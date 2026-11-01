/**
 * Wave 3 — Recovery analytics (pure helpers for the /app/recovery page).
 *
 * Every function here is a view over data the app already has: no new
 * collection, no estimates dressed as facts. Scores come from the
 * rules-based winbackScore engine and are labelled heuristic estimates
 * in the UI, never promises. Rows without usable dates are excluded
 * from time-based views, never guessed.
 */

import { winbackScore, rankByWinback } from './winbackScore.js'
import { lastActivityMs, STALE_AFTER_DAYS } from './graveyard.js'
import { OPEN_STATUSES } from './detectors.js'

export const WARNING_WINDOW_DAYS = 21
export const GHOSTING_AFTER_DAYS = 14

function toMs(value) {
  if (!value) return 0
  if (typeof value === 'number') return value
  const t = Date.parse(value)
  return Number.isNaN(t) ? 0 : t
}

function valueOf(item) {
  return Number(item?.value) || 0
}

function sumValue(list) {
  return list.reduce((s, i) => s + valueOf(i), 0)
}

/**
 * #162 — Early warnings: open inquiries gone quiet 21–29 days — about
 * to rot into the 30-day graveyard, but not there yet. Value first.
 */
export function earlyWarnings(items, nowMs = Date.now()) {
  const day = 24 * 60 * 60 * 1000
  return (items || [])
    .filter(item => OPEN_STATUSES.includes(item.status))
    .map(item => ({
      item,
      quietDays: Math.floor((nowMs - lastActivityMs(item)) / day),
    }))
    .filter(
      row =>
        row.quietDays >= WARNING_WINDOW_DAYS &&
        row.quietDays < STALE_AFTER_DAYS
    )
    .sort((a, b) => valueOf(b.item) - valueOf(a.item))
}

/**
 * #34 — Ghosting: replied, then silent 14+ days. A scheduled future
 * follow-up counts as activity (lastActivityMs already includes it),
 * so ghosted rows are truly unattended.
 */
export function ghostingRows(items, nowMs = Date.now()) {
  const day = 24 * 60 * 60 * 1000
  return (items || [])
    .filter(item => item.status === 'replied')
    .map(item => ({
      item,
      quietDays: Math.floor((nowMs - lastActivityMs(item)) / day),
    }))
    .filter(row => row.quietDays >= GHOSTING_AFTER_DAYS)
    .sort((a, b) => b.quietDays - a.quietDays)
}

/**
 * #163 — Decay prediction: today's win-back score vs the score if
 * nothing happens for 7 / 14 more days (age the inquiry, nothing
 * else changes). Rows without age data show a flat line, flagged.
 */
export function decayPredictions(items) {
  const day = 24 * 60 * 60 * 1000
  return (items || [])
    .filter(item => OPEN_STATUSES.includes(item.status))
    .map(item => {
      const base = toMs(item.createdAt) || toMs(item.date) || 0
      const now = winbackScore(item).score
      if (!base) {
        return { item, now, in7: now, in14: now, noAge: true }
      }
      const in7 = winbackScore({ ...item, createdAt: base - 7 * day }).score
      const in14 = winbackScore({ ...item, createdAt: base - 14 * day }).score
      return { item, now, in7, in14, noAge: false }
    })
    .sort((a, b) => b.now - a.now)
}

/**
 * #164 — Probability map: open pipeline grouped into heuristic score
 * bands. Bands are the winbackScore bands; the UI labels them as
 * heuristic estimates, not conversion promises.
 */
export function probabilityBands(items) {
  const bands = {
    hot: { label: 'High — follow up today', rows: [] },
    warm: { label: 'Medium — steady follow-up', rows: [] },
    cold: { label: 'Low — win-back offer territory', rows: [] },
  }
  for (const item of items || []) {
    if (!OPEN_STATUSES.includes(item.status)) continue
    const { band } = winbackScore(item)
    bands[band].rows.push(item)
  }
  return Object.entries(bands).map(([id, band]) => ({
    id,
    label: band.label,
    count: band.rows.length,
    value: sumValue(band.rows),
  }))
}

