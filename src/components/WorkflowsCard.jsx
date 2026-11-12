import React, { useEffect, useState } from 'react'
import { useWorkspace } from './WorkspaceContext.jsx'
import { canWriteSettings } from '../utils/workspace.js'
import {
  MAX_WORKFLOW_RULES,
  WORKFLOW_ACTIONS,
  WORKFLOW_TRIGGERS,
  loadWorkflowSettings,
  normalizeWorkflowRule,
} from '../utils/workflows.js'

/**
 * Workflow automations card (Settings) — Round 3.
 *
 * Opt-in automation: the master switch is OFF by default and every
 * rule has its own switch. Rules are time-based (a new inquiry left
 * waiting, an inquiry gone stale, an SLA breach) with one action
 * each (assign to the branch manager/owner, assign to a member,
 * create today's follow-up task, or flag as priority). They run in
 * the app-open automation sweep — see AutomationSweep.jsx — never
 * on a server schedule, and nothing is ever sent to customers.
 * Stored in users/{ownerUid}/settings/workflows (same settings-doc
 * pattern: owner/admin write, managers read).
 */
export default function WorkflowsCard() {
  const { workspace, loading: wsLoading } = useWorkspace()
  const [enabled, setEnabled] = useState(false)
  const [rules, setRules] = useState([])
  const [members, setMembers] = useState([])
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const canWrite = canWriteSettings(workspace?.role)

  function workflowsRef() {
    const db = window.firebase?.firestore?.()
    if (!workspace || !db) return null
    return db
      .collection('users')
      .doc(workspace.ownerUid)
      .collection('settings')
      .doc('workflows')
  }

  useEffect(() => {
    if (wsLoading || !workspace) return undefined
    const db = window.firebase?.firestore?.()
    if (!db) return undefined
    let cancelled = false
    loadWorkflowSettings(db, workspace.ownerUid).then(settings => {
      if (cancelled) return
      setEnabled(settings.enabled)
      setRules(settings.rules)
    })
    ;(async () => {
      try {
        const membersSnap = await db
          .collection('users')
          .doc(workspace.ownerUid)
          .collection('members')
          .get()
        if (!cancelled) {
          setMembers(
            membersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          )
        }
      } catch (err) {
        console.error('Workflow members load failed:', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [wsLoading, workspace])

  function updateRule(id, patch) {
    setRules(current =>
      current.map(rule => (rule.id === id ? { ...rule, ...patch } : rule))
    )
    setSaved(false)
  }

  function addRule() {
    if (rules.length >= MAX_WORKFLOW_RULES) return
    setRules(current => [
      ...current,
      {
        id: `wf-${Date.now()}-${current.length}`,
        name: '',
        enabled: true,
        trigger: 'new_inquiry',
        hours: 4,
        action: 'assign_manager',
        assignTo: '',
      },
    ])
    setSaved(false)
  }

  function removeRule(id) {
    setRules(current => current.filter(rule => rule.id !== id))
    setSaved(false)
  }

  async function handleSave(event) {
    event.preventDefault()
    setError('')
    setSaved(false)
    const cleaned = []
    for (const rule of rules) {
      if (rule.trigger !== 'sla_breach') {
        const hours = Number(rule.hours)
        if (!Number.isInteger(hours) || hours < 1 || hours > 720) {
          setError('Rule hours must be a whole number from 1 to 720.')
          return
        }
      }
      if (rule.action === 'assign_member' && !rule.assignTo) {
        setError('A rule that assigns to a team member needs a member picked.')
        return
      }
      const normalized = normalizeWorkflowRule(rule)
      if (!normalized) {
        setError('One rule is incomplete — please check it and save again.')
        return
      }
      cleaned.push(normalized)
    }
    try {
      await workflowsRef().set(
        { enabled: Boolean(enabled), rules: cleaned },
        { merge: true }
      )
      setRules(cleaned)
      setSaved(true)
    } catch (err) {
      console.error('Workflows save failed:', err)
      setError('Could not save — please try again.')
    }
  }

  const triggerLabel = id =>
    WORKFLOW_TRIGGERS.find(t => t.id === id)?.label || id
  const actionLabel = id =>
    WORKFLOW_ACTIONS.find(a => a.id === id)?.label || id

  return (
    <section className="settings-card">
      <div className="settings-card-header">
        <div>
          <span className="settings-label">WORKFLOWS</span>
          <h2>Workflow automations</h2>
          <p>
            Off by default. When the master switch is on, these rules run
            when an owner, admin or branch manager opens the app: an
            inquiry that matches a trigger gets that rule&rsquo;s action —
            assigned, given a follow-up task for today, or flagged as
            priority. A rule acts on an inquiry at most once until there
            is new activity on it, and only the first matching rule acts.
            Nothing is ever sent to customers.
          </p>
        </div>
      </div>

      {canWrite ? (
        <form onSubmit={handleSave}>
          <div className="settings-grid">
            <label>
              <span>Enable workflow automations</span>
              <input
                type="checkbox"
                checked={enabled}
                onChange={e => setEnabled(e.target.checked)}
              />
            </label>
          </div>

          {rules.map(rule => (
            <div className="settings-grid" key={rule.id}>
              <label>
                <span>Rule name</span>
                <input
                  type="text"
                  value={rule.name}
                  placeholder="e.g. Morning pickup"
                  onChange={e => updateRule(rule.id, { name: e.target.value })}
                />
              </label>
              <label>
                <span>Rule on</span>
                <input
                  type="checkbox"
                  checked={rule.enabled !== false}
                  onChange={e =>
                    updateRule(rule.id, { enabled: e.target.checked })
                  }
                />
              </label>
              <label>
                <span>Trigger</span>
                <select
                  value={rule.trigger}
                  onChange={e =>
                    updateRule(rule.id, { trigger: e.target.value })
                  }
                >
                  {WORKFLOW_TRIGGERS.map(trigger => (
                    <option key={trigger.id} value={trigger.id}>
                      {trigger.label}
                    </option>
                  ))}
                </select>
              </label>
              {rule.trigger !== 'sla_breach' && (
                <label>
                  <span>
                    {rule.trigger === 'new_inquiry'
                      ? 'Still waiting after (hours, 1–720)'
                      : 'No activity for (hours, 1–720)'}
                  </span>
                  <input
                    type="number"
                    min="1"
                    max="720"
                    value={rule.hours}
                    onChange={e =>
                      updateRule(rule.id, { hours: e.target.value })
                    }
                  />
                </label>
              )}
              <label>
                <span>Action</span>
                <select
                  value={rule.action}
                  onChange={e =>
                    updateRule(rule.id, { action: e.target.value })
                  }
                >
                  {WORKFLOW_ACTIONS.map(action => (
                    <option key={action.id} value={action.id}>
                      {action.label}
                    </option>
                  ))}
                </select>
              </label>
              {rule.action === 'assign_member' && (
                <label>
                  <span>Assign to</span>
                  <select
                    value={rule.assignTo}
                    onChange={e =>
                      updateRule(rule.id, { assignTo: e.target.value })
                    }
                  >
                    <option value="">Pick a member…</option>
                    {members.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.email || member.name || member.id}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                <span>Remove</span>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => removeRule(rule.id)}
                >
                  Delete rule
                </button>
              </label>
            </div>
          ))}

          {rules.length < MAX_WORKFLOW_RULES && (
            <p>
              <button type="button" className="ghost-button" onClick={addRule}>
                Add a rule
              </button>
            </p>
          )}
          {error && <div className="form-error">{error}</div>}
          {saved && <p>Saved.</p>}
          <button type="submit" className="primary-button">
            Save workflows
          </button>
        </form>
      ) : (
        <p>
          Workflow automations: {enabled ? 'on' : 'off'}
          {enabled && rules.length > 0
            ? ` — ${rules
                .filter(rule => rule.enabled !== false)
                .map(
                  rule =>
                    `${rule.name || 'Untitled'} (${triggerLabel(rule.trigger)} → ${actionLabel(rule.action)})`
                )
                .join('; ')}`
            : ''}
          . Only owners and admins can change workflow settings.
        </p>
      )}
    </section>
  )
}
