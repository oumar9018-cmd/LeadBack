import React, { useEffect, useState } from 'react'
import { useWorkspace } from './WorkspaceContext.jsx'

/**
 * Audit log viewer — batch 4 (enterprise Phase 2).
 *
 * Owner/admin-only (the component is rendered only for those roles
 * in Settings, and firestore.rules allows audit reads to owner/admins
 * only — members can never open this list, even by URL guessing,
 * because the read itself is denied). Records are append-only:
 * nobody, not even the owner, can edit or delete them.
 * Newest first, filterable by actor and action.
 */

const ACTION_LABELS = {
  status_changed: 'Status changed',
  member_added: 'Member added',
  member_removed: 'Member removed',
  member_role_changed: 'Member role changed',
  member_availability_changed: 'Member availability changed',
  inquiry_assigned: 'Inquiry assigned',
  export: 'Data exported',
}

export default function AuditLog() {
  const { workspace } = useWorkspace()
  const [records, setRecords] = useState([])
  const [actorFilter, setActorFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (!workspace) return undefined
    const ownerUid = workspace.ownerUid
    const db = window.firebase?.firestore?.()
    if (!db) return undefined
    let cancelled = false
    db.collection('users')
      .doc(ownerUid)
      .collection('audit')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get()
      .then(snap => {
        if (cancelled) return
        setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      })
      .catch(error => {
        console.error('Audit load failed:', error)
        if (!cancelled) {
          setLoadError('Could not load the audit log. The updated security rules may not be published yet.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [workspace])

  const actors = [...new Set(records.map(r => r.actorEmail || r.actorUid || '').filter(Boolean))]

  const visible = records.filter(r => {
    const actorOk =
      actorFilter === 'all' ||
      (r.actorEmail || r.actorUid || '') === actorFilter
    const actionOk = actionFilter === 'all' || r.action === actionFilter
    return actorOk && actionOk
  })

  function formatTime(value) {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return String(value)
    return date.toLocaleString()
  }

  return (
    <section className="settings-card">
      <div className="settings-card-header">
        <div>
          <span className="settings-label">SECURITY</span>
          <h2>Audit log</h2>
          <p>
            Who changed what, and when. Status changes, team changes
            and exports are recorded here. Records can never be edited
            or deleted — not even by the owner.
          </p>
        </div>
      </div>

      {loadError && <div className="form-error">{loadError}</div>}

      {records.length > 0 && (
        <div className="settings-grid">
          <label>
            <span>Actor</span>
            <select value={actorFilter} onChange={e => setActorFilter(e.target.value)}>
              <option value="all">Everyone</option>
              {actors.map(actor => (
                <option key={actor} value={actor}>{actor}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Action</span>
            <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
              <option value="all">All actions</option>
              {Object.entries(ACTION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {visible.length === 0 && !loadError && (
        <p>No audit records yet. Status changes and team changes will appear here.</p>
      )}

      {visible.map(record => (
        <div key={record.id} className="team-row">
          <div>
            <strong>{ACTION_LABELS[record.action] || record.action}</strong>
            <span>
              {record.actorEmail || record.actorUid || 'Unknown'}
              {' · '}
              {formatTime(record.createdAt)}
              {record.detail ? ` · ${record.detail}` : ''}
              {record.inquiryId ? ` · lead ${record.inquiryId}` : ''}
            </span>
          </div>
        </div>
      ))}
    </section>
  )
}
