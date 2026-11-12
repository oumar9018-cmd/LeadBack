/**
 * Tests for src/utils/reports.js — plain node, no framework:
 *   node tests/reports.test.mjs
 * Exits non-zero on the first failed assertion.
 */
import assert from 'node:assert/strict'
import {
  aggregateByBranch,
  aggregateByMember,
  countFollowupsDueToday,
  recoveryRate,
  summarizeInquiries,
} from '../src/utils/reports.js'

const TODAY = '2026-11-12'

let passed = 0
function check(name, fn) {
  fn()
  passed += 1
  console.log(`ok ${passed} - ${name}`)
}

/* ---------------- recoveryRate edge cases ---------------- */

check('recoveryRate: zero division returns null, never NaN', () => {
  assert.equal(recoveryRate(0, 0), null)
  assert.equal(recoveryRate(undefined, undefined), null)
})

check('recoveryRate: closed-only math', () => {
  assert.equal(recoveryRate(3, 1), 75)
  assert.equal(recoveryRate(0, 4), 0)
  assert.equal(recoveryRate(2, 0), 100)
  assert.equal(recoveryRate(1, 2), 33)
})

/* ---------------- branch aggregation ---------------- */

const branchInquiries = [
  { status: 'recovered', value: 5000, branchId: 'Andheri' },
  { status: 'lost', value: 3000, branchId: 'Andheri' },
  { status: 'new', value: 2000, branchId: 'Andheri' },
  { status: 'recovered', value: '7000', branchId: 'Bandra' },
  { status: 'followup', value: 1500, branchId: 'Bandra' },
  { status: 'recovered', value: 900, branchId: '' },
  { status: 'replied', value: 400 }, // branchId missing entirely
  { status: 'lost', value: 100, branchId: 'Powai' }, // not in defined list
]
const branches = [
  { id: 'andheri', name: 'Andheri' },
  { id: 'bandra', name: 'Bandra' },
  { id: 'thane', name: 'Thane' }, // defined, zero inquiries
]

check('branch: totals, open/recovered/lost and recovered revenue', () => {
  const rows = aggregateByBranch(branchInquiries, branches)
  const andheri = rows.find(r => r.branchId === 'Andheri')
  assert.equal(andheri.total, 3)
  assert.equal(andheri.open, 1)
  assert.equal(andheri.recovered, 1)
  assert.equal(andheri.lost, 1)
  assert.equal(andheri.recoveredRevenue, 5000)
  assert.equal(andheri.recoveryRate, 50)
  const bandra = rows.find(r => r.branchId === 'Bandra')
  assert.equal(bandra.recoveredRevenue, 7000) // string value coerced
  assert.equal(bandra.recoveryRate, 100)
})

check('branch: missing-branch rows fold into one trailing Unassigned row', () => {
  const rows = aggregateByBranch(branchInquiries, branches)
  const unassigned = rows[rows.length - 1]
  assert.equal(unassigned.isUnassigned, true)
  assert.equal(unassigned.branch, 'Unassigned / no branch')
  assert.equal(unassigned.total, 2)
  assert.equal(unassigned.recovered, 1)
  assert.equal(unassigned.open, 1)
  assert.equal(unassigned.recoveredRevenue, 900)
})

check('branch: defined-but-empty branch appears with zeros and null rate', () => {
  const rows = aggregateByBranch(branchInquiries, branches)
  const thane = rows.find(r => r.branchId === 'Thane')
  assert.ok(thane)
  assert.equal(thane.total, 0)
  assert.equal(thane.recoveryRate, null)
  assert.equal(thane.recoveredRevenue, 0)
})

check('branch: branch found only on inquiries still gets a row', () => {
  const rows = aggregateByBranch(branchInquiries, branches)
  assert.ok(rows.some(r => r.branchId === 'Powai' && r.lost === 1))
})

check('branch: no Unassigned row when every inquiry has a branch', () => {
  const rows = aggregateByBranch(
    [{ status: 'new', value: 1, branchId: 'Andheri' }],
    branches
  )
  assert.equal(rows.some(r => r.isUnassigned), false)
})

check('branch: empty input yields only defined branches (or nothing)', () => {
  assert.deepEqual(aggregateByBranch([], []), [])
  assert.deepEqual(aggregateByBranch(null, null), [])
  const rows = aggregateByBranch([], branches)
  assert.equal(rows.length, 3)
  assert.ok(rows.every(r => r.total === 0 && r.recoveryRate === null))
})

check('branch: open-only branch has null recovery rate (no closed rows)', () => {
  const rows = aggregateByBranch(
    [{ status: 'new', value: 10, branchId: 'Andheri' }],
    []
  )
  assert.equal(rows[0].recoveryRate, null)
  assert.equal(rows[0].open, 1)
})

/* ---------------- member aggregation ---------------- */

