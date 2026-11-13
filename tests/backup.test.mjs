/**
 * Tests for src/utils/backup.js — plain node, no framework:
 *   node tests/backup.test.mjs
 * Exits non-zero on the first failed assertion.
 */
import assert from 'node:assert/strict'
import {
  BACKUP_SETTINGS_DOCS,
  BACKUP_VERSION,
  buildBackup,
  planRestore,
  serializeBackupValue,
  summarizeBackup,
  validateBackup,
} from '../src/utils/backup.js'

let passed = 0
function check(name, fn) {
  fn()
  passed += 1
  console.log(`ok ${passed} - ${name}`)
}

const NOW_ISO = '2026-11-13T10:00:00.000Z'

function sampleData() {
  return {
    workspaceId: 'owner1',
    exportedAt: NOW_ISO,
    inquiries: [
      {
        id: 'inq1',
        name: 'Rahul Sharma',
        phone: '9876543210',
        service: 'Ceramic Coating',
        value: 5000,
        status: 'followup',
        createdAt: { seconds: 1762000000, nanoseconds: 0 },
      },
      {
        id: 'inq2',
        name: 'Asha Patel',
        phone: '9812345678',
        service: 'Hair Spa',
        value: 1200,
        status: 'new',
        createdAt: '2026-11-01T09:30:00.000Z',
      },
    ],
    members: [{ id: 'uid-rep', email: 'rep@example.com', role: 'sales_rep' }],
    branches: [{ id: 'andheri', name: 'Andheri' }],
    settings: {
      sla: { firstResponseHours: 8 },
      workflows: { enabled: false, rules: [] },
      targets: { reps: {}, branches: {} },
      workspace: { currency: 'INR' }, // NOT a backup doc — must be dropped
    },
  }
}

check('serialize converts Firestore-like timestamps to ISO strings', () => {
  assert.equal(
    serializeBackupValue({ seconds: 1762000000, nanoseconds: 500000000 }),
    new Date(1762000000500).toISOString()
  )
  assert.equal(
    serializeBackupValue({ toMillis: () => 1762000000000 }),
    new Date(1762000000000).toISOString()
  )
  const nested = serializeBackupValue({
    when: { seconds: 1762000000, nanoseconds: 0 },
    list: [1, 'x', null],
    gone: undefined,
  })
  assert.equal(nested.when, new Date(1762000000000).toISOString())
  assert.deepEqual(nested.list, [1, 'x', null])
  assert.equal('gone' in nested, false)
})

check('buildBackup carries the five settings docs and counts', () => {
  const backup = buildBackup(sampleData())
  assert.equal(backup.version, BACKUP_VERSION)
  assert.equal(backup.workspaceId, 'owner1')
  assert.deepEqual(Object.keys(backup.settings).sort(), ['sla', 'targets', 'workflows'])
  assert.equal(backup.settings.workspace, undefined)
  assert.deepEqual(backup.counts, {
    inquiries: 2,
    customers: 2,
    members: 1,
    branches: 1,
    settingsDocs: 3,
  })
  assert.equal(backup.inquiries[0].createdAt, new Date(1762000000000).toISOString())
  assert.deepEqual(backup.customers[1], {
    inquiryId: 'inq2',
    name: 'Asha Patel',
    phone: '9812345678',
    service: 'Hair Spa',
    value: 1200,
    status: 'new',
  })
})

check('validateBackup accepts a built backup and normalizes it', () => {
  const built = buildBackup(sampleData())
  const roundTripped = JSON.parse(JSON.stringify(built))
  const { ok, errors, backup } = validateBackup(roundTripped)
  assert.equal(ok, true)
  assert.deepEqual(errors, [])
  assert.equal(backup.inquiries.length, 2)
  assert.equal(backup.exportedAt, NOW_ISO)
  const summary = summarizeBackup(backup)
  assert.deepEqual(summary, {
    exportedAt: NOW_ISO,
    inquiries: 2,
    customers: 2,
    members: 1,
    branches: 1,
    settingsDocs: 3,
  })
})