/** #36 — Ranked recovery list (top N by win-back score). */
export function rankedRecovery(items, limit = 20) {
  return rankByWinback(items).slice(0, limit)
}

/**
 * #24 — Forensics: lost inquiries grouped by loss reason and by
 * service, with counts and values. Labels come from the caller (the
 * LossReasonModal label map) so this file stays UI-free.
 */
export function forensicsByReason(lostItems, labels = {}) {
  const byReason = {}
  const byService = {}
  for (const item of lostItems || []) {
    const reason = item.lossReason || 'unknown'
    const label = labels[reason] || reason
    if (!byReason[label]) byReason[label] = { label, count: 0, value: 0 }
    byReason[label].count += 1
    byReason[label].value += valueOf(item)
    const service = item.service || 'Unknown service'
    if (!byService[service]) byService[service] = { service, count: 0, value: 0 }
    byService[service].count += 1
    byService[service].value += valueOf(item)
  }
  return {
    byReason: Object.values(byReason).sort((a, b) => b.value - a.value),
    byService: Object.values(byService)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5),
  }
}

/** #35 — Competitor-loss depth: what competitors took, and where. */
export function competitorDepth(lostItems) {
  const rows = (lostItems || []).filter(i => i.lossReason === 'competitor')
  const services = {}
  let latest = 0
  for (const row of rows) {
    const service = row.service || 'Unknown service'
    services[service] = (services[service] || 0) + 1
    latest = Math.max(latest, toMs(row.lostAt) || toMs(row.createdAt))
  }
  return {
    count: rows.length,
    value: sumValue(rows),
    services: Object.entries(services)
      .map(([service, count]) => ({ service, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    latestMs: latest || null,
  }
}

/** #43 — Rejection patterns over time: lost by reason × month. */
export function rejectionByMonth(lostItems) {
  const months = {}
  for (const item of lostItems || []) {
    const ms = toMs(item.lostAt) || toMs(item.createdAt)
    const month = ms
      ? new Date(ms).toISOString().slice(0, 7)
      : 'Unknown'
    if (!months[month]) months[month] = {}
    const reason = item.lossReason || 'unknown'
    months[month][reason] = (months[month][reason] || 0) + 1
  }
  return Object.entries(months)
    .map(([month, reasons]) => ({ month, reasons }))
    .sort((a, b) => (a.month < b.month ? 1 : -1))
    .slice(0, 12)
}

/** #41 — Recovery attribution: recovered value by source and by rep. */
export function attribution(recoveredItems, memberEmail = {}) {
  const bySource = {}
  const byRep = {}
  for (const item of recoveredItems || []) {
    const v = valueOf(item)
    const source = item.source || 'Unknown'
    if (!bySource[source]) bySource[source] = { key: source, count: 0, value: 0 }
    bySource[source].count += 1
    bySource[source].value += v
    const rep = memberEmail[item.assignedTo] || item.assignedTo || 'Unassigned'
    if (!byRep[rep]) byRep[rep] = { key: rep, count: 0, value: 0 }
    byRep[rep].count += 1
    byRep[rep].value += v
  }
  const sort = list => list.sort((a, b) => b.value - a.value)
  return { bySource: sort(Object.values(bySource)), byRep: sort(Object.values(byRep)) }
}

/** #42 — Proof vault totals: recovered rows + claimed offer values. */
export function vaultTotals(recoveredItems, offers) {
  const claimed = (offers || []).filter(o => Number(o.recoveredValue) > 0)
  return {
    recoveredCount: (recoveredItems || []).length,
    recoveredValue: sumValue(recoveredItems),
    claimedOffers: claimed.length,
    claimedValue: claimed.reduce(
      (s, o) => s + (Number(o.recoveredValue) || 0),
      0
    ),
  }
}
