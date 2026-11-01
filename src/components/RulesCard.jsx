import React, { useEffect, useState } from 'react'
import { useWorkspace } from './WorkspaceContext.jsx'
import { canWriteSettings } from '../utils/workspace.js'
import { customFieldId } from '../utils/customFields.js'
import {
  RULE_TRIGGERS,
  RULE_FIELDS,
  RULE_OPERATORS,
  RULE_ACTIONS,
  RULE_STATUSES,
  validateRule,
} from '../utils/rules.js'
import './AutomationLists.css'

/**
 * #2 — Automation Rules manager (Settings card).
 *
 * Mirrors CustomFieldsCard: rules live in one doc
 * (users/{ownerUid}/settings/rules) so the existing settings rules
 * cover them — owners/admins write, managers read.
 *
 * Honest scope: the card offers ONLY the triggers actually wired into
 * the app (v1: inquiry creation). Rules never send messages and never
 * block saving an inquiry — a failing rule is skipped, creation goes on.
 */

const EMPTY_RULE = () => ({
  name: '',
  trigger: 'inquiry_created',
  conditions: [],
  actions: [],
  elseActions: [],
})

function fieldKind(fieldId) {
  return RULE_FIELDS.find(f => f.id === fieldId)?.kind || 'string'
}

function operatorsFor(fieldId) {
  const kind = fieldKind(fieldId)
  return RULE_OPERATORS.filter(o => o.kinds.includes(kind))
}

