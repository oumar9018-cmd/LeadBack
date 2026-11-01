import React, { useEffect, useState } from 'react'
import { useWorkspace } from './WorkspaceContext.jsx'
import { canWriteSettings } from '../utils/workspace.js'
import { loadSlaSettings } from '../utils/sla.js'

/**
 * #8 — SLA targets card (Settings).
 *
 * One target: first response within N hours for new inquiries. 0 =
 * SLA off. Stored in users/{ownerUid}/settings/sla (same settings-doc
 * pattern: owner/admin write, managers read).
 */
export default function SlaCard() {
  const { workspace, loading: wsLoading } = useWorkspace()
  const [hours, setHours] = useState(24)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const canWrite = canWriteSettings(workspace?.role)

  function slaRef() {
    const db = window.firebase?.firestore?.()
    if (!workspace || !db) return null
    return db
      .collection('users')
      .doc(workspace.ownerUid)
      .collection('settings')
      .doc('sla')
  }

  useEffect(() => {
    if (wsLoading || !workspace) return undefined
    const db = window.firebase?.firestore?.()
    if (!db) return undefined
    let cancelled = false
    loadSlaSettings(db, workspace.ownerUid).then(settings => {
      if (!cancelled) setHours(settings.firstResponseHours)
    })
    return () => {
      cancelled = true
    }
  }, [wsLoading, workspace])

  async function handleSave(event) {
    event.preventDefault()
    setError('')
    setSaved(false)
    const value = Number(hours)
    if (!Number.isInteger(value) || value < 0 || value > 720) {
      setError('Hours must be a whole number from 0 to 720 (0 = off).')
      return
    }
    try {
      await slaRef().set({ firstResponseHours: value }, { merge: true })
      setSaved(true)
    } catch (err) {
      console.error('SLA save failed:', err)
      setError('Could not save — please try again.')
    }
  }

  return (
    <section className="settings-card">
      <div className="settings-card-header">
        <div>
          <span className="settings-label">SLA</span>
          <h2>SLA targets</h2>
          <p>
            First response: a new inquiry breaches when it is still
            unanswered after this many hours. The dashboard shows live
            breaches, at-risk rows, and breach age buckets.
          </p>
        </div>
      </div>

      {canWrite ? (
        <form onSubmit={handleSave}>
          <div className="settings-grid">
            <label>
              <span>First response within (hours, 0 = off)</span>
              <input
                type="number"
                min="0"
                max="720"
                value={hours}
                onChange={e => setHours(e.target.value)}
              />
            </label>
          </div>
          {error && <div className="form-error">{error}</div>}
          {saved && <p>Saved.</p>}
          <button type="submit" className="primary-button">
            Save SLA
          </button>
        </form>
      ) : (
        <p>
          First-response target:{' '}
          {hours === 0 ? 'off' : `within ${hours} hours`}. Only owners
          and admins can change SLA targets.
        </p>
      )}
    </section>
  )
}
