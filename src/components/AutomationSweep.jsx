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
import { lastActivityMs } from '../utils/graveyard.js'
import { logAudit } from '../utils/audit.js'

/**
 * AutomationSweep — headless runner for the workspace automations
 * that need a signed-in session to act:
 *   1. Auto-reschedule of missed follow-ups (settings/automation).
 *   2. Auto-escalation of overdue / SLA-breached inquiries
 *      (settings/escalation, opt-in and off by default).
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
        ;[automationDefaults, escalationConfig] = await Promise.all([
          loadAutomationDefaults(db, ownerUid),
          loadEscalationSettings(db, ownerUid),
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
      if (!escalationConfig) return
      let actions = []
      try {
        actions = evaluateEscalations(localItems, {
          config: escalationConfig,
          members,
          ownerUid,
          slaHours,
          nowMs,
        })
      } catch (error) {
        console.error('Automation sweep escalation evaluation failed:', error)
        return
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
    })()

    return () => {
      cancelled = true
    }
  }, [wsLoading, workspace])

  return null
}
