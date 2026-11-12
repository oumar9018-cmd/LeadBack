import React, { useEffect, useState } from 'react'
import { useWorkspace } from './WorkspaceContext.jsx'
import { canWriteSettings, roleLabel } from '../utils/workspace.js'
import { normalizeTargets } from '../utils/targets.js'

/**
 * Monthly targets (Settings card).
 *
 * Definitions live in one doc (users/{ownerUid}/settings/targets) so
 * the existing settings rules cover them — owners/admins write,
 * managers read. Reports reads the same doc and shows each rep's and
 * branch's month progress against these targets. The same targets
 * apply every month until they are changed. Progress counts
 * inquiries marked recovered in the current month (by recovery
 * date); blank or 0 means "no target".
 */
export default function TargetsCard() {
  const { workspace, loading: wsLoading, user } = useWorkspace()
  const [members, setMembers] = useState([])
  const [branchNames, setBranchNames] = useState([])
  const [repDrafts, setRepDrafts] = useState({})
  const [branchDrafts, setBranchDrafts] = useState({})
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const canWrite = canWriteSettings(workspace?.role)

  useEffect(() => {
    if (wsLoading || !workspace) return undefined
    const db = window.firebase?.firestore?.()
    if (!db) return undefined
    let cancelled = false
    ;(async () => {
      try {
        const base = db.collection('users').doc(workspace.ownerUid)
        const [membersSnap, branchesSnap, targetsSnap] = await Promise.all([
          base.collection('members').get().catch(() => null),
          base.collection('settings').doc('branches').get().catch(() => null),
          base.collection('settings').doc('targets').get().catch(() => null),
        ])
        if (cancelled) return
        setMembers(
          membersSnap
            ? membersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            : []
        )
        const branchList = branchesSnap?.exists
          ? branchesSnap.data()?.branches || []
          : []
        setBranchNames(
          branchList
            .map(b => (typeof b === 'string' ? b : b?.name || ''))
            .filter(Boolean)
        )
        const targets = normalizeTargets(
          targetsSnap?.exists ? targetsSnap.data() : {}
        )
        const toDrafts = map =>
          Object.fromEntries(
            Object.entries(map).map(([key, entry]) => [
              key,
              {
                revenue: entry.revenue ? String(entry.revenue) : '',
                count: entry.count ? String(entry.count) : '',
              },
            ])
          )
        setRepDrafts(toDrafts(targets.reps))
        setBranchDrafts(toDrafts(targets.branches))
        setLoaded(true)
      } catch (err) {
        console.error('Targets load failed:', err)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsLoading, workspace])

  function updateDraft(setter) {
    return (key, field, value) => {
      setSaved(false)
      setter(prev => ({
        ...prev,
        [key]: {
          ...(prev[key] || { revenue: '', count: '' }),
          [field]: value,
        },
      }))
    }
  }
  const updateRep = updateDraft(setRepDrafts)
  const updateBranch = updateDraft(setBranchDrafts)

  async function handleSave(event) {
    event.preventDefault()
    setError('')
    setSaved(false)
    const db = window.firebase?.firestore?.()
    if (!db || !workspace) return
    const toRaw = drafts =>
      Object.fromEntries(
        Object.entries(drafts).map(([key, d]) => [
          key,
          { revenue: Number(d.revenue) || 0, count: Number(d.count) || 0 },
        ])
      )
    try {
      await db
        .collection('users')
        .doc(workspace.ownerUid)
        .collection('settings')
        .doc('targets')
        .set(
          normalizeTargets({
            reps: toRaw(repDrafts),
            branches: toRaw(branchDrafts),
          })
        )
      setSaved(true)
    } catch (err) {
      console.error('Targets save failed:', err)
      setError('Could not save — please try again.')
    }
  }

  function targetInputs(drafts, key, onChange) {
    const d = drafts[key] || { revenue: '', count: '' }
    if (!canWrite) {
      return (
        <span>
          {d.revenue || d.count
            ? `Revenue ${d.revenue || '—'} · Recoveries ${d.count || '—'} per month`
            : 'No target set'}
        </span>
      )
    }
    return (
      <>
        <label>
          <span>Revenue / month</span>
          <input
            type="number"
            min="0"
            value={d.revenue}
            onChange={e => onChange(key, 'revenue', e.target.value)}
            placeholder="No target"
          />
        </label>
        <label>
          <span>Recoveries / month</span>
          <input
            type="number"
            min="0"
            value={d.count}
            onChange={e => onChange(key, 'count', e.target.value)}
            placeholder="No target"
          />
        </label>
      </>
    )
  }

  const ownerLabel =
    workspace?.role === 'owner'
      ? user?.email || 'Workspace owner'
      : 'Workspace owner'

  return (
    <section className="settings-card">
      <div className="settings-card-header">
        <div>
          <span className="settings-label">MONTHLY TARGETS</span>
          <h2>Monthly targets</h2>
          <p>
            Set a monthly recovered-revenue and recovery-count target
            per person and per branch. Reports shows this month&rsquo;s
            progress against them, plus a pace estimate for the month.
            The same targets apply every month until you change them,
            and blank means no target.
          </p>
        </div>
      </div>

      {!loaded ? (
        <p>Loading targets…</p>
      ) : (
        <form onSubmit={handleSave}>
          <h3>People</h3>
          <ul>
            {workspace?.ownerUid && (
              <li key={workspace.ownerUid}>
                {ownerLabel} (Owner)
                <div className="settings-grid">
                  {targetInputs(repDrafts, workspace.ownerUid, updateRep)}
                </div>
              </li>
            )}
            {members.map(member => (
              <li key={member.id}>
                {member.email || member.id}
                {member.role ? ` (${roleLabel(member.role)})` : ''}
                <div className="settings-grid">
                  {targetInputs(repDrafts, member.id, updateRep)}
                </div>
              </li>
            ))}
          </ul>
          {members.length === 0 && (
            <p>No team members yet — targets for people appear once you invite your team.</p>
          )}

          {branchNames.length > 0 && (
            <>
              <h3>Branches</h3>
              <ul>
                {branchNames.map(name => (
                  <li key={name}>
                    {name}
                    <div className="settings-grid">
                      {targetInputs(branchDrafts, name, updateBranch)}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          {canWrite ? (
            <>
              {error && <div className="form-error">{error}</div>}
              {saved && <p>Saved.</p>}
              <button type="submit" className="primary-button">
                Save targets
              </button>
            </>
          ) : (
            <p>Only owners and admins can change monthly targets.</p>
          )}
        </form>
      )}
    </section>
  )
}
