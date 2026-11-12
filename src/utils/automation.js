/**
 * #3 — Automated Task Generator (pure helpers + loader).
 *
 * The app's task unit is the follow-up on an inquiry (the Follow-ups
 * queue lists status === 'followup' rows). Two automatic generators
 * exist: rule actions (schedule_followup, #2) and this default —
 * when a new inquiry arrives and NO rule scheduled a follow-up, the
 * workspace default (settings/automation doc, 0 = off) schedules one
 * after N days. The default never overrides a rule: rules run first.
 *
 * Like branches/custom fields/rules, the automation doc lives under
 * users/{ownerUid}/settings/, so the existing settings rules cover it
 * (owner/admin write, managers read).
 */

/** Pure: add a default follow-up unless one already exists. */
export function applyAutoFollowup(doc, autoDays, nowMs = Date.now()) {
  const days = Number(autoDays)
  if (!Number.isInteger(days) || days < 1 || days > 30) return doc
  if (doc.followup && doc.followup.date) return doc
  const date = new Date(nowMs + days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
  return {
    ...doc,
    status: 'followup',
    followup: { date, time: '10:00', note: 'Auto follow-up' },
  }
}

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/

/** Strict YYYY-MM-DD check — rejects rollovers like 2026-02-30. */
function isValidDateKey(value) {
  if (typeof value !== 'string' || !DATE_KEY_RE.test(value)) return false
  const ms = Date.parse(`${value}T00:00:00.000Z`)
  if (!Number.isFinite(ms)) return false
  return new Date(ms).toISOString().slice(0, 10) === value
}

/**
 * Pure: plan an auto-reschedule for a missed follow-up, or null.
 *
 * A follow-up counts as missed when its date is strictly before
 * today (UTC key, the Followups.jsx convention). The missed date is
 * remembered in `lastAutoRescheduleFor`, so the same missed date is
 * never rescheduled twice, and `autoRescheduleCount` caps how many
 * times one inquiry may be auto-rescheduled in total.
 *
 * The returned historyEntry mirrors the codebase's entry shape
 * (App.jsx logActivity / scheduleFollowup): { id, type, date, time,
 * note } — date is today, and the note says it was auto-rescheduled.
 */
export function planAutoReschedule(item, defaults, nowMs = Date.now()) {
  if (!item || item.status !== 'followup') return null
  const days = Number(defaults?.autoRescheduleDays)
  if (!Number.isInteger(days) || days < 1 || days > 14) return null
  const maxRaw = Number(defaults?.autoRescheduleMax)
  const max =
    Number.isInteger(maxRaw) && maxRaw >= 1 && maxRaw <= 10 ? maxRaw : 3
  const countRaw = Number(item.autoRescheduleCount)
  const count = Number.isInteger(countRaw) && countRaw > 0 ? countRaw : 0
  if (count >= max) return null

  const missedDate = item.followup?.date
  if (!isValidDateKey(missedDate)) return null
  const now = Number.isFinite(Number(nowMs)) ? Number(nowMs) : Date.now()
  const today = new Date(now).toISOString().slice(0, 10)
  if (!(missedDate < today)) return null
  if (item.lastAutoRescheduleFor === missedDate) return null

  const date = new Date(now + days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
  const time = item.followup?.time || '10:00'
  const historyEntry = {
    id: `auto-reschedule-${now}`,
    type: 'auto-rescheduled',
    date: today,
    time: new Date(now).toTimeString().slice(0, 5),
    note: `Auto-rescheduled — missed follow-up on ${missedDate} moved to ${date}`,
  }
  return {
    followup: { date, time, note: 'Auto-rescheduled' },
    autoRescheduleCount: count + 1,
    lastAutoRescheduleFor: missedDate,
    historyEntry,
  }
}

/** Load the workspace automation defaults. 0 days = feature off. */
export async function loadAutomationDefaults(db, ownerUid) {
  const fallback = {
    autoFollowupDays: 0,
    autoRescheduleDays: 0,
    autoRescheduleMax: 3,
  }
  if (!db || !ownerUid) return { ...fallback }
  try {
    const snap = await db
      .collection('users')
      .doc(ownerUid)
      .collection('settings')
      .doc('automation')
      .get()
    if (!snap.exists) return { ...fallback }
    const data = snap.data() || {}
    const days = Number(data?.autoFollowupDays)
    const rescheduleDays = Number(data?.autoRescheduleDays)
    const rescheduleMax = Number(data?.autoRescheduleMax)
    return {
      autoFollowupDays:
        Number.isInteger(days) && days >= 0 && days <= 30 ? days : 0,
      autoRescheduleDays:
        Number.isInteger(rescheduleDays) &&
        rescheduleDays >= 0 &&
        rescheduleDays <= 14
          ? rescheduleDays
          : 0,
      autoRescheduleMax:
        Number.isInteger(rescheduleMax) &&
        rescheduleMax >= 1 &&
        rescheduleMax <= 10
          ? rescheduleMax
          : 3,
    }
  } catch (error) {
    console.error('Automation defaults load failed:', error)
    return { ...fallback }
  }
}
