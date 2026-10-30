import React, { useEffect, useState } from 'react'
import { useWorkspace } from './WorkspaceContext.jsx'

/**
 * Branches — batch 4 (enterprise Phase 2).
 *
 * Owners/admins create and rename the branches that the Team card's
 * branch field and the inquiry branch select draw from. Branches live
 * in one doc (users/{ownerUid}/settings/branches) so the existing
 * settings rules cover them: owner/admins write, managers read.
 *
 * Renaming a branch retags every inquiry, member and invite that
 * used the old name (batched writes) — otherwise renamed branches
 * would orphan rows into the admin-only unbranched default.
 * Deleting is refused while anything still uses the branch, with the
 * counts shown, so a delete can never silently hide leads.
 */

function slugifyBranch(name) {
  return (name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function BranchesCard() {
  const { workspace } = useWorkspace()
  const [branches, setBranches] = useState([])
  const [name, setName] = useState('')
  const [renamingId, setRenamingId] = useState('')
  const [renameValue, setRenameValue] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function db() {
    return window.firebase?.firestore?.()
  }

  function branchesRef() {
    return db()
      .collection('users')
      .doc(workspace.ownerUid)
      .collection('settings')
      .doc('branches')
  }

  async function reload() {
    if (!workspace) return
    try {
      const snap = await branchesRef().get()
      setBranches(snap.exists ? snap.data()?.branches || [] : [])
    } catch (e) {
      console.error('Branches load failed:', e)
      setBranches([])
    }
  }

  useEffect(() => {
    if (workspace) reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.ownerUid])

  async function saveBranches(next) {
    await branchesRef().set({ branches: next }, { merge: true })
    setBranches(next)
  }

  async function handleAdd(event) {
    event.preventDefault()
    setNotice('')
    setError('')
    const clean = name.trim()
    if (!clean) return
    const id = slugifyBranch(clean)
    if (!id) {
      setError('Enter a branch name with letters or numbers.')
      return
    }
    if (branches.some(b => b.id === id || b.name.toLowerCase() === clean.toLowerCase())) {
      setError('A branch with that name already exists.')
      return
    }
    setBusy(true)
    try {
      await saveBranches([...branches, { id, name: clean }])
      setName('')
      setNotice(`Branch "${clean}" added.`)
    } catch (e) {
      console.error('Branch add failed:', e)
      setError('Could not add the branch. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleRename(branch) {
    setNotice('')
    setError('')
    const clean = renameValue.trim()
    if (!clean || clean === branch.name) {
      setRenamingId('')
      return
    }
    if (branches.some(b => b.id !== branch.id && b.name.toLowerCase() === clean.toLowerCase())) {
      setError('A branch with that name already exists.')
      return
    }
    setBusy(true)
    try {
      const database = db()
      const ownerRef = database.collection('users').doc(workspace.ownerUid)
      // Retag every row that used the old branch name, so nothing is
      // orphaned into the admin-only default.
      const inquiriesSnap = await ownerRef
        .collection('inquiries')
        .where('branchId', '==', branch.name)
        .get()
      const membersSnap = await ownerRef
        .collection('members')
        .where('branchId', '==', branch.name)
        .get()
      const invitesSnap = await ownerRef
        .collection('invites')
        .where('branchId', '==', branch.name)
        .get()
      const updates = []
      inquiriesSnap.docs.forEach(d => updates.push({ ref: d.ref, data: { branchId: clean } }))
      membersSnap.docs.forEach(d => updates.push({ ref: d.ref, data: { branchId: clean } }))
      invitesSnap.docs.forEach(d => updates.push({ ref: d.ref, data: { branchId: clean } }))
      for (let i = 0; i < updates.length; i += 400) {
        const batch = database.batch()
        updates.slice(i, i + 400).forEach(u => batch.update(u.ref, u.data))
        await batch.commit()
      }
      const next = branches.map(b => (b.id === branch.id ? { ...b, name: clean } : b))
      await saveBranches(next)
      setRenamingId('')
      setNotice(
        `Branch renamed to "${clean}" (${updates.length} row${updates.length === 1 ? '' : 's'} retagged).`
      )
    } catch (e) {
      console.error('Branch rename failed:', e)
      setError('Could not rename the branch. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(branch) {
    setNotice('')
    setError('')
    setBusy(true)
    try {
      const database = db()
      const ownerRef = database.collection('users').doc(workspace.ownerUid)
      const [inquiriesSnap, membersSnap, invitesSnap] = await Promise.all([
        ownerRef.collection('inquiries').where('branchId', '==', branch.name).get(),
        ownerRef.collection('members').where('branchId', '==', branch.name).get(),
        ownerRef.collection('invites').where('branchId', '==', branch.name).get(),
      ])
      const used =
        inquiriesSnap.size + membersSnap.size + invitesSnap.size
      if (used > 0) {
        setError(
          `Cannot delete "${branch.name}" — it is still used by ${inquiriesSnap.size} inquiry${inquiriesSnap.size === 1 ? '' : 'ies'}, ${membersSnap.size} member${membersSnap.size === 1 ? '' : 's'} and ${invitesSnap.size} invite${invitesSnap.size === 1 ? '' : 's'}. Move those rows to another branch first.`
        )
        return
      }
      await saveBranches(branches.filter(b => b.id !== branch.id))
      setNotice(`Branch "${branch.name}" deleted.`)
    } catch (e) {
      console.error('Branch delete failed:', e)
      setError('Could not delete the branch. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="settings-card">
      <div className="settings-card-header">
        <div>
          <span className="settings-label">BRANCHES</span>
          <h2>Branches</h2>
          <p>
            Branches scope what Branch Managers see. The Team card's
            branch field and the inquiry branch select draw from this
            list. Renaming a branch retags its rows; deleting is
            refused while anything still uses it.
          </p>
        </div>
      </div>

      <form onSubmit={handleAdd}>
        <div className="settings-grid">
          <label className="settings-full">
            <span>New branch name</span>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Andheri"
            />
          </label>
        </div>
        {error && <div className="form-error">{error}</div>}
        {notice && <p>{notice}</p>}
        <div className="settings-save-row">
          <button type="submit" className="settings-save-button" disabled={busy}>
            {busy ? 'Saving…' : 'Add branch'}
          </button>
        </div>
      </form>

      {branches.length > 0 && (
        <div>
          <h3>Existing branches</h3>
          {branches.map(branch => (
            <div key={branch.id} className="team-row">
              {renamingId === branch.id ? (
                <>
                  <input
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    aria-label={`New name for ${branch.name}`}
                  />
                  <button type="button" onClick={() => handleRename(branch)} disabled={busy}>
                    Save
                  </button>
                  <button type="button" onClick={() => setRenamingId('')}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <strong>{branch.name}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setRenamingId(branch.id)
                      setRenameValue(branch.name)
                    }}
                  >
                    Rename
                  </button>
                  <button type="button" onClick={() => handleDelete(branch)} disabled={busy}>
                    Delete
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {branches.length === 0 && (
        <p>No branches yet. Add one above — until then, all rows are unbranched and visible to owners/admins only.</p>
      )}
    </section>
  )
}
