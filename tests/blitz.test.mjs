/**
 * Tests for src/utils/blitz.js — plain node, no framework:
 *   node tests/blitz.test.mjs
 * Exits non-zero on the first failed assertion.
 */
import assert from 'node:assert/strict'
import {
  BLITZ_TOUCHES,
  hasActiveBlitz,
  isBlitzEligible,
  planBlitzSequence,
} from '../src/utils/blitz.js'

const NOW = Date.parse('2026-11-12T12:00:00.000Z')
const DAY = 24 * 60 * 60 * 1000

let passed = 0
function check(name, fn) {
  fn()
  passed += 1
  console.log(`ok ${passed} - ${name}`)
}

const stale = {
  id: 's1',
  status: 'followup',
  createdAt: new Date(NOW - 45 * DAY).toISOString(),
}

check('eligibility: a stale open inquiry is eligible', () => {
  assert.equal(isBlitzEligible(stale, NOW), true)
})

check('eligibility: fresh or recently-active inquiries are not', () => {
  const fresh = { id: 'f', status: 'new', createdAt: new Date(NOW - 2 * DAY).toISOString() }
  assert.equal(isBlitzEligible(fresh, NOW), false)
  const touched = {
    ...stale,
    followupHistory: [{ date: '2026-11-10', time: '10:00' }],
  }
  assert.equal(isBlitzEligible(touched, NOW), false)
})

check('eligibility: closed inquiries are never eligible', () => {
  assert.equal(isBlitzEligible({ ...stale, status: 'recovered' }, NOW), false)
  assert.equal(isBlitzEligible({ ...stale, status: 'lost' }, NOW), false)
  assert.equal(isBlitzEligible(null, NOW), false)
})

check('eligibility: a scheduled future follow-up counts as activity', () => {
  const planned = {
    ...stale,
    followup: { date: '2026-12-01', time: '10:00' },
  }
  assert.equal(isBlitzEligible(planned, NOW), false)
})

check('plan: exactly the 3 blitz touches, in dripSteps shape', () => {
  const steps = planBlitzSequence(stale, NOW)
  assert.equal(steps.length, 3)
  assert.deepEqual(
    steps.map(s => s.templateId),
    BLITZ_TOUCHES.map(t => t.templateId)
  )
  assert.deepEqual(steps.map(s => s.day), [1, 3, 6])
  assert.deepEqual(steps.map(s => s.dueDate), [
    '2026-11-12',
    '2026-11-14',
    '2026-11-17',
  ])
  assert.ok(steps.every(s => s.sent === false && s.blitz === true))
})

check('plan: null for ineligible inquiries', () => {
  assert.equal(
    planBlitzSequence({ id: 'x', status: 'new', createdAt: new Date(NOW).toISOString() }, NOW),
    null
  )
})

check('active blitz: unsent blitz steps block a second blitz; sent ones do not', () => {
  const running = {
    ...stale,
    dripSteps: [{ day: 1, templateId: 'firstFollowup', dueDate: '2026-11-12', sent: false, blitz: true }],
  }
  assert.equal(hasActiveBlitz(running), true)
  assert.equal(isBlitzEligible(running, NOW), false)
  assert.equal(planBlitzSequence(running, NOW), null)

  const finished = {
    ...stale,
    dripSteps: [{ day: 1, templateId: 'firstFollowup', dueDate: '2026-11-12', sent: true, blitz: true }],
  }
  assert.equal(hasActiveBlitz(finished), false)

  const plainDrip = {
    ...stale,
    dripSteps: [{ day: 1, templateId: 'winBack', dueDate: '2026-11-12', sent: false }],
  }
  assert.equal(hasActiveBlitz(plainDrip), false) // hand-built drips are not blitzes
})

console.log(`\n${passed} checks passed`)
