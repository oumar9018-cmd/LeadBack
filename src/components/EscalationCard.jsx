import React, { useEffect, useState } from 'react'
import { useWorkspace } from './WorkspaceContext.jsx'
import { canWriteSettings } from '../utils/workspace.js'
import {
  DEFAULT_ESCALATION_CONFIG,
  loadEscalationSettings,
} from '../utils/escalation.js'

/**
 * Auto-escalation card (Settings).
 *
 * Opt-in automation: OFF by default. When on, the automation sweep
 * runs when an owner, admin or branch manager opens the app, flags
 * inquiries whose follow-up is overdue (or which have breached the
 * SLA), and — when reassignment is on — moves them to the branch
 * manager for their branch, or to the workspace owner. Stored in
 * users/{ownerUid}/settings/escalation (same settings-doc pattern:
 * owner/admin write, managers read).
 */
export default function EscalationCard() {
  const { workspace, loading: wsLoading } = useWorkspace()
  const [enabled, setEnabled] = useState(DEFAULT_ESCALATION_CONFIG.enabled)
  const [overdueDays, setOverdueDays] = useState(
    DEFAULT_ESCALATION_CONFIG.overdueDays
  )
  const [includeSlaBreach, setIncludeSlaBreach] = useState(
    DEFAULT_ESCALATION_CONFIG.includeSlaBreach
  )
  const [reassign, setReassign] = useState(DEFAULT_ESCALATION_CONFIG.reassign)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const canWrite = canWriteSettings(workspace?.role)

  function escalationRef() {
    const db = window.firebase?.firestore?.()
    if (!workspace || !db) return null
    return db
      .collection('users')
      .doc(workspace.ownerUid)
      .collection('settings')
      .doc('escalation')
  }

  useEffect(() => {
    if (wsLoading || !workspace) return undefined
    const db = window.firebase?.firestore?.()
    if (!db) return undefined
    let cancelled = false
    loadEscalationSettings(db, workspace.ownerUid).then(settings => {
      if (cancelled) return
      setEnabled(settings.enabled)
      setOverdueDays(settings.overdueDays)
      setIncludeSlaBreach(settings.includeSlaBreach)
      setReassign(settings.reassign)
    })
    return () => {
      cancelled = true
    }
  }, [wsLoading, workspace])

  async function handleSave(event) {
    event.preventDefault()
    setError('')
    setSaved(false)
    const value = Number(overdueDays)
    if (!Number.isInteger(value) || value < 1 || value > 30) {
      setError('Overdue days must be a whole number from 1 to 30.')
      return
    }
    try {
      await escalationRef().set(
        {
          enabled: Boolean(enabled),
          overdueDays: value,
          includeSlaBreach: Boolean(includeSlaBreach),
          reassign: Boolean(reassign),
        },
        { merge: true }
      )
      setSaved(true)
    } catch (err) {
      console.error('Escalation save failed:', err)
      setError('Could not save — please try again.')
    }
  }

  return (
    <section className="settings-card">
      <div className="settings-card-header">
        <div>
          <span className="settings-label">ESCALATION</span>
          <h2>Auto-escalation</h2>
          <p>
            This automation is off by default. When it is on, the sweep
            runs when an owner, admin or branch manager opens the app:
            inquiries whose follow-up has been overdue too long (or
            which have breached the SLA, when included) are flagged as
            escalated, and reassignments are recorded in the Activity
            log. Nothing is ever sent to customers.
          </p>
        </div>
      </div>

      {canWrite ? (
        <form onSubmit={handleSave}>
          <div className="settings-grid">
            <label>
              <span>Enable auto-escalation</span>
              <input
                type="checkbox"
                checked={enabled}
                onChange={e => setEnabled(e.target.checked)}
              />
            </label>
            <label>
              <span>Escalate follow-ups overdue by (days, 1–30)</span>
              <input
                type="number"
                min="1"
                max="30"
                value={overdueDays}
                onChange={e => setOverdueDays(e.target.value)}
              />
            </label>
            <label>
              <span>Include SLA breaches</span>
              <input
                type="checkbox"
                checked={includeSlaBreach}
                onChange={e => setIncludeSlaBreach(e.target.checked)}
              />
            </label>
            <label>
              <span>Reassign to branch manager (or owner)</span>
              <input
                type="checkbox"
                checked={reassign}
                onChange={e => setReassign(e.target.checked)}
              />
            </label>
          </div>
          {error && <div className="form-error">{error}</div>}
          {saved && <p>Saved.</p>}
          <button type="submit" className="primary-button">
            Save escalation
          </button>
        </form>
      ) : (
        <p>
          Auto-escalation: {enabled ? 'on' : 'off'}
          {enabled
            ? ` — follow-ups overdue by ${overdueDays} ${
                Number(overdueDays) === 1 ? 'day' : 'days'
              }${includeSlaBreach ? ', including SLA breaches' : ''}${
                reassign
                  ? ', reassigned to the branch manager (or owner)'
                  : ', flagged only (no reassignment)'
              }`
            : ''}
          . Only owners and admins can change escalation settings.
        </p>
      )}
    </section>
  )
}
