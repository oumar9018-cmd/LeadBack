/**
 * Workspace backup & restore — Round 5 (pure helpers).
 *
 * A backup is ONE portable JSON file:
 *   { app: 'BackWon', kind: 'workspace-backup', version: 1,
 *     exportedAt: <ISO>, workspaceId: <ownerUid>,
 *     inquiries: [ { id, ...doc } ],
 *     customers: [ { inquiryId, name, phone, service, value, status } ],
 *     members:   [ { id, ...doc } ],
 *     branches:  [ { id, name } ],
 *     settings:  { sla, workflows, escalation, targets, customFields } }
 *
 * `customers` is the Customers-page directory derived from the
 * inquiry rows (that page has no collection of its own), carried so
 * the file reads as a complete workspace export; restoring the
 * inquiries restores the directory with them. `members` is carried
 * for reference: firestore.rules only let a member create their own
 * member record (at invite-accept time), so a restore NEVER writes
 * member docs — the preview says so in plain words.
 *
 * Restore is a SAFE MERGE, planned here and applied by the Export
 * Center:
 *   - Inquiries are always ADDED as new documents with fresh ids
 *     and a `restoredFrom` marker (the original id). Nothing is
 *     ever overwritten or deleted, so restoring the same file twice
 *     creates a second set of copies — the preview warns about this.
 *   - Branches are appended only when their id is not already in
 *     the workspace's branch list.
 *   - Settings docs get only the top-level keys that are MISSING in
 *     the current doc; keys the workspace already has are never
 *     overwritten. A settings doc that does not exist yet is
 *     restored in full.
 *   - Members are reference-only (see above).
 *
 * Serialization converts Firestore Timestamp-like values (objects
 * with toMillis()/toDate(), or { seconds, nanoseconds }) to ISO
 * strings, recursively, so the file is plain JSON. The app's own
 * readers (e.g. createdMs in workflows.js) parse ISO strings back,
 * so restored rows keep working.
 *
 * Which settings docs travel: exactly the five named for this
 * feature. The `workspace` settings doc (currency, business name)
 * and the automation/routing/rules/territories docs are NOT part of
 * a backup — stated here so nobody assumes otherwise.
 */

export const BACKUP_APP = 'BackWon'
export const BACKUP_KIND = 'workspace-backup'
export const BACKUP_VERSION = 1

export const BACKUP_SETTINGS_DOCS = [
  'sla',
  'workflows',
  'escalation',
  'targets',
  'customFields',
]

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

/** Deep-convert a Firestore doc value into plain JSON data:
 * Timestamps → ISO strings; undefined/functions dropped (object
 * keys) or nulled (array slots), like JSON.stringify would. */
export function serializeBackupValue(value) {
  if (value === null || value === undefined) return null
  if (typeof value === 'number' || typeof value === 'string') return value
  if (typeof value === 'boolean') return value
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object') {
    if (typeof value.toMillis === 'function') {
      const ms = value.toMillis()
      return Number.isFinite(ms) ? new Date(ms).toISOString() : null
    }
    if (typeof value.toDate === 'function') {
      const date = value.toDate()
      return date instanceof Date ? date.toISOString() : null
    }
    if (
      Number.isFinite(value.seconds) &&
      Number.isFinite(value.nanoseconds) &&
      Object.keys(value).length <= 2
    ) {
      const ms = value.seconds * 1000 + Math.floor(value.nanoseconds / 1e6)
      return new Date(ms).toISOString()
    }
    if (Array.isArray(value)) {
      return value.map(item => serializeBackupValue(item))
    }
    const out = {}
    for (const [key, item] of Object.entries(value)) {
      if (item === undefined || typeof item === 'function') continue
      out[key] = serializeBackupValue(item)
    }
    return out
  }
  return null
}

function serializeDoc(doc) {
  if (!isPlainObject(doc)) return null
  const out = serializeBackupValue(doc)
  return isPlainObject(out) ? out : null
}

