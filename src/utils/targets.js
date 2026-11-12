/**
 * Monthly targets (quotas) + end-of-month pace forecast.
 *
 * Definitions live in one small doc (users/{ownerUid}/settings/targets,
 * same pattern as customFields/workflows) so the existing settings
 * rules cover them: owners/admins write, managers read.
 *
 *   { reps:     { [memberUid]:  { revenue, count } },
 *     branches: { [branchName]: { revenue, count } } }
 *
 * `revenue` is a monthly recovered-revenue target in the workspace
 * currency; `count` is a monthly recovered-inquiries target. A
 * missing or zero value means "no target" — progress then shows the
 * month's actuals with no percentage, never a fabricated one. The
 * same targets apply to every month until they are changed; there
 * is no per-month history.
 *
 * Progress is counted from `recoveredAt` ('YYYY-MM-DD', stamped by
 * markRecovered in App.jsx — the same date streaks.js trusts).
 * Inquiries recovered before that stamp existed carry no date and
 * cannot be placed in a month honestly, so they count in all-time
 * reports but not toward any month. Nothing is backdated or guessed.
 */
import {
  UNASSIGNED_BRANCH_ID,
  UNASSIGNED_BRANCH_LABEL,
  UNASSIGNED_MEMBER_ID,
  UNASSIGNED_MEMBER_LABEL,
} from './reports.js'

export const MAX_TARGET_ENTRIES = 200

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function cleanTargetNumber(raw) {
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.round(n)
}

/** One target entry, or null when it carries no usable target. */
export function normalizeTargetEntry(raw) {
  if (!raw || typeof raw !== 'object') return null
  const revenue = cleanTargetNumber(raw.revenue)
  const count = cleanTargetNumber(raw.count)
  if (revenue <= 0 && count <= 0) return null
  return { revenue, count }
}

function normalizeTargetMap(raw) {
  const out = {}
  if (!raw || typeof raw !== 'object') return out
  for (const [key, value] of Object.entries(raw)) {
    if (!key) continue
    const entry = normalizeTargetEntry(value)
    if (entry) out[key] = entry
    if (Object.keys(out).length >= MAX_TARGET_ENTRIES) break
  }
  return out
}

/** Validate a raw settings/targets doc into { reps, branches }. */
export function normalizeTargets(raw) {
  const source = raw && typeof raw === 'object' ? raw : {}
  return {
    reps: normalizeTargetMap(source.reps),
    branches: normalizeTargetMap(source.branches),
  }
}

/** Load monthly targets (settings/targets doc). Empty = no targets. */
export async function loadTargets(db, ownerUid) {
  if (!db || !ownerUid) return { reps: {}, branches: {} }
  try {
    const snap = await db
      .collection('users')
      .doc(ownerUid)
      .collection('settings')
      .doc('targets')
      .get()
    if (!snap.exists) return { reps: {}, branches: {} }
    return normalizeTargets(snap.data() || {})
  } catch (error) {
    console.error('Targets load failed:', error)
    return { reps: {}, branches: {} }
  }
}

/** 'YYYY-MM' (UTC) for a timestamp — the key recoveredAt dates share. */
export function monthKeyFromMs(nowMs = Date.now()) {
  return new Date(nowMs).toISOString().slice(0, 7)
}

