/**
 * Tests for src/utils/workflows.js — plain node, no framework:
 *   node tests/workflows.test.mjs
 * Exits non-zero on the first failed assertion.
 */
import assert from 'node:assert/strict'
import {
  MAX_WORKFLOW_RULES,
  evaluateWorkflows,
  normalizeWorkflowRule,
  normalizeWorkflowSettings,
} from '../src/utils/workflows.js'

const NOW = Date.parse('2026-11-12T12:00:00.000Z')
const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

let passed = 0
function check(name, fn) {
  fn()
  passed += 1
  console.log(`ok ${passed} - ${name}`)
}

const members = [
  { id: 'mgr1', email: 'mgr@example.com', role: 'branch_manager', branchId: 'Andheri' },
  { id: 'rep1', email: 'rep@example.com', role: 'sales_rep', branchId: 'Andheri' },
]

function settings(rules, enabled = true) {
  return { enabled, rules }
}
function rule(overrides = {}) {
  return {
    id: 'r1',
    name: 'Test rule',
    enabled: true,
    trigger: 'new_inquiry',
    hours: 4,
    action: 'flag_priority',
    assignTo: '',
    ...overrides,
  }
}
function run(items, cfg, options = {}) {
  return evaluateWorkflows(items, cfg, {
    members,
    ownerUid: 'owner1',
    slaHours: 24,
    nowMs: NOW,
    ...options,
  })
}

/* ---------------- normalization ---------------- */

check('normalize: malformed rules are dropped, valid ones sanitized', () => {
  assert.equal(normalizeWorkflowRule(null), null)
  assert.equal(normalizeWorkflowRule({ name: 'x' }), null) // no id
  assert.equal(
    normalizeWorkflowRule({ id: 'a', trigger: 'nope', action: 'flag_priority' }),
    null
  )
  assert.equal(
    normalizeWorkflowRule({ id: 'a', trigger: 'stale', action: 'nope' }),
    null
  )
  const ok = normalizeWorkflowRule({
    id: 'a', trigger: 'stale', action: 'flag_priority', hours: 99999,
  })
  assert.equal(ok.hours, 72) // invalid hours → trigger default
  assert.equal(ok.enabled, true) // enabled unless explicitly false
  assert.equal(ok.name, 'Untitled workflow')
})

check('normalize: master switch is opt-in (only literal true enables)', () => {
  assert.equal(normalizeWorkflowSettings({}).enabled, false)
  assert.equal(normalizeWorkflowSettings({ enabled: 'yes' }).enabled, false)
  assert.equal(normalizeWorkflowSettings({ enabled: true }).enabled, true)
})

check('normalize: rule list is capped', () => {
  const many = Array.from({ length: 15 }, (_, i) =>
    rule({ id: `r${i}` })
  )
  assert.equal(
    normalizeWorkflowSettings({ enabled: true, rules: many }).rules.length,
    MAX_WORKFLOW_RULES
  )
})

/* ---------------- master / rule switches ---------------- */

check('evaluate: master off or no enabled rules → no actions', () => {
  const item = { id: 'i1', status: 'new', createdAt: NOW - 10 * HOUR }
  assert.deepEqual(run([item], settings([rule()], false)), [])
  assert.deepEqual(run([item], settings([rule({ enabled: false })])), [])
})

check('evaluate: closed inquiries are never touched', () => {
  const cfg = settings([rule()])
  const closed = [
    { id: 'a', status: 'recovered', createdAt: NOW - 10 * HOUR },
    { id: 'b', status: 'lost', createdAt: NOW - 10 * HOUR },
  ]
  assert.deepEqual(run(closed, cfg), [])
})

/* ---------------- triggers ---------------- */

check('trigger new_inquiry: fires at the hour boundary, not before', () => {
  const cfg = settings([rule({ hours: 4 })])
  const young = { id: 'y', status: 'new', createdAt: NOW - 3 * HOUR }
  const ripe = { id: 'r', status: 'new', createdAt: NOW - 4 * HOUR }
  const picked = { id: 'p', status: 'followup', createdAt: NOW - 9 * HOUR }
  const actions = run([young, ripe, picked], cfg)
  assert.deepEqual(actions.map(a => a.inquiryId), ['r'])
})

check('trigger stale: recent activity keeps an old inquiry safe', () => {
  const cfg = settings([rule({ id: 's', trigger: 'stale', hours: 72 })])
  const stale = { id: 'st', status: 'replied', createdAt: NOW - 10 * DAY }
  const active = {
    id: 'ac',
    status: 'replied',
    createdAt: NOW - 10 * DAY,
    followupHistory: [{ date: '2026-11-11', time: '09:00' }],
  }
  const actions = run([stale, active], cfg)
  assert.deepEqual(actions.map(a => a.inquiryId), ['st'])
})

check('trigger sla_breach: uses the workspace SLA target', () => {
  const cfg = settings([rule({ id: 'sb', trigger: 'sla_breach', hours: 1 })])
  const breached = { id: 'br', status: 'new', createdAt: NOW - 30 * HOUR }
  assert.equal(run([breached], cfg).length, 1)
  assert.deepEqual(run([breached], cfg, { slaHours: 0 }), [])
  assert.deepEqual(run([breached], cfg, { slaHours: 48 }), [])
})

