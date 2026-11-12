/**
 * Workflow automations — Round 3 (pure helpers + loader).
 *
 * A second, time-based automation layer beside the creation-time
 * rule engine (utils/rules.js): rules are evaluated by the app-open
 * sweep (components/AutomationSweep.jsx), not at creation. A rule is
 *   { id, name, enabled, trigger, hours, action, assignTo }
 * with triggers:
 *   - new_inquiry: still 'new' (nobody has picked it up) at least
 *     `hours` after creation.
 *   - stale: no activity (creation, history entry, or a future
 *     scheduled follow-up — utils/graveyard.js lastActivityMs) for
 *     at least `hours`.
 *   - sla_breach: the first-response SLA is breached right now
 *     (utils/sla.js getSlaStatus); `hours` is unused.
 * and actions:
 *   - assign_manager: branch manager for the inquiry's branch, else
 *     the workspace owner (the escalation.js resolution).
 *   - assign_member: the member named by the rule's `assignTo`.
 *   - create_followup: schedule a follow-up task for today (the
 *     app's task unit — status 'followup' + followup.date), unless
 *     the inquiry already has an upcoming follow-up.
 *   - flag_priority: stamp priorityFlaggedAt/priorityFlagRule on the
 *     inquiry and leave a history entry — the visible flag lives in
 *     the inquiry's activity history.
 *
 * Opt-in and OFF by default (master switch AND per-rule switch).
 * Episode dedupe mirrors escalation.js: `workflowFired[ruleId]`
 * records lastActivityMs() when the rule fired; while no newer
 * activity exists the rule does not fire again for that inquiry.
 * New activity re-arms it. At most ONE workflow action per inquiry
 * per sweep — the first matching rule (top to bottom) wins, so two
 * rules can never fight over the same inquiry in one run.
 *
 * Settings live in users/{ownerUid}/settings/workflows, so the
 * existing settings rules cover them (owner/admin write, managers
 * read). Actions are applied by the sweep and audit-logged with the
 * EXISTING audit actions only (inquiry_assigned / task_created /
 * rule_applied) — no new audit action, no rules change.
 */

import { getSlaStatus } from './sla.js'
import { lastActivityMs } from './graveyard.js'

export const WORKFLOW_TRIGGERS = [
  { id: 'new_inquiry', label: 'New inquiry still waiting' },
  { id: 'stale', label: 'Inquiry goes stale (no activity)' },
  { id: 'sla_breach', label: 'SLA breach' },
]

export const WORKFLOW_ACTIONS = [
  { id: 'assign_manager', label: 'Assign to branch manager (or owner)' },
  { id: 'assign_member', label: 'Assign to a team member' },
  { id: 'create_followup', label: 'Create a follow-up task for today' },
  { id: 'flag_priority', label: 'Flag as priority' },
]

export const MAX_WORKFLOW_RULES = 10

export const DEFAULT_WORKFLOW_SETTINGS = { enabled: false, rules: [] }

const HOUR_MS = 1000 * 60 * 60
const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/

/** createdAt → ms. Mirrors the createdMs pattern in sla.js/digest.js:
 * epoch ms, ISO strings, Firestore Timestamps; else NaN. */
function createdMs(value) {
  const n = Number(value)
  if (Number.isFinite(n) && n > 0) return n
  if (typeof value === 'string') {
    const t = Date.parse(value)
    if (Number.isFinite(t) && t > 0) return t
  }
  if (value && typeof value === 'object') {
    if (typeof value.toMillis === 'function') {
      const t = value.toMillis()
      if (Number.isFinite(t) && t > 0) return t
    } else if (typeof value.toDate === 'function') {
      const t = value.toDate().getTime()
      if (Number.isFinite(t) && t > 0) return t
    }
  }
  return NaN
}

function isValidDateKey(value) {
  if (typeof value !== 'string' || !DATE_KEY_RE.test(value)) return false
  const ms = Date.parse(`${value}T00:00:00.000Z`)
  if (!Number.isFinite(ms)) return false
  return new Date(ms).toISOString().slice(0, 10) === value
}

function defaultHours(trigger) {
  if (trigger === 'new_inquiry') return 4
  if (trigger === 'stale') return 72
  return 24
}

/** Sanitize one raw rule; null when it cannot ever run honestly
 * (no id, unknown trigger/action). Mirrors loadRules' strictness. */
export function normalizeWorkflowRule(raw) {
  if (!raw || typeof raw !== 'object') return null
  if (typeof raw.id !== 'string' || !raw.id) return null
  if (!WORKFLOW_TRIGGERS.some(t => t.id === raw.trigger)) return null
  if (!WORKFLOW_ACTIONS.some(a => a.id === raw.action)) return null
  const hours = Number(raw.hours)
  return {
    id: raw.id,
    name:
      typeof raw.name === 'string' && raw.name.trim()
        ? raw.name.trim()
        : 'Untitled workflow',
    enabled: raw.enabled !== false,
    trigger: raw.trigger,
    hours:
      Number.isInteger(hours) && hours >= 1 && hours <= 720
        ? hours
        : defaultHours(raw.trigger),
    action: raw.action,
    assignTo: typeof raw.assignTo === 'string' ? raw.assignTo : '',
  }
}

/** Sanitize a whole settings object. Off by default; malformed
 * rules are dropped, never fatal; the list is capped. */
export function normalizeWorkflowSettings(raw) {
  const source = raw && typeof raw === 'object' ? raw : {}
  const rules = (Array.isArray(source.rules) ? source.rules : [])
    .map(normalizeWorkflowRule)
    .filter(Boolean)
    .slice(0, MAX_WORKFLOW_RULES)
  return { enabled: source.enabled === true, rules }
}

