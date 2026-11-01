import React, { useEffect, useState } from 'react'
import { useWorkspace } from './WorkspaceContext.jsx'
import {
  loadTerritories,
  validateTerritory,
} from '../utils/territories.js'

/**
 * #11 — Territory rules card (Team page, owner/admin only — the page
 * itself is already owner/admin-gated).
 *
 * A rule: service keyword → branch. New inquiries whose service
 * contains the keyword belong to that branch before routing, so the
 * rep is picked inside the branch. First match wins; a manager's own
 * branch always wins over territory.
 */
export default function TerritoryCard() {
  const { workspace, loading: wsLoading } = useWorkspace()
  const [rules, setRules] = useState([])
  const [branches, setBranches] = useState([])
  const [pattern, setPattern] = useState('')
  const [branch, setBranch] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  function territoriesRef() {
    const db = window.firebase?.firestore?.()
    if (!workspace || !db) return null
    return db
      .collection('users')
      .doc(workspace.ownerUid)
      .collection('settings')
      .doc('territories')
  }

  useEffect(() => {
    if (wsLoading || !workspace) return undefined
    const db = window.firebase?.firestore?.()
    if (!db) return undefined
    let cancelled = false
    loadTerritories(db, workspace.ownerUid).then(list => {
      if (!cancelled) setRules(list)
    })
    ;(async () => {
      try {
        const snap = await db
          .collection('users')
          .doc(workspace.ownerUid)
          .collection('settings')
          .doc('branches')
          .get()
        if (!cancelled) {
          setBranches(snap.exists ? snap.data()?.branches || [] : [])
        }
      } catch {
        if (!cancelled) setBranches([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [wsLoading, workspace])

  async function saveRules(next) {
    await territoriesRef().set({ territories: next }, { merge: true })
    setRules(next)
    setSaved(true)
  }

  async function handleAdd(event) {
    event.preventDefault()
    setError('')
    setSaved(false)
    const rule = {
      id: `${Date.now()}`,
      pattern: pattern.trim(),
      branch: branch.trim(),
    }
    const problem = validateTerritory(rule, rules)
    if (problem) {
      setError(problem)
      return
    }
    try {
      await saveRules([...rules, rule])
      setPattern('')
      setBranch('')
    } catch (err) {
      console.error('Territory save failed:', err)
      setError('Could not save — please try again.')
    }
  }

  async function handleDelete(id) {
    try {
      await saveRules(rules.filter(r => r.id !== id))
    } catch (err) {
      console.error('Territory delete failed:', err)
    }
  }

  return (
    <section className="settings-card">
      <div className="settings-card-header">
        <div>
          <span className="settings-label">TERRITORY</span>
          <h2>Territory rules</h2>
          <p>
            Service keyword → branch. A new inquiry whose service
            contains the keyword is routed inside that branch. First
            match wins. Note: members must carry the exact branch name
            in their profile for territory routing to reach them.
          </p>
        </div>
      </div>

      {rules.length === 0 ? (
        <p>No territory rules yet.</p>
      ) : (
        <ul>
          {rules.map(rule => (
            <li key={rule.id}>
              Service contains “{rule.pattern}” → {rule.branch}
              <button
                type="button"
                className="ghost-button"
                onClick={() => handleDelete(rule.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd}>
        <div className="settings-grid">
          <label>
            <span>Service keyword</span>
            <input
              value={pattern}
              onChange={e => setPattern(e.target.value)}
              placeholder="e.g. Hair"
            />
          </label>
          <label>
            <span>Branch</span>
            <select value={branch} onChange={e => setBranch(e.target.value)}>
              <option value="">—</option>
              {branches.map(b => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {error && <div className="form-error">{error}</div>}
        {saved && <p>Saved.</p>}
        <button type="submit" className="primary-button">
          Add territory rule
        </button>
      </form>
    </section>
  )
}
