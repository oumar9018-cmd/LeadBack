/**
 * #8 SLA Command Center + #123 SLA Breach Analytics (pure helpers).
 *
 * v1 SLA model — first response: a NEW inquiry breaches when it is
 * still 'new' (nobody has responded or followed up) longer than
 * firstResponseHours after creation. At risk = past 75% of the target.
 * Rows in any other status already got a response, so they can never
 * breach this SLA. Rows without createdAt cannot be aged honestly, so
 * they are 'unknown' and excluded — never guessed.
 *
 * #123 analytics is a snapshot over the current population (breach
 * buckets + oldest breach), not a historical trend: breach events are
 * not logged as history yet, so no trend is fabricated.
 */

export const SLA_AT_RISK_FRACTION = 0.75

/** createdAt → ms. Accepts epoch ms, ISO strings, and Firestore
 * Timestamps (toMillis/toDate); anything else is unknowable (NaN).
 * Mirrors the toMs pattern in graveyard.js. */
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

/** 'ok' | 'at-risk' | 'breached' | 'responded' | 'unknown'. Pure. */
export function getSlaStatus(inquiry, firstResponseHours, nowMs = Date.now()) {
  if (!inquiry || inquiry.status !== 'new') return 'responded'
  const created = createdMs(inquiry.createdAt)
  if (!Number.isFinite(created) || created <= 0) return 'unknown'
  const hours = Number(firstResponseHours)
  if (!Number.isFinite(hours) || hours <= 0) return 'ok'
  const ageHours = (nowMs - created) / (1000 * 60 * 60)
  if (ageHours > hours) return 'breached'
  if (ageHours > hours * SLA_AT_RISK_FRACTION) return 'at-risk'
  return 'ok'
}

/** Age in whole hours since creation, or null when unknowable. */
export function ageHours(inquiry, nowMs = Date.now()) {
  const created = createdMs(inquiry?.createdAt)
  if (!Number.isFinite(created) || created <= 0) return null
  return Math.floor((nowMs - created) / (1000 * 60 * 60))
}

/**
 * Snapshot summary: breached rows (oldest first), at-risk rows,
 * and breach age buckets. Pure — the dashboard section renders this.
 */
export function getSlaSummary(items, firstResponseHours, nowMs = Date.now()) {
  const breached = []
  const atRisk = []
  const buckets = { under48: 0, over48: 0 }
  for (const item of Array.isArray(items) ? items : []) {
    const status = getSlaStatus(item, firstResponseHours, nowMs)
    if (status === 'breached') {
      const age = ageHours(item, nowMs)
      breached.push({ ...item, age })
      if (age !== null && age >= 48) buckets.over48 += 1
      else buckets.under48 += 1
    } else if (status === 'at-risk') {
      atRisk.push({ ...item, age: ageHours(item, nowMs) })
    }
  }
  breached.sort((a, b) => (b.age ?? 0) - (a.age ?? 0))
  return {
    breached,
    atRisk,
    buckets,
    oldestBreachHours: breached.length > 0 ? breached[0].age : null,
  }
}

const DAY_MS = 1000 * 60 * 60 * 24

/**
 * SLA Centre analytics (Round 3) — the Reports page SLA tab.
 *
 * Windows (7 / 30 days) count inquiries CREATED inside the window
 * whose createdAt is readable; unreadable rows are excluded, never
 * guessed. A row is "judged" once it has had a fair chance to meet
 * the target: it is older than the target, or it already received a
 * first response (status moved off 'new'). "Breached" = judged and
 * STILL unanswered past the target. The breach rate is therefore
 * breached ÷ judged — the share of judgeable inquiries that never
 * got a first response in time.
 *
 * Honest limit: BackWon does not record a first-response timestamp,
 * so a row that was answered late counts as "responded" here — the
 * rate measures inquiries still waiting past the target, not every
 * late answer in history. The tab copy says exactly that.
 *
 * Worst branch / rep rank the CURRENT live breaches (the same list
 * getSlaSummary returns), not history. Branch labels follow the
 * reports.js convention: inquiry.branchId carries the branch name,
 * '' = unassigned. Assignees resolve through `members` (+ the owner
 * seed, like aggregateByMember); unknown uids fold into Unassigned.
 */