/** Load workflow settings (settings/workflows doc). Off by default. */
export async function loadWorkflowSettings(db, ownerUid) {
  if (!db || !ownerUid) return { ...DEFAULT_WORKFLOW_SETTINGS }
  try {
    const snap = await db
      .collection('users')
      .doc(ownerUid)
      .collection('settings')
      .doc('workflows')
      .get()
    if (!snap.exists) return { ...DEFAULT_WORKFLOW_SETTINGS }
    return normalizeWorkflowSettings(snap.data() || {})
  } catch (error) {
    console.error('Workflow settings load failed:', error)
    return { ...DEFAULT_WORKFLOW_SETTINGS }
  }
}

function resolveManagerTarget(item, members, ownerUid) {
  const manager = members.find(
    member =>
      member &&
      member.role === 'branch_manager' &&
      (member.branchId || '') === (item.branchId || '')
  )
  if (manager) {
    return {
      targetUid: manager.id,
      targetLabel: manager.email || manager.name || 'Workspace owner',
    }
  }
  return { targetUid: ownerUid || '', targetLabel: 'Workspace owner' }
}

/**
 * Pure: decide which workflow actions should run right now.
 *
 * @param {Array} items scoped inquiries ({ id, ...data() } shape)
 * @param {object} settings raw or normalized workflow settings
 * @param {object} options { members, ownerUid, slaHours, nowMs }
 * @returns {Array<{ inquiryId, ruleId, ruleName, action, targetUid,
 *   targetLabel, followup, status, patch, historyEntry, firedPatch }>}
 *   Fields that do not apply to an action are null/undefined; the
 *   sweep applies `patch` + `followup`/`status` writes and appends
 *   `historyEntry` when present. `firedPatch` is the full
 *   workflowFired map to store (existing markers preserved).
 */
export function evaluateWorkflows(items, settings, options = {}) {
  const config = normalizeWorkflowSettings(settings)
  if (!config.enabled) return []
  const rules = config.rules.filter(rule => rule.enabled)
  if (rules.length === 0) return []

  const members = Array.isArray(options.members) ? options.members : []
  const ownerUid = options.ownerUid || ''
  const slaHours = options.slaHours
  const nowMs =
    Number.isFinite(Number(options.nowMs)) && options.nowMs !== undefined
      ? Number(options.nowMs)
      : Date.now()
  const todayKey = new Date(nowMs).toISOString().slice(0, 10)
  const nowTime = new Date(nowMs).toTimeString().slice(0, 5)

  const actions = []
  for (const item of Array.isArray(items) ? items : []) {
    if (!item || !item.id) continue
    if (item.status === 'recovered' || item.status === 'lost') continue
    const activity = lastActivityMs(item)
    const created = createdMs(item.createdAt)
    const firedMap =
      item.workflowFired && typeof item.workflowFired === 'object'
        ? item.workflowFired
        : {}

    for (const rule of rules) {
      // Episode dedupe — at most one firing per activity episode.
      const fired = Number(firedMap[rule.id])
      if (Number.isFinite(fired) && fired >= activity) continue

      let matched = false
      if (rule.trigger === 'new_inquiry') {
        matched =
          item.status === 'new' &&
          Number.isFinite(created) &&
          nowMs - created >= rule.hours * HOUR_MS
      } else if (rule.trigger === 'stale') {
        matched = activity > 0 && nowMs - activity >= rule.hours * HOUR_MS
      } else if (rule.trigger === 'sla_breach') {
        matched = getSlaStatus(item, slaHours, nowMs) === 'breached'
      }
      if (!matched) continue

      const base = {
        inquiryId: item.id,
        ruleId: rule.id,
        ruleName: rule.name,
        action: rule.action,
        targetUid: null,
        targetLabel: '',
        followup: null,
        status: null,
        patch: null,
        historyEntry: null,
        firedPatch: { ...firedMap, [rule.id]: activity },
      }

      if (rule.action === 'assign_manager' || rule.action === 'assign_member') {
        const resolved =
          rule.action === 'assign_manager'
            ? resolveManagerTarget(item, members, ownerUid)
            : (() => {
                const member = members.find(m => m && m.id === rule.assignTo)
                return {
                  targetUid: rule.assignTo || '',
                  targetLabel: member
                    ? member.email || member.name || rule.assignTo
                    : rule.assignTo,
                }
              })()
        // No target, or already assigned there: never a no-op write.
        if (!resolved.targetUid || resolved.targetUid === item.assignedTo) {
          continue
        }
        base.targetUid = resolved.targetUid
        base.targetLabel = resolved.targetLabel || 'Workspace owner'
      } else if (rule.action === 'create_followup') {
        const existing = item.followup?.date
        if (
          item.status === 'followup' &&
          isValidDateKey(existing) &&
          existing >= todayKey
        ) {
          continue // an upcoming follow-up already exists — never clobber
        }
        base.followup = {
          date: todayKey,
          time: '10:00',
          note: `Workflow — ${rule.name}`,
        }
        base.status = 'followup'
        base.historyEntry = {
          id: `workflow-${nowMs}-${rule.id}`,
          type: 'workflow',
          date: todayKey,
          time: nowTime,
          note: `Follow-up created by workflow "${rule.name}"`,
        }
      } else if (rule.action === 'flag_priority') {
        base.patch = {
          priorityFlaggedAt: new Date(nowMs).toISOString(),
          priorityFlagRule: rule.name,
        }
        base.historyEntry = {
          id: `workflow-${nowMs}-${rule.id}`,
          type: 'workflow',
          date: todayKey,
          time: nowTime,
          note: `Flagged as priority by workflow "${rule.name}"`,
        }
      }

      actions.push(base)
      break // one workflow action per inquiry per sweep
    }
  }
  return actions
}
