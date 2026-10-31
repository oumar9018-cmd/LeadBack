import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import WinbackScoreBadge from './components/WinbackScore.jsx'
import Modal from './components/Modal.jsx'
import VoiceInput from './components/VoiceInput.jsx'
import OwnerBookings from './components/OwnerBookings.jsx'
import { useWorkspace } from './components/WorkspaceContext.jsx'
import { canManageTeam, inScope } from './utils/workspace.js'
import { assignNext } from './utils/roundRobin.js'
import { logAudit } from './utils/audit.js'
import CsvImport from './components/CsvImport.jsx'
import { IconPlus, IconX } from './components/icons.jsx'
import { rankByWinback } from './utils/winbackScore.js'
import { findOpenDuplicates } from './utils/detectors.js'
import { toCsv, downloadCsv } from './utils/csv.js'
import CustomFieldInputs from './components/CustomFieldInputs.jsx'
import {
  loadCustomFieldDefinitions,
  normalizeCustomValue,
} from './utils/customFields.js'
import {
  CURRENCY_CODES,
  currencySymbol,
  defaultCurrencyForBrowser,
  formatMoney,
} from './utils/money.js'

const statusLabels = {
  new: 'New',
  followup: 'Follow up',
  replied: 'Replied',
  recovered: 'Recovered',
  lost: 'Lost',
}

/**
 * Inquiries — the work list. Batch 3 (2026-10-30) restored Overview as
 * the post-login landing page, but Inquiries keeps the two write paths
 * that moved here in batch 2, so nothing is lost:
 * - Add inquiry (modal below; writes straight to Firestore, unlike the
 *   old Dashboard path which went through the whole-list sync effect).
 * - Booking requests (OwnerBookings section below the panel; same
 *   direct-write pattern for "Add as inquiry").
 * Clicking a customer opens the inquiry detail modal at /app/inquiry,
 * hosted by the Dashboard component in detail-only mode (see App.jsx).
 */
