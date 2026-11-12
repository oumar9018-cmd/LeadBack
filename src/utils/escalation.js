/**
 * Auto-escalation — pure helpers + loader.
 *
 * When enabled (opt-in, OFF by default), inquiries that have been
 * left too long are flagged — and, when `reassign` is on, moved to
 * the branch manager for their branch (or the workspace owner when
 * the branch has no manager). Two triggers:
 *   - overdue_followup: status 'followup' whose scheduled date is
 *     at least `overdueDays` whole days before today.
 *   - sla_breach: a still-'new' inquiry that has breached the
 *     first-response SLA (utils/sla.js getSlaStatus), when
 *     `includeSlaBreach` is on and the SLA target is > 0.
 *
 * Episode dedupe: an inquiry escalates at most once per activity
 * episode. `escalatedForActivityMs` records lastActivityMs() at the
 * moment of escalation; while no newer activity exists, the row is
 * skipped. New activity (a newer follow-up/history entry) re-arms it.
 *
 * The settings doc lives under users/{ownerUid}/settings/escalation,
 * so the existing settings rules cover it (owner/admin write,
 * managers read).
 */

import { getSlaStatus } from './sla.js'
import { lastActivityMs } from './graveyard.js'

export const DEFAULT_ESCALATION_CONFIG = {
  enabled: false,
  overdueDays: 2,
  includeSlaBreach: true,
  reassign: true,
}

// Back-compat alias for callers that prefer the "settings" name.
export const DEFAULT_ESCALATION_SETTINGS = DEFAULT_ESCALATION_CONFIG

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/

/** Strict YYYY-MM-DD check — rejects rollovers like 2026-02-30. */
function isValidDateKey(value) {
  if (typeof value !== 'string' || !DATE_KEY_RE.test(value)) return false
  const ms = Date.parse(`${value}T00:00:00.000Z`)
  if (!Number.isFinite(ms)) return false
  return new Date(ms).toISOString().slice(0, 10) === value
}

function dateKeyToUtcMs(value) {
  return Date.parse(`${value}T00:00:00.000Z`)
}

function todayKeyFromMs(nowMs) {
  return new Date(nowMs).toISOString().slice(0, 10)
}

function normalizeConfig(config) {
  const raw = config && typeof config === 'object' ? config : {}
  return {
    enabled:
      typeof raw.enabled === 'boolean'
        ? raw.enabled
        : DEFAULT_ESCALATION_CONFIG.enabled,
    overdueDays:
      Number.isInteger(Number(raw.overdueDays)) &&
      Number(raw.overdueDays) >= 1 &&
      Number(raw.overdueDays) <= 30
        ? Number(raw.overdueDays)
        : DEFAULT_ESCALATION_CONFIG.overdueDays,
    includeSlaBreach:
      typeof raw.includeSlaBreach === 'boolean'
        ? raw.includeSlaBreach
        : DEFAULT_ESCALATION_CONFIG.includeSlaBreach,
    reassign:
      typeof raw.reassign === 'boolean'
        ? raw.reassign
        : DEFAULT_ESCALATION_CONFIG.reassign,
  }
}

/** Load escalation settings (settings/escalation doc). Off by default. */
export async function loadEscalationSettings(db, ownerUid) {
  if (!db || !ownerUid) return { ...DEFAULT_ESCALATION_CONFIG }
  try {
    const snap = await db
      .collection('users')
      .doc(ownerUid)
      .collection('settings')
      .doc('escalation')
      .get()
    if (!snap.exists) return { ...DEFAULT_ESCALATION_CONFIG }
    const data = snap.data() || {}
    const overdue = Number(data?.overdueDays)
    return {
      enabled:
        typeof data?.enabled === 'boolean'
          ? data.enabled
          : DEFAULT_ESCALATION_CONFIG.enabled,
      overdueDays:
        Number.isInteger(overdue) && overdue >= 1 && overdue <= 30
          ? overdue
          : DEFAULT_ESCALATION_CONFIG.overdueDays,
      includeSlaBreach:
        typeof data?.includeSlaBreach === 'boolean'
          ? data.includeSlaBreach
          : DEFAULT_ESCALATION_CONFIG.includeSlaBreach,
      reassign:
        typeof data?.reassign === 'boolean'
          ? data.reassign
          : DEFAULT_ESCALATION_CONFIG.reassign,
    }
  } catch (error) {
    console.error('Escalation settings load failed:', error)
    return { ...DEFAULT_ESCALATION_CONFIG }
  }
}