/** The Customers-page directory rows for a set of inquiries. */
export function deriveCustomers(inquiries) {
  return (Array.isArray(inquiries) ? inquiries : []).map(item => ({
    inquiryId: item?.id ? String(item.id) : '',
    name: item?.name || '',
    phone: item?.phone || '',
    service: item?.service || '',
    value: Number(item?.value) || 0,
    status: item?.status || '',
  }))
}

/**
 * Build the backup object from loaded workspace data.
 * @param {object} data { workspaceId, exportedAt (Date|ISO|ms),
 *   inquiries, members, branches, settings: { docId: docData } }
 * Docs keep their `id` field (callers pass { id, ...data() } rows).
 */
export function buildBackup(data = {}) {
  const inquiries = (Array.isArray(data.inquiries) ? data.inquiries : [])
    .map(serializeDoc)
    .filter(Boolean)
  const members = (Array.isArray(data.members) ? data.members : [])
    .map(serializeDoc)
    .filter(Boolean)
  const branches = (Array.isArray(data.branches) ? data.branches : [])
    .map(serializeDoc)
    .filter(Boolean)
  const settings = {}
  for (const docId of BACKUP_SETTINGS_DOCS) {
    const doc = data.settings?.[docId]
    if (isPlainObject(doc)) settings[docId] = serializeDoc(doc)
  }
  const exportedAt =
    data.exportedAt instanceof Date
      ? data.exportedAt.toISOString()
      : typeof data.exportedAt === 'string' && data.exportedAt
        ? data.exportedAt
        : new Date(Number(data.exportedAt) || Date.now()).toISOString()
  return {
    app: BACKUP_APP,
    kind: BACKUP_KIND,
    version: BACKUP_VERSION,
    exportedAt,
    workspaceId: typeof data.workspaceId === 'string' ? data.workspaceId : '',
    counts: {
      inquiries: inquiries.length,
      customers: inquiries.length,
      members: members.length,
      branches: branches.length,
      settingsDocs: Object.keys(settings).length,
    },
    inquiries,
    customers: deriveCustomers(inquiries),
    members,
    branches,
    settings,
  }
}

/**
 * Validate a parsed backup file. Returns { ok, errors, backup } —
 * `backup` is a normalized copy (arrays guaranteed, settings limited
 * to the known docs) and is only present when ok is true. Anything
 * structurally wrong is a hard error: a partial guess at a restore
 * is worse than no restore.
 */
export function validateBackup(raw) {
  const errors = []
  if (!isPlainObject(raw)) {
    return { ok: false, errors: ['The file is not a BackWon backup (expected a JSON object).'], backup: null }
  }
  if (raw.app !== BACKUP_APP || raw.kind !== BACKUP_KIND) {
    errors.push('The file is not a BackWon workspace backup.')
  }
  if (raw.version !== BACKUP_VERSION) {
    errors.push(
      `Backup version ${raw.version === undefined ? '(missing)' : raw.version} is not supported — this BackWon restores version ${BACKUP_VERSION} backups.`
    )
  }
  if (!Array.isArray(raw.inquiries)) {
    errors.push('The backup has no inquiries list.')
  } else if (raw.inquiries.some(item => !isPlainObject(item))) {
    errors.push('Some inquiries in the backup are not valid records.')
  }
  for (const key of ['members', 'branches']) {
    if (raw[key] !== undefined && !Array.isArray(raw[key])) {
      errors.push(`The backup's ${key} section is not a list.`)
    }
  }
  if (raw.settings !== undefined && !isPlainObject(raw.settings)) {
    errors.push('The backup\'s settings section is not valid.')
  }
  if (errors.length > 0) return { ok: false, errors, backup: null }

  const settings = {}
  for (const docId of BACKUP_SETTINGS_DOCS) {
    if (isPlainObject(raw.settings?.[docId])) {
      settings[docId] = raw.settings[docId]
    }
  }
  return {
    ok: true,
    errors: [],
    backup: {
      version: BACKUP_VERSION,
      exportedAt:
        typeof raw.exportedAt === 'string' ? raw.exportedAt : '',
      workspaceId:
        typeof raw.workspaceId === 'string' ? raw.workspaceId : '',
      inquiries: raw.inquiries,
      customers: Array.isArray(raw.customers) ? raw.customers : [],
      members: Array.isArray(raw.members) ? raw.members : [],
      branches: Array.isArray(raw.branches) ? raw.branches : [],
      settings,
    },
  }
}

