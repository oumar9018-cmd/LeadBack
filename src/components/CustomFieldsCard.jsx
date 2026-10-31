import React, { useEffect, useState } from 'react'
import { useWorkspace } from './WorkspaceContext.jsx'
import { canWriteSettings } from '../utils/workspace.js'
import {
  CUSTOM_FIELD_TYPES,
  MAX_CUSTOM_FIELDS,
  customFieldId,
  validateCustomField,
} from '../utils/customFields.js'

/**
 * #13 — Custom Fields manager (Settings card).
 *
 * Mirrors BranchesCard: definitions live in one doc
 * (users/{ownerUid}/settings/customFields) so the existing settings
 * rules cover them — owners/admins write, managers read. Deleting a
 * definition hides it from forms and lists, but never deletes values
 * already stored on inquiries (those rows keep their data).
 */
export default function CustomFieldsCard() {
  const { workspace, loading: wsLoading } = useWorkspace()
  const [fields, setFields] = useState([])
  const [label, setLabel] = useState('')
  const [type, setType] = useState('text')
  const [optionsText, setOptionsText] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const canWrite = canWriteSettings(workspace?.role)

  function fieldsRef() {
    const db = window.firebase?.firestore?.()
    if (!workspace || !db) return null
    return db
      .collection('users')
      .doc(workspace.ownerUid)
      .collection('settings')
      .doc('customFields')
  }

  useEffect(() => {
    if (wsLoading || !workspace) return undefined
    const ref = fieldsRef()
    if (!ref) return undefined
    let cancelled = false
    ;(async () => {
      try {
        const snap = await ref.get()
        if (!cancelled) {
          setFields(snap.exists ? snap.data()?.fields || [] : [])
        }
      } catch (err) {
        console.error('Custom fields load failed:', err)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsLoading, workspace])

  async function saveFields(next) {
    const ref = fieldsRef()
    if (!ref) return
    await ref.set({ fields: next }, { merge: true })
    setFields(next)
    setSaved(true)
  }

  async function handleAdd(event) {
    event.preventDefault()
    setError('')
    setSaved(false)
    const options = optionsText
      .split(',')
      .map(o => o.trim())
      .filter(Boolean)
    const problem = validateCustomField({ label, type, options }, fields)
    if (problem) {
      setError(problem)
      return
    }
    const field = {
      id: customFieldId(label, fields.map(f => f.id)),
      label: label.trim(),
      type,
      ...(type === 'select' ? { options } : {}),
    }
    try {
      await saveFields([...fields, field])
      setLabel('')
      setOptionsText('')
      setType('text')
    } catch (err) {
      console.error('Custom field save failed:', err)
      setError('Could not save — please try again.')
    }
  }

  async function handleDelete(id) {
    try {
      await saveFields(fields.filter(f => f.id !== id))
    } catch (err) {
      console.error('Custom field delete failed:', err)
      setError('Could not delete — please try again.')
    }
  }

  return (
    <section className="settings-card">
      <div className="settings-card-header">
        <div>
          <span className="settings-label">CUSTOM FIELDS</span>
          <h2>Custom fields</h2>
          <p>
            Add your own fields to inquiries — for example, budget range,
            preferred language, or lead source detail. They appear on the
            add-inquiry form, the inquiry details, and CSV exports.
          </p>
        </div>
      </div>

      {fields.length === 0 ? (
        <p>No custom fields yet.</p>
      ) : (
        <ul>
          {fields.map(field => (
            <li key={field.id}>
              {field.label} ({CUSTOM_FIELD_TYPES.find(t => t.id === field.type)?.label || field.type}
              {field.type === 'select' ? `: ${field.options.join(', ')}` : ''})
              {canWrite && (
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => handleDelete(field.id)}
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canWrite ? (
        <form onSubmit={handleAdd}>
          <div className="settings-grid">
            <label>
              <span>Field name</span>
              <input
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="e.g. Budget range"
              />
            </label>
            <label>
              <span>Type</span>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
              >
                {CUSTOM_FIELD_TYPES.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            {type === 'select' && (
              <label className="full-field">
                <span>Options (comma-separated)</span>
                <input
                  value={optionsText}
                  onChange={e => setOptionsText(e.target.value)}
                  placeholder="e.g. Under 5k, 5k–20k, 20k+"
                />
              </label>
            )}
          </div>
          {error && <div className="form-error">{error}</div>}
          {saved && <p>Saved.</p>}
          <button
            type="submit"
            className="primary-button"
            disabled={fields.length >= MAX_CUSTOM_FIELDS}
          >
            Add field
          </button>
          {fields.length >= MAX_CUSTOM_FIELDS && (
            <p>Maximum {MAX_CUSTOM_FIELDS} custom fields.</p>
          )}
        </form>
      ) : (
        <p>Only owners and admins can change custom fields.</p>
      )}
    </section>
  )
}
