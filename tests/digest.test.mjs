/**
 * Tests for src/utils/digest.js — plain node, no framework:
 *   node tests/digest.test.mjs
 * Exits non-zero on the first failed assertion.
 */
import assert from 'node:assert/strict'
import { buildDigest, formatDigestText } from '../src/utils/digest.js'

// Fixed "now": 2026-11-12 12:00 UTC, so today (UTC) is 2026-11-12.
const NOW = Date.UTC(2026, 10, 12, 12, 0, 0)
const DAY = 1000 * 60 * 60 * 24
const HOUR = 1000 * 60 * 60
const TODAY = '2026-11-12'

let passed = 0
function check(name, fn) {
  fn()
  passed += 1
  console.log(`ok ${passed} - ${name}`)
}

/* ---------------- generatedForDate + totals ---------------- */

check('digest: generatedForDate is the UTC date of nowMs, totals reused', () => {
  const digest = buildDigest(
    [
      { name: 'A', status: 'recovered', value: 1000 },
      { name: 'B', status: 'lost', value: 500 },
      { name: 'C', status: 'new', value: 250 },
    ],
    { nowMs: NOW }
  )
  assert.equal(digest.generatedForDate, TODAY)
  assert.equal(digest.totals.total, 3)
  assert.equal(digest.totals.recovered, 1)
  assert.equal(digest.totals.recoveredRevenue, 1000)
  assert.equal(digest.totals.open, 1)
})

/* ---------------- newLast7Days boundaries ---------------- */

check('newLast7Days: exactly 7x24h ago counts, 7d+1h ago does not', () => {
  const digest = buildDigest(
    [
      { name: 'edge-in', status: 'new', createdAt: NOW - 7 * DAY },
      { name: 'edge-out', status: 'new', createdAt: NOW - 7 * DAY - HOUR },
      { name: 'fresh', status: 'new', createdAt: NOW - HOUR },
      { name: 'at-now', status: 'new', createdAt: NOW },
    ],
    { nowMs: NOW }
  )
  assert.equal(digest.newLast7Days, 3)
})

check('newLast7Days: unknown createdAt is excluded, never guessed', () => {
  const digest = buildDigest(
    [
      { name: 'missing', status: 'new' },
      { name: 'garbage', status: 'new', createdAt: 'not-a-date' },
      { name: 'null', status: 'new', createdAt: null },
      { name: 'iso', status: 'new', createdAt: new Date(NOW - DAY).toISOString() },
      { name: 'future', status: 'new', createdAt: NOW + HOUR },
    ],
    { nowMs: NOW }
  )
  assert.equal(digest.newLast7Days, 1)
})

/* ---------------- dueToday ---------------- */

check('dueToday: closed rows excluded, top 5 by value desc', () => {
  const digest = buildDigest(
    [
      { name: 'small', status: 'followup', value: 100, followup: { date: TODAY } },
      { name: 'big', status: 'new', value: 300, followup: { date: TODAY } },
      { name: 'done', status: 'recovered', value: 9999, followup: { date: TODAY } },
      { name: 'gone', status: 'lost', value: 8888, followup: { date: TODAY } },
      { name: 'tomorrow', status: 'followup', value: 7777, followup: { date: '2026-11-13' } },
    ],
    { nowMs: NOW }
  )
  assert.equal(digest.dueToday.count, 2)
  assert.deepEqual(digest.dueToday.top, [
    { name: 'big', value: 300 },
    { name: 'small', value: 100 },
  ])
})

check('dueToday: missing name falls back to Unnamed inquiry', () => {
  const digest = buildDigest(
    [{ status: 'followup', value: 10, followup: { date: TODAY } }],
    { nowMs: NOW }
  )
  assert.equal(digest.dueToday.top[0].name, 'Unnamed inquiry')
})

/* ---------------- overdue ---------------- */

