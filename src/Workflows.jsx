import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkspace } from './components/WorkspaceContext.jsx'
import {
  canViewSettings,
  canWriteSettings,
} from './utils/workspace.js'
import { customFieldId } from './utils/customFields.js'
import {
  RULE_TRIGGERS,
  RULE_FIELDS,
  RULE_OPERATORS,
  RULE_ACTIONS,
  RULE_STATUSES,
  validateRule,
} from './utils/rules.js'

/**
 * #1 — Visual Workflow Automation Builder.
 *
 * A workflow IS a rule: same storage (settings/rules doc), same engine
 * (utils/rules.js), same audit trail. This page is the visual way to
 * build one — a vertical flow: WHEN trigger → IF conditions → THEN
 * actions → ELSE actions. Nodes are added by tapping (phone-first:
 * drag-and-drop does not work reliably on touch, so ↑/↓ reorder
 * buttons are the primary reorder path; HTML5 drag is a desktop
 * extra on the same nodes).
 *
 * Permissions mirror the rules card: viewing needs canViewSettings
 * (owner/admin/branch_manager), editing needs canWriteSettings
 * (owner/admin). Trigger options come from RULE_TRIGGERS, so new
 * wired triggers appear here automatically — nothing unwired is
 * ever offered.
 */

const EMPTY_WORKFLOW = () => ({
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

const NODE_STYLE = {
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 12,
  background: '#fff',
  marginBottom: 10,
}

const RAIL_STYLE = {
  borderLeft: '3px solid #2563EB',
  marginLeft: 8,
  paddingLeft: 16,
}

export default function Workflows() {
  const { workspace, loading } = useWorkspace()
  const navigate = useNavigate()
  const [rules, setRules] = useState([])
  const [members, setMembers] = useState([])
  const [branches, setBranches] = useState([])
  const [draft, setDraft] = useState(null)
  const [error, setError] = useState('')

  const canView = canViewSettings(workspace?.role)
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
    if (loading || !workspace) return undefined
    const db = window.firebase?.firestore?.()
    if (!db) return undefined
    let cancelled = false
    ;(async () => {
      try {
        const snap = await rulesRef().get()
        if (!cancelled) setRules(snap.exists ? snap.data()?.rules || [] : [])
      } catch (err) {
        console.error('Workflows load failed:', err)
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
  }, [loading, workspace])

  if (!loading && workspace && !canView) {
    return (
      <div className="settings-page">
        <div className="settings-inner">
          <header className="settings-header">
            <div>
              <span className="app-eyebrow">WORKFLOWS</span>
              <h1>Workflows</h1>
              <p>
                Workflow automation is not available for your role. Your
                leads live on the Inquiries and Follow-ups pages.
              </p>
            </div>
            <button
              className="primary-button"
              onClick={() => navigate('/app/inquiries')}
            >
              Go to Inquiries
            </button>
          </header>
        </div>
      </div>
    )
  }

  async function saveRules(next) {
    const ref = rulesRef()
    if (!ref) return
    await ref.set({ rules: next }, { merge: true })
    setRules(next)
  }

  function startNew() {
    setError('')
    setDraft({ ...EMPTY_WORKFLOW(), id: '' })
  }

  function startEdit(rule) {
    setError('')
    setDraft(JSON.parse(JSON.stringify(rule)))
  }

  async function handleSave(event) {
    event.preventDefault()
    setError('')
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
      console.error('Workflow save failed:', err)
      setError('Could not save — please try again.')
    }
  }

  async function toggleEnabled(rule) {
    try {
      await saveRules(
        rules.map(r => (r.id === rule.id ? { ...r, enabled: !r.enabled } : r))
      )
    } catch (err) {
      console.error('Workflow toggle failed:', err)
    }
  }

  async function handleDelete(id) {
    try {
      await saveRules(rules.filter(r => r.id !== id))
    } catch (err) {
      console.error('Workflow delete failed:', err)
    }
  }

  function move(listKey, index, delta) {
    setDraft(current => {
      const list = [...current[listKey]]
      const target = index + delta
      if (target < 0 || target >= list.length) return current
      ;[list[index], list[target]] = [list[target], list[index]]
      return { ...current, [listKey]: list }
    })
  }

  function removeFrom(listKey, index) {
    setDraft(current => ({
      ...current,
      [listKey]: current[listKey].filter((_, i) => i !== index),
    }))
  }

  function updateIn(listKey, index, patch) {
    setDraft(current => ({
      ...current,
      [listKey]: current[listKey].map((item, i) =>
        i === index ? { ...item, ...patch } : item
      ),
    }))
  }

  function onDropOn(listKey, index, event) {
    event.preventDefault()
    try {
      const data = JSON.parse(event.dataTransfer.getData('text/plain'))
      if (data.list !== listKey || data.index === index) return
      setDraft(current => {
        const list = [...current[listKey]]
        const [moved] = list.splice(data.index, 1)
        list.splice(index, 0, moved)
        return { ...current, [listKey]: list }
      })
    } catch {
      // A failed drag is a no-op; the ↑/↓ buttons always work.
    }
  }

  function nodeChrome(listKey, index, children) {
    return (
      <div
        style={NODE_STYLE}
        draggable
        onDragStart={e =>
          e.dataTransfer.setData(
            'text/plain',
            JSON.stringify({ list: listKey, index })
          )
        }
        onDragOver={e => e.preventDefault()}
        onDrop={e => onDropOn(listKey, index, e)}
      >
        {children}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button type="button" className="ghost-button" onClick={() => move(listKey, index, -1)}>
            Up
          </button>
          <button type="button" className="ghost-button" onClick={() => move(listKey, index, 1)}>
            Down
          </button>
          <button type="button" className="ghost-button" onClick={() => removeFrom(listKey, index)}>
            Remove
          </button>
        </div>
      </div>
    )
  }

  function conditionValueInput(condition, onValue) {
    const field = condition.field
    if (field === 'status') {
      return (
        <select value={condition.value || ''} onChange={e => onValue(e.target.value)}>
          <option value="">—</option>
          {RULE_STATUSES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      )
    }
    if (field === 'assignedTo') {
      return (
        <select value={condition.value || ''} onChange={e => onValue(e.target.value)}>
          <option value="">Unassigned</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>{m.email || m.id}</option>
          ))}
        </select>
      )
    }
    if (field === 'branchId') {
      return (
        <select value={condition.value || ''} onChange={e => onValue(e.target.value)}>
          <option value="">No branch</option>
          {branches.map(b => (
            <option key={b.id} value={b.name}>{b.name}</option>
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

  function actionValueInput(action, onValue) {
    if (action.type === 'assign_to') {
      return (
        <select value={action.value || ''} onChange={e => onValue(e.target.value)}>
          <option value="">—</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>{m.email || m.id}</option>
          ))}
        </select>
      )
    }
    if (action.type === 'set_branch') {
      return (
        <select value={action.value || ''} onChange={e => onValue(e.target.value)}>
          <option value="">—</option>
          {branches.map(b => (
            <option key={b.id} value={b.name}>{b.name}</option>
          ))}
        </select>
      )
    }
    if (action.type === 'set_status') {
      return (
        <select value={action.value || ''} onChange={e => onValue(e.target.value)}>
          <option value="">—</option>
          {RULE_STATUSES.map(s => (
            <option key={s} value={s}>{s}</option>
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

  function conditionNodes() {
    return draft.conditions.map((condition, index) => {
      const operator = RULE_OPERATORS.find(o => o.id === condition.operator)
      return (
        <div key={index}>
          {nodeChrome(
            'conditions',
            index,
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <select
                value={condition.field}
                onChange={e => {
                  const field = e.target.value
                  const firstOp = operatorsFor(field)[0]
                  updateIn('conditions', index, {
                    field,
                    operator: firstOp.id,
                    value: '',
                  })
                }}
              >
                {RULE_FIELDS.map(f => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
              <select
                value={condition.operator}
                onChange={e =>
                  updateIn('conditions', index, { operator: e.target.value })
                }
              >
                {operatorsFor(condition.field).map(o => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
              {operator?.needsValue &&
                conditionValueInput(condition, value =>
                  updateIn('conditions', index, { value })
                )}
            </div>
          )}
          {index < draft.conditions.length - 1 && (
            <div style={{ margin: '0 0 10px 20px', fontWeight: 600 }}>AND</div>
          )}
        </div>
      )
    })
  }

  function actionNodes(listKey) {
    return draft[listKey].map((action, index) =>
      nodeChrome(
        listKey,
        index,
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <select
            value={action.type}
            onChange={e =>
              updateIn(listKey, index, { type: e.target.value, value: '' })
            }
          >
            {RULE_ACTIONS.map(a => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
          </select>
          {actionValueInput(action, value =>
            updateIn(listKey, index, { value })
          )}
        </div>
      )
    )
  }

  return (
    <div className="settings-page">
      <div className="settings-inner">
        <header className="settings-header">
          <div>
            <span className="app-eyebrow">AUTOMATION</span>
            <h1>Workflows</h1>
            <p>
              Build automation as a flow: when something happens, if the
              conditions match, then do this — otherwise do that. A saved
              workflow runs on real inquiries through the same rule engine
              as the Settings rules list.
            </p>
          </div>
        </header>

        {!draft && (
          <>
            {rules.length === 0 && <p>No workflows yet.</p>}
            <ul>
              {rules.map(rule => (
                <li key={rule.id}>
                  <strong>{rule.name}</strong> —{' '}
                  {RULE_TRIGGERS.find(t => t.id === rule.trigger)?.label ||
                    rule.trigger}{' '}
                  ({rule.conditions.length} condition
                  {rule.conditions.length === 1 ? '' : 's'},{' '}
                  {rule.actions.length} action
                  {rule.actions.length === 1 ? '' : 's'}
                  {rule.elseActions.length > 0
                    ? `, ${rule.elseActions.length} else`
                    : ''}
                  ){!rule.enabled && ' [disabled]'}
                  {canWrite && (
                    <>
                      <button type="button" className="ghost-button" onClick={() => toggleEnabled(rule)}>
                        {rule.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button type="button" className="ghost-button" onClick={() => startEdit(rule)}>
                        Edit flow
                      </button>
                      <button type="button" className="ghost-button" onClick={() => handleDelete(rule.id)}>
                        Delete
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
            {canWrite && (
              <button type="button" className="primary-button" onClick={startNew}>
                New workflow
              </button>
            )}
            {!canWrite && (
              <p>Only owners and admins can change workflows.</p>
            )}
          </>
        )}

        {canWrite && draft && (
          <form onSubmit={handleSave}>
            <div className="settings-grid">
              <label>
                <span>Workflow name</span>
                <input
                  value={draft.name}
                  onChange={e => setDraft({ ...draft, name: e.target.value })}
                  placeholder="e.g. High-value leads to Priya"
                />
              </label>
              <label>
                <span>When</span>
                <select
                  value={draft.trigger}
                  onChange={e => setDraft({ ...draft, trigger: e.target.value })}
                >
                  {RULE_TRIGGERS.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div style={RAIL_STYLE}>
              <h3>IF — all of these match</h3>
              {draft.conditions.length === 0 && (
                <p>No conditions — this workflow matches every new inquiry.</p>
              )}
              {conditionNodes()}
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

              <h3 style={{ marginTop: 24 }}>THEN — do this</h3>
              {draft.actions.length === 0 && <p>No actions yet.</p>}
              {actionNodes('actions')}
              <button
                type="button"
                className="ghost-button"
                onClick={() =>
                  setDraft(current => ({
                    ...current,
                    actions: [
                      ...current.actions,
                      { type: 'assign_to', value: '' },
                    ],
                  }))
                }
              >
                Add action
              </button>

              <h3 style={{ marginTop: 24 }}>ELSE — otherwise do this</h3>
              {draft.elseActions.length === 0 && <p>No else actions.</p>}
              {actionNodes('elseActions')}
              <button
                type="button"
                className="ghost-button"
                onClick={() =>
                  setDraft(current => ({
                    ...current,
                    elseActions: [
                      ...current.elseActions,
                      { type: 'assign_to', value: '' },
                    ],
                  }))
                }
              >
                Add else action
              </button>
            </div>

            {error && <div className="form-error">{error}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" className="primary-button">
                Save workflow
              </button>
              <button type="button" className="ghost-button" onClick={() => setDraft(null)}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
