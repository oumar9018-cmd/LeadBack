/**
 * Wave 1 detectors — pure functions, no Firestore, no DOM.
 *
 * Powers audit #18 (duplicate check), #31 (missed follow-ups — already
 * surfaced by Followups.jsx, kept here for reuse), and #33 (unassigned
 * revenue). All inputs are rows the caller can already see, so these
 * functions cannot leak data across workspace scopes.
 */
import { normalizePhone } from './whatsapp.js'

export const OPEN_STATUSES = ['new', 'followup', 'replied']

/**
 * #18 — open inquiries sharing the caller's normalized phone number.
 * Normalization means +91 98765 43210, 09876543210 and 919876543210 all
 * match each other. Closed (recovered/lost) rows are NOT matches: a
 * returning customer is a new inquiry, not a duplicate.
 */
export function findOpenDuplicates(items, phone) {
  const wanted = normalizePhone(phone)
  if (!wanted) return []
  return (items || []).filter(
    item =>
      OPEN_STATUSES.includes(item.status) &&
      normalizePhone(item.phone) === wanted
  )
}

/** #33 — open inquiries with nobody assigned. */
export function getUnassignedOpen(items) {
  return (items || []).filter(
    item => OPEN_STATUSES.includes(item.status) && !(item.assignedTo || '')
  )
}

/** Sum of the value field across rows (non-numeric treated as 0). */
export function totalValue(items) {
  return (items || []).reduce(
    (sum, item) => sum + (Number(item.value) || 0),
    0
  )
}