check('overdue: days math, total value, ordering by days then value', () => {
  const digest = buildDigest(
    [
      { name: 'two-days', status: 'followup', value: 500, followup: { date: '2026-11-10' } },
      { name: 'seven-low', status: 'followup', value: 200, followup: { date: '2026-11-05' } },
      { name: 'seven-high', status: 'followup', value: 900, followup: { date: '2026-11-05' } },
      // Not status followup -> never overdue under this definition.
      { name: 'new-old', status: 'new', value: 4000, followup: { date: '2026-11-01' } },
      // Closed -> excluded even with an old followup date.
      { name: 'recovered-old', status: 'recovered', value: 3000, followup: { date: '2026-11-01' } },
      // Due today is not overdue.
      { name: 'today', status: 'followup', value: 2000, followup: { date: TODAY } },
    ],
    { nowMs: NOW }
  )
  assert.equal(digest.overdue.count, 3)
  assert.equal(digest.overdue.totalValue, 1600)
  assert.deepEqual(digest.overdue.top, [
    { name: 'seven-high', value: 900, daysOverdue: 7 },
    { name: 'seven-low', value: 200, daysOverdue: 7 },
    { name: 'two-days', value: 500, daysOverdue: 2 },
  ])
})

/* ---------------- unassigned ---------------- */

check('unassigned: open rows only, missing values count as 0', () => {
  const digest = buildDigest(
    [
      { name: 'a', status: 'new', value: 100 },
      { name: 'b', status: 'followup', assignedTo: '' }, // value missing
      { name: 'c', status: 'new', value: 500, assignedTo: 'uid-x' },
      { name: 'd', status: 'recovered', value: 900 }, // closed -> excluded
      { name: 'e', status: 'lost', assignedTo: '' }, // closed -> excluded
    ],
    { nowMs: NOW }
  )
  assert.equal(digest.unassigned.count, 2)
  assert.equal(digest.unassigned.value, 100)
})

/* ---------------- SLA passthrough ---------------- */

check('slaBreaches: slaHours 0 means SLA off -> zero breaches', () => {
  const digest = buildDigest(
    [{ name: 'ancient', status: 'new', createdAt: NOW - 30 * DAY }],
    { nowMs: NOW, slaHours: 0 }
  )
  assert.equal(digest.slaBreaches.count, 0)
  assert.deepEqual(digest.slaBreaches.top, [])
})

check('slaBreaches: breached new row counted with age from the SLA summary', () => {
  const digest = buildDigest(
    [
      { name: 'breached', status: 'new', createdAt: NOW - 48 * HOUR },
      { name: 'responded', status: 'replied', createdAt: NOW - 96 * HOUR },
      { name: 'fresh', status: 'new', createdAt: NOW - 2 * HOUR },
    ],
    { nowMs: NOW, slaHours: 24 }
  )
  assert.equal(digest.slaBreaches.count, 1)
  assert.deepEqual(digest.slaBreaches.top, [{ name: 'breached', ageHours: 48 }])
})

/* ---------------- escalated ---------------- */

check('escalated: only open rows with escalatedAt set', () => {
  const digest = buildDigest(
    [
      { name: 'esc-open', status: 'followup', escalatedAt: '2026-11-11T09:00:00.000Z' },
      { name: 'esc-recovered', status: 'recovered', escalatedAt: '2026-11-11T09:00:00.000Z' },
      { name: 'esc-lost', status: 'lost', escalatedAt: '2026-11-11T09:00:00.000Z' },
      { name: 'plain', status: 'new' },
    ],
    { nowMs: NOW }
  )
  assert.equal(digest.escalated.count, 1)
  assert.deepEqual(digest.escalated.names, ['esc-open'])
})

/* ---------------- top branch / top rep ---------------- */

const members = [
  { id: 'uid-asha', email: 'asha@example.com', role: 'sales_rep', branchId: 'Andheri' },
  { id: 'uid-ravi', email: 'ravi@example.com', role: 'sales_rep', branchId: 'Bandra' },
]
const branches = [
  { id: 'andheri', name: 'Andheri' },
  { id: 'bandra', name: 'Bandra' },
]

