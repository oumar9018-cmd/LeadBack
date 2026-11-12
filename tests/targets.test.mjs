/**
 * Tests for src/utils/targets.js — plain node, no framework:
 *   node tests/targets.test.mjs
 * Exits non-zero on the first failed assertion.
 *
 * Monthly targets + pace forecast. All "now" values are pinned so
 * the month math is deterministic. Month keys/dates are UTC, the
 * convention recoveredAt ('YYYY-MM-DD') is written in.
 */
import assert from 'node:assert/strict'
import {
  isRecoveredInMonth,
  monthKeyFromMs,
  monthLabelFromMs,
  monthlyRecoveryByBranch,
  monthlyRecoveryByMember,
  normalizeTargetEntry,
  normalizeTargets,
  paceForecast,
  targetProgress,
} from '../src/utils/targets.js'

let passed = 0
function check(name, fn) {
  fn()
  passed += 1
  console.log(`ok ${passed} - ${name}`)
}

const NOV_13 = Date.parse('2026-11-13T12:00:00.000Z') // 13 of 30 days

/* ---------------- normalization ---------------- */

check('normalizeTargets: junk in, empty maps out', () => {
  assert.deepEqual(normalizeTargets(null), { reps: {}, branches: {} })
  assert.deepEqual(normalizeTargets('nope'), { reps: {}, branches: {} })
  assert.deepEqual(normalizeTargets({ reps: 'x', branches: 4 }), {
    reps: {},
    branches: {},
  })
})

check('normalizeTargetEntry: zero/negative/NaN targets are no target', () => {
  assert.equal(normalizeTargetEntry(null), null)
  assert.equal(normalizeTargetEntry({ revenue: 0, count: 0 }), null)
  assert.equal(normalizeTargetEntry({ revenue: -5, count: 'x' }), null)
  assert.deepEqual(normalizeTargetEntry({ revenue: '20000', count: 10.4 }), {
    revenue: 20000,
    count: 10,
  })
  assert.deepEqual(normalizeTargetEntry({ count: 5 }), { revenue: 0, count: 5 })
})

check('normalizeTargets: drops unusable entries, keeps usable ones', () => {
  const out = normalizeTargets({
    reps: { u1: { revenue: 5000, count: 0 }, u2: { revenue: 0, count: 0 }, u3: null },
    branches: { Andheri: { revenue: 9000, count: 9 } },
  })
  assert.deepEqual(out.reps, { u1: { revenue: 5000, count: 0 } })
  assert.deepEqual(out.branches, { Andheri: { revenue: 9000, count: 9 } })
})

/* ---------------- month keys ---------------- */

check('monthKeyFromMs / monthLabelFromMs: UTC month of the timestamp', () => {
  assert.equal(monthKeyFromMs(NOV_13), '2026-11')
  assert.equal(monthLabelFromMs(NOV_13), 'November 2026')
  assert.equal(monthKeyFromMs(Date.parse('2027-01-01T00:00:00.000Z')), '2027-01')
})

check('isRecoveredInMonth: needs recovered status AND a recoveredAt in month', () => {
  assert.equal(
    isRecoveredInMonth({ status: 'recovered', recoveredAt: '2026-11-01' }, '2026-11'),
    true
  )
  assert.equal(
    isRecoveredInMonth({ status: 'recovered', recoveredAt: '2026-10-31' }, '2026-11'),
    false
  )
  assert.equal(
    isRecoveredInMonth({ status: 'lost', recoveredAt: '2026-11-01' }, '2026-11'),
    false
  )
  // Recovered before the recoveredAt stamp existed: unplaceable, excluded.
  assert.equal(isRecoveredInMonth({ status: 'recovered' }, '2026-11'), false)
})

/* ---------------- monthly aggregation ---------------- */

const members = [
  { id: 'rep1', email: 'rep@example.com', role: 'sales_rep', branchId: 'Andheri' },
  { id: 'rep2', email: 'two@example.com', role: 'sales_rep', branchId: 'Bandra' },
]
const branches = [{ id: 'andheri', name: 'Andheri' }, { id: 'bandra', name: 'Bandra' }]

const items = [
  { status: 'recovered', recoveredAt: '2026-11-02', value: 1000, assignedTo: 'rep1', branchId: 'Andheri' },
  { status: 'recovered', recoveredAt: '2026-11-10', value: 3000, assignedTo: 'rep1', branchId: 'Andheri' },
  { status: 'recovered', recoveredAt: '2026-10-31', value: 9000, assignedTo: 'rep1', branchId: 'Andheri' }, // last month
  { status: 'recovered', recoveredAt: '2026-11-05', value: 2000, assignedTo: 'owner1', branchId: 'Bandra' },
  { status: 'recovered', recoveredAt: '2026-11-06', value: 500, assignedTo: 'ghost', branchId: '' }, // unknown rep, unbranched
  { status: 'recovered', value: 7000, assignedTo: 'rep2', branchId: 'Bandra' }, // no recoveredAt — excluded
  { status: 'lost', recoveredAt: '2026-11-06', value: 4000, assignedTo: 'rep2', branchId: 'Bandra' }, // not recovered
  { status: 'new', value: 100, assignedTo: 'rep2', branchId: 'Bandra' },
]

