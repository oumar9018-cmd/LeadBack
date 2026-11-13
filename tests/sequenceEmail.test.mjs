/**
 * Tests for src/utils/sequenceEmail.js — plain node, no framework:
 *   node tests/sequenceEmail.test.mjs
 * Exits non-zero on the first failed assertion.
 */
import assert from 'node:assert/strict'
import {
  buildEmailStep,
  customerEmail,
  isValidEmail,
  stepChannel,
} from '../src/utils/sequenceEmail.js'

let passed = 0
function check(name, fn) {
  fn()
  passed += 1
  console.log(`ok ${passed} - ${name}`)
}

check('stepChannel defaults everything but explicit email to whatsapp', () => {
  assert.equal(stepChannel({ channel: 'email' }), 'email')
  assert.equal(stepChannel({ channel: 'whatsapp' }), 'whatsapp')
  assert.equal(stepChannel({}), 'whatsapp')
  assert.equal(stepChannel(null), 'whatsapp')
  assert.equal(stepChannel({ channel: 'pigeon' }), 'whatsapp')
})

check('isValidEmail / customerEmail accept plain addresses only', () => {
  assert.equal(isValidEmail('rahul@example.com'), true)
  assert.equal(isValidEmail(' rahul@example.com '), true)
  assert.equal(isValidEmail('not-an-email'), false)
  assert.equal(isValidEmail('a@b'), false)
  assert.equal(isValidEmail(''), false)
  assert.equal(isValidEmail(undefined), false)
  assert.equal(customerEmail({ email: ' asha@example.com ' }), 'asha@example.com')
  assert.equal(customerEmail({ email: 'nope' }), '')
  assert.equal(customerEmail({}), '')
  assert.equal(customerEmail(null), '')
})

check('buildEmailStep returns null for WhatsApp steps', () => {
  const inquiry = { name: 'Rahul', email: 'rahul@example.com' }
  assert.equal(buildEmailStep(inquiry, { templateId: 'firstFollowup' }), null)
  assert.equal(
    buildEmailStep(inquiry, { templateId: 'firstFollowup', channel: 'whatsapp' }),
    null
  )
})

check('buildEmailStep skips with a clear reason when there is no email', () => {
  for (const inquiry of [{ name: 'Rahul' }, { name: 'Rahul', email: '' }, { name: 'Rahul', email: 'bad' }]) {
    const result = buildEmailStep(inquiry, { templateId: 'winBack', channel: 'email' })
    assert.deepEqual(result, { ok: false, channel: 'email', reason: 'no_email' })
  }
})

check('buildEmailStep renders subject/body from the template into a mailto', () => {
  const result = buildEmailStep(
    {
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      service: 'Ceramic Coating',
    },
    { templateId: 'firstFollowup', channel: 'email' },
    { businessName: 'Shine Studio' }
  )
  assert.equal(result.ok, true)
  assert.equal(result.to, 'rahul@example.com')
  assert.equal(result.subject, 'First follow-up — Shine Studio')
  assert.equal(
    result.body,
    'Hi Rahul, this is Shine Studio. You had asked about Ceramic Coating — just checking if you still need it? Happy to help.'
  )
  assert.ok(result.href.startsWith('mailto:rahul%40example.com?subject='))
  const decoded = decodeURIComponent(result.href)
  assert.ok(decoded.includes(`subject=${result.subject}`))
  assert.ok(decoded.includes(`body=${result.body}`))
})

check('buildEmailStep handles an unknown template without inventing text', () => {
  const result = buildEmailStep(
    { name: 'Asha', email: 'asha@example.com', service: 'Hair Spa' },
    { templateId: 'doesNotExist', channel: 'email' },
    {}
  )
  assert.equal(result.ok, true)
  assert.equal(result.body, '')
  assert.equal(result.subject, 'Follow-up — BackWon')
})

console.log(`\n${passed} checks passed`)
