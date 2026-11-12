/**
 * Tests for src/utils/customFields.js — plain node, no framework:
 *   node tests/customFields.test.mjs
 * Exits non-zero on the first failed assertion.
 *
 * Covers the pure logic only: id slugging, definition validation,
 * value normalization, and the CSV-import helpers (Round 4):
 * mapping guesses, per-cell coercion, and per-row map building.
 * The Firestore loader is exercised through the UI path.
 */
import assert from 'node:assert/strict'
import {
  MAX_CUSTOM_FIELDS,
  buildImportedCustomValues,
  coerceImportedCustomValue,
  customFieldId,
  guessCustomFieldMapping,
  normalizeCustomValue,
  validateCustomField,
} from '../src/utils/customFields.js'

let passed = 0
function check(name, fn) {
  fn()
  passed += 1
  console.log(`ok ${passed} - ${name}`)
}

/* ---------------- customFieldId ---------------- */

check('customFieldId: slugifies the label', () => {
  assert.equal(customFieldId('Budget Range'), 'budget-range')
  assert.equal(customFieldId('  Lead   Source!! '), 'lead-source')
})

check('customFieldId: deduplicates with a numeric suffix', () => {
  assert.equal(customFieldId('Budget', ['budget']), 'budget-2')
  assert.equal(customFieldId('Budget', ['budget', 'budget-2']), 'budget-3')
})

check('customFieldId: unslugifiable labels get unique generated ids', () => {
  assert.equal(customFieldId('बजट', []), 'field-1')
  assert.equal(customFieldId('बजट', ['field-1']), 'field-2')
  assert.equal(customFieldId('!!!', ['field-1', 'field-2']), 'field-3')
})

/* ---------------- validateCustomField ---------------- */

check('validateCustomField: a plain text field is valid', () => {
  assert.equal(validateCustomField({ label: 'Budget', type: 'text' }, []), '')
})

check('validateCustomField: label is required', () => {
  assert.equal(
    validateCustomField({ label: '  ', type: 'text' }, []),
    'Field name is required.'
  )
  assert.equal(
    validateCustomField({ label: undefined, type: 'text' }, []),
    'Field name is required.'
  )
})

check('validateCustomField: unknown type is rejected', () => {
  assert.equal(
    validateCustomField({ label: 'X', type: 'richtext' }, []),
    'Unknown field type.'
  )
})

check('validateCustomField: duplicate labels rejected case-insensitively', () => {
  const existing = [{ id: 'budget', label: 'Budget', type: 'text' }]
  assert.equal(
    validateCustomField({ label: ' budget ', type: 'number' }, existing),
    'A field with this name already exists.'
  )
})

check('validateCustomField: the field cap is enforced', () => {
  const existing = Array.from({ length: MAX_CUSTOM_FIELDS }, (_, i) => ({
    id: `f${i}`,
    label: `F${i}`,
    type: 'text',
  }))
  assert.equal(
    validateCustomField({ label: 'One more', type: 'text' }, existing),
    `Maximum ${MAX_CUSTOM_FIELDS} custom fields.`
  )
})

check('validateCustomField: dropdowns need at least one real option', () => {
  assert.equal(
    validateCustomField({ label: 'Size', type: 'select', options: [] }, []),
    'Dropdown fields need at least one option.'
  )
  assert.equal(
    validateCustomField({ label: 'Size', type: 'select', options: [' ', ''] }, []),
    'Dropdown fields need at least one option.'
  )
  assert.equal(
    validateCustomField({ label: 'Size', type: 'select', options: ['S', 'M'] }, []),
    ''
  )
})

/* ---------------- normalizeCustomValue ---------------- */

check('normalizeCustomValue: text is trimmed, empties stay empty', () => {
  assert.equal(normalizeCustomValue('text', '  hello '), 'hello')
  assert.equal(normalizeCustomValue('text', null), '')
  assert.equal(normalizeCustomValue('text', undefined), '')
})

check('normalizeCustomValue: numbers coerce, garbage becomes empty', () => {
  assert.equal(normalizeCustomValue('number', '42'), 42)
  assert.equal(normalizeCustomValue('number', ' 3.5 '), 3.5)
  assert.equal(normalizeCustomValue('number', 'abc'), '')
  assert.equal(normalizeCustomValue('number', ''), '')
})