/** 'November 2026' (UTC) for a timestamp — for report headings. */
export function monthLabelFromMs(nowMs = Date.now()) {
  const d = new Date(nowMs)
  return `${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** True when the inquiry was marked recovered in the given month. */
export function isRecoveredInMonth(item, monthKey) {
  return (
    item?.status === 'recovered' &&
    typeof item?.recoveredAt === 'string' &&
    item.recoveredAt.slice(0, 7) === monthKey
  )
}

function valueOf(item) {
  return Number(item?.value) || 0
}

/**
 * This month's recoveries per member, with the same row conventions
 * as reports.js aggregateByMember: every member gets a row (even at
 * zero), the owner is seeded when `options.ownerUid` is given, and
 * recoveries whose assignee is unknown fold into a trailing
 * "Unassigned" row that appears only when such recoveries exist.
 * Rows: { memberId, name, email, role, isUnassigned,
 *         recoveredCount, recoveredRevenue }
 */
export function monthlyRecoveryByMember(items, members = [], options = {}) {
  const monthKey = options.monthKey || monthKeyFromMs(options.nowMs)
  const byMember = new Map()

  const ensure = (memberId, seed = {}) => {
    if (!byMember.has(memberId)) {
      byMember.set(memberId, {
        memberId,
        name: seed.name || seed.email || memberId,
        email: seed.email || '',
        role: seed.role || '',
        isUnassigned: memberId === UNASSIGNED_MEMBER_ID,
        recoveredCount: 0,
        recoveredRevenue: 0,
      })
    }
    return byMember.get(memberId)
  }

  for (const member of members || []) {
    if (!member?.id) continue
    ensure(member.id, {
      name: member.email || member.id,
      email: member.email || '',
      role: member.role || '',
    })
  }
  if (options.ownerUid) {
    ensure(options.ownerUid, {
      name: options.ownerEmail || 'Owner',
      email: options.ownerEmail || '',
      role: 'owner',
    })
  }

  let hasUnassigned = false
  for (const item of items || []) {
    if (!isRecoveredInMonth(item, monthKey)) continue
    let memberId = item?.assignedTo || UNASSIGNED_MEMBER_ID
    if (memberId !== UNASSIGNED_MEMBER_ID && !byMember.has(memberId)) {
      memberId = UNASSIGNED_MEMBER_ID
    }
    if (memberId === UNASSIGNED_MEMBER_ID) hasUnassigned = true
    const row = ensure(memberId, { name: UNASSIGNED_MEMBER_LABEL })
    row.recoveredCount += 1
    row.recoveredRevenue += valueOf(item)
  }
  if (!hasUnassigned) byMember.delete(UNASSIGNED_MEMBER_ID)

  return [...byMember.values()]
}

/**
 * This month's recoveries per branch, with reports.js
 * aggregateByBranch conventions: branchId carries the branch NAME,
 * defined branches appear even at zero, and the unbranched bucket
 * appears only when this-month recoveries exist there.
 * Rows: { branchId, branch, isUnassigned, recoveredCount,
 *         recoveredRevenue }
 */
export function monthlyRecoveryByBranch(items, branches = [], monthKey) {
  const key = monthKey || monthKeyFromMs()
  const byBranch = new Map()

  const ensure = branchId => {
    if (!byBranch.has(branchId)) {
      byBranch.set(branchId, {
        branchId,
        branch: branchId || UNASSIGNED_BRANCH_LABEL,
        isUnassigned: branchId === UNASSIGNED_BRANCH_ID,
        recoveredCount: 0,
        recoveredRevenue: 0,
      })
    }
    return byBranch.get(branchId)
  }

  for (const branch of branches || []) {
    const name = typeof branch === 'string' ? branch : branch?.name || ''
    if (name) ensure(name)
  }

  let hasUnassigned = false
  for (const item of items || []) {
    if (!isRecoveredInMonth(item, key)) continue
    const branchId = item?.branchId || UNASSIGNED_BRANCH_ID
    if (branchId === UNASSIGNED_BRANCH_ID) hasUnassigned = true
    const row = ensure(branchId)
    row.recoveredCount += 1
    row.recoveredRevenue += valueOf(item)
  }
  if (!hasUnassigned) byBranch.delete(UNASSIGNED_BRANCH_ID)

  return [...byBranch.values()]
}

/**
 * Percent of a target reached (rounded, may exceed 100), or null
 * when there is no usable target — the UI shows the actuals with
 * "no target set", never a fabricated percentage.
 */
export function targetProgress(actual, target) {
  const t = Number(target)
  if (!Number.isFinite(t) || t <= 0) return null
  const a = Number(actual)
  return Math.round(((Number.isFinite(a) ? a : 0) / t) * 100)
}

/**
 * End-of-month pace forecast: this month's recovered revenue and
 * count, scaled from the days elapsed to the full month at the same
 * daily pace. This is a pace ESTIMATE, not a promise — it assumes
 * the rest of the month behaves like the part so far, which real
 * months often don't. `ready` is false until at least one recovery
 * lands this month (no pace exists before that) and the projected
 * values are null then, never invented.
 */
export function paceForecast(items, nowMs = Date.now()) {
  const now = new Date(nowMs)
  const monthKey = monthKeyFromMs(nowMs)
  const daysInMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)
  ).getUTCDate()
  const daysElapsed = now.getUTCDate()

  let recoveredCount = 0
  let recoveredRevenue = 0
  for (const item of items || []) {
    if (!isRecoveredInMonth(item, monthKey)) continue
    recoveredCount += 1
    recoveredRevenue += valueOf(item)
  }

  const ready = recoveredCount > 0 && daysElapsed > 0
  const scale = ready ? daysInMonth / daysElapsed : 0
  return {
    ready,
    monthKey,
    daysElapsed,
    daysInMonth,
    recoveredCount,
    recoveredRevenue,
    projectedCount: ready ? Math.round(recoveredCount * scale) : null,
    projectedRevenue: ready ? Math.round(recoveredRevenue * scale) : null,
  }
}
