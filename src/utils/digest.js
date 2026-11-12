/**
 * Manager Digest — Round 2, in-app digest for the Reports page.
 *
 * Pure functions over the same plain inquiry/member/branch objects
 * Reports.jsx already loads. Every figure here is computed from the
 * loaded inquiries — nothing is estimated, projected, or invented:
 * rows whose createdAt cannot be read are excluded from the
 * last-7-days count rather than guessed, and money sums treat a
 * missing `value` as 0 (the reports.js convention).
 *
 * Open = status not in (recovered, lost), the reports.js definition.
 * "Today" is the UTC date ('YYYY-MM-DD') of `nowMs`, the same key
 * shape followup.date carries.
 */

import { formatMoney } from './money.js'
import {
  aggregateByBranch,
  aggregateByMember,
  summarizeInquiries,
} from './reports.js'
import { getSlaSummary } from './sla.js'

const DAY_MS = 1000 * 60 * 60 * 24

/** createdAt → ms. Mirrors the createdMs/toMs pattern in sla.js:
 * epoch ms, ISO strings, and Firestore Timestamps are readable;
 * anything else is unknowable (NaN) and excluded, never guessed. */
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

function isOpen(item) {
  return item?.status !== 'recovered' && item?.status !== 'lost'
}

function nameOf(item) {
  return item?.name || 'Unnamed inquiry'
}

function valueOf(item) {
  return Number(item?.value) || 0
}

/** 'YYYY-MM-DD' → UTC-midnight ms, or NaN for an unreadable key. */
function dateKeyMs(key) {
  if (typeof key !== 'string') return NaN
  const t = Date.parse(`${key}T00:00:00.000Z`)
  return Number.isFinite(t) ? t : NaN
}

/**
 * Build the digest snapshot:
 *   {
 *     generatedForDate: 'YYYY-MM-DD' (UTC, from nowMs),
 *     totals,                       // summarizeInquiries(items)
 *     newLast7Days,                 // count, createdAt in [now-7d, now]
 *     dueToday:  { count, top: [{ name, value }] },
 *     overdue:   { count, totalValue, top: [{ name, value, daysOverdue }] },
 *     slaBreaches: { count, top: [{ name, ageHours }] },
 *     unassigned: { count, value },
 *     escalated: { count, names: [name, ...] },
 *     topBranch: { branch, recoveredRevenue, recovered } | null,
 *     topRep:    { name, recoveredRevenue, recovered } | null,
 *   }
 * Top lists are capped at 5.
 */
export function buildDigest(
  items,
  { members = [], branches = [], slaHours = 0, nowMs = Date.now() } = {}
) {
  const list = Array.isArray(items) ? items : []
  const now = Number(nowMs)
  const safeNow = Number.isFinite(now) ? now : Date.now()
  const today = new Date(safeNow).toISOString().slice(0, 10)
  const todayMs = dateKeyMs(today)

  const totals = summarizeInquiries(list)

  const windowStart = safeNow - 7 * DAY_MS
  let newLast7Days = 0
  for (const item of list) {
    const created = createdMs(item?.createdAt)
    if (!Number.isFinite(created)) continue
    if (created >= windowStart && created <= safeNow) newLast7Days += 1
  }

  const dueItems = list
    .filter(item => isOpen(item) && item?.followup?.date === today)
    .map(item => ({ name: nameOf(item), value: valueOf(item) }))
    .sort((a, b) => b.value - a.value)
  const dueToday = { count: dueItems.length, top: dueItems.slice(0, 5) }

  const overdueItems = list
    .filter(
      item =>
        isOpen(item) &&
        item?.status === 'followup' &&
        typeof item?.followup?.date === 'string' &&
        item.followup.date < today
    )
    .map(item => {
      const followupMs = dateKeyMs(item.followup.date)
      const daysOverdue =
        Number.isFinite(followupMs) && Number.isFinite(todayMs)
          ? Math.round((todayMs - followupMs) / DAY_MS)
          : 0
      return { name: nameOf(item), value: valueOf(item), daysOverdue }
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue || b.value - a.value)
  const overdue = {
    count: overdueItems.length,
    totalValue: overdueItems.reduce((sum, row) => sum + row.value, 0),
    top: overdueItems.slice(0, 5),
  }

  const breached = getSlaSummary(list, slaHours, safeNow).breached || []
  const slaBreaches = {
    count: breached.length,
    top: breached.slice(0, 5).map(item => ({
      name: nameOf(item),
      ageHours: item.age ?? null,
    })),
  }

  let unassignedCount = 0
  let unassignedValue = 0
  for (const item of list) {
    if (isOpen(item) && !item?.assignedTo) {
      unassignedCount += 1
      unassignedValue += valueOf(item)
    }
  }
  const unassigned = { count: unassignedCount, value: unassignedValue }

  const escalatedItems = list.filter(item => isOpen(item) && item?.escalatedAt)
  const escalated = {
    count: escalatedItems.length,
    names: escalatedItems.slice(0, 5).map(nameOf),
  }

  const branchRow = (aggregateByBranch(list, branches) || [])
    .filter(row => !row.isUnassigned && row.recovered > 0)
    .sort((a, b) => b.recoveredRevenue - a.recoveredRevenue)[0]
  const topBranch = branchRow
    ? {
        branch: branchRow.branch,
        recoveredRevenue: branchRow.recoveredRevenue,
        recovered: branchRow.recovered,
      }
    : null

  const memberRow = (aggregateByMember(list, members) || [])
    .filter(row => !row.isUnassigned && row.recovered > 0)
    .sort((a, b) => b.recoveredRevenue - a.recoveredRevenue)[0]
  const topRep = memberRow
    ? {
        name: memberRow.name,
        recoveredRevenue: memberRow.recoveredRevenue,
        recovered: memberRow.recovered,
      }
    : null

  return {
    generatedForDate: today,
    totals,
    newLast7Days,
    dueToday,
    overdue,
    slaBreaches,
    unassigned,
    escalated,
    topBranch,
    topRep,
  }
}

/**
 * Plain-text version of the digest, ready to paste into WhatsApp or
 * email. Headline lines are always present with the real numbers
 * (0 included); top branch / top rep lines appear only when there
 * is a recovered leader to name. No marketing language.
 */
export function formatDigestText(digest, currency) {
  const d = digest || {}
  const totals = d.totals || {}
  const lines = [
    `BackWon manager digest — ${d.generatedForDate || ''}`,
    `New inquiries (last 7 days): ${d.newLast7Days ?? 0}`,
    `Recovered: ${totals.recovered ?? 0} (${formatMoney(totals.recoveredRevenue ?? 0, currency)})`,
    `Follow-ups due today: ${d.dueToday?.count ?? 0}`,
    `Overdue follow-ups: ${d.overdue?.count ?? 0} (${formatMoney(d.overdue?.totalValue ?? 0, currency)})`,
    `SLA breaches: ${d.slaBreaches?.count ?? 0}`,
    `Unassigned open inquiries: ${d.unassigned?.count ?? 0} (${formatMoney(d.unassigned?.value ?? 0, currency)})`,
    `Escalated: ${d.escalated?.count ?? 0}`,
  ]
  if (d.topBranch) {
    lines.push(
      `Top branch: ${d.topBranch.branch} — ${formatMoney(d.topBranch.recoveredRevenue, currency)} recovered (${d.topBranch.recovered} recovered)`
    )
  }
  if (d.topRep) {
    lines.push(
      `Top rep: ${d.topRep.name} — ${formatMoney(d.topRep.recoveredRevenue, currency)} recovered (${d.topRep.recovered} recovered)`
    )
  }
  return lines.join('\n')
}
