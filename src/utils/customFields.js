/**
 * #13 — Custom Fields.
 *
 * Definitions live in one small doc (users/{ownerUid}/settings/customFields,
 * same pattern as branches) so the existing settings rules cover them:
 * owners/admins write, managers read. Values live on the inquiry doc
 * itself under a single `custom` map, so no migration is needed — old
 * inquiries simply have no custom values.
 *
 * Types are deliberately small: text, number, date, dropdown. Nothing
 * here sends data anywhere new; values are workspace-scoped inquiry
 * data, exactly like name/phone/service.
 */

export const CUSTOM_FIELD_TYPES = [
  { id: 'text', label: 'Text' },
  { id: 'number', label: 'Number' },
  { id: 'date', label: 'Date' },
  { id: 'select', label: 'Dropdown' },
]

export const MAX_CUSTOM_FIELDS = 10

function slugify(label) {
  return (label || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Stable id from the label, deduplicated against existing ids. */
export function customFieldId(label, existingIds = []) {
  const base = slugify(label) || 'field'
  if (!existingIds.includes(base)) return base
  let n = 2
  while (existingIds.includes(`${base}-${n}`)) n += 1
  return `${base}-${n}`
}

/**
 * Validate a new field definition. Returns '' when valid, else the
 * exact error to show. Pure — safe to unit-test.
 */
export function validateCustomField({ label, type, options }, existing = []) {
  if (!label || !label.trim()) return 'Field name is required.'
  if (!CUSTOM_FIELD_TYPES.some(t => t.id === type)) return 'Unknown field type.'
  if (existing.length >= MAX_CUSTOM_FIELDS) {
    return `Maximum ${MAX_CUSTOM_FIELDS} custom fields.`
  }
  if (
    existing.some(f => f.label.toLowerCase() === label.trim().toLowerCase())
  ) {
    return 'A field with this name already exists.'
  }
  if (type === 'select') {
    const clean = (options || []).map(o => String(o).trim()).filter(Boolean)
    if (clean.length === 0) {
      return 'Dropdown fields need at least one option.'
    }
  }
  return ''
}

/** Normalize a raw input value for storage. Empty stays empty. Text is
 * trimmed, matching how name/phone/service are saved. */
export function normalizeCustomValue(type, raw) {
  if (raw === null || raw === undefined) return ''
  if (type === 'number') {
    if (String(raw).trim() === '') return ''
    const n = Number(raw)
    return Number.isNaN(n) ? '' : n
  }
  return String(raw).trim()
}

/** Display string for a stored value ('—' when empty). */
export function formatCustomValue(value) {
  if (value === '' || value === null || value === undefined) return '—'
  return String(value)
}

/**
 * Load definitions for a workspace. Returns [] when the doc does not
 * exist yet, and drops any malformed entries instead of crashing.
 * Firestore-touching (not pure) — tested through the UI path, not node.
 */
export async function loadCustomFieldDefinitions(db, ownerUid) {
  if (!db || !ownerUid) return []
  try {
    const snap = await db
      .collection('users')
      .doc(ownerUid)
      .collection('settings')
      .doc('customFields')
      .get()
    if (!snap.exists) return []
    const raw = snap.data()?.fields
    if (!Array.isArray(raw)) return []
    return raw.filter(
      field =>
        field &&
        typeof field.id === 'string' &&
        typeof field.label === 'string' &&
        CUSTOM_FIELD_TYPES.some(t => t.id === field.type) &&
        (field.type !== 'select' ||
          (Array.isArray(field.options) && field.options.length > 0))
    )
  } catch (error) {
    console.error('Custom fields load failed:', error)
    return []
  }
}
