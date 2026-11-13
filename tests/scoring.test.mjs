/**
 * Tests for src/utils/scoring.js — plain node, no framework:
 *   node tests/scoring.test.mjs
 * Exits non-zero on the first failed assertion.
 *
 * Lead score: explained, rule-based. All "now" values are pinned
 * (2026-11-13T12:00:00Z) so age/contact/SLA math is deterministic.
 * Every expected score below is the 50-point baseline plus the
 * adjustments worked out in the util header — if a weight changes,
 * these numbers must be re-derived, not just re-typed.
 */
import assert from 'node:assert/strict'
import {
  followupStateOf,
  lastContactMs,
  leadBandLabel,
  leadScore,
  rankByLeadScore,
} from '../src/utils/scoring.js'

let passed = 0
function check(name, fn) {
  fn()
  passed += 1
  console.log(`ok ${passed} - ${name}`)
}

const NOW = Date.parse('2026-11-13T12:00:00.000Z')
const DAY = 1000 * 60 * 60 * 24
const HOUR = 1000 * 60 * 60
const iso = ms => new Date(ms).toISOString()
const dateOf = ms => iso(ms).slice(0, 10)

const ladderWith = done =>
  ({
    steps: [0, 1, 2].map(i => ({ text: `offer ${i + 1}`, done: i < done })),
  })

/* ---------------- closed / junk ---------------- */

check('closed inquiries score null (recovered and lost)', () => {
  assert.equal(leadScore({ status: 'recovered' }, { nowMs: NOW }), null)
  assert.equal(leadScore({ status: 'lost' }, { nowMs: NOW }), null)
})

check('non-objects score null', () => {
  assert.equal(leadScore(null, { nowMs: NOW }), null)
  assert.equal(leadScore('nope', { nowMs: NOW }), null)
  assert.equal(leadScore(undefined, { nowMs: NOW }), null)
})

/* ---------------- absolute scores ---------------- */

check('fresh new inquiry: age bonus minus untouched penalties', () => {
  // 50 + 12 (age ≤1d) − 4 (not contacted) − 4 (no follow-up) = 54
  const r = leadScore(
    { status: 'new', createdAt: iso(NOW - 2 * HOUR) },
    { nowMs: NOW }
  )
  assert.equal(r.score, 54)
  assert.equal(r.band, 'warm')
  assert.deepEqual(r.reasons, [
    'Inquired within the last day',
    'Not contacted yet',
    'No follow-up scheduled',
  ])
})

check('hot case: replied, high value, booking source, ladder started', () => {
  // 50 + 12 (value) + 12 (age) + 14 (replied) + 8 (contact ≤1d)
  //    + 6 (booking) + 4 (ladder step 1) = 106 → clamped to 100
  const r = leadScore(
    {
      status: 'replied',
      value: 25000,
      source: 'booking',
      createdAt: iso(NOW - 12 * HOUR),
      followupHistory: [
        { type: 'WhatsApp opened (first)', date: dateOf(NOW), time: '09:15' },
      ],
      offerLadder: ladderWith(1),
    },
    { nowMs: NOW }
  )
  assert.equal(r.score, 100)
  assert.equal(r.band, 'hot')
  assert.equal(r.reasons.length, 6)
  assert.ok(r.reasons.includes('Customer has replied — the conversation is live'))
  assert.ok(r.reasons.includes('First win-back offer already made'))
})

check('band edge: exactly 70 is hot', () => {
  // 50 + 12 (value) + 8 (age 2d) + 2 (follow-up upcoming)
  //    − 6 (csv) + 4 (ladder step 1) = 70
  const r = leadScore(
    {
      status: 'followup',
      value: 25000,
      source: 'csv',
      createdAt: iso(NOW - 2 * DAY),
      followup: { date: dateOf(NOW + DAY), time: '09:00' },
      offerLadder: ladderWith(1),
    },
    { nowMs: NOW }
  )
  assert.equal(r.score, 70)
  assert.equal(r.band, 'hot')
})

check('band edge: 69 is warm', () => {
  // 50 + 7 (value 5000) + 8 (age 2d) + 4 (follow-up due today) = 69
  const r = leadScore(
    {
      status: 'followup',
      value: 5000,
      createdAt: iso(NOW - 2 * DAY),
      followup: { date: dateOf(NOW), time: '23:59' },
    },
    { nowMs: NOW }
  )
  assert.equal(r.score, 69)
  assert.equal(r.band, 'warm')
})

check('band edge: exactly 40 is warm', () => {
  // 50 − 6 (age 20d) − 4 (no follow-up scheduled) = 40
  const r = leadScore(
    { status: 'followup', createdAt: iso(NOW - 20 * DAY) },
    { nowMs: NOW }
  )
  assert.equal(r.score, 40)
  assert.equal(r.band, 'warm')
})

