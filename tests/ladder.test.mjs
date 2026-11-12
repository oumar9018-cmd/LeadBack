/**
 * Tests for src/utils/ladder.js — plain node, no framework:
 *   node tests/ladder.test.mjs
 * Exits non-zero on the first failed assertion.
 */
import assert from 'node:assert/strict'
import {
  LADDER_STEP_COUNT,
  createOfferLadder,
  ladderProgress,
  normalizeOfferLadder,
  setLadderStep,
} from '../src/utils/ladder.js'

let passed = 0
function check(name, fn) {
  fn()
  passed += 1
  console.log(`ok ${passed} - ${name}`)
}

check('create: a fresh ladder is 3 empty, undone steps', () => {
  const ladder = createOfferLadder()
  assert.equal(ladder.steps.length, LADDER_STEP_COUNT)
  assert.ok(ladder.steps.every(s => s.text === '' && s.done === false))
  assert.deepEqual(ladderProgress(ladder), { done: 0, total: 3, complete: false })
})

check('normalize: stored junk coerces to exactly 3 clean steps', () => {
  assert.deepEqual(normalizeOfferLadder(null), createOfferLadder())
  assert.deepEqual(normalizeOfferLadder({ steps: 'nope' }), createOfferLadder())
  const coerced = normalizeOfferLadder({
    steps: [
      { text: '10% off', done: true },
      { text: 42, done: 'yes' },
      { text: 'Best price', done: false },
      { text: 'extra step is dropped', done: true },
    ],
  })
  assert.equal(coerced.steps.length, 3)
  assert.deepEqual(coerced.steps[0], { text: '10% off', done: true })
  assert.deepEqual(coerced.steps[1], { text: '', done: false })
  assert.deepEqual(coerced.steps[2], { text: 'Best price', done: false })
})

check('setLadderStep: patches one step, returns a new ladder', () => {
  const ladder = createOfferLadder()
  const next = setLadderStep(ladder, 1, { text: 'Free delivery', done: true })
  assert.deepEqual(next.steps[1], { text: 'Free delivery', done: true })
  assert.deepEqual(ladder.steps[1], { text: '', done: false }) // original untouched
  assert.deepEqual(ladderProgress(next), { done: 1, total: 3, complete: false })
})

check('setLadderStep: partial patches keep the other field', () => {
  const ladder = setLadderStep(createOfferLadder(), 0, { text: '5% off' })
  const toggled = setLadderStep(ladder, 0, { done: true })
  assert.deepEqual(toggled.steps[0], { text: '5% off', done: true })
})

check('setLadderStep: out-of-range index is a no-op', () => {
  const ladder = createOfferLadder()
  assert.deepEqual(setLadderStep(ladder, 3, { done: true }), ladder)
  assert.deepEqual(setLadderStep(ladder, -1, { done: true }), ladder)
  assert.deepEqual(setLadderStep(ladder, 'x', { done: true }), ladder)
})

check('progress: complete only when all 3 steps are done', () => {
  let ladder = createOfferLadder()
  ladder = setLadderStep(ladder, 0, { done: true })
  ladder = setLadderStep(ladder, 1, { done: true })
  assert.equal(ladderProgress(ladder).complete, false)
  ladder = setLadderStep(ladder, 2, { done: true })
  assert.deepEqual(ladderProgress(ladder), { done: 3, total: 3, complete: true })
})

console.log(`\n${passed} checks passed`)
