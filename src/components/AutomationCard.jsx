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
  const [rescheduleDays, setRescheduleDays] = useState(0)
  const [rescheduleMax, setRescheduleMax] = useState(3)
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
      if (!cancelled) {
        setDays(defaults.autoFollowupDays)
        setRescheduleDays(defaults.autoRescheduleDays ?? 0)
        setRescheduleMax(defaults.autoRescheduleMax ?? 3)
      }
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
    const rescheduleValue = Number(rescheduleDays)
    if (
      !Number.isInteger(rescheduleValue) ||
      rescheduleValue < 0 ||
      rescheduleValue > 14
    ) {
      setError('Auto-reschedule days must be a whole number from 0 to 14 (0 = off).')
      return
    }
    const maxValue = Number(rescheduleMax)
    if (!Number.isInteger(maxValue) || maxValue < 1 || maxValue > 10) {
      setError('Auto-reschedule max must be a whole number from 1 to 10.')
      return
    }
    try {
      await automationRef().set(
        {
          autoFollowupDays: value,
          autoRescheduleDays: rescheduleValue,
          autoRescheduleMax: maxValue,
        },
        { merge: true }
      )
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
            nothing. Set 0 to turn it off. Missed follow-ups can also be
            auto-rescheduled: when the sweep runs, a follow-up whose
            date has passed is moved forward by the reschedule days
            below, up to the max number of times per inquiry.
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
            <label>
              <span>Auto-reschedule missed follow-ups after (days, 0 = off)</span>
              <input
                type="number"
                min="0"
                max="14"
                value={rescheduleDays}
                onChange={e => setRescheduleDays(e.target.value)}
              />
            </label>
            <label>
              <span>Auto-reschedule max times per inquiry (1–10)</span>
              <input
                type="number"
                min="1"
                max="10"
                value={rescheduleMax}
                onChange={e => setRescheduleMax(e.target.value)}
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
          Auto-reschedule:{' '}
          {rescheduleDays === 0
            ? 'off'
            : `missed follow-ups moved ${rescheduleDays} days forward, up to ${rescheduleMax} times per inquiry`}
          . Only owners and admins can change automation defaults.
        </p>
      )}
    </section>
  )
}
