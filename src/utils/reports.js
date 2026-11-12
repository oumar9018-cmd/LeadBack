/**
 * Reports aggregations — #115 Branch Comparison + #70 per-branch
 * performance rollup, #116 Salesperson Comparison + #89 scorecards.
 *
 * Pure functions over plain inquiry/member/branch objects (the same
 * shapes the Firestore docs carry once mapped to `{ id, ...data() }`):
 *
 *   inquiry: { status, value, branchId, assignedTo, followup }
 *     - status: 'new' | 'followup' | 'replied' | 'recovered' | 'lost'
 *       (anything that is not recovered/lost counts as open, matching
 *       how Revenue.jsx and forecast.js bucket the pipeline).
 *     - value: estimated value (Number-coerced). Recovered revenue is
 *       the sum of `value` over recovered rows — the same definition
 *       Revenue.jsx uses; inquiries carry no separate recoveredValue
 *       field (that field lives on offers, see utils/recovery.js).
 *     - branchId: the branch NAME (branches are stored as
 *       { id: slug, name } in settings/branches, and inquiries carry
 *       the name — see BranchesCard.jsx rename retagging). '' or a
 *       missing field means unbranched.
 *     - assignedTo: the member's uid (the members doc id), '' when
 *       unassigned.
 *     - followup: { date: 'YYYY-MM-DD', time, note } when scheduled.
 *   member: { id (uid), email, role, branchId }
 *   branch: { id, name } as stored in settings/branches.
 *
 * Recovery rate follows teamInsights.js repPerformance: recovered /
 * (recovered + lost) — closed inquiries only — and is null when
 * nothing has closed yet, so the UI can show '—' instead of a
 * fabricated 0%. Zero-division never produces NaN/Infinity here.
 */

export const OPEN_STATUSES = ['new', 'followup', 'replied']

export const UNASSIGNED_BRANCH_ID = ''
export const UNASSIGNED_BRANCH_LABEL = 'Unassigned / no branch'
export const UNASSIGNED_MEMBER_ID = ''
export const UNASSIGNED_MEMBER_LABEL = 'Unassigned'

function valueOf(item) {
  return Number(item?.value) || 0
}

function isOpen(item) {
  return item?.status !== 'recovered' && item?.status !== 'lost'
}

/** Closed-only recovery rate (percent, rounded), or null when no
 *  inquiry has closed yet. */
export function recoveryRate(recovered, lost) {
  const closed = (Number(recovered) || 0) + (Number(lost) || 0)
  if (closed <= 0) return null
  return Math.round(((Number(recovered) || 0) / closed) * 100)
}

/** 'YYYY-MM-DD' for today (UTC), the same key Followups.jsx uses. */
export function todayKey(now = new Date()) {
  return now.toISOString().slice(0, 10)
}

/** Open inquiries whose scheduled follow-up falls on `today`
 *  ('YYYY-MM-DD'). Recovered/lost rows never count — their follow-up
 *  is done, whatever date it still carries. */
export function countFollowupsDueToday(items, today = todayKey()) {
  return (items || []).filter(
    item => isOpen(item) && item?.followup?.date === today
  ).length
}

function emptyBucket() {
  return { open: 0, recovered: 0, lost: 0, recoveredRevenue: 0 }
}

function addTo(bucket, item) {
  if (item?.status === 'recovered') {
    bucket.recovered += 1
    bucket.recoveredRevenue += valueOf(item)
  } else if (item?.status === 'lost') {
    bucket.lost += 1
  } else {
    bucket.open += 1
  }
}

function finish(bucket) {
  return {
    ...bucket,
    recoveryRate: recoveryRate(bucket.recovered, bucket.lost),
  }
}

/**
 * Per-branch rollup (#115 + #70). One row per branch:
 *   { branchId, branch, isUnassigned, total, open, recovered, lost,
 *     recoveryRate, recoveredRevenue }
 *
 * `branches` is the settings/branches list ([{ id, name }]); defined
 * branches appear even with zero inquiries, and branch names found
 * only on inquiries appear too. Rows sort by recovered revenue, then
 * total, then name. The unbranched bucket is included only when such
 * inquiries exist, and always sorts last.
 */
