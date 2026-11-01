// #57 — pipeline health (pure, unit-tested). A rules-based verdict, not
// a model: counts by status, stale share, unassigned, and SLA breaches
// (when a target is configured) decide Healthy / Needs attention /
// Critical. Thresholds are documented here, not hidden in the UI.

import { isStale } from './graveyard.js'
import { getSlaStatus } from './sla.js'

const OPEN_STATUSES = ['new', 'followup', 'replied']

export function pipelineHealth(items, nowMs = Date.now(), slaHours = 0) {
  const list = items || []
  const byStatus = {}
  let valueByStatus = {}
  for (const item of list) {
    const s = item.status || 'unknown'
    byStatus[s] = (byStatus[s] || 0) + 1
    valueByStatus[s] = (valueByStatus[s] || 0) + (Number(item.value) || 0)
  }
  const open = list.filter(i => OPEN_STATUSES.includes(i.status))
  const stale = open.filter(i => isStale(i, nowMs))
  const unassigned = open.filter(i => !i.assignedTo)
  const breached =
    slaHours > 0
      ? open.filter(i => getSlaStatus(i, slaHours, nowMs) === 'breached').length
      : 0
  const staleShare = open.length > 0 ? stale.length / open.length : 0
  const notes = []
  if (unassigned.length > 0) notes.push(`${unassigned.length} open lead(s) unassigned`)
  if (stale.length > 0) notes.push(`${stale.length} open lead(s) quiet 30+ days`)
  if (breached > 0) notes.push(`${breached} SLA breach(es)`)
  let verdict = 'healthy'
  if (staleShare > 0.3 || breached > 5) verdict = 'critical'
  else if (notes.length > 0) verdict = 'needs-attention'
  if (notes.length === 0) notes.push('No blockers detected')
  return {
    byStatus,
    valueByStatus,
    openCount: open.length,
    staleCount: stale.length,
    unassignedCount: unassigned.length,
    breachedCount: breached,
    staleShare: Math.round(staleShare * 100),
    verdict,
    notes,
  }
}
