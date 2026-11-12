import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkspace } from './components/WorkspaceContext.jsx'
import { canManageTeam } from './utils/workspace.js'
import { toCsv, downloadCsv } from './utils/csv.js'
import { logAudit } from './utils/audit.js'
import { loadCustomFieldDefinitions } from './utils/customFields.js'
import './ExportCenter.css'

/**
 * Data Export Center — #140.
 *
 * Owner/admin only (same gate as Activity/Team: anyone else gets the
 * role note, never the data — the audit collection is owner/admin
 * readable in firestore.rules, and a full export must not hand staff
 * rows outside their scope). Three real CSV downloads, all built
 * with utils/csv.js (the same escaping + Blob download the Inquiries
 * export uses):
 *   - Inquiries: full export, same columns as the Inquiries page
 *     export, including custom-field columns when defined.
 *   - Customers: the Customers page rows (one row per inquiry —
 *     that page's directory is the inquiry list itself).
 *   - Audit log: timestamp / actor / action / details, loaded the
 *     way AuditLog.jsx loads it (newest first). Capped at the most
 *     recent 1,000 records, and the cap is stated on the card when
 *     it is hit rather than truncating silently.
 * Every export writes an 'export' audit entry — the action audit.js
 * reserves for exactly this path. Row counts are shown before
 * download; zero-row exports stay disabled with an honest note.
 */

const AUDIT_EXPORT_LIMIT = 1000