export function aggregateByBranch(inquiries, branches = []) {
  const items = inquiries || []
  const byBranch = new Map()

  const ensure = branchId => {
    if (!byBranch.has(branchId)) {
      byBranch.set(branchId, {
        branchId,
        branch: branchId || UNASSIGNED_BRANCH_LABEL,
        isUnassigned: branchId === UNASSIGNED_BRANCH_ID,
        total: 0,
        ...emptyBucket(),
      })
    }
    return byBranch.get(branchId)
  }

  for (const branch of branches || []) {
    const name =
      typeof branch === 'string' ? branch : branch?.name || ''
    if (name) ensure(name)
  }

  let hasUnassigned = false
  for (const item of items) {
    const branchId = item?.branchId || UNASSIGNED_BRANCH_ID
    if (branchId === UNASSIGNED_BRANCH_ID) hasUnassigned = true
    const row = ensure(branchId)
    row.total += 1
    addTo(row, item)
  }
  if (!hasUnassigned) byBranch.delete(UNASSIGNED_BRANCH_ID)

  return [...byBranch.values()]
    .map(finish)
    .sort((a, b) => {
      if (a.isUnassigned !== b.isUnassigned) return a.isUnassigned ? 1 : -1
      return (
        b.recoveredRevenue - a.recoveredRevenue ||
        b.total - a.total ||
        a.branch.localeCompare(b.branch)
      )
    })
}

/**
 * Per-member scorecard rollup (#116 + #89). One row per member:
 *   { memberId, name, email, role, isUnassigned, assigned, open,
 *     recovered, lost, recoveryRate, recoveredRevenue,
 *     followupsDueToday }
 *
 * Every member in `members` gets a row, even with zero assigned.
 * `options.ownerUid` / `options.ownerEmail` seed an owner row when
 * given (the workspace owner is not a members doc, but can hold
 * assigned rows). Inquiries whose assignedTo is empty — or names a
 * uid that is neither a member nor the owner — fold into a single
 * trailing "Unassigned" row, which appears only when such inquiries
 * exist. `options.today` ('YYYY-MM-DD') pins the follow-ups-due
 * count for tests; it defaults to today.
 */
export function aggregateByMember(inquiries, members = [], options = {}) {
  const items = inquiries || []
  const today = options.today || todayKey()
  const byMember = new Map()

  const ensure = (memberId, seed = {}) => {
    if (!byMember.has(memberId)) {
      byMember.set(memberId, {
        memberId,
        name: seed.name || seed.email || memberId,
        email: seed.email || '',
        role: seed.role || '',
        isUnassigned: memberId === UNASSIGNED_MEMBER_ID,
        assigned: 0,
        followupsDueToday: 0,
        ...emptyBucket(),
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
  for (const item of items) {
    let memberId = item?.assignedTo || UNASSIGNED_MEMBER_ID
    if (memberId !== UNASSIGNED_MEMBER_ID && !byMember.has(memberId)) {
      memberId = UNASSIGNED_MEMBER_ID
    }
    if (memberId === UNASSIGNED_MEMBER_ID) hasUnassigned = true
    const row = ensure(memberId, { name: UNASSIGNED_MEMBER_LABEL })
    addTo(row, item)
    row.assigned += 1
    if (isOpen(item) && item?.followup?.date === today) {
      row.followupsDueToday += 1
    }
  }
  if (!hasUnassigned) byMember.delete(UNASSIGNED_MEMBER_ID)

  return [...byMember.values()]
    .map(row => ({
      ...row,
      recoveryRate: recoveryRate(row.recovered, row.lost),
    }))
    .sort((a, b) => {
      if (a.isUnassigned !== b.isUnassigned) return a.isUnassigned ? 1 : -1
      return (
        b.recoveredRevenue - a.recoveredRevenue ||
        b.assigned - a.assigned ||
        a.name.localeCompare(b.name)
      )
    })
}

/** Workspace totals for report headers: same buckets, one row. */
export function summarizeInquiries(inquiries) {
  const bucket = { total: 0, ...emptyBucket() }
  for (const item of inquiries || []) {
    bucket.total += 1
    addTo(bucket, item)
  }
  return finish(bucket)
}
