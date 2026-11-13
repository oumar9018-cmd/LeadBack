import React, { useEffect, useRef } from 'react'
import { useWorkspace } from './WorkspaceContext.jsx'
import { inScope } from '../utils/workspace.js'
import {
  loadAutomationDefaults,
  planAutoReschedule,
} from '../utils/automation.js'
import {
  loadEscalationSettings,
  evaluateEscalations,
} from '../utils/escalation.js'
import { loadSlaSettings } from '../utils/sla.js'
import {
  loadWorkflowSettings,
  evaluateWorkflows,
} from '../utils/workflows.js'
import { lastActivityMs } from '../utils/graveyard.js'
import { logAudit } from '../utils/audit.js'

/**
 * AutomationSweep — headless runner for the workspace automations
 * that need a signed-in session to act:
 *   1. Auto-reschedule of missed follow-ups (settings/automation).
 *   2. Auto-escalation of overdue / SLA-breached inquiries
 *      (settings/escalation, opt-in and off by default).
 *   3. Workflow automations — time-based trigger → action rules
 *      (settings/workflows, opt-in and off by default). A rule's
 *      action can also be an outbound webhook POST (Round 5): the
 *      episode marker is stamped like any other action, then the
 *      payload is sent; sends are counted and ONE summary audit
 *      entry records sent/failed for this app open — failed sends
 *      are never retried silently.
 *
 * It renders nothing and runs ONCE per mounted workspace (guard
 * keyed `${ownerUid}:${role}`), only for owner/admin/branch_manager
 * — never for sales reps. Reschedules apply first and the local
 * copies are updated before escalation is evaluated, so an inquiry
 * that was just rescheduled is not also escalated for the same
 * missed date. Every per-item write is isolated in its own
 * try/catch: one bad doc never stops the sweep.
 */
