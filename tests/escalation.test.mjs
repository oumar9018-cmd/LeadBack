/**
 * Tests for src/utils/escalation.js — plain node, no framework:
 *   node tests/escalation.test.mjs
 * Exits non-zero on the first failed assertion.
 */
import assert from 'node:assert/strict'
import {
  DEFAULT_ESCALATION_CONFIG,
  evaluateEscalations,
} from '../src/utils/escalation.js'
import { lastActivityMs } from '../src/utils/graveyard.js'

const NOW = Date.parse('2026-11-12T12:00:00.000Z') // today = 2026-11-12 (UTC)
const OWNER = 'uid-owner'
const MEMBERS = [
  { id: 'uid-mgr-andheri', email: 'andheri@example.com', role: 'branch_manager', branchId: 'Andheri' },
  { id: 'uid-mgr-bandra', email: 'bandra@example.com', role: 'branch_manager', branchId: 'Bandra' },
  { id: 'uid-rep-1', email: 'rep@example.com', role: 'sales_rep', branchId: 'Andheri' },
]
const ON = { enabled: true, overdueDays: 2, includeSlaBreach: true, reassign: true }

let passed = 0
function check(name, fn) {
  fn()
  passed += 1
  console.log(`ok ${passed} - ${name}`)
}

function overdueItem(overrides = {}) {
  return {
    id: 'inq-overdue',
    status: 'followup',
    branchId: 'Andheri',
    assignedTo: 'uid-rep-1',
    createdAt: '2026-11-01T00:00:00.000Z',
    followup: { date: '2026-11-10', time: '10:00', note: '' },
    followupHistory: [],
    ...overrides,
  }
}

function evalItems(items, config = ON, extra = {}) {
  return evaluateEscalations(items, {
    config,
    members: MEMBERS,
    ownerUid: OWNER,
    slaHours: 24,
    nowMs: NOW,
    ...extra,
  })
}

check('defaults: escalation is OFF by default (opt-in)', () => {
  assert.equal(DEFAULT_ESCALATION_CONFIG.enabled, false)
  assert.equal(DEFAULT_ESCALATION_CONFIG.overdueDays, 2)
  assert.equal(DEFAULT_ESCALATION_CONFIG.includeSlaBreach, true)
  assert.equal(DEFAULT_ESCALATION_CONFIG.reassign, true)
})

check('disabled config returns no actions', () => {
  assert.deepEqual(evalItems([overdueItem()], { ...ON, enabled: false }), [])
  // Missing / empty config also means disabled (normalize falls back
  // to the OFF default) — called directly, since evalItems defaults
  // its config argument to ON.
  const base = { members: MEMBERS, ownerUid: OWNER, slaHours: 24, nowMs: NOW }
  assert.deepEqual(evaluateEscalations([overdueItem()], { ...base, config: undefined }), [])
  assert.deepEqual(evaluateEscalations([overdueItem()], { ...base, config: {} }), [])
  assert.deepEqual(evaluateEscalations([overdueItem()], { ...base }), [])
})

check('overdue below threshold is skipped, at/above threshold escalates', () => {
  // 2026-11-11 is 1 day before today — below the 2-day threshold.
  assert.deepEqual(
    evalItems([overdueItem({ followup: { date: '2026-11-11', time: '10:00' } })]),
    []
  )
  // 2026-11-10 is exactly 2 days overdue — at threshold.
  const at = evalItems([overdueItem()])
  assert.equal(at.length, 1)
  assert.equal(at[0].inquiryId, 'inq-overdue')
  assert.equal(at[0].reason, 'overdue_followup')
  assert.equal(at[0].daysOverdue, 2)
  // 2026-11-05 is 7 days overdue.
  const above = evalItems([
    overdueItem({ followup: { date: '2026-11-05', time: '10:00' } }),
  ])
  assert.equal(above.length, 1)
  assert.equal(above[0].daysOverdue, 7)
})

check('overdue: due today, future and invalid dates never escalate', () => {
  assert.deepEqual(
    evalItems([overdueItem({ followup: { date: '2026-11-12', time: '10:00' } })]),
    []
  )
  assert.deepEqual(
    evalItems([overdueItem({ followup: { date: '2026-11-20', time: '10:00' } })]),
    []
  )
  assert.deepEqual(
    evalItems([overdueItem({ followup: { date: 'not-a-date', time: '10:00' } })]),
    []
  )
  assert.deepEqual(
    evalItems([overdueItem({ followup: { date: '2026-02-30', time: '10:00' } })]),
    []
  )
  assert.deepEqual(evalItems([overdueItem({ followup: undefined })]), [])
})

check('SLA breach escalates when included, with daysOverdue null', () => {
  const breached = {
    id: 'inq-sla',
    status: 'new',
    branchId: '',
    assignedTo: '',
    createdAt: new Date(NOW - 48 * 60 * 60 * 1000).toISOString(),
    followupHistory: [],
  }
  const actions = evalItems([breached])
  assert.equal(actions.length, 1)
  assert.equal(actions[0].reason, 'sla_breach')
  assert.equal(actions[0].daysOverdue, null)
})

