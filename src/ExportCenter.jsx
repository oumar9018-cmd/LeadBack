import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkspace } from './components/WorkspaceContext.jsx'
import { canManageTeam } from './utils/workspace.js'
import { toCsv, downloadCsv } from './utils/csv.js'
import { logAudit } from './utils/audit.js'
import { loadCustomFieldDefinitions } from './utils/customFields.js'
import {
  BACKUP_SETTINGS_DOCS,
  buildBackup,
  planRestore,
  summarizeBackup,
  validateBackup,
} from './utils/backup.js'
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
 *
 * Round 5 adds Backup & Restore under the exports: one JSON file
 * with the whole workspace (utils/backup.js) and an owner-only,
 * safe-merge restore — restored inquiries are NEW documents with a
 * restoredFrom marker, settings only gain keys they are missing,
 * and nothing is ever overwritten or deleted.
 */

const AUDIT_EXPORT_LIMIT = 1000

export default function ExportCenter() {
  const navigate = useNavigate()
  const { workspace, loading: wsLoading } = useWorkspace()

  const [inquiries, setInquiries] = useState([])
  const [auditRecords, setAuditRecords] = useState([])
  const [customFields, setCustomFields] = useState([])
  const [members, setMembers] = useState([])
  const [branchList, setBranchList] = useState([])
  const [settingsDocs, setSettingsDocs] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState('')

  // Restore flow: idle → preview (validated + planned) → applying →
  // done; a rejected file lands in 'error' with the reasons.
  const [restore, setRestore] = useState({ status: 'idle' })
  const [restoreConfirmed, setRestoreConfirmed] = useState(false)

  const allowed = canManageTeam(workspace?.role)
  const isOwner = workspace?.role === 'owner'

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
      }

      // Backup inputs: members list, branches and the settings docs
      // a backup carries. Each load is independent — a failed one
      // just leaves that section empty in the backup.
      try {
        const snap = await db
          .collection('users')
          .doc(workspace.ownerUid)
          .collection('members')
          .get()
        if (!cancelled) {
          setMembers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        }
      } catch (error) {
        console.error('Export members load failed:', error)
      }

      try {
        const snap = await db
          .collection('users')
          .doc(workspace.ownerUid)
          .collection('settings')
          .doc('branches')
          .get()
        if (!cancelled) {
          setBranchList(snap.exists ? snap.data()?.branches || [] : [])
        }
      } catch (error) {
        console.error('Export branches load failed:', error)
      }

      try {
        const docs = {}
        for (const docId of BACKUP_SETTINGS_DOCS) {
          const snap = await db
            .collection('users')
            .doc(workspace.ownerUid)
            .collection('settings')
            .doc(docId)
            .get()
          docs[docId] = snap.exists ? snap.data() : null
        }
        if (!cancelled) setSettingsDocs(docs)
      } catch (error) {
        console.error('Export settings load failed:', error)
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

  function downloadBackup() {
    const backup = buildBackup({
      workspaceId: workspace.ownerUid,
      exportedAt: new Date(),
      inquiries,
      members,
      branches: branchList,
      settings: settingsDocs,
    })
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `backwon-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    logAudit(workspace.ownerUid, {
      action: 'export',
      detail: `Downloaded full workspace backup (JSON): ${backup.counts.inquiries} inquiries, ${backup.counts.members} members, ${backup.counts.branches} branches, ${backup.counts.settingsDocs} settings docs`,
    })
    setNotice(
      `Backup downloaded — ${backup.counts.inquiries} inquiries, ${backup.counts.members} members, ${backup.counts.branches} branches and ${backup.counts.settingsDocs} settings docs in one JSON file.`
    )
  }

  async function handleRestoreFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setRestoreConfirmed(false)
    let parsed
    try {
      parsed = JSON.parse(await file.text())
    } catch {
      setRestore({
        status: 'error',
        errors: ['That file is not valid JSON — pick a BackWon backup file.'],
      })
      return
    }
    const { ok, errors, backup } = validateBackup(parsed)
    if (!ok) {
      setRestore({ status: 'error', errors })
      return
    }
    const plan = planRestore(backup, {
      branches: branchList,
      settings: settingsDocs,
    })
    setRestore({ status: 'preview', backup, summary: summarizeBackup(backup), plan })
  }

  async function applyRestore() {
    if (restore.status !== 'preview' || !restoreConfirmed) return
    const db = window.firebase?.firestore?.()
    if (!db || !workspace) return
    setRestore(current => ({ ...current, status: 'applying' }))
    const base = db.collection('users').doc(workspace.ownerUid)
    const { plan, summary } = restore

    let added = 0
    let failed = 0
    for (const entry of plan.inquiriesToAdd) {
      try {
        await base.collection('inquiries').add(entry.data)
        added += 1
      } catch (error) {
        console.error('Restore inquiry failed:', entry.sourceId, error)
        failed += 1
      }
    }

    let branchesAdded = 0
    if (plan.branchesToAdd.length > 0) {
      try {
        const merged = [...branchList, ...plan.branchesToAdd]
        await base
          .collection('settings')
          .doc('branches')
          .set({ branches: merged }, { merge: true })
        setBranchList(merged)
        branchesAdded = plan.branchesToAdd.length
      } catch (error) {
        console.error('Restore branches failed:', error)
      }
    }

    let settingsKeysFilled = 0
    for (const [docId, patch] of Object.entries(plan.settingsPatches)) {
      try {
        await base.collection('settings').doc(docId).set(patch, { merge: true })
        settingsKeysFilled += Object.keys(patch).length
        setSettingsDocs(current => ({
          ...current,
          [docId]: { ...(current[docId] || {}), ...patch },
        }))
      } catch (error) {
        console.error('Restore settings failed:', docId, error)
      }
    }

    if (added > 0) {
      try {
        const snap = await base.collection('inquiries').get()
        setInquiries(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      } catch (error) {
        console.error('Restore inquiries reload failed:', error)
      }
    }

    // The audit allowlist is fixed (no rules change), so a restore is
    // recorded under the existing 'export' action with the detail
    // stating plainly that it was a restore.
    logAudit(workspace.ownerUid, {
      action: 'export',
      detail: `Restored workspace backup dated ${summary.exportedAt || 'unknown'}: ${added} inquiries added as new copies, ${branchesAdded} branches added, ${settingsKeysFilled} settings keys filled (nothing overwritten)${failed ? `, ${failed} inquiries failed` : ''}`,
    })
    setRestore(current => ({
      ...current,
      status: 'done',
      result: { added, failed, branchesAdded, settingsKeysFilled },
    }))
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

        <h2 className="exports-section-title">Backup &amp; restore</h2>
        <div className="exports-grid exports-grid-two">
          <section className="exports-card">
            <span className="exports-card-label">FULL WORKSPACE BACKUP</span>
            <h2>Workspace backup (JSON)</h2>
            <p>
              One JSON file with everything: all inquiries, the customer
              directory, the team members list, branches, and the SLA,
              workflows, escalation, targets and custom-field settings.
              The workspace profile doc (business name, currency) is not
              part of a backup. Keep the file somewhere safe — it
              contains customer phone numbers.
            </p>
            <div className="exports-card-meta">
              <strong>{showLoading ? '…' : inquiries.length}</strong>
              <span>inquiries in this workspace</span>
            </div>
            <button
              type="button"
              className="primary-button"
              onClick={downloadBackup}
              disabled={showLoading}
            >
              Download backup
            </button>
          </section>

          <section className="exports-card">
            <span className="exports-card-label">RESTORE</span>
            <h2>Restore a backup</h2>
            {!isOwner ? (
              <p>
                Restoring is owner-only. Ask the workspace owner to run a
                restore — it adds data to the workspace, so it is kept to
                the owner&rsquo;s account.
              </p>
            ) : (
              <>
                <p>
                  Upload a BackWon backup JSON to preview it first.
                  Restore never overwrites or deletes anything: inquiries
                  come back as new copies marked as restored, branches
                  are added only if missing, and settings only gain keys
                  they do not have yet. Team members are not restored —
                  their records are created when they accept an invite.
                </p>
                <label className="restore-file">
                  <span>Choose a backup file</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleRestoreFile}
                    disabled={restore.status === 'applying'}
                  />
                </label>

                {restore.status === 'error' && (
                  <div className="form-error">
                    {restore.errors.map((error, index) => (
                      <p key={index}>{error}</p>
                    ))}
                  </div>
                )}

                {(restore.status === 'preview' ||
                  restore.status === 'applying' ||
                  restore.status === 'done') && (
                  <div className="restore-preview">
                    <p>
                      <strong>Backup date:</strong>{' '}
                      {restore.summary.exportedAt
                        ? restore.summary.exportedAt.slice(0, 10)
                        : 'not recorded'}
                    </p>
                    <ul>
                      <li>
                        Inquiries: {restore.summary.inquiries} — all will
                        be added as new copies
                      </li>
                      <li>
                        Customers: {restore.summary.customers} — they come
                        back with the inquiries
                      </li>
                      <li>
                        Team members: {restore.summary.members} — listed
                        for reference only, not restored
                      </li>
                      <li>
                        Branches: {restore.plan.branchesToAdd.length} new
                        to add, {restore.plan.branchesExisting} already
                        here
                      </li>
                      <li>
                        Settings:{' '}
                        {Object.values(restore.plan.settingsPatches).reduce(
                          (total, patch) => total + Object.keys(patch).length,
                          0
                        )}{' '}
                        missing keys will be filled; keys you already have
                        stay untouched
                      </li>
                    </ul>

                    {restore.status === 'preview' && (
                      <>
                        <label className="restore-confirm">
                          <input
                            type="checkbox"
                            checked={restoreConfirmed}
                            onChange={event =>
                              setRestoreConfirmed(event.target.checked)
                            }
                          />
                          <span>
                            I understand restore adds copies and never
                            overwrites — and that restoring the same file
                            twice will duplicate the inquiries.
                          </span>
                        </label>
                        <button
                          type="button"
                          className="primary-button"
                          onClick={applyRestore}
                          disabled={!restoreConfirmed}
                        >
                          Restore now
                        </button>
                      </>
                    )}
                    {restore.status === 'applying' && (
                      <p className="exports-card-note">Restoring…</p>
                    )}
                    {restore.status === 'done' && (
                      <p className="exports-card-note" role="status">
                        Restore finished — {restore.result.added} inquiries
                        added, {restore.result.branchesAdded} branches
                        added, {restore.result.settingsKeysFilled} settings
                        keys filled.
                        {restore.result.failed > 0
                          ? ` ${restore.result.failed} inquiries could not be added.`
                          : ''}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