check('cold case: old, untouched new inquiry with no plan', () => {
  // 50 − 12 (age 40d) − 4 (not contacted) − 4 (no follow-up) = 30
  const r = leadScore(
    { status: 'new', createdAt: iso(NOW - 40 * DAY) },
    { nowMs: NOW }
  )
  assert.equal(r.score, 30)
  assert.equal(r.band, 'cold')
  assert.ok(r.reasons.includes('Inquired 40 days ago — gone cold'))
})

/* ---------------- individual signals (differentials) ---------------- */

check('value tiers: 20000+ beats 5000+, small values are neutral', () => {
  const base = { status: 'followup', createdAt: iso(NOW - 10 * DAY) }
  const high = leadScore({ ...base, value: 20000 }, { nowMs: NOW })
  const mid = leadScore({ ...base, value: 5000 }, { nowMs: NOW })
  const small = leadScore({ ...base, value: 4999 }, { nowMs: NOW })
  const none = leadScore({ ...base }, { nowMs: NOW })
  assert.equal(high.score - mid.score, 5)
  assert.equal(mid.score - small.score, 7)
  assert.equal(small.score, none.score)
  assert.ok(high.reasons.includes('High-value inquiry'))
  assert.ok(mid.reasons.includes('Good-sized inquiry'))
})

check('age: unreadable createdAt earns no age adjustment', () => {
  const unknown = leadScore(
    { status: 'followup', createdAt: 'not-a-date' },
    { nowMs: NOW }
  )
  const known = leadScore(
    { status: 'followup', createdAt: iso(NOW - 10 * DAY) },
    { nowMs: NOW }
  )
  // 10 days old is the neutral age band too, so the two must agree.
  assert.equal(unknown.score, known.score)
  assert.ok(!unknown.reasons.some(r => r.startsWith('Inquired')))
})

check('source: booking link up, team-logged slightly up, csv down', () => {
  const base = { status: 'followup', createdAt: iso(NOW - 10 * DAY) }
  const booking = leadScore({ ...base, source: 'booking' }, { nowMs: NOW })
  const link = leadScore({ ...base, source: 'backwon-link' }, { nowMs: NOW })
  const manual = leadScore({ ...base, source: 'manual' }, { nowMs: NOW })
  const csv = leadScore({ ...base, source: 'csv' }, { nowMs: NOW })
  const other = leadScore({ ...base, source: 'shopify' }, { nowMs: NOW })
  const none = leadScore({ ...base }, { nowMs: NOW })
  assert.equal(booking.score - none.score, 6)
  assert.equal(link.score, booking.score)
  assert.equal(manual.score - none.score, 3)
  assert.equal(csv.score - none.score, -6)
  assert.equal(other.score, none.score)
})

check('last contact: recency helps, long silence hurts', () => {
  const base = { status: 'followup', createdAt: iso(NOW - 10 * DAY) }
  const entry = daysAgo => ({
    type: 'WhatsApp opened (check-in)',
    date: dateOf(NOW - daysAgo * DAY),
    time: '10:00',
  })
  const fresh = leadScore(
    { ...base, followupHistory: [entry(0)] },
    { nowMs: NOW }
  )
  const week = leadScore(
    { ...base, followupHistory: [entry(6)] },
    { nowMs: NOW }
  )
  const stale = leadScore(
    { ...base, followupHistory: [entry(10)] },
    { nowMs: NOW }
  )
  const quiet = leadScore(
    { ...base, followupHistory: [entry(20)] },
    { nowMs: NOW }
  )
  const none = leadScore({ ...base }, { nowMs: NOW })
  assert.equal(fresh.score - none.score, 8)
  assert.equal(week.score - none.score, 2)
  assert.equal(stale.score - none.score, -5)
  assert.equal(quiet.score - none.score, -10)
  assert.ok(quiet.reasons.includes('Last contact 20 days ago — gone quiet'))
})

check('lastContactMs: latest contact entry wins, non-contact ignored', () => {
  const ms = lastContactMs({
    followupHistory: [
      { type: 'WhatsApp opened (a)', date: '2026-11-01', time: '09:00' },
      { type: 'Drip sequence saved (3 steps)', date: '2026-11-12', time: '09:00' },
      { type: 'Voice note opened', date: '2026-11-10', time: '08:30' },
      { type: 'Marked recovered', date: '2026-11-12', time: '10:00' },
    ],
  })
  assert.equal(ms, Date.parse('2026-11-10T08:30'))
  assert.equal(lastContactMs({ followupHistory: [] }), null)
  assert.equal(lastContactMs({}), null)
})

