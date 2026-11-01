/**
 * #11 — Territory rules (pure helpers + loader).
 *
 * A territory rule maps a service keyword to a branch: when a new
 * inquiry's service contains the keyword, the inquiry belongs to that
 * branch BEFORE routing runs, so routing then picks a rep inside the
 * branch (branch-filtered routing already exists in roundRobin.js).
 * First matching rule wins. A manager's own branch always wins over
 * territory (a manager's row belongs to their branch).
 *
 * Branch values are branch NAMES — the same convention as the detail
 * modal's branch select. Members must carry that exact name in their
 * profile for territory routing to reach them (member branchId is
 * hand-typed today); the card's help text says so.
 *
 * Storage: settings/territories doc, same settings-doc pattern
 * (owner/admin write, managers read).
 */

/** First matching rule's branch, or '' when nothing matches. */
export function matchTerritory(territories, inquiry) {
  const service = String(inquiry?.service || '').toLowerCase()
  if (!service) return ''
  for (const rule of Array.isArray(territories) ? territories : []) {
    const pattern = String(rule?.pattern || '').toLowerCase().trim()
    if (pattern && service.includes(pattern)) {
      return rule.branch || ''
    }
  }
  return ''
}

/** Validate one territory rule. Returns '' when valid, else the error. */
export function validateTerritory(rule, existing = []) {
  if (!rule.pattern || !rule.pattern.trim()) {
    return 'Service keyword is required.'
  }
  if (!rule.branch || !rule.branch.trim()) {
    return 'Branch is required.'
  }
  if (
    existing.some(
      r =>
        r.id !== rule.id &&
        r.pattern.toLowerCase() === rule.pattern.trim().toLowerCase()
    )
  ) {
    return 'A rule with this keyword already exists.'
  }
  return ''
}

/** Load territory rules for a workspace. Malformed entries dropped. */
export async function loadTerritories(db, ownerUid) {
  if (!db || !ownerUid) return []
  try {
    const snap = await db
      .collection('users')
      .doc(ownerUid)
      .collection('settings')
      .doc('territories')
      .get()
    if (!snap.exists) return []
    const raw = snap.data()?.territories
    if (!Array.isArray(raw)) return []
    return raw.filter(
      rule =>
        rule &&
        typeof rule.pattern === 'string' &&
        typeof rule.branch === 'string'
    )
  } catch (error) {
    console.error('Territories load failed:', error)
    return []
  }
}
