import React, { useEffect, useState } from 'react'
import { useWorkspace } from './WorkspaceContext.jsx'
import { canWriteSettings } from '../utils/workspace.js'
import {
  normalizeTerritoryGroups,
  validateTerritoryGroup,
} from '../utils/territoryGroups.js'

/**
 * Territories — branch groups for reporting (Round 6).
 *
 * A territory groups existing branches under one region name so
 * Reports can roll the region up like a branch. Definitions live in
 * one doc (users/{ownerUid}/settings/territoryGroups) so the
 * existing settings rules cover them: owners/admins write, managers
 * read (they see the groups as text below).
 *
 * This is NOT the territory routing rules card (Team page): those
 * assign new inquiries to a branch by service keyword. These groups
 * only change how Reports adds branches up — they never move a lead.
 */
export default function TerritoryGroupsCard() {
  const { workspace, loading: wsLoading } = useWorkspace()
  const [groups, setGroups] = useState([])
  const [branchNames, setBranchNames] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [renamingId, setRenamingId] = useState('')
  const [renameValue, setRenameValue] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const canWrite = canWriteSettings(workspace?.role)

  function db() {
    return window.firebase?.firestore?.()
  }

  function groupsRef() {
    return db()
      .collection('users')
      .doc(workspace.ownerUid)
      .collection('settings')
      .doc('territoryGroups')
  }

  async function reload() {
    if (!workspace) return
    const database = db()
    if (!database) return
    try {
      const base = database.collection('users').doc(workspace.ownerUid)
      const [groupsSnap, branchesSnap] = await Promise.all([
        base.collection('settings').doc('territoryGroups').get().catch(() => null),
        base.collection('settings').doc('branches').get().catch(() => null),
      ])
      setGroups(
        normalizeTerritoryGroups(groupsSnap?.exists ? groupsSnap.data() : {})
      )
      const branchList = branchesSnap?.exists
        ? branchesSnap.data()?.branches || []
        : []
      setBranchNames(
        branchList
          .map(b => (typeof b === 'string' ? b : b?.name || ''))
          .filter(Boolean)
      )
    } catch (e) {
      console.error('Territory groups load failed:', e)
      setGroups([])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!wsLoading && workspace) reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsLoading, workspace?.ownerUid])

  async function saveGroups(next) {
    const normalized = normalizeTerritoryGroups({ groups: next })
    await groupsRef().set({ groups: normalized }, { merge: true })
    setGroups(normalized)
    return normalized
  }

  async function handleAdd(event) {
    event.preventDefault()
    setNotice('')
    setError('')
    const clean = name.trim()
    const problem = validateTerritoryGroup({ name: clean }, groups)
    if (problem) {
      setError(problem)
      return
    }
    setBusy(true)
    try {
      await saveGroups([...groups, { id: '', name: clean, branches: [] }])
      setName('')
      setNotice(`Territory "${clean}" added. Tick its branches below.`)
    } catch (e) {
      console.error('Territory add failed:', e)
      setError('Could not add the territory. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleRename(group) {
    setNotice('')
    setError('')
    const clean = renameValue.trim()
    if (!clean || clean === group.name) {
      setRenamingId('')
      return
    }
    const problem = validateTerritoryGroup({ id: group.id, name: clean }, groups)
    if (problem) {
      setError(problem)
      return
    }
    setBusy(true)
    try {
      await saveGroups(
        groups.map(g => (g.id === group.id ? { ...g, name: clean } : g))
      )
      setRenamingId('')
      setNotice(`Territory renamed to "${clean}".`)
    } catch (e) {
      console.error('Territory rename failed:', e)
      setError('Could not rename the territory. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(group) {
    setNotice('')
    setError('')
    setBusy(true)
    try {
      await saveGroups(groups.filter(g => g.id !== group.id))
      setNotice(
        `Territory "${group.name}" deleted. Its branches now report under "No territory".`
      )
    } catch (e) {
      console.error('Territory delete failed:', e)
      setError('Could not delete the territory. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleToggleBranch(group, branchName, checked) {
    setNotice('')
    setError('')
    setBusy(true)
    try {
      const next = groups.map(g => {
        if (g.id !== group.id) return g
        const branches = checked
          ? [...g.branches, branchName]
          : g.branches.filter(b => b !== branchName)
        return { ...g, branches }
      })
      await saveGroups(next)
    } catch (e) {
      console.error('Territory branch toggle failed:', e)
      setError('Could not save that change. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  // Which territory (if any) already claims each branch — a branch
  // can only be ticked in one group.
  const claimedBy = new Map()
  for (const group of groups) {
    for (const branch of group.branches) claimedBy.set(branch, group)
  }

  return (
    <section className="settings-card">
      <div className="settings-card-header">
        <div>
          <span className="settings-label">TERRITORIES</span>
          <h2>Territories</h2>
          <p>
            Group branches into territories (regions) and Reports gains
            a Territories view that rolls each region up — totals, open,
            recovered and lost inquiries, recovery rate and recovered
            revenue — the same numbers as the branch view. A branch can
            belong to one territory; branches in none report under
            &ldquo;No territory&rdquo;. This only changes reporting: it
            never moves a lead, and it is separate from the territory
            routing rules on the Team page. If you rename a branch, update
            its territory here too — groups match branches by name.
          </p>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}
      {notice && <p>{notice}</p>}

      {canWrite && (
        <form onSubmit={handleAdd}>
          <div className="settings-grid">
            <label className="settings-full">
              <span>New territory name</span>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. North"
              />
            </label>
          </div>
          <div className="settings-save-row">
            <button type="submit" className="settings-save-button" disabled={busy}>
              {busy ? 'Saving…' : 'Add territory'}
            </button>
          </div>
        </form>
      )}

      {loading && <p>Loading…</p>}

      {!loading && groups.length === 0 && (
        <p>
          No territories yet.
          {branchNames.length === 0
            ? ' Add branches first (Team page), then group them here.'
            : ' Add one above, then tick the branches that belong to it.'}
        </p>
      )}

      {!loading &&
        groups.map(group => (
          <div key={group.id}>
            <h3>
              {renamingId === group.id && canWrite ? (
                <>
                  <input
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    aria-label={`New name for ${group.name}`}
                  />{' '}
                  <button type="button" onClick={() => handleRename(group)} disabled={busy}>
                    Save
                  </button>{' '}
                  <button type="button" onClick={() => setRenamingId('')}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  {group.name}{' '}
                  {canWrite && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setRenamingId(group.id)
                          setRenameValue(group.name)
                        }}
                      >
                        Rename
                      </button>{' '}
                      <button
                        type="button"
                        onClick={() => handleDelete(group)}
                        disabled={busy}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </>
              )}
            </h3>
            {branchNames.length === 0 ? (
              <p>No branches exist yet, so there is nothing to group.</p>
            ) : canWrite ? (
              <div className="settings-grid">
                {branchNames.map(branchName => {
                  const owner = claimedBy.get(branchName)
                  const mine = owner?.id === group.id
                  return (
                    <label key={branchName}>
                      <input
                        type="checkbox"
                        checked={mine}
                        disabled={busy || (Boolean(owner) && !mine)}
                        onChange={e =>
                          handleToggleBranch(group, branchName, e.target.checked)
                        }
                      />{' '}
                      <span>
                        {branchName}
                        {owner && !mine ? ` (in ${owner.name})` : ''}
                      </span>
                    </label>
                  )
                })}
              </div>
            ) : (
              <p>
                {group.branches.length > 0
                  ? group.branches.join(', ')
                  : 'No branches in this territory yet.'}
              </p>
            )}
          </div>
        ))}

      {!loading && !canWrite && groups.length > 0 && (
        <p>View-only for your role — only owners and admins can change territories.</p>
      )}
    </section>
  )
}