check('SLA breach is excluded when includeSlaBreach is false', () => {
  const breached = {
    id: 'inq-sla',
    status: 'new',
    createdAt: new Date(NOW - 48 * 60 * 60 * 1000).toISOString(),
    followupHistory: [],
  }
  assert.deepEqual(evalItems([breached], { ...ON, includeSlaBreach: false }), [])
})

check('SLA breach never fires when slaHours is 0 (SLA off)', () => {
  const breached = {
    id: 'inq-sla',
    status: 'new',
    createdAt: new Date(NOW - 48 * 60 * 60 * 1000).toISOString(),
    followupHistory: [],
  }
  assert.deepEqual(evalItems([breached], ON, { slaHours: 0 }), [])
  // And a not-yet-breached new inquiry does not fire at slaHours 24.
  const fresh = {
    ...breached,
    id: 'inq-fresh',
    createdAt: new Date(NOW - 2 * 60 * 60 * 1000).toISOString(),
  }
  assert.deepEqual(evalItems([fresh]), [])
})

check('episode dedupe: marker >= activity skips', () => {
  const item = overdueItem()
  const activity = lastActivityMs(item)
  assert.ok(activity > 0)
  assert.deepEqual(
    evalItems([overdueItem({ escalatedForActivityMs: activity })]),
    []
  )
  assert.deepEqual(
    evalItems([overdueItem({ escalatedForActivityMs: activity + 1000 })]),
    []
  )
  // Marker 0 with an otherwise-unknown activity of 0 also skips:
  // exercised indirectly — a 0 marker is finite, so only a strictly
  // newer activity re-arms (next check).
})

check('episode dedupe: newer activity than the marker re-arms', () => {
  const item = overdueItem()
  const activity = lastActivityMs(item)
  const rearmed = overdueItem({
    escalatedForActivityMs: activity,
    followupHistory: [{ date: '2026-11-11', time: '09:00', type: 'note', note: '' }],
  })
  // New history entry (2026-11-11) is newer than the old activity
  // (the 2026-11-10 follow-up date), so the episode re-arms.
  assert.ok(lastActivityMs(rearmed) > activity)
  const actions = evalItems([rearmed])
  assert.equal(actions.length, 1)
  assert.equal(actions[0].reason, 'overdue_followup')
  // A marker older than current activity also re-arms.
  assert.equal(
    evalItems([overdueItem({ escalatedForActivityMs: activity - 1000 })]).length,
    1
  )
})

check('target: branch manager for the branch is chosen', () => {
  const actions = evalItems([overdueItem()])
  assert.equal(actions[0].targetUid, 'uid-mgr-andheri')
  assert.equal(actions[0].targetLabel, 'andheri@example.com')
  const bandra = evalItems([overdueItem({ branchId: 'Bandra' })])
  assert.equal(bandra[0].targetUid, 'uid-mgr-bandra')
})

check('target: no branch manager falls back to the owner', () => {
  const actions = evalItems([overdueItem({ branchId: 'Powai' })])
  assert.equal(actions[0].targetUid, OWNER)
  assert.equal(actions[0].targetLabel, 'Workspace owner')
  const unbranched = evalItems([overdueItem({ branchId: '' })])
  assert.equal(unbranched[0].targetUid, OWNER)
  assert.equal(unbranched[0].targetLabel, 'Workspace owner')
})

check('target: already assigned to the target is flag-only', () => {
  const toManager = evalItems([overdueItem({ assignedTo: 'uid-mgr-andheri' })])
  assert.equal(toManager.length, 1)
  assert.equal(toManager[0].targetUid, null)
  const toOwner = evalItems([
    overdueItem({ branchId: 'Powai', assignedTo: OWNER }),
  ])
  assert.equal(toOwner.length, 1)
  assert.equal(toOwner[0].targetUid, null)
})

check('closed rows (recovered/lost) are always skipped', () => {
  assert.deepEqual(evalItems([overdueItem({ status: 'recovered' })]), [])
  assert.deepEqual(evalItems([overdueItem({ status: 'lost' })]), [])
  const lostNew = {
    id: 'inq-lost-new',
    status: 'lost',
    createdAt: new Date(NOW - 72 * 60 * 60 * 1000).toISOString(),
    followupHistory: [],
  }
  assert.deepEqual(evalItems([lostNew]), [])
})

check('reassign:false makes every action flag-only', () => {
  const actions = evalItems(
    [
      overdueItem(),
      {
        id: 'inq-sla',
        status: 'new',
        branchId: 'Andheri',
        assignedTo: 'uid-rep-1',
        createdAt: new Date(NOW - 48 * 60 * 60 * 1000).toISOString(),
        followupHistory: [],
      },
    ],
    { ...ON, reassign: false }
  )
  assert.equal(actions.length, 2)
  assert.ok(actions.every(a => a.targetUid === null))
})

check('empty / malformed input yields no actions', () => {
  assert.deepEqual(evalItems([]), [])
  assert.deepEqual(evalItems(null), [])
  assert.deepEqual(evalItems([null, {}, { status: 'followup' }]), [])
})

console.log(`\n${passed} checks passed`)