check('normalizeCustomValue: dates must parse', () => {
  assert.equal(normalizeCustomValue('date', '2026-01-05'), '2026-01-05')
  assert.equal(normalizeCustomValue('date', 'not a date'), '')
  assert.equal(normalizeCustomValue('date', ' '), '')
})

/* ---------------- guessCustomFieldMapping ---------------- */

const defs = [
  { id: 'budget-range', label: 'Budget Range', type: 'text' },
  { id: 'size', label: 'Size', type: 'select', options: ['S', 'M', 'L'] },
  { id: 'field-1', label: 'बजट', type: 'number' },
]

check('guessCustomFieldMapping: label match is case-insensitive', () => {
  const mapping = guessCustomFieldMapping(defs, ['Name', 'budget range', 'SIZE'])
  assert.equal(mapping['budget-range'], 1)
  assert.equal(mapping.size, 2)
})

check('guessCustomFieldMapping: falls back to the field id, else -1', () => {
  const mapping = guessCustomFieldMapping(defs, ['Name', 'field-1'])
  assert.equal(mapping['field-1'], 1)
  assert.equal(mapping['budget-range'], -1)
  assert.equal(mapping.size, -1)
})

/* ---------------- coerceImportedCustomValue ---------------- */

check('coerce: empty cells are stored as nothing and never flagged', () => {
  assert.deepEqual(coerceImportedCustomValue(defs[0], ''), { value: '', flagged: false })
  assert.deepEqual(coerceImportedCustomValue(defs[1], '  '), { value: '', flagged: false })
  assert.deepEqual(coerceImportedCustomValue(defs[2], null), { value: '', flagged: false })
})

check('coerce: text passes through trimmed', () => {
  assert.deepEqual(coerceImportedCustomValue(defs[0], ' 5k–20k '), {
    value: '5k–20k',
    flagged: false,
  })
})

check('coerce: numbers accept currency/commas, garbage is flagged', () => {
  assert.deepEqual(coerceImportedCustomValue(defs[2], '₹5,000'), {
    value: 5000,
    flagged: false,
  })
  assert.deepEqual(coerceImportedCustomValue(defs[2], '12.5'), {
    value: 12.5,
    flagged: false,
  })
  assert.deepEqual(coerceImportedCustomValue(defs[2], 'lots'), {
    value: '',
    flagged: true,
  })
})

check('coerce: dates normalize to YYYY-MM-DD, garbage is flagged', () => {
  const dateField = { id: 'visit', label: 'Visit', type: 'date' }
  assert.deepEqual(coerceImportedCustomValue(dateField, '2026-01-05'), {
    value: '2026-01-05',
    flagged: false,
  })
  assert.deepEqual(coerceImportedCustomValue(dateField, 'someday'), {
    value: '',
    flagged: true,
  })
})

check('coerce: dropdown matches options case-insensitively, stores canonical', () => {
  assert.deepEqual(coerceImportedCustomValue(defs[1], 'm'), {
    value: 'M',
    flagged: false,
  })
  assert.deepEqual(coerceImportedCustomValue(defs[1], 'XL'), {
    value: '',
    flagged: true,
  })
})

/* ---------------- buildImportedCustomValues ---------------- */

check('buildImportedCustomValues: builds the map, drops empties, counts flags', () => {
  const mapping = { 'budget-range': 0, size: 1, 'field-1': 2 }
  const { custom, flagged } = buildImportedCustomValues(defs, mapping, [
    '5k–20k',
    'huge',
    '₹7,500',
  ])
  assert.deepEqual(custom, { 'budget-range': '5k–20k', 'field-1': 7500 })
  assert.equal(flagged, 1)
})

check('buildImportedCustomValues: unmapped fields are skipped entirely', () => {
  const { custom, flagged } = buildImportedCustomValues(
    defs,
    { 'budget-range': -1 },
    ['x', 'M', '100']
  )
  assert.deepEqual(custom, {})
  assert.equal(flagged, 0)
})

check('buildImportedCustomValues: no defs, no mapping, no row — no crash', () => {
  assert.deepEqual(buildImportedCustomValues([], {}, []), { custom: {}, flagged: 0 })
  assert.deepEqual(buildImportedCustomValues(null, null, null), { custom: {}, flagged: 0 })
})

console.log(`\n${passed} customFields checks passed`)
