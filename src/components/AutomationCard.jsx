import React, { useEffect, useState } from 'react'
import { useWorkspace } from './WorkspaceContext.jsx'
import { canWriteSettings } from '../utils/workspace.js'
import { loadAutomationDefaults } from '../utils/automation.js'

/**
 * #3 — Automation defaults card (Settings).
 *
 * One workspace default: automatically schedule a follow-up for new
 * inquiries that no rule scheduled one for. 0 = off. Stored in
 * users/{ownerUid}/settings/automation (same settings-doc pattern as
 * branches/custom fields/rules: owner/admin write, managers read).
 */
export default function AutomationCard() {
  const { workspace, loading: wsLoading } = useWorkspace()
  const [days, setDays] = useState(0)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const canWrite = canWriteSettings(workspace?.role)

  function automationRef() {
    const db = window.firebase?.firestore?.()
    if (!workspace || !db) return null
    return db
      .collection('users')
      .doc(workspace.ownerUid)
      .collection('settings')
      .doc('automation')
  }

  useEffect(() => {
    if (wsLoading || !workspace) return undefined
    const db = window.firebase?.firestore?.()
    if (!db) return undefined
    let cancelled = false
    loadAutomationDefaults(db, workspace.ownerUid).then(defaults => {
      if (!cancelled) setDays(defaults.autoFollowupDays)
    })
    return () => {
      cancelled = true
    }
  }, [wsLoading, workspace])

  async function handleSave(event) {
    event.preventDefault()
    setError('')
    setSaved(false)
    const value = Number(days)
    if (!Number.isInteger(value) || value < 0 || value > 30) {
      setError('Days must be a whole number from 0 to 30.')
      return
    }
    try {
      await automationRef().set({ autoFollowupDays: value }, { merge: true })
      setSaved(true)
    } catch (err) {
      console.error('Automation defaults save failed:', err)
      setError('Could not save — please try again.')
    }
  }

  return (
    <section className="settings-card">
      <div className="settings-card-header">
        <div>
          <span className="settings-label">AUTOMATION</span>
          <h2>Automation defaults</h2>
          <p>
            New inquiries with no rule-scheduled follow-up automatically
            get one after this many days (10:00 AM). Rules always win:
            if a rule already scheduled a follow-up, this default does
            nothing. Set 0 to turn it off.
          </p>
        </div>
      </div>

      {canWrite ? (
        <form onSubmit={handleSave}>
          <div className="settings-grid">
            <label>
              <span>Auto follow-up after (days, 0 = off)</span>
              <input
                type="number"
                min="0"
                max="30"
                value={days}
                onChange={e => setDays(e.target.value)}
              />
            </label>
          </div>
          {error && <div className="form-error">{error}</div>}
          {saved && <p>Saved.</p>}
          <button type="submit" className="primary-button">
            Save defaults
          </button>
        </form>
      ) : (
        <p>
          Auto follow-up: {days === 0 ? 'off' : `after ${days} days`}.
          Only owners and admins can change automation defaults.
        </p>
      )}
    </section>
  )
}