export default function RulesCard() {
  const { workspace, loading: wsLoading } = useWorkspace()
  const [rules, setRules] = useState([])
  const [members, setMembers] = useState([])
  const [branches, setBranches] = useState([])
  const [draft, setDraft] = useState(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const canWrite = canWriteSettings(workspace?.role)

  function rulesRef() {
    const db = window.firebase?.firestore?.()
    if (!workspace || !db) return null
    return db
      .collection('users')
      .doc(workspace.ownerUid)
      .collection('settings')
      .doc('rules')
  }

  useEffect(() => {
    if (wsLoading || !workspace) return undefined
    const db = window.firebase?.firestore?.()
    if (!db) return undefined
    let cancelled = false
    ;(async () => {
      try {
        const ref = rulesRef()
        const snap = await ref.get()
        if (!cancelled) {
          setRules(snap.exists ? snap.data()?.rules || [] : [])
        }
      } catch (err) {
        console.error('Rules load failed:', err)
      }
      try {
        const membersSnap = await db
          .collection('users')
          .doc(workspace.ownerUid)
          .collection('members')
          .get()
        if (!cancelled) {
          setMembers(membersSnap.docs.map(d => ({ id: d.id, ...d.data() })))
        }
      } catch {
        // Members list is owner/admin-only in the rules; staff get [].
        if (!cancelled) setMembers([])
      }
      try {
        const branchesSnap = await db
          .collection('users')
          .doc(workspace.ownerUid)
          .collection('settings')
          .doc('branches')
          .get()
        if (!cancelled) {
          setBranches(branchesSnap.exists ? branchesSnap.data()?.branches || [] : [])
        }
      } catch {
        if (!cancelled) setBranches([])
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsLoading, workspace])

  async function saveRules(next) {
    const ref = rulesRef()
    if (!ref) return
    await ref.set({ rules: next }, { merge: true })
    setRules(next)
    setSaved(true)
  }

  function startNew() {
    setError('')
    setSaved(false)
    setDraft({ ...EMPTY_RULE(), id: '' })
  }

  function startEdit(rule) {
    setError('')
    setSaved(false)
    setDraft(JSON.parse(JSON.stringify(rule)))
  }

  async function handleSaveDraft(event) {
    event.preventDefault()
    setError('')
    setSaved(false)
    const problem = validateRule(draft, rules)
    if (problem) {
      setError(problem)
      return
    }
    const id = draft.id || customFieldId(draft.name, rules.map(r => r.id))
    const next = draft.id
      ? rules.map(r => (r.id === draft.id ? { ...draft, id } : r))
      : [...rules, { ...draft, id, enabled: true }]
    try {
      await saveRules(next)
      setDraft(null)
    } catch (err) {
      console.error('Rule save failed:', err)
      setError('Could not save — please try again.')
    }
  }

  async function toggleEnabled(rule) {
    try {
      await saveRules(
        rules.map(r => (r.id === rule.id ? { ...r, enabled: !r.enabled } : r))
      )
    } catch (err) {
      console.error('Rule toggle failed:', err)
    }
  }

  async function handleDelete(id) {
    try {
      await saveRules(rules.filter(r => r.id !== id))
    } catch (err) {
      console.error('Rule delete failed:', err)
    }
  }

  function updateCondition(index, patch) {
    setDraft(current => ({
      ...current,
      conditions: current.conditions.map((c, i) =>
        i === index ? { ...c, ...patch } : c
      ),
    }))
  }

  function updateAction(listKey, index, patch) {
    setDraft(current => ({
      ...current,
      [listKey]: current[listKey].map((a, i) =>
        i === index ? { ...a, ...patch } : a
      ),
    }))
  }

  function conditionValueControl(condition, onValue) {
    const field = condition.field
    if (field === 'status') {
      return (
        <select value={condition.value || ''} onChange={e => onValue(e.target.value)}>
          <option value="">—</option>
          {RULE_STATUSES.map(s => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      )
    }
    if (field === 'assignedTo') {
      return (
        <select value={condition.value || ''} onChange={e => onValue(e.target.value)}>
          <option value="">Unassigned</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>
              {m.email || m.id}
            </option>
          ))}
        </select>
      )
    }
    if (field === 'branchId') {
      return (
        <select value={condition.value || ''} onChange={e => onValue(e.target.value)}>
          <option value="">No branch</option>
          {branches.map(b => (
            <option key={b.id} value={b.name}>
              {b.name}
            </option>
          ))}
        </select>
      )
    }
    return (
      <input
        type={fieldKind(field) === 'number' ? 'number' : 'text'}
        value={condition.value || ''}
        onChange={e => onValue(e.target.value)}
        placeholder="Value"
      />
    )
  }

  function actionValueControl(action, onValue) {
    if (action.type === 'assign_to') {
      return (
        <select value={action.value || ''} onChange={e => onValue(e.target.value)}>
          <option value="">—</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>
              {m.email || m.id}
            </option>
          ))}
        </select>
      )
    }
    if (action.type === 'set_branch') {
      return (
        <select value={action.value || ''} onChange={e => onValue(e.target.value)}>
          <option value="">—</option>
          {branches.map(b => (
            <option key={b.id} value={b.name}>
              {b.name}
            </option>
          ))}
        </select>
      )
    }
    if (action.type === 'set_status') {
      return (
        <select value={action.value || ''} onChange={e => onValue(e.target.value)}>
          <option value="">—</option>
          {RULE_STATUSES.map(s => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      )
    }
    if (action.type === 'schedule_followup') {
      return (
        <input
          type="number"
          min="1"
          max="90"
          value={action.value || ''}
          onChange={e => onValue(e.target.value)}
          placeholder="Days (1–90)"
        />
      )
    }
    return null
  }

  function actionRows(listKey, title) {
    const list = draft[listKey]
    return (
      <div>
        <h3>{title}</h3>
        {list.length === 0 && <p>No actions yet.</p>}
        {list.map((action, index) => (
          <div key={index} className="settings-grid">
            <label>
              <span>Action</span>
              <select
                value={action.type}
                onChange={e =>
                  updateAction(listKey, index, { type: e.target.value, value: '' })
                }
              >
                {RULE_ACTIONS.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Value</span>
              {actionValueControl(action, value =>
                updateAction(listKey, index, { value })
              )}
            </label>
            <button
              type="button"
              className="ghost-button"
              onClick={() =>
                setDraft(current => ({
                  ...current,
                  [listKey]: current[listKey].filter((_, i) => i !== index),
                }))
              }
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className="ghost-button"
          onClick={() =>
            setDraft(current => ({
              ...current,
              [listKey]: [...current[listKey], { type: 'assign_to', value: '' }],
            }))
          }
        >
          Add action
        </button>
      </div>
    )
  }

  return (
    <section className="settings-card">
      <div className="settings-card-header">
        <div>
          <span className="settings-label">AUTOMATION</span>
          <h2>Automation rules</h2>
          <p>
            If this, then that — rules run top to bottom when an inquiry is
            created. They assign, branch, restatus, or schedule reminders.
            They never send messages, and a failing rule never blocks
            saving an inquiry.
          </p>
        </div>
      </div>

      {rules.length === 0 && !draft && <p>No rules yet.</p>}
      <ul className="auto-list">
        {rules.map(rule => (
          <li key={rule.id}>
            <strong>{rule.name}</strong> —{' '}
            {RULE_TRIGGERS.find(t => t.id === rule.trigger)?.label || rule.trigger}{' '}
            ({rule.conditions.length} condition
            {rule.conditions.length === 1 ? '' : 's'}, {rule.actions.length}{' '}
            action{rule.actions.length === 1 ? '' : 's'}
            {rule.elseActions.length > 0 ? `, ${rule.elseActions.length} else` : ''})
            {!rule.enabled && (
              <span className="badge-off">Disabled</span>
            )}
            {canWrite && (
              <>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => toggleEnabled(rule)}
                >
                  {rule.enabled ? 'Disable' : 'Enable'}
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => startEdit(rule)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => handleDelete(rule.id)}
                >
                  Delete
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      {canWrite && !draft && (
        <button type="button" className="primary-button" onClick={startNew}>
          New rule
        </button>
      )}
      {!canWrite && <p>Only owners and admins can change rules.</p>}

      {canWrite && draft && (
        <form onSubmit={handleSaveDraft}>
          <div className="settings-grid">
            <label>
              <span>Rule name</span>
              <input
                value={draft.name}
                onChange={e => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. High-value leads to Priya"
              />
            </label>
            <label>
              <span>Trigger</span>
              <select value={draft.trigger} disabled>
                {RULE_TRIGGERS.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <h3>If all of these match</h3>
          {draft.conditions.length === 0 && (
            <p>No conditions — this rule matches every new inquiry.</p>
          )}
          {draft.conditions.map((condition, index) => {
            const operator = RULE_OPERATORS.find(o => o.id === condition.operator)
            return (
              <div key={index} className="settings-grid">
                <label>
                  <span>Field</span>
                  <select
                    value={condition.field}
                    onChange={e => {
                      const field = e.target.value
                      const firstOp = operatorsFor(field)[0]
                      updateCondition(index, {
                        field,
                        operator: firstOp.id,
                        value: '',
                      })
                    }}
                  >
                    {RULE_FIELDS.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Operator</span>
                  <select
                    value={condition.operator}
                    onChange={e =>
                      updateCondition(index, { operator: e.target.value })
                    }
                  >
                    {operatorsFor(condition.field).map(o => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                {operator?.needsValue && (
                  <label>
                    <span>Value</span>
                    {conditionValueControl(condition, value =>
                      updateCondition(index, { value })
                    )}
                  </label>
                )}
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() =>
                    setDraft(current => ({
                      ...current,
                      conditions: current.conditions.filter((_, i) => i !== index),
                    }))
                  }
                >
                  Remove
                </button>
              </div>
            )
          })}
          <button
            type="button"
            className="ghost-button"
            onClick={() =>
              setDraft(current => ({
                ...current,
                conditions: [
                  ...current.conditions,
                  { field: 'status', operator: 'equals', value: '' },
                ],
              }))
            }
          >
            Add condition
          </button>

          {actionRows('actions', 'Then do this')}
          {actionRows('elseActions', 'Otherwise (else) do this')}

          {error && <div className="form-error">{error}</div>}
          {saved && <p>Saved.</p>}
          <button type="submit" className="primary-button">
            Save rule
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={() => setDraft(null)}
          >
            Cancel
          </button>
        </form>
      )}
    </section>
  )
}