/**
 * Pure: decide which inquiries should be escalated right now.
 *
 * @param {Array} items inquiries ({ id, status, branchId, assignedTo,
 *   followup, createdAt, followupHistory, escalatedForActivityMs })
 * @param {object} options { config, members, ownerUid, slaHours, nowMs }
 * @returns {Array<{ inquiryId, reason, daysOverdue, targetUid, targetLabel }>}
 *   daysOverdue is a number for 'overdue_followup' and null for
 *   'sla_breach'. targetUid is null for flag-only actions (reassign
 *   off, or the row is already assigned to the escalation target).
 */
export function evaluateEscalations(items, options = {}) {
  const config = normalizeConfig(options.config)
  if (!config.enabled) return []

  const members = Array.isArray(options.members) ? options.members : []
  const ownerUid = options.ownerUid || ''
  const slaHours = options.slaHours
  const nowMs =
    Number.isFinite(Number(options.nowMs)) && options.nowMs !== undefined
      ? Number(options.nowMs)
      : Date.now()
  const todayKey = todayKeyFromMs(nowMs)
  const todayMs = dateKeyToUtcMs(todayKey)

  const actions = []
  for (const item of Array.isArray(items) ? items : []) {
    if (!item || !item.id) continue
    if (item.status === 'recovered' || item.status === 'lost') continue

    // Episode dedupe — at most one escalation per activity episode.
    const activity = lastActivityMs(item)
    if (
      Number.isFinite(item.escalatedForActivityMs) &&
      item.escalatedForActivityMs >= activity
    ) {
      continue
    }

    let reason = null
    let daysOverdue = null

    // Overdue follow-up trigger.
    if (item.status === 'followup') {
      const followupDate = item.followup?.date
      if (isValidDateKey(followupDate) && followupDate < todayKey) {
        const diff = Math.floor(
          (todayMs - dateKeyToUtcMs(followupDate)) / (24 * 60 * 60 * 1000)
        )
        if (diff >= config.overdueDays) {
          reason = 'overdue_followup'
          daysOverdue = diff
        }
      }
    }

    // SLA breach trigger (getSlaStatus only breaches 'new' rows).
    if (!reason && config.includeSlaBreach) {
      if (getSlaStatus(item, slaHours, nowMs) === 'breached') {
        reason = 'sla_breach'
        daysOverdue = null
      }
    }

    if (!reason) continue

    // Resolve the escalation target (only when reassign is on).
    let targetUid = null
    let targetLabel = ''
    if (config.reassign) {
      const manager = members.find(
        member =>
          member &&
          member.role === 'branch_manager' &&
          (member.branchId || '') === (item.branchId || '')
      )
      let candidateUid
      let candidateLabel
      if (manager) {
        candidateUid = manager.id
        candidateLabel = manager.email || manager.name || 'Workspace owner'
      } else {
        candidateUid = ownerUid
        candidateLabel = 'Workspace owner'
      }
      targetLabel = candidateLabel || 'Workspace owner'
      if (candidateUid && candidateUid !== item.assignedTo) {
        targetUid = candidateUid
      } else {
        // Already assigned to the target (or no target known):
        // flag only, never a no-op reassignment.
        targetUid = null
      }
    }

    actions.push({
      inquiryId: item.id,
      reason,
      daysOverdue,
      targetUid,
      targetLabel,
    })
  }
  return actions
}