/* ---------------- actions ---------------- */

check('action assign_manager: branch manager first, owner fallback', () => {
  const cfg = settings([
    rule({ id: 'am', action: 'assign_manager', trigger: 'new_inquiry', hours: 1 }),
  ])
  const inBranch = { id: 'a', status: 'new', createdAt: NOW - 2 * HOUR, branchId: 'Andheri', assignedTo: 'rep1' }
  const noBranch = { id: 'b', status: 'new', createdAt: NOW - 2 * HOUR, branchId: 'Powai', assignedTo: '' }
  const actions = run([inBranch, noBranch], cfg)
  assert.equal(actions[0].targetUid, 'mgr1')
  assert.equal(actions[0].targetLabel, 'mgr@example.com')
  assert.equal(actions[1].targetUid, 'owner1')
  assert.equal(actions[1].targetLabel, 'Workspace owner')
})

check('action assign_*: already assigned to the target is a no-op (skipped)', () => {
  const cfg = settings([
    rule({ id: 'am', action: 'assign_manager', trigger: 'new_inquiry', hours: 1 }),
  ])
  const item = { id: 'a', status: 'new', createdAt: NOW - 2 * HOUR, branchId: 'Andheri', assignedTo: 'mgr1' }
  assert.deepEqual(run([item], cfg), [])
})

check('action assign_member: uses the rule target; missing target never fires', () => {
  const item = { id: 'a', status: 'new', createdAt: NOW - 2 * HOUR, assignedTo: '' }
  const cfg = settings([
    rule({ id: 'am2', action: 'assign_member', assignTo: 'rep1', hours: 1 }),
  ])
  const actions = run([item], cfg)
  assert.equal(actions[0].targetUid, 'rep1')
  const broken = settings([
    rule({ id: 'am3', action: 'assign_member', assignTo: '', hours: 1 }),
  ])
  assert.deepEqual(run([item], broken), [])
})

check('action create_followup: plans today’s task + history entry', () => {
  const cfg = settings([
    rule({ id: 'cf', action: 'create_followup', trigger: 'stale', hours: 24 }),
  ])
  const item = { id: 'a', status: 'replied', createdAt: NOW - 3 * DAY }
  const [action] = run([item], cfg)
  assert.equal(action.followup.date, '2026-11-12')
  assert.equal(action.followup.time, '10:00')
  assert.equal(action.status, 'followup')
  assert.equal(action.historyEntry.type, 'workflow')
})

check('action create_followup: never clobbers an upcoming follow-up', () => {
  const cfg = settings([
    rule({ id: 'cf', action: 'create_followup', trigger: 'stale', hours: 24 }),
  ])
  const upcoming = {
    id: 'a', status: 'followup', createdAt: NOW - 3 * DAY,
    followup: { date: '2026-11-20', time: '10:00' },
  }
  assert.deepEqual(run([upcoming], cfg), [])
  const missed = {
    id: 'b', status: 'followup', createdAt: NOW - 9 * DAY,
    followup: { date: '2026-11-01', time: '10:00' },
  }
  assert.equal(run([missed], cfg).length, 1)
})

check('action flag_priority: stamps the flag patch + history entry', () => {
  const cfg = settings([rule({ hours: 1 })])
  const item = { id: 'a', status: 'new', createdAt: NOW - 2 * HOUR }
  const [action] = run([item], cfg)
  assert.equal(action.patch.priorityFlagRule, 'Test rule')
  assert.equal(action.patch.priorityFlaggedAt, '2026-11-12T12:00:00.000Z')
  assert.match(action.historyEntry.note, /Flagged as priority/)
})

/* ---------------- dedupe / ordering ---------------- */

check('dedupe: a rule fires at most once per activity episode, then re-arms', () => {
  const cfg = settings([rule({ hours: 1 })])
  const created = NOW - 2 * HOUR
  const fired = {
    id: 'a', status: 'new', createdAt: created,
    workflowFired: { r1: created },
  }
  assert.deepEqual(run([fired], cfg), [])
  const rearmed = {
    ...fired,
    followupHistory: [{ date: '2026-11-12', time: '11:00' }],
  }
  assert.equal(run([rearmed], cfg).length, 1)
})

check('ordering: first matching rule wins — one action per inquiry', () => {
  const cfg = settings([
    rule({ id: 'first', name: 'First', hours: 1 }),
    rule({ id: 'second', name: 'Second', hours: 1, action: 'assign_member', assignTo: 'rep1' }),
  ])
  const item = { id: 'a', status: 'new', createdAt: NOW - 2 * HOUR, assignedTo: '' }
  const actions = run([item], cfg)
  assert.equal(actions.length, 1)
  assert.equal(actions[0].ruleId, 'first')
})

check('firedPatch preserves markers from other rules', () => {
  const cfg = settings([rule({ hours: 1 })])
  const item = {
    id: 'a', status: 'new', createdAt: NOW - 2 * HOUR,
    workflowFired: { other: 123 },
  }
  const [action] = run([item], cfg)
  assert.equal(action.firedPatch.other, 123)
  assert.equal(action.firedPatch.r1, NOW - 2 * HOUR)
})

console.log(`\n${passed} checks passed`)