const members = [
  { id: 'uid-asha', email: 'asha@example.com', role: 'sales_rep', branchId: 'Andheri' },
  { id: 'uid-ravi', email: 'ravi@example.com', role: 'sales_rep', branchId: 'Bandra' },
  { id: 'uid-idle', email: 'idle@example.com', role: 'sales_rep', branchId: '' },
]
const memberInquiries = [
  { status: 'recovered', value: 4000, assignedTo: 'uid-asha', followup: { date: TODAY } },
  { status: 'lost', value: 1000, assignedTo: 'uid-asha' },
  { status: 'followup', value: 2000, assignedTo: 'uid-asha', followup: { date: TODAY, time: '10:00' } },
  { status: 'new', value: 500, assignedTo: 'uid-asha', followup: { date: '2026-11-13' } },
  { status: 'recovered', value: 2500, assignedTo: 'uid-ravi' },
  { status: 'recovered', value: 800, assignedTo: '' },
  { status: 'new', value: 300 }, // assignedTo missing
  { status: 'lost', value: 600, assignedTo: 'uid-ghost' }, // unknown assignee
  { status: 'recovered', value: 1200, assignedTo: 'uid-owner' },
]

check('member: assigned/open/recovered/lost, revenue and closed rate', () => {
  const rows = aggregateByMember(memberInquiries, members, {
    today: TODAY,
    ownerUid: 'uid-owner',
    ownerEmail: 'owner@example.com',
  })
  const asha = rows.find(r => r.memberId === 'uid-asha')
  assert.equal(asha.assigned, 4)
  assert.equal(asha.recovered, 1)
  assert.equal(asha.lost, 1)
  assert.equal(asha.open, 2)
  assert.equal(asha.recoveredRevenue, 4000)
  assert.equal(asha.recoveryRate, 50)
  assert.equal(asha.name, 'asha@example.com')
})

check('member: follow-ups due today counts open rows due today only', () => {
  const rows = aggregateByMember(memberInquiries, members, { today: TODAY })
  const asha = rows.find(r => r.memberId === 'uid-asha')
  // The recovered row also carries today's date but is closed — excluded.
  // The 2026-11-13 row is tomorrow — excluded. Only the followup row counts.
  assert.equal(asha.followupsDueToday, 1)
  assert.equal(
    countFollowupsDueToday(memberInquiries, TODAY),
    1
  )
})

check('member: empty + missing + unknown assignees fold into trailing Unassigned', () => {
  const rows = aggregateByMember(memberInquiries, members, {
    today: TODAY,
    ownerUid: 'uid-owner',
  })
  const unassigned = rows[rows.length - 1]
  assert.equal(unassigned.isUnassigned, true)
  assert.equal(unassigned.name, 'Unassigned')
  assert.equal(unassigned.assigned, 3)
  assert.equal(unassigned.recovered, 1)
  assert.equal(unassigned.lost, 1)
  assert.equal(unassigned.recoveredRevenue, 800)
})

check('member: owner row seeded from ownerUid, idle member row present', () => {
  const rows = aggregateByMember(memberInquiries, members, {
    today: TODAY,
    ownerUid: 'uid-owner',
    ownerEmail: 'owner@example.com',
  })
  const owner = rows.find(r => r.memberId === 'uid-owner')
  assert.ok(owner)
  assert.equal(owner.assigned, 1)
  assert.equal(owner.recoveredRevenue, 1200)
  assert.equal(owner.role, 'owner')
  const idle = rows.find(r => r.memberId === 'uid-idle')
  assert.ok(idle)
  assert.equal(idle.assigned, 0)
  assert.equal(idle.recoveryRate, null)
  assert.equal(idle.followupsDueToday, 0)
})

check('member: without ownerUid an owner-assigned row folds to Unassigned', () => {
  const rows = aggregateByMember(memberInquiries, members, { today: TODAY })
  const unassigned = rows.find(r => r.isUnassigned)
  assert.equal(unassigned.assigned, 4)
})

check('member: empty input yields seeded members only, no Unassigned row', () => {
  assert.deepEqual(aggregateByMember([], [], { today: TODAY }), [])
  assert.deepEqual(aggregateByMember(undefined, undefined), [])
  const rows = aggregateByMember([], members, { today: TODAY })
  assert.equal(rows.length, 3)
  assert.ok(rows.every(r => r.assigned === 0 && r.recoveryRate === null))
  assert.equal(rows.some(r => r.isUnassigned), false)
})

check('member: member without email falls back to uid as display name', () => {
  const rows = aggregateByMember(
    [{ status: 'new', value: 1, assignedTo: 'uid-bare' }],
    [{ id: 'uid-bare', role: 'sales_rep' }],
    { today: TODAY }
  )
  assert.equal(rows[0].name, 'uid-bare')
})

/* ---------------- summarize ---------------- */

check('summarize: totals across all inquiries', () => {
  const totals = summarizeInquiries(branchInquiries)
  assert.equal(totals.total, 8)
  assert.equal(totals.recovered, 3)
  assert.equal(totals.lost, 2)
  assert.equal(totals.open, 3)
  assert.equal(totals.recoveredRevenue, 12900)
  assert.equal(totals.recoveryRate, 60)
})

check('summarize: empty input is all zeros with null rate', () => {
  const totals = summarizeInquiries([])
  assert.equal(totals.total, 0)
  assert.equal(totals.recoveryRate, null)
  assert.equal(totals.recoveredRevenue, 0)
})

console.log(`\n${passed} checks passed`)
