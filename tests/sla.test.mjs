/**
 * Tests for src/utils/sla.js — plain node, no framework:
 *   node tests/sla.test.mjs
 * Exits non-zero on the first failed assertion.
 *
 * Covers the pre-existing getSlaStatus/getSlaSummary basics and the
 * Round 3 getSlaAnalytics (SLA Centre): 7/30-day windows, the judged
 * rule, live breach list labelling, worst branch/rep.
 */
import assert from 'node:assert/strict'
import {
  getSlaAnalytics,
  getSlaStatus,
  getSlaSummary,
} from '../src/utils/sla.js'

const NOW = Date.parse('2026-11-12T12:00:00.000Z')
const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
const TARGET = 24

let passed = 0
function check(name, fn) {
  fn()
  passed += 1
  console.log(`ok ${passed} - ${name}`)
}

/* ---------------- getSlaStatus basics ---------------- */

check('getSlaStatus: non-new rows are responded, never breached', () => {
  const old = { status: 'followup', createdAt: NOW - 90 * DAY }
  assert.equal(getSlaStatus(old, TARGET, NOW), 'responded')
})

check('getSlaStatus: unreadable createdAt is unknown', () => {
  assert.equal(getSlaStatus({ status: 'new' }, TARGET, NOW), 'unknown')
  assert.equal(
    getSlaStatus({ status: 'new', createdAt: 'not-a-date' }, TARGET, NOW),
    'unknown'
  )
})

check('getSlaStatus: SLA off (0 hours) never breaches', () => {
  const old = { status: 'new', createdAt: NOW - 90 * DAY }
  assert.equal(getSlaStatus(old, 0, NOW), 'ok')
})

check('getSlaSummary: breached sorted oldest first, at-risk separate', () => {
  const items = [
    { id: 'a', status: 'new', createdAt: NOW - 30 * HOUR },
    { id: 'b', status: 'new', createdAt: NOW - 50 * HOUR },
    { id: 'c', status: 'new', createdAt: NOW - 20 * HOUR },
  ]
  const summary = getSlaSummary(items, TARGET, NOW)
  assert.deepEqual(summary.breached.map(r => r.id), ['b', 'a'])
  assert.deepEqual(summary.atRisk.map(r => r.id), ['c'])
  assert.equal(summary.oldestBreachHours, 50)
})

/* ---------------- getSlaAnalytics ---------------- */

const members = [{ id: 'm1', email: 'rep@example.com', role: 'sales_rep' }]
const items = [
  // A — breached, 7d window, Andheri, m1
  { id: 'A', name: 'Asha', status: 'new', createdAt: NOW - 3 * DAY, branchId: 'Andheri', assignedTo: 'm1', value: 1000 },
  // B — breached, 7d window, Andheri, m1
  { id: 'B', name: 'Bala', status: 'new', createdAt: NOW - 2 * DAY, branchId: 'Andheri', assignedTo: 'm1', value: 2000 },
  // C — breached, 30d window only, Bandra, owner
  { id: 'C', name: 'Chet', status: 'new', createdAt: NOW - 10 * DAY, branchId: 'Bandra', assignedTo: 'owner1', value: 3000 },
  // D — exactly at target age: at-risk, NOT judged in windows
  { id: 'D', name: 'Dev', status: 'new', createdAt: NOW - 1 * DAY, branchId: 'Bandra', assignedTo: 'm1' },
  // E — responded, both windows
  { id: 'E', name: 'Esha', status: 'followup', createdAt: NOW - 5 * DAY, branchId: 'Bandra', assignedTo: 'm1' },
  // F — responded quickly (young but already answered): judged + responded
  { id: 'F', name: 'Fara', status: 'replied', createdAt: NOW - 2 * HOUR, branchId: 'Bandra', assignedTo: '' },
  // G — breached live, outside both windows, Powai, m1
  { id: 'G', name: 'Giri', status: 'new', createdAt: NOW - 40 * DAY, branchId: 'Powai', assignedTo: 'm1', value: 500 },
  // H — unreadable createdAt: excluded everywhere
  { id: 'H', name: 'Hema', status: 'new', branchId: 'Powai', assignedTo: 'm1' },
  // I — breached, no branch, unknown assignee folds to Unassigned
  { id: 'I', name: 'Ira', status: 'new', createdAt: NOW - 3 * DAY, branchId: '', assignedTo: 'ghost', value: 700 },
]

