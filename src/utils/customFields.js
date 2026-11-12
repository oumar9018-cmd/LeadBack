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

/** Stable id from the label, deduplicated against existing ids. A label
 * that slugifies to nothing (e.g. non-ASCII) gets a generated id
 * instead of the shared "field" base, so distinct labels never collide. */
export function customFieldId(label, existingIds = []) {
  const slug = slugify(label)
  if (!slug) {
    let n = existingIds.length + 1
    while (existingIds.includes(`field-${n}`)) n += 1
    return `field-${n}`
  }
  if (!existingIds.includes(slug)) return slug
  let n = 2
  while (existingIds.includes(`${slug}-${n}`)) n += 1
  return `${slug}-${n}`
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
  if (type === 'date') {
    const text = String(raw).trim()
    if (!text) return ''
    return Number.isNaN(Date.parse(text)) ? '' : text
  }
  return String(raw).trim()
}

/**
 * Guess which CSV column feeds each custom field during import.
 * Exact header match against the field label (case-insensitive)
 * first — a sheet exported from BackWon carries the label as its
 * header, so re-imports map themselves — then against the field id
 * (the label's slug). Returns { [fieldId]: columnIndex | -1 }.
 * Pure.
 */
export function guessCustomFieldMapping(defs, headers) {
  const normalized = (headers || []).map(h =>
    String(h || '').trim().toLowerCase()
  )
  const mapping = {}
  for (const field of Array.isArray(defs) ? defs : []) {
    if (!field?.id) continue
    let index = normalized.indexOf(
      String(field.label || '').trim().toLowerCase()
    )
    if (index < 0) index = normalized.indexOf(field.id)
    mapping[field.id] = index
  }
  return mapping
}

/**
 * Coerce one imported CSV cell into a storable custom value.
 * Returns { value, flagged }: `value` is '' when nothing should be
 * stored; `flagged` is true only when the cell HAD content that
 * could not be used (a dropdown value matching no option, a number
 * or date that does not parse) — the import preview surfaces the
 * count instead of silently dropping data. Dropdown matches are
 * case-insensitive and store the canonical option text. Pure.
 */
export function coerceImportedCustomValue(field, raw) {
  const text = String(raw ?? '').trim()
  if (!text) return { value: '', flagged: false }
  if (!field || !CUSTOM_FIELD_TYPES.some(t => t.id === field.type)) {
    return { value: '', flagged: true }
  }
  if (field.type === 'number') {
    const cleaned = text.replace(/[^0-9.-]/g, '')
    const n =
      cleaned && cleaned !== '-' && cleaned !== '.'
        ? Number(cleaned)
        : NaN
    return Number.isFinite(n)
      ? { value: n, flagged: false }
      : { value: '', flagged: true }
  }
  if (field.type === 'date') {
    const parsed = new Date(text)
    if (Number.isNaN(parsed.getTime())) return { value: '', flagged: true }
    return { value: parsed.toISOString().slice(0, 10), flagged: false }
  }
  if (field.type === 'select') {
    const match = (field.options || []).find(
      option => String(option).toLowerCase() === text.toLowerCase()
    )
    return match
      ? { value: match, flagged: false }
      : { value: '', flagged: true }
  }
  return { value: text, flagged: false }
}

/**
 * Build the `custom` map for one imported CSV row. `mapping` is
 * { [fieldId]: columnIndex } (-1 or missing = not mapped); `row` is
 * the raw cell array. Empty values are dropped, mirroring manual
 * creation, so imported and hand-added inquiries keep the same
 * shape. Returns { custom, flagged } — flagged counts cells that
 * had content but could not be used. Pure.
 */
export function buildImportedCustomValues(defs, mapping, row) {
  const custom = {}
  let flagged = 0
  for (const field of Array.isArray(defs) ? defs : []) {
    const index = mapping?.[field.id]
    if (typeof index !== 'number' || index < 0) continue
    const result = coerceImportedCustomValue(
      field,
      Array.isArray(row) ? row[index] : ''
    )
    if (result.flagged) flagged += 1
    if (result.value !== '') custom[field.id] = result.value
  }
  return { custom, flagged }
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