check('monthlyRecoveryByMember: counts only this-month recoveries, owner seeded', () => {
  const rows = monthlyRecoveryByMember(items, members, {
    ownerUid: 'owner1',
    ownerEmail: 'owner@example.com',
    monthKey: '2026-11',
  })
  const byId = new Map(rows.map(r => [r.memberId, r]))
  assert.equal(byId.get('rep1').recoveredCount, 2)
  assert.equal(byId.get('rep1').recoveredRevenue, 4000)
  assert.equal(byId.get('rep2').recoveredCount, 0) // no-date + lost rows excluded
  assert.equal(byId.get('owner1').recoveredCount, 1)
  assert.equal(byId.get('owner1').recoveredRevenue, 2000)
})

check('monthlyRecoveryByMember: unknown assignees fold into Unassigned', () => {
  const rows = monthlyRecoveryByMember(items, members, { monthKey: '2026-11' })
  const unassigned = rows.find(r => r.isUnassigned)
  assert.ok(unassigned)
  assert.equal(unassigned.recoveredCount, 2) // owner1 (unseeded) + ghost
  assert.equal(unassigned.recoveredRevenue, 2500)
})

check('monthlyRecoveryByMember: no Unassigned row when nothing folds there', () => {
  const rows = monthlyRecoveryByMember(
    items.filter(i => i.assignedTo === 'rep1'),
    members,
    { monthKey: '2026-11' }
  )
  assert.equal(rows.some(r => r.isUnassigned), false)
  assert.equal(rows.length, 2) // both members still listed at their values
})

check('monthlyRecoveryByBranch: defined branches appear even at zero', () => {
  const rows = monthlyRecoveryByBranch(items, branches, '2026-11')
  const byId = new Map(rows.map(r => [r.branchId, r]))
  assert.equal(byId.get('Andheri').recoveredRevenue, 4000)
  assert.equal(byId.get('Andheri').recoveredCount, 2)
  assert.equal(byId.get('Bandra').recoveredRevenue, 2000)
  const unassigned = rows.find(r => r.isUnassigned)
  assert.ok(unassigned)
  assert.equal(unassigned.recoveredRevenue, 500)
})

check('monthlyRecoveryByBranch: unbranched bucket hidden when empty this month', () => {
  const rows = monthlyRecoveryByBranch(
    items.filter(i => i.branchId),
    branches,
    '2026-11'
  )
  assert.equal(rows.some(r => r.isUnassigned), false)
})

/* ---------------- targetProgress ---------------- */

check('targetProgress: null without a target, rounded percent with one', () => {
  assert.equal(targetProgress(500, 0), null)
  assert.equal(targetProgress(500, undefined), null)
  assert.equal(targetProgress(500, 'x'), null)
  assert.equal(targetProgress(500, 1000), 50)
  assert.equal(targetProgress(1500, 1000), 150) // over-target is real, shown as-is
  assert.equal(targetProgress(0, 1000), 0)
})

/* ---------------- paceForecast ---------------- */

check('paceForecast: mid-month pace scales to the full month', () => {
  const paceItems = Array.from({ length: 13 }, (_, i) => ({
    status: 'recovered',
    recoveredAt: `2026-11-${String((i % 13) + 1).padStart(2, '0')}`,
    value: 1000,
  }))
  const pace = paceForecast(paceItems, NOV_13)
  assert.equal(pace.ready, true)
  assert.equal(pace.monthKey, '2026-11')
  assert.equal(pace.daysElapsed, 13)
  assert.equal(pace.daysInMonth, 30)
  assert.equal(pace.recoveredCount, 13)
  assert.equal(pace.recoveredRevenue, 13000)
  assert.equal(pace.projectedRevenue, 30000) // 13000 * 30/13
  assert.equal(pace.projectedCount, 30)
})

check('paceForecast: last month and undated recoveries do not count', () => {
  const pace = paceForecast(
    [
      { status: 'recovered', recoveredAt: '2026-10-15', value: 5000 },
      { status: 'recovered', value: 5000 },
      { status: 'lost', recoveredAt: '2026-11-03', value: 5000 },
    ],
    NOV_13
  )
  assert.equal(pace.ready, false)
  assert.equal(pace.recoveredCount, 0)
  assert.equal(pace.projectedRevenue, null)
  assert.equal(pace.projectedCount, null)
})

check('paceForecast: month lengths are real (leap February, 31-day month)', () => {
  const feb = paceForecast(
    [{ status: 'recovered', recoveredAt: '2028-02-10', value: 2900 }],
    Date.parse('2028-02-29T12:00:00.000Z')
  )
  assert.equal(feb.daysInMonth, 29)
  assert.equal(feb.daysElapsed, 29)
  assert.equal(feb.projectedRevenue, 2900) // final day: projection = actual
  const jan = paceForecast([], Date.parse('2026-01-15T12:00:00.000Z'))
  assert.equal(jan.daysInMonth, 31)
})

check('paceForecast: empty input is a clean not-ready shape', () => {
  const pace = paceForecast([], NOV_13)
  assert.equal(pace.ready, false)
  assert.equal(pace.recoveredRevenue, 0)
  assert.equal(pace.projectedRevenue, null)
})

console.log(`\n${passed} targets checks passed`)