/** Counts + date for the restore preview, from a validated backup. */
export function summarizeBackup(backup) {
  return {
    exportedAt: backup?.exportedAt || '',
    inquiries: (backup?.inquiries || []).length,
    customers: (backup?.customers || []).length,
    members: (backup?.members || []).length,
    branches: (backup?.branches || []).length,
    settingsDocs: Object.keys(backup?.settings || {}).length,
  }
}

/**
 * Plan a safe-merge restore of a validated backup against the
 * workspace's current state:
 * @param {object} backup validated backup (validateBackup output)
 * @param {object} current { branches: [{id, name}], settings:
 *   { docId: currentDocData | null } }
 * @returns a plan the caller applies verbatim:
 *   { inquiriesToAdd: [{ sourceId, data }],   // data has NO id; it
 *                                             // carries restoredFrom
 *     branchesToAdd: [{ id, name }],
 *     branchesExisting: number,
 *     settingsPatches: { docId: { key: value } },  // missing keys only
 *     settingsSkippedKeys: { docId: [key] },
 *     membersInBackup: number,              // reference only
 *     customersInBackup: number }           // restored via inquiries
 */
export function planRestore(backup, current = {}, options = {}) {
  const restoredAt =
    options.restoredAt ||
    new Date(Number(options.nowMs) || Date.now()).toISOString()

  const inquiriesToAdd = (backup?.inquiries || []).map(item => {
    const { id, ...rest } = item || {}
    return {
      sourceId: id ? String(id) : '',
      data: {
        ...rest,
        restoredFrom: id ? String(id) : '',
        restoredAt,
      },
    }
  })

  const currentBranchIds = new Set(
    (Array.isArray(current.branches) ? current.branches : [])
      .map(branch => (typeof branch === 'string' ? branch : branch?.id))
      .filter(Boolean)
      .map(String)
  )
  const branchesToAdd = []
  let branchesExisting = 0
  for (const branch of backup?.branches || []) {
    const id = typeof branch === 'string' ? branch : branch?.id
    if (!id) continue
    if (currentBranchIds.has(String(id))) {
      branchesExisting += 1
    } else {
      branchesToAdd.push(
        typeof branch === 'string' ? { id: branch, name: branch } : branch
      )
      currentBranchIds.add(String(id))
    }
  }

  const settingsPatches = {}
  const settingsSkippedKeys = {}
  for (const docId of BACKUP_SETTINGS_DOCS) {
    const backupDoc = backup?.settings?.[docId]
    if (!isPlainObject(backupDoc)) continue
    const currentDoc = current.settings?.[docId]
    const patch = {}
    const skipped = []
    for (const [key, value] of Object.entries(backupDoc)) {
      if (isPlainObject(currentDoc) && currentDoc[key] !== undefined) {
        skipped.push(key)
      } else {
        patch[key] = value
      }
    }
    if (Object.keys(patch).length > 0) settingsPatches[docId] = patch
    if (skipped.length > 0) settingsSkippedKeys[docId] = skipped
  }

  return {
    inquiriesToAdd,
    branchesToAdd,
    branchesExisting,
    settingsPatches,
    settingsSkippedKeys,
    membersInBackup: (backup?.members || []).length,
    customersInBackup: (backup?.customers || []).length,
  }
}
