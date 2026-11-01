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

/** 'ok' | 'at-risk' | 'breached' | 'responded' | 'unknown'. Pure. */
export function getSlaStatus(inquiry, firstResponseHours, nowMs = Date.now()) {
  if (!inquiry || inquiry.status !== 'new') return 'responded'
  const created = Number(inquiry.createdAt)
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
  const created = Number(inquiry?.createdAt)
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
