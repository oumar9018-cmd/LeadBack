import React, { useEffect, useState } from 'react'
import { useWorkspace } from './WorkspaceContext.jsx'

/**
 * #12 — Routing mode card (Team page, owner/admin only — the page
 * itself is already owner/admin-gated).
 *
 * Balanced (default, today's behaviour): least lifetime routed count
 * first, rotation-pointer tie-break. Workload: fewest currently OPEN
 * inquiries first (status new/followup/replied), same tie-break, with
 * an optional capacity cap — a rep at capacity is skipped unless every
 * candidate is at capacity (routing never leaves a row unassigned
 * when candidates exist). Stored in settings/routing.
 */
export default function RoutingCard() {
  const { workspace, loading: wsLoading } = useWorkspace()
  const [mode, setMode] = useState('balanced')
  const [capacity, setCapacity] = useState(0)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  function routingRef() {
    const db = window.firebase?.firestore?.()
    if (!workspace || !db) return null
    return db
      .collection('users')
      .doc(workspace.ownerUid)
      .collection('settings')
      .doc('routing')
  }

  useEffect(() => {
    if (wsLoading || !workspace) return undefined
    const ref = routingRef()
    if (!ref) return undefined
    let cancelled = false
    ;(async () => {
      try {
        const snap = await ref.get()
        if (!cancelled && snap.exists) {
          const data = snap.data() || {}
          if (data.mode === 'workload') setMode('workload')
          const cap = Number(data.capacity)
          if (Number.isInteger(cap) && cap >= 0) setCapacity(cap)
        }
      } catch (err) {
        console.error('Routing settings load failed:', err)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsLoading, workspace])

  async function handleSave(event) {
    event.preventDefault()
    setError('')
    setSaved(false)
    const cap = Number(capacity)
    if (!Number.isInteger(cap) || cap < 0 || cap > 500) {
      setError('Capacity must be a whole number from 0 to 500 (0 = unlimited).')
      return
    }
    try {
      await routingRef().set({ mode, capacity: cap }, { merge: true })
      setSaved(true)
    } catch (err) {
      console.error('Routing settings save failed:', err)
      setError('Could not save — please try again.')
    }
  }

  return (
    <section className="settings-card">
      <div className="settings-card-header">
        <div>
          <span className="settings-label">ROUTING</span>
          <h2>Routing mode</h2>
          <p>
            Balanced spreads new leads evenly over time. Workload sends
            each new lead to the rep with the fewest open leads right
            now, and skips reps at capacity when others have room.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="settings-grid">
          <label>
            <span>Mode</span>
            <select value={mode} onChange={e => setMode(e.target.value)}>
              <option value="balanced">Balanced (rotation)</option>
              <option value="workload">Workload (fewest open leads)</option>
            </select>
          </label>
          <label>
            <span>Capacity per rep, open leads (0 = unlimited)</span>
            <input
              type="number"
              min="0"
              max="500"
              value={capacity}
              onChange={e => setCapacity(e.target.value)}
            />
          </label>
        </div>
        {error && <div className="form-error">{error}</div>}
        {saved && <p>Saved.</p>}
        <button type="submit" className="primary-button">
          Save routing
        </button>
      </form>
    </section>
  )
}