export default function AutomationSweep() {
  const { workspace, loading: wsLoading } = useWorkspace()
  const ranForRef = useRef('')

  useEffect(() => {
    if (wsLoading || !workspace) return undefined
    if (
      workspace.role !== 'owner' &&
      workspace.role !== 'admin' &&
      workspace.role !== 'branch_manager'
    ) {
      return undefined
    }
    const db = window.firebase?.firestore?.()
    if (!db) return undefined

    const guardKey = `${workspace.ownerUid}:${workspace.role}`
    if (ranForRef.current === guardKey) return undefined
    ranForRef.current = guardKey

    let cancelled = false
    const nowMs = Date.now()
    const ownerUid = workspace.ownerUid

    ;(async () => {
      let items = []
      let members = []
      let automationDefaults = {
        autoFollowupDays: 0,
        autoRescheduleDays: 0,
        autoRescheduleMax: 3,
      }
      let escalationConfig = null
      let workflowSettings = null
      let slaHours = 24

      // ---- Load (scoped exactly like Reports.jsx) ----
      try {
        const uid = window.firebase?.auth?.().currentUser?.uid
        let query = db
          .collection('users')
          .doc(ownerUid)
          .collection('inquiries')
        if (workspace.role === 'branch_manager') {
          query = query.where('branchId', '==', workspace.branchId || '')
        }
        const snapshot = await query.get()
        if (cancelled) return
        items = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(item => inScope(item, workspace, uid))
      } catch (error) {
        console.error('Automation sweep inquiries load failed:', error)
        return
      }

      try {
        const membersSnap = await db
          .collection('users')
          .doc(ownerUid)
          .collection('members')
          .get()
        if (cancelled) return
        members = membersSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
      } catch (error) {
        console.error('Automation sweep members load failed:', error)
        members = []
      }

      try {
        ;[automationDefaults, escalationConfig, workflowSettings] =
          await Promise.all([
            loadAutomationDefaults(db, ownerUid),
            loadEscalationSettings(db, ownerUid),
            loadWorkflowSettings(db, ownerUid),
          ])
        const slaSettings = await loadSlaSettings(db, ownerUid)
        slaHours = slaSettings.firstResponseHours
      } catch (error) {
        console.error('Automation sweep settings load failed:', error)
      }
      if (cancelled) return

      const FieldValue = window.firebase?.firestore?.FieldValue
      const inquiryRef = id =>
        db
          .collection('users')
          .doc(ownerUid)
          .collection('inquiries')
          .doc(String(id))

      // ---- 1. Auto-reschedules first ----
      const localItems = []
      for (const item of items) {
        if (cancelled) return
        let local = item
        try {
          const plan = planAutoReschedule(item, automationDefaults, nowMs)
          if (plan) {
            const historyPatch =
              FieldValue?.arrayUnion
                ? FieldValue.arrayUnion(plan.historyEntry)
                : [...(item.followupHistory || []), plan.historyEntry]
            await inquiryRef(item.id).set(
              {
                followup: plan.followup,
                autoRescheduleCount: plan.autoRescheduleCount,
                lastAutoRescheduleFor: plan.lastAutoRescheduleFor,
                followupHistory: historyPatch,
              },
              { merge: true }
            )
            local = {
              ...item,
              followup: plan.followup,
              autoRescheduleCount: plan.autoRescheduleCount,
              lastAutoRescheduleFor: plan.lastAutoRescheduleFor,
              followupHistory: [
                ...(item.followupHistory || []),
                plan.historyEntry,
              ],
            }
            await logAudit(ownerUid, {
              action: 'task_created',
              inquiryId: item.id,
              detail: `Auto-rescheduled missed follow-up from ${plan.lastAutoRescheduleFor} to ${plan.followup.date}`,
            })
          }
        } catch (error) {
          console.error(
            'Automation sweep auto-reschedule failed:',
            item.id,
            error
          )
        }
        localItems.push(local)
      }
      if (cancelled) return

      // ---- 2. Escalations against the locally updated copies ----
      let actions = []
      if (escalationConfig) {
        try {
          actions = evaluateEscalations(localItems, {
            config: escalationConfig,
            members,
            ownerUid,
            slaHours,
            nowMs,
          })
        } catch (error) {
          console.error(
            'Automation sweep escalation evaluation failed:',
            error
          )
          actions = []
        }
      }

      for (const action of actions) {
        if (cancelled) return
        try {
          const item = localItems.find(
            entry => String(entry.id) === String(action.inquiryId)
          )
          if (!item) continue
          const activity = lastActivityMs(item)
          await inquiryRef(action.inquiryId).set(
            {
              escalatedAt: new Date(nowMs).toISOString(),
              escalatedReason: action.reason,
              escalatedForActivityMs: activity,
              ...(action.targetUid
                ? { assignedTo: action.targetUid }
                : {}),
            },
            { merge: true }
          )
          if (action.targetUid) {
            await logAudit(ownerUid, {
              action: 'inquiry_assigned',
              inquiryId: action.inquiryId,
              detail: `Auto-escalated (${
                action.reason === 'sla_breach'
                  ? 'SLA breach'
                  : `follow-up overdue ${action.daysOverdue}d`
              }) to ${action.targetLabel}`,
            })
          }
        } catch (error) {
          console.error(
            'Automation sweep escalation failed:',
            action.inquiryId,
            error
          )
        }
      }
      if (cancelled) return

      // ---- 3. Workflow automations (opt-in, off by default) ----
      if (workflowSettings) {
        let workflowActions = []
        try {
          workflowActions = evaluateWorkflows(localItems, workflowSettings, {
            members,
            ownerUid,
            slaHours,
            nowMs,
            workspaceId: ownerUid,
          })
        } catch (error) {
          console.error(
            'Automation sweep workflow evaluation failed:',
            error
          )
          workflowActions = []
        }

        let webhooksSent = 0
        let webhooksFailed = 0

        for (const action of workflowActions) {
          if (cancelled) return
          try {
            const item = localItems.find(
              entry => String(entry.id) === String(action.inquiryId)
            )
            if (!item) continue
            const patch = {
              workflowFired: action.firedPatch,
              ...(action.patch || {}),
              ...(action.targetUid
                ? { assignedTo: action.targetUid }
                : {}),
              ...(action.followup
                ? { followup: action.followup, status: action.status }
                : {}),
            }
            if (action.historyEntry) {
              patch.followupHistory = FieldValue?.arrayUnion
                ? FieldValue.arrayUnion(action.historyEntry)
                : [
                    ...(item.followupHistory || []),
                    action.historyEntry,
                  ]
            }
            await inquiryRef(action.inquiryId).set(patch, { merge: true })

            if (action.webhook) {
              // The episode marker is already stamped above, so a
              // failed send is final for this episode — counted in
              // the summary below, never retried silently.
              try {
                const response = await fetch(action.webhook.url, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(action.webhook.payload),
                })
                if (response.ok) {
                  webhooksSent += 1
                } else {
                  webhooksFailed += 1
                  console.error(
                    'Workflow webhook send failed:',
                    action.ruleName,
                    response.status
                  )
                }
              } catch (error) {
                webhooksFailed += 1
                console.error(
                  'Workflow webhook send failed:',
                  action.ruleName,
                  error
                )
              }
            } else if (action.targetUid) {
              await logAudit(ownerUid, {
                action: 'inquiry_assigned',
                inquiryId: action.inquiryId,
                detail: `Workflow "${action.ruleName}" assigned to ${action.targetLabel}`,
              })
            } else if (action.followup) {
              await logAudit(ownerUid, {
                action: 'task_created',
                inquiryId: action.inquiryId,
                detail: `Workflow "${action.ruleName}" created a follow-up for ${action.followup.date}`,
              })
            } else {
              await logAudit(ownerUid, {
                action: 'rule_applied',
                inquiryId: action.inquiryId,
                detail: `Workflow "${action.ruleName}" flagged as priority`,
              })
            }
          } catch (error) {
            console.error(
              'Automation sweep workflow action failed:',
              action.inquiryId,
              error
            )
          }
        }

        if (webhooksSent + webhooksFailed > 0) {
          await logAudit(ownerUid, {
            action: 'rule_applied',
            detail: `Workflow webhooks this app open: ${webhooksSent} sent, ${webhooksFailed} failed (failed sends are not retried)`,
          })
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [wsLoading, workspace])

  return null
}
