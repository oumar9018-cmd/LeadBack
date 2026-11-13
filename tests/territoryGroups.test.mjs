/**
 * Tests for src/utils/territoryGroups.js — plain node, no framework:
 *   node tests/territoryGroups.test.mjs
 * Exits non-zero on the first failed assertion.
 *
 * Territories group branches (by NAME, the convention inquiries
 * carry) for the Reports rollup. Pure logic only — the loader and
 * card follow the same settings-doc pattern as targets/branches.
 */
import assert from 'node:assert/strict'
import {
  aggregateByTerritory,
  branchTerritoryMap,
  normalizeTerritoryGroups,
  territoryNameForBranch,
  validateTerritoryGroup,
} from '../src/utils/territoryGroups.js'

let passed = 0
function check(name, fn) {
  fn()
  passed += 1
  console.log(`ok ${passed} - ${name}`)
}

const GROUPS = normalizeTerritoryGroups({
  groups: [
    { id: 'north', name: 'North', branches: ['Delhi', 'Jaipur'] },
    { id: 'south', name: 'South', branches: ['Kochi'] },
  ],
})

/* ---------------- normalization ---------------- */

check('normalize: junk in, empty list out', () => {
  assert.deepEqual(normalizeTerritoryGroups(null), [])
  assert.deepEqual(normalizeTerritoryGroups('nope'), [])
  assert.deepEqual(normalizeTerritoryGroups({}), [])
  assert.deepEqual(normalizeTerritoryGroups({ groups: 'x' }), [])
})

check('normalize: drops nameless groups and non-object entries', () => {
  const out = normalizeTerritoryGroups({
    groups: [null, 'x', { name: '  ' }, { name: 'West', branches: [] }],
  })
  assert.deepEqual(out, [{ id: 'west', name: 'West', branches: [] }])
})

check('normalize: duplicate names keep the first (case-insensitive)', () => {
  const out = normalizeTerritoryGroups({
    groups: [
      { name: 'North', branches: ['Delhi'] },
      { name: 'north', branches: ['Agra'] },
    ],
  })
  assert.equal(out.length, 1)
  assert.deepEqual(out[0].branches, ['Delhi'])
})

check('normalize: a branch lives in at most one territory (first wins)', () => {
  const out = normalizeTerritoryGroups({
    groups: [
      { name: 'North', branches: ['Delhi', 'Jaipur'] },
      { name: 'Central', branches: ['Jaipur', 'Indore'] },
    ],
  })
  assert.deepEqual(out[0].branches, ['Delhi', 'Jaipur'])
  assert.deepEqual(out[1].branches, ['Indore'])
})

check('normalize: branch lists are trimmed and deduped', () => {
  const out = normalizeTerritoryGroups({
    groups: [{ name: 'North', branches: [' Delhi ', 'Delhi', '', 42] }],
  })
  assert.deepEqual(out[0].branches, ['Delhi'])
})

check('normalize: a bare array is accepted too', () => {
  const out = normalizeTerritoryGroups([{ name: 'North', branches: [] }])
  assert.equal(out.length, 1)
  assert.equal(out[0].id, 'north')
})

/* ---------------- validation ---------------- */

check('validate: name required, duplicates refused (self excluded)', () => {
  assert.equal(validateTerritoryGroup({ name: '' }, []), 'Territory name is required.')
  assert.equal(validateTerritoryGroup({ name: 'East' }, GROUPS), '')
  assert.equal(
    validateTerritoryGroup({ name: 'north' }, GROUPS),
    'A territory with that name already exists.'
  )
  assert.equal(
    validateTerritoryGroup({ id: 'north', name: 'North' }, GROUPS),
    ''
  )
})

/* ---------------- lookup ---------------- */

check('lookup: branch → territory, ungrouped → empty', () => {
  assert.equal(territoryNameForBranch(GROUPS, 'Jaipur'), 'North')
  assert.equal(territoryNameForBranch(GROUPS, 'Kochi'), 'South')
  assert.equal(territoryNameForBranch(GROUPS, 'Surat'), '')
  assert.equal(territoryNameForBranch(GROUPS, ''), '')
  const map = branchTerritoryMap(GROUPS)
  assert.equal(map.size, 3)
  assert.equal(map.get('Delhi'), 'North')
})

/* ---------------- rollup ---------------- */

const INQUIRIES = [
  { status: 'recovered', value: 1000, branchId: 'Delhi' },
  { status: 'recovered', value: 500, branchId: 'Jaipur' },
  { status: 'lost', value: 300, branchId: 'Delhi' },
  { status: 'new', value: 200, branchId: 'Kochi' },
  { status: 'followup', value: 100, branchId: 'Surat' },
  { status: 'new', value: 50, branchId: '' },
]

check('rollup: same metrics as the branch rollup, grouped', () => {
  const rows = aggregateByTerritory(INQUIRIES, GROUPS, [
    'Delhi', 'Jaipur', 'Kochi', 'Surat',
  ])
  const byName = Object.fromEntries(rows.map(r => [r.territory, r]))
  // North = Delhi + Jaipur: 3 rows, 2 recovered (₹1500), 1 lost.
  assert.equal(byName.North.total, 3)
  assert.equal(byName.North.recovered, 2)
  assert.equal(byName.North.lost, 1)
  assert.equal(byName.North.recoveredRevenue, 1500)
  assert.equal(byName.North.recoveryRate, 67) // 2 of 3 closed
  assert.deepEqual(byName.North.branches, ['Delhi', 'Jaipur'])
  // South = Kochi: 1 open row, nothing closed → rate null, never 0%.
  assert.equal(byName.South.total, 1)
  assert.equal(byName.South.open, 1)
  assert.equal(byName.South.recoveryRate, null)
  // No territory = Surat + unbranched.
  assert.equal(byName['No territory'].total, 2)
  assert.equal(byName['No territory'].isUnassigned, true)
  assert.deepEqual(byName['No territory'].branches, ['Surat'])
})

check('rollup: defined territories appear even with zero inquiries', () => {
  const rows = aggregateByTerritory([], GROUPS, [])
  assert.deepEqual(rows.map(r => r.territory), ['North', 'South'])
  assert.ok(rows.every(r => r.total === 0))
})

check('rollup: No territory row appears only when such inquiries exist', () => {
  const rows = aggregateByTerritory(
    [{ status: 'new', value: 1, branchId: 'Delhi' }],
    GROUPS,
    []
  )
  assert.deepEqual(rows.map(r => r.territory), ['North', 'South'])
})

check('rollup: no groups → everything is No territory', () => {
  const rows = aggregateByTerritory(INQUIRIES, [], ['Delhi'])
  assert.equal(rows.length, 1)
  assert.equal(rows[0].territory, 'No territory')
  assert.equal(rows[0].total, 6)
  assert.deepEqual(rows[0].branches, ['Delhi'])
})

check('rollup: row order follows the branch rollup (revenue, then total)', () => {
  const rows = aggregateByTerritory(INQUIRIES, GROUPS, [])
  // North (₹1500 recovered) first, No territory last.
  assert.equal(rows[0].territory, 'North')
  assert.equal(rows[rows.length - 1].territory, 'No territory')
})

console.log(`\n${passed} checks passed`)