check('follow-up state: overdue beats today beats upcoming beats none', () => {
  const base = { status: 'followup', createdAt: iso(NOW - 10 * DAY) }
  const overdue = leadScore(
    { ...base, followup: { date: dateOf(NOW - DAY), time: '09:00' } },
    { nowMs: NOW }
  )
  const today = leadScore(
    { ...base, followup: { date: dateOf(NOW), time: '23:59' } },
    { nowMs: NOW }
  )
  const upcoming = leadScore(
    { ...base, followup: { date: dateOf(NOW + 2 * DAY), time: '09:00' } },
    { nowMs: NOW }
  )
  const none = leadScore({ ...base }, { nowMs: NOW })
  assert.equal(overdue.score - none.score, 10)
  assert.equal(today.score - none.score, 8)
  assert.equal(upcoming.score - none.score, 6)
  assert.equal(followupStateOf({ followup: { date: 'x', time: 'y' } }, NOW), null)
})

check('replied: no penalty for a missing follow-up schedule', () => {
  const r = leadScore(
    { status: 'replied', createdAt: iso(NOW - 10 * DAY) },
    { nowMs: NOW }
  )
  assert.ok(!r.reasons.includes('No follow-up scheduled'))
  assert.ok(r.reasons.includes('Customer has replied — the conversation is live'))
})

/* ---------------- SLA signal ---------------- */

check('SLA: breached new inquiry jumps, at-risk helps less', () => {
  const breached = leadScore(
    { status: 'new', createdAt: iso(NOW - 30 * HOUR) },
    { nowMs: NOW, firstResponseHours: 24 }
  )
  const atRisk = leadScore(
    { status: 'new', createdAt: iso(NOW - 20 * HOUR) },
    { nowMs: NOW, firstResponseHours: 24 }
  )
  // Same inquiries without a configured target: SLA stays silent.
  const silent = leadScore(
    { status: 'new', createdAt: iso(NOW - 30 * HOUR) },
    { nowMs: NOW }
  )
  assert.equal(breached.score - silent.score, 10)
  assert.ok(breached.reasons.includes('Past the first-response target — answer now'))
  assert.ok(atRisk.reasons.includes('Close to the first-response target'))
  assert.ok(!silent.reasons.some(r => r.includes('first-response')))
})

check('SLA: only new inquiries are judged (followup = responded)', () => {
  const r = leadScore(
    { status: 'followup', createdAt: iso(NOW - 30 * HOUR) },
    { nowMs: NOW, firstResponseHours: 24 }
  )
  assert.ok(!r.reasons.some(x => x.includes('first-response')))
})

/* ---------------- offer ladder ---------------- */

check('ladder: each made offer adds, a finished ladder needs a new angle', () => {
  const base = { status: 'followup', createdAt: iso(NOW - 10 * DAY) }
  const one = leadScore({ ...base, offerLadder: ladderWith(1) }, { nowMs: NOW })
  const two = leadScore({ ...base, offerLadder: ladderWith(2) }, { nowMs: NOW })
  const three = leadScore({ ...base, offerLadder: ladderWith(3) }, { nowMs: NOW })
  const none = leadScore({ ...base }, { nowMs: NOW })
  assert.equal(one.score - none.score, 4)
  assert.equal(two.score - none.score, 8)
  // +12 for three offers, −4 because the ladder is exhausted.
  assert.equal(three.score - none.score, 8)
  assert.ok(three.reasons.includes('All three offers made and still open — needs a new angle'))
  assert.ok(two.reasons.includes('2 of 3 win-back offers already made'))
})

/* ---------------- labels + ranking ---------------- */

check('band labels', () => {
  assert.equal(leadBandLabel('hot'), 'Hot')
  assert.equal(leadBandLabel('warm'), 'Warm')
  assert.equal(leadBandLabel('cold'), 'Cold')
  assert.equal(leadBandLabel('anything'), 'Cold')
})

check('rankByLeadScore: high first, closed appended unscored', () => {
  const rows = rankByLeadScore(
    [
      { id: 'cold', status: 'followup', createdAt: iso(NOW - 40 * DAY) },
      { id: 'done', status: 'recovered', createdAt: iso(NOW) },
      { id: 'hot', status: 'replied', value: 30000, createdAt: iso(NOW - HOUR) },
      { id: 'lost', status: 'lost', createdAt: iso(NOW) },
    ],
    { nowMs: NOW }
  )
  assert.deepEqual(rows.map(r => r.inquiry.id), ['hot', 'cold', 'done', 'lost'])
  assert.equal(rows[2].score, null)
  assert.equal(rows[3].band, null)
  assert.deepEqual(rankByLeadScore(null, { nowMs: NOW }), [])
})

console.log(`\n${passed} checks passed`)
