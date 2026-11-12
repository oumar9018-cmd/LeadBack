/**
 * Tests for src/utils/automation.js planAutoReschedule — plain node:
 *   node tests/automation.test.mjs
 * Exits non-zero on the first failed assertion.
 */
import assert from 'node:assert/strict'
import { planAutoReschedule } from '../src/utils/automation.js'

const NOW = Date.parse('2026-11-12T12:00:00.000Z') // today = 2026-11-12 (UTC)
const DEFAULTS = { autoRescheduleDays: 3, autoRescheduleMax: 3 }

let passed = 0
function check(name, fn) {
  fn()
  passed += 1
  console.log(`ok ${passed} - ${name}`)
}

function missedItem(overrides = {}) {
  return {
    id: 'inq-1',
    status: 'followup',
    followup: { date: '2026-11-10', time: '09:30', note: 'Call back' },
    followupHistory: [],
    ...overrides,
  }
}

check('off (autoRescheduleDays 0 or missing) returns null', () => {
  assert.equal(planAutoReschedule(missedItem(), { autoRescheduleDays: 0, autoRescheduleMax: 3 }, NOW), null)
  assert.equal(planAutoReschedule(missedItem(), {}, NOW), null)
  assert.equal(planAutoReschedule(missedItem(), undefined, NOW), null)
  assert.equal(planAutoReschedule(missedItem(), { autoRescheduleDays: 15, autoRescheduleMax: 3 }, NOW), null)
})

check('not-yet-due follow-ups return null (today and future)', () => {
  assert.equal(
    planAutoReschedule(missedItem({ followup: { date: '2026-11-12', time: '09:30' } }), DEFAULTS, NOW),
    null
  )
  assert.equal(
    planAutoReschedule(missedItem({ followup: { date: '2026-11-13', time: '09:30' } }), DEFAULTS, NOW),
    null
  )
  assert.equal(
    planAutoReschedule(missedItem({ followup: { date: 'not-a-date', time: '09:30' } }), DEFAULTS, NOW),
    null
  )
  assert.equal(planAutoReschedule(missedItem({ followup: undefined }), DEFAULTS, NOW), null)
})

check('max reached returns null', () => {
  assert.equal(
    planAutoReschedule(missedItem({ autoRescheduleCount: 3 }), DEFAULTS, NOW),
    null
  )
  assert.equal(
    planAutoReschedule(missedItem({ autoRescheduleCount: 5 }), DEFAULTS, NOW),
    null
  )
  assert.equal(
    planAutoReschedule(
      missedItem({ autoRescheduleCount: 1 }),
      { autoRescheduleDays: 3, autoRescheduleMax: 1 },
      NOW
    ),
    null
  )
})

check('same missed date already processed returns null', () => {
  assert.equal(
    planAutoReschedule(
      missedItem({ autoRescheduleCount: 1, lastAutoRescheduleFor: '2026-11-10' }),
      DEFAULTS,
      NOW
    ),
    null
  )
  // A different last-processed date does not block a new miss.
  assert.ok(
    planAutoReschedule(
      missedItem({ autoRescheduleCount: 1, lastAutoRescheduleFor: '2026-11-01' }),
      DEFAULTS,
      NOW
    )
  )
})

check('happy path: date math, count increment and time preserved', () => {
  const plan = planAutoReschedule(missedItem(), DEFAULTS, NOW)
  assert.ok(plan)
  assert.deepEqual(plan.followup, {
    date: '2026-11-15', // today (2026-11-12) + 3 days
    time: '09:30',
    note: 'Auto-rescheduled',
  })
  assert.equal(plan.autoRescheduleCount, 1)
  assert.equal(plan.lastAutoRescheduleFor, '2026-11-10')
})

check('happy path: existing count increments, missing time defaults to 10:00', () => {
  const plan = planAutoReschedule(
    missedItem({
      autoRescheduleCount: 1,
      followup: { date: '2026-11-09', note: '' },
    }),
    { autoRescheduleDays: 1, autoRescheduleMax: 3 },
    NOW
  )
  assert.ok(plan)
  assert.equal(plan.followup.date, '2026-11-13') // today + 1 day
  assert.equal(plan.followup.time, '10:00')
  assert.equal(plan.autoRescheduleCount, 2)
  assert.equal(plan.lastAutoRescheduleFor, '2026-11-09')
})

check('historyEntry mirrors the codebase entry shape with today + auto note', () => {
  const plan = planAutoReschedule(missedItem(), DEFAULTS, NOW)
  assert.ok(plan.historyEntry)
  assert.equal(typeof plan.historyEntry.id, 'string')
  assert.ok(plan.historyEntry.id.length > 0)
  assert.equal(plan.historyEntry.date, '2026-11-12')
  assert.match(plan.historyEntry.time, /^\d{2}:\d{2}$/)
  assert.ok(plan.historyEntry.note.includes('Auto-rescheduled'))
  assert.equal(typeof plan.historyEntry.type, 'string')
  assert.ok(plan.historyEntry.type.length > 0)
})

check("non-'followup' statuses return null", () => {
  for (const status of ['new', 'replied', 'recovered', 'lost']) {
    assert.equal(planAutoReschedule(missedItem({ status }), DEFAULTS, NOW), null)
  }
  assert.equal(planAutoReschedule(null, DEFAULTS, NOW), null)
  assert.equal(planAutoReschedule(undefined, DEFAULTS, NOW), null)
})

console.log(`\n${passed} checks passed`)