export function getSlaAnalytics(items, firstResponseHours, options = {}) {
  const list = Array.isArray(items) ? items : []
  const hours = Number(firstResponseHours)
  const enabled = Number.isFinite(hours) && hours > 0
  const nowMs =
    Number.isFinite(Number(options.nowMs)) && options.nowMs !== undefined
      ? Number(options.nowMs)
      : Date.now()
  const members = Array.isArray(options.members) ? options.members : []
  const ownerUid = options.ownerUid || ''
  const ownerEmail = options.ownerEmail || ''

  const memberLabel = uid => {
    if (!uid) return 'Unassigned'
    if (ownerUid && uid === ownerUid) return ownerEmail || 'Owner'
    const member = members.find(m => m && m.id === uid)
    if (member) return member.email || member.name || uid
    return 'Unassigned'
  }
  const memberKey = uid => {
    if (!uid) return ''
    if (ownerUid && uid === ownerUid) return uid
    return members.some(m => m && m.id === uid) ? uid : ''
  }

  const emptyWindow = () => ({
    created: 0,
    judged: 0,
    breached: 0,
    responded: 0,
    breachRate: null,
  })

  if (!enabled) {
    return {
      enabled: false,
      targetHours: 0,
      live: { breached: [], breachedCount: 0, atRiskCount: 0, oldestBreachHours: null },
      windows: { days7: emptyWindow(), days30: emptyWindow() },
      worstBranch: null,
      worstRep: null,
    }
  }

  const windowStats = days => {
    const start = nowMs - days * DAY_MS
    const stats = emptyWindow()
    for (const item of list) {
      const created = createdMs(item?.createdAt)
      if (!Number.isFinite(created)) continue
      if (created < start || created > nowMs) continue
      stats.created += 1
      const ageMs = nowMs - created
      const pastTarget = ageMs > hours * 60 * 60 * 1000
      const responded = item?.status !== 'new'
      if (!pastTarget && !responded) continue
      stats.judged += 1
      if (!responded && pastTarget) stats.breached += 1
    }
    stats.responded = stats.judged - stats.breached
    stats.breachRate =
      stats.judged > 0
        ? Math.round((stats.breached / stats.judged) * 100)
        : null
    return stats
  }

  const summary = getSlaSummary(list, hours, nowMs)
  const breached = summary.breached.map(item => ({
    id: item.id,
    name: item.name || 'Unnamed inquiry',
    service: item.service || '',
    branch: item.branchId || 'Unassigned / no branch',
    assigneeUid: memberKey(item.assignedTo),
    assignee: memberLabel(item.assignedTo),
    ageHours: item.age ?? null,
    value: Number(item.value) || 0,
  }))

  const worstOf = keyOf => {
    const counts = new Map()
    for (const row of breached) {
      const key = keyOf(row)
      counts.set(key, (counts.get(key) || 0) + 1)
    }
    let worst = null
    for (const [label, count] of counts) {
      if (
        !worst ||
        count > worst.count ||
        (count === worst.count && label.localeCompare(worst.label) < 0)
      ) {
        worst = { label, count }
      }
    }
    return worst
  }

  return {
    enabled: true,
    targetHours: hours,
    live: {
      breached,
      breachedCount: breached.length,
      atRiskCount: summary.atRisk.length,
      oldestBreachHours: summary.oldestBreachHours,
    },
    windows: { days7: windowStats(7), days30: windowStats(30) },
    worstBranch: worstOf(row => row.branch),
    worstRep: worstOf(row => row.assignee),
  }
}

/** Load SLA targets (settings/sla doc). Default 24h, 0 = SLA off. */
export async function loadSlaSettings(db, ownerUid) {
  if (!db || !ownerUid) return { firstResponseHours: 24 }
  try {
    const snap = await db
      .collection('users')
      .doc(ownerUid)
      .collection('settings')
      .doc('sla')
      .get()
    if (!snap.exists) return { firstResponseHours: 24 }
    const hours = Number(snap.data()?.firstResponseHours)
    return {
      firstResponseHours:
        Number.isInteger(hours) && hours >= 0 && hours <= 720 ? hours : 24,
    }
  } catch (error) {
    console.error('SLA settings load failed:', error)
    return { firstResponseHours: 24 }
  }
}