export default function Inquiries() {
  const navigate = useNavigate()
  // Batch 4: workspace root + role (solo owners: own uid, role 'owner').
  const { workspace, loading: wsLoading } = useWorkspace()

  const [items, setItems] = useState([])
  // Workspace currency (timezone default until Settings saves one).
  const [currency, setCurrency] = useState(() => defaultCurrencyForBrowser())

  // Loads from the workspace owner's data root. Gate 6 fix: Firestore
  // rules are NOT filters — an unfiltered collection get is denied
  // outright for staff, because the per-doc rule only allows rows in
  // their scope. The query itself is therefore scoped server-side to
  // exactly what the rule allows (rep: assignedTo == uid; manager:
  // branchId == branch). inScope() below stays as belt-and-braces
  // for aggregates that read the whole list.
  useEffect(() => {
    if (wsLoading || !workspace) {
      if (!wsLoading) setItems([])
      return undefined
    }
    const db = window.firebase?.firestore?.()
    if (!db) return undefined
    let cancelled = false
    ;(async () => {
      try {
        const uid = window.firebase?.auth?.().currentUser?.uid
        let query = db
          .collection('users')
          .doc(workspace.ownerUid)
          .collection('inquiries')
        if (workspace.role === 'sales_rep') {
          query = query.where('assignedTo', '==', uid || '')
        } else if (workspace.role === 'branch_manager') {
          query = query.where('branchId', '==', workspace.branchId || '')
        }
        const snapshot = await query.get()
        if (cancelled) return
        setItems(
          snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(item => inScope(item, workspace, uid))
        )
      } catch (error) {
        console.error('Inquiries load failed:', error)
        if (!cancelled) setItems([])
      }

      try {
        const settingsSnap = await db
          .collection('users')
          .doc(workspace.ownerUid)
          .collection('settings')
          .doc('workspace')
          .get()
        const savedCurrency = settingsSnap.exists
          ? settingsSnap.data()?.currency
          : undefined
        if (!cancelled && CURRENCY_CODES.includes(savedCurrency)) setCurrency(savedCurrency)
      } catch (error) {
        console.error('Inquiries currency load failed:', error)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [wsLoading, workspace])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showMenu, setShowMenu] = useState(false)
  const [sortByScore, setSortByScore] = useState(false)

  const [showAddInquiry, setShowAddInquiry] = useState(false)
  const [showCsvImport, setShowCsvImport] = useState(false)
  // Batch 5: the list can be large, so rendering is
  // capped (200 rows + "Show more") — the safeguard the CSV spec
  // requires before large imports are offered.
  const [visibleCount, setVisibleCount] = useState(200)
  // Gate 6 backfill: routing only runs at inquiry creation, so rows
  // that queued unassigned before a member became available stay
  // unassigned until an owner/admin routes them by hand.
  const [routing, setRouting] = useState(false)
  const [routeReport, setRouteReport] = useState('')
  const [form, setForm] = useState({
    name: '',
    phone: '',
    service: '',
    value: '',
    status: 'new',
  })
  const [formError, setFormError] = useState('')
  // #18 — open rows sharing the typed phone, shown as a warning (not a
  // block: a returning customer is legitimate, so "Save anyway" proceeds).
  const [dupWarning, setDupWarning] = useState([])
  // #13 — custom field definitions for this workspace + the add form's
  // values for them. Definitions load once per mount (same pattern as
  // branches); values live on the inquiry doc under `custom`.
  const [customFields, setCustomFields] = useState([])
  const [customValues, setCustomValues] = useState({})

  useEffect(() => {
    if (wsLoading || !workspace) return undefined
    const db = window.firebase?.firestore?.()
    if (!db) return undefined
    let cancelled = false
    loadCustomFieldDefinitions(db, workspace.ownerUid).then(list => {
      if (!cancelled) setCustomFields(list)
    })
    return () => {
      cancelled = true
    }
  }, [wsLoading, workspace])

  // Direct Firestore write (this page has no whole-list sync effect).
  async function addInquiryDoc(doc) {
    const db = window.firebase?.firestore?.()
    if (!workspace || !db) return null
    const ref = await db
      .collection('users')
      .doc(workspace.ownerUid)
      .collection('inquiries')
      .add(doc)
    setItems(current => [{ id: ref.id, ...doc }, ...current])
    return ref
  }

  async function handleAddInquiry(event, bypassDup = false) {
    if (event) event.preventDefault()

    if (
      !form.name.trim() ||
      !form.phone.trim() ||
      !form.service.trim() ||
      !form.value
    ) {
      setFormError('Please complete all required fields.')
      return
    }

    // #18 — duplicate check on manual entry. Scoped to the rows this user
    // can already see (items), so the check leaks nothing across scopes.
    // Only OPEN rows count: a recovered/lost row with the same phone is
    // a returning customer, not a duplicate.
    if (!bypassDup) {
      const dups = findOpenDuplicates(items, form.phone)
      if (dups.length > 0) {
        setDupWarning(dups)
        return
      }
    }

    try {
      // Batch 5: route before writing. Routing never blocks creation —
      // assignNext falls back to unassigned on any failure.
      const db = window.firebase?.firestore?.()
      const branchId = workspace?.role === 'branch_manager' ? workspace.branchId || '' : ''
      const route = await assignNext(db, workspace?.ownerUid, { branchId })
      // #13 — normalize defined custom values; empty values are dropped
      // so old and new inquiries keep the same clean shape.
      const custom = {}
      for (const field of customFields) {
        const value = normalizeCustomValue(field.type, customValues[field.id])
        if (value !== '' && value !== null && value !== undefined) {
          custom[field.id] = value
        }
      }
      const ref = await addInquiryDoc({
        name: form.name.trim(),
        phone: form.phone.trim(),
        service: form.service.trim(),
        value: Number(form.value),
        status: form.status,
        date: 'Just now',
        createdAt: Date.now(),
        assignedTo: route.assignedTo,
        assignedAt: route.assignedAt,
        assignedBy: route.assignedBy,
        source: 'manual',
        branchId,
        custom,
      })
      if (route.assignedTo && ref) {
        logAudit(workspace.ownerUid, {
          action: 'status_changed',
          inquiryId: ref.id,
          detail: `assigned to ${route.assignedEmail || route.assignedTo}`,
        })
      }
      setForm({ name: '', phone: '', service: '', value: '', status: 'new' })
      setFormError('')
      setDupWarning([])
      setCustomValues({})
      setShowAddInquiry(false)
    } catch (error) {
      console.error('Add inquiry failed:', error)
      setFormError('Could not save — please try again.')
    }
  }

  // #140 — CSV export of exactly the filtered list on screen (search +
  // status filter applied, render cap ignored). Scoped by construction:
  // `filtered` only ever contains rows this user can already see.
  // #13 — custom columns ride along when fields are defined.
  function handleExportCsv() {
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
    downloadCsv('wynback-inquiries.csv', toCsv(columns, filtered))
  }

  async function handleBookingAsInquiry(booking) {
    try {
      const db = window.firebase?.firestore?.()
      const branchId = workspace?.role === 'branch_manager' ? workspace.branchId || '' : ''
      const route = await assignNext(db, workspace?.ownerUid, { branchId })
      const ref = await addInquiryDoc({
        name: booking.customerName,
        phone: booking.customerPhone,
        service: `Booking request — ${booking.preferredDate}${booking.preferredTime ? ` at ${booking.preferredTime}` : ''}`,
        value: 0,
        status: 'new',
        date: 'Just now',
        createdAt: Date.now(),
        assignedTo: route.assignedTo,
        assignedAt: route.assignedAt,
        assignedBy: route.assignedBy,
        source: 'booking',
        branchId,
      })
      if (route.assignedTo && ref) {
        logAudit(workspace.ownerUid, {
          action: 'status_changed',
          inquiryId: ref.id,
          detail: `assigned to ${route.assignedEmail || route.assignedTo}`,
        })
      }
    } catch (error) {
      console.error('Add booking as inquiry failed:', error)
    }
  }

  // Gate 6 backfill (owner/admin only): run the round-robin router
  // over every currently-unassigned row and report how many routed
  // vs stayed unassigned vs errored. Routing only — this never sends
  // a message, never touches Blitz, and never re-deals rows that
  // already have an assignee.
  async function handleRouteUnassigned() {
    if (!workspace || routing) return
    const db = window.firebase?.firestore?.()
    if (!db) return
    setRouting(true)
    setRouteReport('')
    const unassigned = items.filter(item => (item.assignedTo || '') === '')
    let routed = 0
    let errored = 0
    let firstError = ''
    const updates = []
    for (const item of unassigned) {
      const route = await assignNext(db, workspace.ownerUid, {
        branchId: item.branchId || '',
      })
      if (!route.assignedTo) {
        // Round-2: a thrown transaction is NOT "no available agent".
        // assignNext marks it routing: 'error'; only a genuine
        // zero-candidates result ('no-candidates') keeps that wording.
        if (route.routing === 'error') {
          errored += 1
          if (!firstError) firstError = route.routingError || 'routing failed'
        }
        continue
      }
      try {
        await db
          .collection('users')
          .doc(workspace.ownerUid)
          .collection('inquiries')
          .doc(String(item.id))
          .update({
            assignedTo: route.assignedTo,
            assignedAt: route.assignedAt,
            assignedBy: route.assignedBy,
          })
        routed += 1
        updates.push({
          id: item.id,
          assignedTo: route.assignedTo,
          assignedAt: route.assignedAt,
          assignedBy: route.assignedBy,
          assignedEmail: route.assignedEmail || '',
        })
      } catch (error) {
        // assignNext already bumped the pick's count; the row stays
        // unassigned, but this is a write error, not "no agent".
        console.error('Route unassigned update failed:', error)
        errored += 1
        if (!firstError) firstError = error?.message || 'update failed'
      }
    }
    if (updates.length > 0) {
      setItems(current =>
        current.map(item => {
          const update = updates.find(u => u.id === item.id)
          return update ? { ...item, ...update } : item
        })
      )
      // Bulk-route audit: one 'inquiry_assigned' entry per routed
      // row, matching the manual-assignment action. Previously the
      // bulk action logged nothing, so its rows were invisible in
      // the audit filter even though routing itself worked.
      updates.forEach(u => {
        logAudit(workspace.ownerUid, {
          action: 'inquiry_assigned',
          inquiryId: u.id,
          detail: `assigned to ${u.assignedEmail || u.assignedTo}`,
        })
      })
    }
    setRouting(false)
    const stayed = unassigned.length - routed - errored
    if (unassigned.length === 0) {
      setRouteReport('No unassigned inquiries.')
    } else {
      const parts = [
        `Routed ${routed} of ${unassigned.length} unassigned ${unassigned.length === 1 ? 'inquiry' : 'inquiries'}.`,
      ]
      if (stayed > 0) {
        parts.push(`${stayed} stayed unassigned (no available agent).`)
      }
      if (errored > 0) {
        parts.push(`${errored} could not be routed (error: ${String(firstError).slice(0, 200)}).`)
      }
      setRouteReport(parts.join(' '))
    }
  }

  const options = [
    ['all', 'All statuses'],
    ['new', 'New'],
    ['followup', 'Follow up'],
    ['replied', 'Replied'],
    ['recovered', 'Recovered'],
    ['lost', 'Lost'],
    // Batch 5: the unassigned queue — rows no available agent picked
    // up. Admins see them here; reps/managers never do (scope rules).
    ['unassigned', 'Unassigned'],
  ]

  const selectedLabel =
    options.find(([value]) => value === statusFilter)?.[1] ||
    'All statuses'

  const filtered = items.filter(item => {
    const query = search.toLowerCase().trim()

    const matchesSearch =
      !query ||
      (item.name || '').toLowerCase().includes(query) ||
      (item.phone || '').toLowerCase().includes(query) ||
      (item.service || '').toLowerCase().includes(query)

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'unassigned'
        ? (item.assignedTo || '') === ''
        : item.status === statusFilter)

    return matchesSearch && matchesStatus
  })

  const displayed = sortByScore
    ? rankByWinback(filtered).map(r => r.inquiry)
    : filtered

  // Batch 5: render cap (see visibleCount). The full filtered count
  // still shows in the toolbar; only rendering is paged.
  const visible = displayed.slice(0, visibleCount)

  return (
    <div className="inquiries-page">
      <div className="inquiries-inner">

        <header className="inquiries-header">
          <div>
            <span className="app-eyebrow">INQUIRIES</span>
            <h1>Inquiry pipeline</h1>
            <p>Track every opportunity from first inquiry to recovery.</p>
          </div>

          <div className="inquiries-header-actions">
          {workspace?.role !== 'sales_rep' && (
            <button
              type="button"
              className="primary-button"
              onClick={() => setShowAddInquiry(true)}
            >
              <IconPlus width={13} height={13} /> Add inquiry
            </button>
          )}
          {(workspace?.role === 'owner' || workspace?.role === 'admin') && (
            <button
              type="button"
              className="ghost-button"
              onClick={() => setShowCsvImport(true)}
            >
              Import CSV
            </button>
          )}
          <button
            type="button"
            className="ghost-button"
            onClick={handleExportCsv}
          >
            Export CSV
          </button>
          {canManageTeam(workspace?.role) && (
            <button
              type="button"
              className="ghost-button"
              onClick={handleRouteUnassigned}
              disabled={routing}
            >
              {routing ? 'Routing…' : 'Route unassigned now'}
            </button>
          )}
          </div>
        </header>

        {routeReport && (
          <p className="route-report">{routeReport}</p>
        )}

        <section className="inquiries-panel">

          <div className="inquiries-toolbar">
            <div>
              <h2>All inquiries</h2>
              <p>
                {`${filtered.length} ${filtered.length === 1 ? 'inquiry' : 'inquiries'}`}
              </p>
            </div>

            <div className="inquiries-tools">

              <input
                type="search"
                placeholder="Search name, phone or service"
                value={search}
                onChange={event => setSearch(event.target.value)}
              />

              <div className="inquiry-filter-wrap">
                <button
                  type="button"
                  className="inquiry-filter-button"
                  onClick={() => setShowMenu(value => !value)}
                >
                  <span>{selectedLabel}</span>
                  <span className={`filter-chevron ${showMenu ? 'open' : ''}`}>
                    ↓
                  </span>
                </button>

                {showMenu && (
                  <div className="inquiry-filter-menu">
                    {options.map(([value, label]) => (
                      <button
                        type="button"
                        key={value}
                        className={`inquiry-filter-option ${
                          statusFilter === value ? 'active' : ''
                        }`}
                        onClick={() => {
                          setStatusFilter(value)
                          setShowMenu(false)
                        }}
                      >
                        <span>{label}</span>
                        {statusFilter === value && <span>✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

          <div className="inquiry-table-wrap">
          <div className="inquiry-table-head">
            <span>Customer</span>
            <span>Service</span>
            <span>Value</span>
            <span>
              <button
                type="button"
                className={sortByScore ? 'score-sort active' : 'score-sort'}
                onClick={() => setSortByScore(v => !v)}
                title="Sort by win-back score"
              >
                Win-back {sortByScore ? '↓' : '↕'}
              </button>
            </span>
            <span>Status</span>
          </div>

          <div className="inquiry-list">
            {visible.map(item => (
              <div className="inquiry-page-row" key={item.id}>

                <button
                  type="button"
                  className="inquiry-page-customer"
                  onClick={() =>
                    navigate(`/app/inquiry?inquiry=${item.id}`)
                  }
                >
                  <strong>{item.name}</strong>
                  <span>{item.phone}</span>
                </button>

                <div className="inquiry-page-service">
                  {item.service}
                </div>

                <strong className="inquiry-page-value">
                  {formatMoney(item.value, currency)}
                </strong>

                <WinbackScoreBadge inquiry={item} />

                <span className={`status status-${item.status}`}>
                  {statusLabels[item.status]}
                </span>

              </div>
            ))}

            {displayed.length === 0 && (
              <div className="inquiries-empty">
                No inquiries found.
              </div>
            )}
          </div>
          {displayed.length > visible.length && (
            <div className="inquiries-show-more">
              <p>Showing {visible.length} of {displayed.length} inquiries.</p>
              <button type="button" className="ghost-button" onClick={() => setVisibleCount(c => c + 200)}>
                Show more
              </button>
            </div>
          )}
          </div>

        </section>

        {canManageTeam(workspace?.role) && (
          <OwnerBookings onAddInquiry={handleBookingAsInquiry} />
        )}

        <CsvImport
          open={showCsvImport}
          onClose={() => setShowCsvImport(false)}
          workspace={workspace}
          existingItems={items}
          onImported={rows => setItems(current => [...rows, ...current])}
        />

        <Modal open={showAddInquiry} onClose={() => { setShowAddInquiry(false); setDupWarning([]) }}>
          <div className="modal-header">
            <div>
              <span className="app-eyebrow">NEW CUSTOMER</span>
              <h2>Add inquiry</h2>
              <p>Capture a customer before the opportunity disappears.</p>
            </div>

            <button
              type="button"
              className="modal-close"
              onClick={() => { setShowAddInquiry(false); setDupWarning([]) }}
              aria-label="Close"
            >
              <IconX width={15} height={15} />
            </button>
          </div>

          <form onSubmit={handleAddInquiry}>
            <div className="voice-form-row">
              <span>Don't want to type?</span>
              <VoiceInput
                onResult={({ name, service, value }) => {
                  // This page has no follow-up form for a voice note to
                  // land in, so only the customer fields are filled.
                  setForm(f => ({
                    ...f,
                    name: name || f.name,
                    service: service || f.service,
                    value: value || f.value,
                  }))
                }}
              />
            </div>
            <div className="form-grid">
              <label>
                Customer name
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                />
              </label>

              <label>
                Phone
                <input
                  value={form.phone}
                  onChange={e => { setForm({ ...form, phone: e.target.value }); setDupWarning([]) }}
                  placeholder="+91 98765 43210"
                />
              </label>

              <label className="full-field">
                Service
                <input
                  value={form.service}
                  onChange={e => setForm({ ...form, service: e.target.value })}
                  placeholder="e.g. Ceramic Coating"
                />
              </label>

              <label>
                Estimated value
                <div className="money-input">
                  <span>{currencySymbol(currency)}</span>
                  <input
                    type="number"
                    min="0"
                    value={form.value}
                    onChange={e => setForm({ ...form, value: e.target.value })}
                    placeholder="5000"
                  />
                </div>
              </label>

              <label>
                Initial status
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                >
                  <option value="new">New</option>
                  <option value="followup">Follow up</option>
                  <option value="replied">Replied</option>
                </select>
              </label>

              {/* #13 — custom fields defined in Settings. Nothing renders
                  when none are defined. */}
              <CustomFieldInputs
                fields={customFields}
                values={customValues}
                onChange={(id, value) =>
                  setCustomValues(prev => ({ ...prev, [id]: value }))
                }
              />
            </div>

            {dupWarning.length > 0 && (
              <div className="form-warning" role="alert">
                <strong>Same phone already open:</strong>
                <ul>
                  {dupWarning.map(dup => (
                    <li key={dup.id}>
                      {dup.name} — {dup.service} ({statusLabels[dup.status] || dup.status})
                    </li>
                  ))}
                </ul>
                <p>
                  This may be the same customer twice. Save anyway only if
                  this is a genuinely new inquiry.
                </p>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => handleAddInquiry(null, true)}
                >
                  Save anyway
                </button>
              </div>
            )}

            {formError && <div className="form-error">{formError}</div>}

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => { setShowAddInquiry(false); setDupWarning([]) }}
              >
                Cancel
              </button>

              <button type="submit" className="save-button">
                Add inquiry
              </button>
            </div>
          </form>
        </Modal>

      </div>
    </div>
  )
}