const analytics = getSlaAnalytics(items, TARGET, {
  members,
  ownerUid: 'owner1',
  ownerEmail: 'owner@example.com',
  nowMs: NOW,
})

check('analytics: enabled with the target echoed', () => {
  assert.equal(analytics.enabled, true)
  assert.equal(analytics.targetHours, 24)
})

check('analytics: 7-day window — created/judged/breached/responded/rate', () => {
  assert.deepEqual(analytics.windows.days7, {
    created: 6,
    judged: 5,
    breached: 3,
    responded: 2,
    breachRate: 60,
  })
})

check('analytics: 30-day window includes the 10-day-old breach', () => {
  assert.deepEqual(analytics.windows.days30, {
    created: 7,
    judged: 6,
    breached: 4,
    responded: 2,
    breachRate: 67,
  })
})

check('analytics: live breach list is oldest first with resolved labels', () => {
  assert.equal(analytics.live.breachedCount, 5)
  assert.deepEqual(
    analytics.live.breached.map(r => r.id),
    ['G', 'C', 'A', 'I', 'B']
  )
  const ira = analytics.live.breached.find(r => r.id === 'I')
  assert.equal(ira.branch, 'Unassigned / no branch')
  assert.equal(ira.assignee, 'Unassigned')
  const chet = analytics.live.breached.find(r => r.id === 'C')
  assert.equal(chet.assignee, 'owner@example.com')
  const asha = analytics.live.breached.find(r => r.id === 'A')
  assert.equal(asha.assignee, 'rep@example.com')
  assert.equal(asha.ageHours, 72)
  assert.equal(analytics.live.atRiskCount, 1)
  assert.equal(analytics.live.oldestBreachHours, 960)
})

check('analytics: worst branch and worst rep come from live breaches', () => {
  assert.deepEqual(analytics.worstBranch, { label: 'Andheri', count: 2 })
  assert.deepEqual(analytics.worstRep, { label: 'rep@example.com', count: 3 })
})

check('analytics: SLA off returns the disabled shape, no claims', () => {
  const off = getSlaAnalytics(items, 0, { members, nowMs: NOW })
  assert.equal(off.enabled, false)
  assert.equal(off.live.breachedCount, 0)
  assert.equal(off.windows.days7.breachRate, null)
  assert.equal(off.worstBranch, null)
  assert.equal(off.worstRep, null)
})

check('analytics: breach rate is null (not 0) when nothing is judged', () => {
  const young = [
    { id: 'y', status: 'new', createdAt: NOW - 1 * HOUR },
  ]
  const result = getSlaAnalytics(young, TARGET, { nowMs: NOW })
  assert.equal(result.windows.days7.created, 1)
  assert.equal(result.windows.days7.judged, 0)
  assert.equal(result.windows.days7.breachRate, null)
})

check('analytics: no breaches means worst branch/rep are null', () => {
  const calm = [
    { id: 'x', status: 'recovered', createdAt: NOW - 3 * DAY, branchId: 'Bandra' },
  ]
  const result = getSlaAnalytics(calm, TARGET, { nowMs: NOW })
  assert.equal(result.live.breachedCount, 0)
  assert.equal(result.worstBranch, null)
  assert.equal(result.worstRep, null)
  assert.equal(result.windows.days7.breachRate, 0)
})

check('analytics: malformed input never throws', () => {
  const result = getSlaAnalytics(null, TARGET, { nowMs: NOW })
  assert.equal(result.live.breachedCount, 0)
  assert.equal(result.windows.days30.created, 0)
})

console.log(`\n${passed} checks passed`)
