/**
 * Territories — branch groups for reporting (Round 6, pure helpers
 * + loader).
 *
 * A territory groups existing branches under one region name
 * ("North", "South") so Reports can roll the whole region up the
 * same way it rolls a branch up. A branch belongs to at most one
 * territory; branches in no group report under "No territory".
 *
 * NOT the same feature as the territory ROUTING rules
 * (utils/territories.js, #11 — service keyword → branch, stored in
 * settings/territories). Groups live in their OWN doc,
 * settings/territoryGroups, so the two never overwrite each other:
 *
 *   { groups: [{ id, name, branches: [branchName, ...] }] }
 *
 * Branch values are branch NAMES — the convention inquiries and
 * members already carry. The generic settings rules cover the doc
 * (owners/admins write, managers read), so no firestore.rules
 * change is needed.
 *
 * Grouping is by name only: renaming a branch in the Branches card
 * does not retag groups (the group keeps the old name until it is
 * edited, and that branch then reports under "No territory") —
 * stated in the Settings card copy.
 */
import { aggregateByBranch, UNASSIGNED_BRANCH_ID } from './reports.js'

export const MAX_TERRITORY_GROUPS = 50
export const NO_TERRITORY_ID = ''
export const NO_TERRITORY_LABEL = 'No territory'

function slugifyGroup(name) {
  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function cleanBranchList(raw) {
  const out = []
  if (!Array.isArray(raw)) return out
  for (const value of raw) {
    const name = typeof value === 'string' ? value.trim() : ''
    if (name && !out.includes(name)) out.push(name)
  }
  return out
}

/**
 * Validate a raw settings/territoryGroups doc into a clean group
 * list: [{ id, name, branches }]. Junk is dropped, never guessed:
 * nameless groups go, duplicate names keep the first, and a branch
 * claimed by an earlier group is removed from later groups (a
 * branch lives in at most one territory; first group wins).
 */
export function normalizeTerritoryGroups(raw) {
  const source =
    raw && typeof raw === 'object' && !Array.isArray(raw)
      ? raw.groups
      : raw
  const list = Array.isArray(source) ? source : []
  const groups = []
  const seenNames = new Set()
  const claimed = new Set()
  for (const entry of list) {
    if (!entry || typeof entry !== 'object') continue
    const name = typeof entry.name === 'string' ? entry.name.trim() : ''
    if (!name) continue
    const key = name.toLowerCase()
    if (seenNames.has(key)) continue
    const branches = cleanBranchList(entry.branches).filter(branch => {
      if (claimed.has(branch)) return false
      claimed.add(branch)
      return true
    })
    seenNames.add(key)
    groups.push({
      id:
        typeof entry.id === 'string' && entry.id
          ? entry.id
          : slugifyGroup(name),
      name,
      branches,
    })
    if (groups.length >= MAX_TERRITORY_GROUPS) break
  }
  return groups
}

/** Validate one group against the existing list. Returns '' when
 * valid, else the plain-words error (TerritoryCard convention). */
export function validateTerritoryGroup(group, existing = []) {
  const name = typeof group?.name === 'string' ? group.name.trim() : ''
  if (!name) return 'Territory name is required.'
  if (
    (Array.isArray(existing) ? existing : []).some(
      other =>
        other.id !== group.id &&
        other.name.toLowerCase() === name.toLowerCase()
    )
  ) {
    return 'A territory with that name already exists.'
  }
  return ''
}

/** Map of branch name → territory name, from normalized groups. */
export function branchTerritoryMap(groups) {
  const map = new Map()
  for (const group of Array.isArray(groups) ? groups : []) {
    for (const branch of group?.branches || []) {
      if (!map.has(branch)) map.set(branch, group.name)
    }
  }
  return map
}

/** The territory name a branch belongs to, or '' (No territory). */
export function territoryNameForBranch(groups, branchName) {
  if (!branchName) return NO_TERRITORY_ID
  return branchTerritoryMap(groups).get(branchName) || NO_TERRITORY_ID
}

/**
 * Per-territory rollup with exactly the branch-rollup metrics
 * (reports.js): one row per defined territory — even at zero —
 * plus a trailing "No territory" row when inquiries exist whose
 * branch is in no group (or who have no branch):
 *   { territoryId, territory, branches, isUnassigned, total, open,
 *     recovered, lost, recoveryRate, recoveredRevenue }
 *
 * `branchNames` (every branch name in the workspace, optional) only
 * feeds the No-territory row's `branches` list — the branch names
 * that belong to no group. Grouping itself follows the inquiries.
 */
export function aggregateByTerritory(inquiries, groups, branchNames = []) {
  const list = Array.isArray(groups) ? groups : []
  const map = branchTerritoryMap(list)
  const remapped = (Array.isArray(inquiries) ? inquiries : []).map(
    item => ({
      ...item,
      branchId: map.get(item?.branchId || '') || UNASSIGNED_BRANCH_ID,
    })
  )
  const rows = aggregateByBranch(
    remapped,
    list.map(group => group.name)
  )
  const groupByName = new Map(list.map(group => [group.name, group]))
  const ungrouped = (Array.isArray(branchNames) ? branchNames : []).filter(
    name => name && !map.has(name)
  )
  return rows.map(row => {
    if (row.isUnassigned) {
      return {
        territoryId: NO_TERRITORY_ID,
        territory: NO_TERRITORY_LABEL,
        branches: ungrouped,
        isUnassigned: true,
        total: row.total,
        open: row.open,
        recovered: row.recovered,
        lost: row.lost,
        recoveryRate: row.recoveryRate,
        recoveredRevenue: row.recoveredRevenue,
      }
    }
    const group = groupByName.get(row.branchId)
    return {
      territoryId: group?.id || slugifyGroup(row.branchId),
      territory: row.branch,
      branches: group ? [...group.branches] : [row.branchId],
      isUnassigned: false,
      total: row.total,
      open: row.open,
      recovered: row.recovered,
      lost: row.lost,
      recoveryRate: row.recoveryRate,
      recoveredRevenue: row.recoveredRevenue,
    }
  })
}

/** Load territory groups (settings/territoryGroups doc). */
export async function loadTerritoryGroups(db, ownerUid) {
  if (!db || !ownerUid) return []
  try {
    const snap = await db
      .collection('users')
      .doc(ownerUid)
      .collection('settings')
      .doc('territoryGroups')
      .get()
    if (!snap.exists) return []
    return normalizeTerritoryGroups(snap.data() || {})
  } catch (error) {
    console.error('Territory groups load failed:', error)
    return []
  }
}