check('validateBackup rejects malformed files', () => {
  for (const bad of [null, undefined, 'text', 42, [], { app: 'Other', kind: 'workspace-backup', version: 1, inquiries: [] }]) {
    const { ok, backup } = validateBackup(bad)
    assert.equal(ok, false)
    assert.equal(backup, null)
  }
  const noInquiries = validateBackup({ app: 'BackWon', kind: 'workspace-backup', version: 1 })
  assert.equal(noInquiries.ok, false)
  assert.ok(noInquiries.errors.some(e => e.includes('inquiries')))
  const badRows = validateBackup({ app: 'BackWon', kind: 'workspace-backup', version: 1, inquiries: ['nope'] })
  assert.equal(badRows.ok, false)
  const badMembers = validateBackup({ app: 'BackWon', kind: 'workspace-backup', version: 1, inquiries: [], members: {} })
  assert.equal(badMembers.ok, false)
})

check('validateBackup rejects a version mismatch', () => {
  const { ok, errors } = validateBackup({
    app: 'BackWon',
    kind: 'workspace-backup',
    version: BACKUP_VERSION + 1,
    inquiries: [],
  })
  assert.equal(ok, false)
  assert.ok(errors.some(e => e.includes('version')))
})

check('planRestore adds inquiries as new docs with restoredFrom, never the old id', () => {
  const { backup } = validateBackup(JSON.parse(JSON.stringify(buildBackup(sampleData()))))
  const plan = planRestore(backup, { branches: [], settings: {} }, { restoredAt: NOW_ISO })
  assert.equal(plan.inquiriesToAdd.length, 2)
  const first = plan.inquiriesToAdd[0]
  assert.equal(first.sourceId, 'inq1')
  assert.equal(first.data.restoredFrom, 'inq1')
  assert.equal(first.data.restoredAt, NOW_ISO)
  assert.equal('id' in first.data, false)
  assert.equal(first.data.name, 'Rahul Sharma')
})

check('planRestore only fills MISSING settings keys — the no-overwrite rule', () => {
  const { backup } = validateBackup(JSON.parse(JSON.stringify(buildBackup(sampleData()))))
  const current = {
    branches: [],
    settings: {
      sla: { firstResponseHours: 24 }, // workspace already has a target
      workflows: null, // doc does not exist yet
      targets: { reps: { uid1: { revenue: 100, count: 2 } } }, // branches key missing
    },
  }
  const plan = planRestore(backup, current, { restoredAt: NOW_ISO })
  // sla: existing key kept out of the patch entirely
  assert.equal(plan.settingsPatches.sla, undefined)
  assert.deepEqual(plan.settingsSkippedKeys.sla, ['firstResponseHours'])
  // workflows: doc missing → restored in full
  assert.deepEqual(plan.settingsPatches.workflows, { enabled: false, rules: [] })
  // targets: only the missing `branches` key is patched
  assert.deepEqual(plan.settingsPatches.targets, { branches: {} })
  assert.deepEqual(plan.settingsSkippedKeys.targets, ['reps'])
})

check('planRestore appends only branches that are not already present', () => {
  const { backup } = validateBackup(JSON.parse(JSON.stringify(buildBackup(sampleData()))))
  const plan = planRestore(
    backup,
    { branches: [{ id: 'andheri', name: 'Andheri' }], settings: {} },
    { restoredAt: NOW_ISO }
  )
  assert.deepEqual(plan.branchesToAdd, [])
  assert.equal(plan.branchesExisting, 1)
  const plan2 = planRestore(backup, { branches: [], settings: {} }, { restoredAt: NOW_ISO })
  assert.deepEqual(plan2.branchesToAdd, [{ id: 'andheri', name: 'Andheri' }])
  assert.equal(plan2.branchesExisting, 0)
})

check('planRestore treats members and customers as reference/via-inquiries', () => {
  const { backup } = validateBackup(JSON.parse(JSON.stringify(buildBackup(sampleData()))))
  const plan = planRestore(backup, { branches: [], settings: {} }, { restoredAt: NOW_ISO })
  assert.equal(plan.membersInBackup, 1)
  assert.equal(plan.customersInBackup, 2)
  // No member write instructions exist anywhere in the plan shape.
  assert.deepEqual(Object.keys(plan).sort(), [
    'branchesExisting',
    'branchesToAdd',
    'customersInBackup',
    'inquiriesToAdd',
    'membersInBackup',
    'settingsPatches',
    'settingsSkippedKeys',
  ])
})

check('BACKUP_SETTINGS_DOCS is exactly the five named docs', () => {
  assert.deepEqual(BACKUP_SETTINGS_DOCS, [
    'sla',
    'workflows',
    'escalation',
    'targets',
    'customFields',
  ])
})

console.log(`\n${passed} checks passed`)
