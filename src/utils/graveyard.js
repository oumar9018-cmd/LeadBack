/**
 * Graveyard Value Counter — the money rotting in dead leads.
 *
 * A lead counts toward the graveyard when:
 *  - status === 'lost' (explicitly dead), OR
 *  - status is open (new/followup/replied) AND last activity is > 30 days ago
 *    ("stale" — the owner has effectively abandoned it).
 *
 * lastActivity = latest of createdAt and any followupHistory entry date.
 */

export const STALE_AFTER_DAYS = 30

function toMs(value) {
  if (!value) return 0
  if (typeof value === 'number') return value
  const t = Date.parse(value)
  return Number.isNaN(t) ? 0 : t
}

function historyEntryMs(entry) {
  if (!entry) return 0
  // followupHistory entries store date as 'YYYY-MM-DD' (+ optional time 'HH:MM')
  if (entry.date) {
    const t = Date.parse(`${entry.date}${entry.time ? `T${entry.time}` : ''}`)
    if (!Number.isNaN(t)) return t
  }
  return toMs(entry.createdAt)
}

export function lastActivityMs(item) {
  let latest = toMs(item.createdAt)
  for (const entry of item.followupHistory || []) {
    latest = Math.max(latest, historyEntryMs(entry))
  }
  // A scheduled follow-up in the future means the lead is being worked.
  if (item.followup?.date) {
    latest = Math.max(latest, toMs(item.followup.date))
  }
  return latest
}

export function isStale(item, now = Date.now()) {
  if (['recovered', 'lost'].includes(item.status)) return false
  const last = lastActivityMs(item)
  if (!last) return false
  return now - last > STALE_AFTER_DAYS * 24 * 60 * 60 * 1000
}

export function computeGraveyard(items, now = Date.now()) {
  const lost = []
  const stale = []

  for (const item of items || []) {
    if (item.status === 'lost') lost.push(item)
    else if (isStale(item, now)) stale.push(item)
  }

  const sum = list => list.reduce((s, i) => s + (Number(i.value) || 0), 0)

  return {
    lost,
    stale,
    lostCount: lost.length,
    staleCount: stale.length,
    count: lost.length + stale.length,
    lostValue: sum(lost),
    staleValue: sum(stale),
    total: sum(lost) + sum(stale),
  }
}
