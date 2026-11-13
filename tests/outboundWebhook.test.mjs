/**
 * Tests for src/utils/outboundWebhook.js + the send_webhook action
 * in src/utils/workflows.js — plain node, no framework:
 *   node tests/outboundWebhook.test.mjs
 * Exits non-zero on the first failed assertion.
 */
import assert from 'node:assert/strict'
import {
  WEBHOOK_EVENT,
  buildWebhookPayload,
  validateWebhookUrl,
  webhookHost,
} from '../src/utils/outboundWebhook.js'
import {
  evaluateWorkflows,
  normalizeWorkflowRule,
} from '../src/utils/workflows.js'

let passed = 0
function check(name, fn) {
  fn()
  passed += 1
  console.log(`ok ${passed} - ${name}`)
}

const NOW = Date.parse('2026-11-13T12:00:00.000Z')
const HOUR = 60 * 60 * 1000

check('validateWebhookUrl accepts https hook URLs from Zapier/Make', () => {
  for (const url of [
    'https://hooks.zapier.com/hooks/catch/123456/abcdef/',
    'https://hook.eu2.make.com/xyz123',
    '  https://example.com/hook  ',
  ]) {
    const result = validateWebhookUrl(url)
    assert.equal(result.ok, true, url)
    assert.equal(result.url, url.trim())
  }
})

check('validateWebhookUrl rejects non-https, malformed and empty URLs', () => {
  for (const bad of [
    'http://hooks.zapier.com/hooks/catch/1/x/',
    'ftp://example.com/hook',
    'not a url',
    '',
    '   ',
    null,
    undefined,
    42,
    'https://',
  ]) {
    const result = validateWebhookUrl(bad)
    assert.equal(result.ok, false, String(bad))
    assert.ok(result.error.length > 0)
  }
  assert.match(validateWebhookUrl('http://x.com/h').error, /https/)
})

check('webhookHost returns only the host (never the secret path)', () => {
  assert.equal(
    webhookHost('https://hooks.zapier.com/hooks/catch/123/secret/'),
    'hooks.zapier.com'
  )
  assert.equal(webhookHost('garbage'), '')
})

check('buildWebhookPayload carries the documented field set only', () => {
  const payload = buildWebhookPayload({
    rule: { id: 'wf-1', name: 'Morning pickup', trigger: 'new_inquiry' },
    inquiry: {
      id: 'inq1',
      name: 'Rahul Sharma',
      phone: '9876543210',
      email: 'rahul@example.com',
      service: 'Ceramic Coating',
      status: 'new',
      value: 5000,
      source: 'manual',
      branchId: 'Andheri',
      assignedTo: '',
      createdAt: NOW - 5 * HOUR,
      // internal fields that must NOT leak:
      workflowFired: { 'wf-1': 1 },
      followupHistory: [{ note: 'internal' }],
      priorityFlaggedAt: '2026-11-13T00:00:00.000Z',
    },
    workspaceId: 'owner1',
    nowMs: NOW,
  })
  assert.equal(payload.event, WEBHOOK_EVENT)
  assert.equal(payload.workspaceId, 'owner1')
  assert.equal(payload.timestamp, new Date(NOW).toISOString())
  assert.deepEqual(payload.rule, {
    id: 'wf-1',
    name: 'Morning pickup',
    trigger: 'new_inquiry',
    action: 'send_webhook',
  })
  assert.deepEqual(payload.inquiry, {
    id: 'inq1',
    name: 'Rahul Sharma',
    phone: '9876543210',
    email: 'rahul@example.com',
    service: 'Ceramic Coating',
    status: 'new',
    value: 5000,
    source: 'manual',
    branchId: 'Andheri',
    assignedTo: '',
    createdAt: NOW - 5 * HOUR,
  })
})

check('buildWebhookPayload blanks an invalid email and tolerates gaps', () => {
  const payload = buildWebhookPayload({
    rule: {},
    inquiry: { id: 'x', email: 'not-an-email', value: 'oops' },
    workspaceId: undefined,
    nowMs: NOW,
  })
  assert.equal(payload.inquiry.email, '')
  assert.equal(payload.inquiry.value, 0)
  assert.equal(payload.workspaceId, '')
  assert.equal(payload.inquiry.createdAt, null)
})

function webhookSettings(url, enabled = true) {
  return {
    enabled,
    rules: [
      {
        id: 'wf-hook',
        name: 'Zapier bridge',
        enabled: true,
        trigger: 'new_inquiry',
        hours: 4,
        action: 'send_webhook',
        webhookUrl: url,
      },
    ],
  }
}

const waitingInquiry = {
  id: 'inq1',
  name: 'Rahul Sharma',
  status: 'new',
  createdAt: NOW - 5 * HOUR,
}

check('normalizeWorkflowRule keeps a trimmed webhookUrl', () => {
  const rule = normalizeWorkflowRule({
    id: 'r1',
    trigger: 'stale',
    action: 'send_webhook',
    webhookUrl: '  https://hook.make.com/abc  ',
  })
  assert.equal(rule.webhookUrl, 'https://hook.make.com/abc')
  const other = normalizeWorkflowRule({
    id: 'r2',
    trigger: 'stale',
    action: 'flag_priority',
  })
  assert.equal(other.webhookUrl, '')
})

check('evaluateWorkflows fires send_webhook with url + payload, no other write', () => {
  const actions = evaluateWorkflows([waitingInquiry], webhookSettings('https://hooks.zapier.com/hooks/catch/1/x/'), {
    members: [],
    ownerUid: 'owner1',
    slaHours: 24,
    nowMs: NOW,
  })
  assert.equal(actions.length, 1)
  const action = actions[0]
  assert.equal(action.action, 'send_webhook')
  assert.equal(action.webhook.url, 'https://hooks.zapier.com/hooks/catch/1/x/')
  assert.equal(action.webhook.payload.event, 'workflow_fired')
  assert.equal(action.webhook.payload.workspaceId, 'owner1')
  assert.equal(action.webhook.payload.inquiry.id, 'inq1')
  assert.equal(action.targetUid, null)
  assert.equal(action.followup, null)
  assert.equal(action.patch, null)
  assert.equal(action.historyEntry, null)
  // Episode marker still stamped by the sweep via firedPatch.
  assert.ok(action.firedPatch['wf-hook'] > 0)
})

check('evaluateWorkflows never fires a webhook rule with an invalid URL', () => {
  for (const url of ['http://hooks.zapier.com/x', 'not-a-url', '']) {
    const actions = evaluateWorkflows([waitingInquiry], webhookSettings(url), {
      members: [],
      ownerUid: 'owner1',
      slaHours: 24,
      nowMs: NOW,
    })
    assert.equal(actions.length, 0, url)
  }
})

check('evaluateWorkflows respects the episode dedupe for webhooks', () => {
  const fired = {
    ...waitingInquiry,
    workflowFired: { 'wf-hook': NOW - 5 * HOUR },
  }
  const actions = evaluateWorkflows([fired], webhookSettings('https://hooks.zapier.com/hooks/catch/1/x/'), {
    members: [],
    ownerUid: 'owner1',
    slaHours: 24,
    nowMs: NOW,
  })
  assert.equal(actions.length, 0)
})

console.log(`\n${passed} checks passed`)