export default function ExportCenter() {
  const navigate = useNavigate()
  const { workspace, loading: wsLoading } = useWorkspace()

  const [inquiries, setInquiries] = useState([])
  const [auditRecords, setAuditRecords] = useState([])
  const [customFields, setCustomFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState('')

  const allowed = canManageTeam(workspace?.role)

  useEffect(() => {
    if (wsLoading || !workspace || !allowed) return undefined
    const db = window.firebase?.firestore?.()
    if (!db) return undefined
    let cancelled = false
    ;(async () => {
      try {
        const snap = await db
          .collection('users')
          .doc(workspace.ownerUid)
          .collection('inquiries')
          .get()
        if (!cancelled) {
          setInquiries(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        }
      } catch (error) {
        console.error('Export inquiries load failed:', error)
        if (!cancelled) {
          setLoadError('Unable to load export data. Please try again.')
        }
      }

      try {
        const snap = await db
          .collection('users')
          .doc(workspace.ownerUid)
          .collection('audit')
          .orderBy('createdAt', 'desc')
          .limit(AUDIT_EXPORT_LIMIT)
          .get()
        if (!cancelled) {
          setAuditRecords(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        }
      } catch (error) {
        // AuditLog.jsx hits this when the updated rules are not
        // published yet; the inquiries/customers exports still work.
        console.error('Export audit load failed:', error)
        if (!cancelled) setAuditRecords([])
      }

      try {
        const fields = await loadCustomFieldDefinitions(db, workspace.ownerUid)
        if (!cancelled) setCustomFields(fields)
      } catch (error) {
        console.error('Export custom fields load failed:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [wsLoading, workspace, allowed])

  function exportInquiries() {
    // Same columns as Inquiries.jsx handleExportCsv (including the
    // custom-field columns when the workspace defines any).
    const columns = [
      { key: 'name', label: 'Name' },
      { key: 'phone', label: 'Phone' },
      { key: 'service', label: 'Service' },
      { key: 'value', label: 'Value' },
      { key: 'status', label: 'Status' },
      { key: 'source', label: 'Source' },
      { key: 'assignedTo', label: 'Assigned To' },
      {
        key: 'created',
        label: 'Created',
        get: row =>
          row.createdAt
            ? new Date(row.createdAt).toISOString().slice(0, 10)
            : row.date || '',
      },
      ...customFields.map(field => ({
        key: `custom_${field.id}`,
        label: field.label,
        get: row => row.custom?.[field.id] ?? '',
      })),
    ]
    downloadCsv('backwon-inquiries.csv', toCsv(columns, inquiries))
    logAudit(workspace.ownerUid, {
      action: 'export',
      detail: `Exported ${inquiries.length} inquiries (CSV)`,
    })
    setNotice(`Inquiries exported — ${inquiries.length} rows downloaded.`)
  }

  function exportCustomers() {
    // The Customers page (Customers.jsx) is a directory over the
    // same inquiry rows, so the customer export carries exactly the
    // fields that page shows, one row per inquiry.
    const columns = [
      { key: 'name', label: 'Name' },
      { key: 'phone', label: 'Phone' },
      { key: 'service', label: 'Service' },
      { key: 'value', label: 'Value' },
      { key: 'status', label: 'Status' },
    ]
    downloadCsv('backwon-customers.csv', toCsv(columns, inquiries))
    logAudit(workspace.ownerUid, {
      action: 'export',
      detail: `Exported ${inquiries.length} customers (CSV)`,
    })
    setNotice(`Customers exported — ${inquiries.length} rows downloaded.`)
  }

  function exportAudit() {
    const columns = [
      { key: 'createdAt', label: 'Timestamp' },
      {
        key: 'actor',
        label: 'Actor',
        get: row => row.actorEmail || row.actorUid || '',
      },
      { key: 'action', label: 'Action' },
      { key: 'detail', label: 'Details' },
      { key: 'inquiryId', label: 'Inquiry ID' },
    ]
    downloadCsv('backwon-audit-log.csv', toCsv(columns, auditRecords))
    logAudit(workspace.ownerUid, {
      action: 'export',
      detail: `Exported ${auditRecords.length} audit records (CSV)`,
    })
    setNotice(`Audit log exported — ${auditRecords.length} rows downloaded.`)
  }

  if (!wsLoading && workspace && !allowed) {
    return (
      <div className="settings-page">
        <div className="settings-inner">
          <header className="settings-header">
            <div>
              <span className="app-eyebrow">EXPORTS</span>
              <h1>Export Center</h1>
              <p>Data export is not available for your role. Your leads live on the Inquiries and Follow-ups pages.</p>
            </div>
            <button
              className="primary-button"
              onClick={() => navigate('/app/inquiries')}
            >
              Back to inquiries
            </button>
          </header>
        </div>
      </div>
    )
  }

  // Firebase absent: the load effect no-ops, so surface the
  // unavailable state from render instead of spinning forever.
  const dataUnavailable =
    !wsLoading && !!workspace && allowed && !window.firebase?.firestore?.()
  const showLoading = loading && !dataUnavailable

  const auditCapped = auditRecords.length >= AUDIT_EXPORT_LIMIT

  const cards = [
    {
      key: 'inquiries',
      title: 'Inquiries',
      description:
        'Every inquiry in the workspace — name, phone, service, value, status, source, assignee and created date, plus custom fields when defined.',
      count: inquiries.length,
      emptyNote: 'No inquiries to export yet.',
      onExport: exportInquiries,
    },
    {
      key: 'customers',
      title: 'Customers',
      description:
        'The customer directory from the Customers page — one row per inquiry with name, phone, service, value and status.',
      count: inquiries.length,
      emptyNote: 'No customers to export yet.',
      onExport: exportCustomers,
    },
    {
      key: 'audit',
      title: 'Audit log',
      description:
        'The append-only activity record — timestamp, actor, action and details for status changes, team changes and exports.',
      count: auditRecords.length,
      emptyNote: 'No audit records to export yet.',
      note: auditCapped
        ? `Exports the most recent ${AUDIT_EXPORT_LIMIT} records.`
        : '',
      onExport: exportAudit,
    },
  ]

  return (
    <div className="exports-page">
      <div className="exports-inner">
        <header className="exports-header">
          <div>
            <span className="app-eyebrow">EXPORTS</span>
            <h1>Export Center</h1>
            <p>Download your workspace data as CSV. Every export is recorded in the audit log.</p>
          </div>
          <button
            className="primary-button"
            onClick={() => navigate('/app/inquiries')}
          >
            Back to inquiries
          </button>
        </header>

        {dataUnavailable && (
          <div className="form-error">Workspace data is unavailable right now.</div>
        )}
        {loadError && <div className="form-error">{loadError}</div>}
        {notice && <p className="exports-notice" role="status">{notice}</p>}
        {showLoading && <p className="exports-loading">Loading export data…</p>}

        <div className="exports-grid">
          {cards.map(card => (
            <section className="exports-card" key={card.key}>
              <span className="exports-card-label">{card.title.toUpperCase()}</span>
              <h2>{card.title}</h2>
              <p>{card.description}</p>
              <div className="exports-card-meta">
                <strong>{showLoading ? '…' : card.count}</strong>
                <span>{card.count === 1 ? 'row ready' : 'rows ready'}</span>
              </div>
              {card.note && <p className="exports-card-note">{card.note}</p>}
              {!showLoading && card.count === 0 && (
                <p className="exports-card-note">{card.emptyNote}</p>
              )}
              <button
                type="button"
                className="primary-button"
                onClick={card.onExport}
                disabled={showLoading || card.count === 0}
              >
                Download CSV
              </button>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