check('topBranch/topRep: null when nothing is recovered', () => {
  const digest = buildDigest(
    [
      { name: 'a', status: 'new', value: 100, branchId: 'Andheri', assignedTo: 'uid-asha' },
      { name: 'b', status: 'lost', value: 200, branchId: 'Bandra', assignedTo: 'uid-ravi' },
    ],
    { nowMs: NOW, members, branches }
  )
  assert.equal(digest.topBranch, null)
  assert.equal(digest.topRep, null)
})

check('topBranch/topRep: highest recovered revenue, unassigned excluded', () => {
  const digest = buildDigest(
    [
      { name: 'a', status: 'recovered', value: 5000, branchId: 'Andheri', assignedTo: 'uid-asha' },
      { name: 'b', status: 'recovered', value: 7000, branchId: 'Bandra', assignedTo: 'uid-ravi' },
      // Bigger, but unbranched + unassigned: folds into the excluded rows.
      { name: 'c', status: 'recovered', value: 99999, branchId: '', assignedTo: '' },
    ],
    { nowMs: NOW, members, branches }
  )
  assert.deepEqual(digest.topBranch, {
    branch: 'Bandra',
    recoveredRevenue: 7000,
    recovered: 1,
  })
  assert.deepEqual(digest.topRep, {
    name: 'ravi@example.com',
    recoveredRevenue: 7000,
    recovered: 1,
  })
})

/* ---------------- formatDigestText ---------------- */

check('formatDigestText: headline figures present, top lines omitted when null', () => {
  const digest = buildDigest(
    [
      { name: 'fresh', status: 'new', createdAt: NOW - HOUR, followup: { date: TODAY } },
      { name: 'late', status: 'followup', value: 400, followup: { date: '2026-11-10' } },
      // Genuine breach: still 'new' 48h after creation vs a 24h target.
      // Assigned, so it does not change the unassigned count.
      { name: 'stale', status: 'new', createdAt: NOW - 48 * HOUR, assignedTo: 'uid-x' },
    ],
    { nowMs: NOW, slaHours: 24 }
  )
  const text = formatDigestText(digest, 'USD')
  assert.ok(text.includes(TODAY))
  assert.ok(text.includes('New inquiries (last 7 days): 2'))
  assert.ok(text.includes('Recovered: 0'))
  assert.ok(text.includes('Follow-ups due today: 1'))
  assert.ok(text.includes('Overdue follow-ups: 1'))
  assert.ok(text.includes('$400'))
  assert.ok(text.includes('SLA breaches: 1'))
  assert.ok(text.includes('Unassigned open inquiries: 2'))
  assert.ok(text.includes('Escalated: 0'))
  assert.ok(!text.includes('Top branch'))
  assert.ok(!text.includes('Top rep'))
})

check('formatDigestText: top branch and top rep lines appear when present', () => {
  const digest = buildDigest(
    [
      { name: 'b', status: 'recovered', value: 7000, branchId: 'Bandra', assignedTo: 'uid-ravi' },
    ],
    { nowMs: NOW, members, branches }
  )
  const text = formatDigestText(digest, 'USD')
  assert.ok(text.includes('Recovered: 1'))
  assert.ok(text.includes('$7,000'))
  assert.ok(text.includes('Top branch: Bandra'))
  assert.ok(text.includes('Top rep: ravi@example.com'))
})

check('digest: empty input is all zeros with null leaders', () => {
  const digest = buildDigest([], { nowMs: NOW })
  assert.equal(digest.newLast7Days, 0)
  assert.equal(digest.dueToday.count, 0)
  assert.equal(digest.overdue.count, 0)
  assert.equal(digest.slaBreaches.count, 0)
  assert.equal(digest.unassigned.count, 0)
  assert.equal(digest.escalated.count, 0)
  assert.equal(digest.topBranch, null)
  assert.equal(digest.topRep, null)
})

console.log(`\n${passed} checks passed`)
