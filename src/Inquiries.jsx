import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import WinbackScoreBadge from './components/WinbackScore.jsx'
import Modal from './components/Modal.jsx'
import VoiceInput from './components/VoiceInput.jsx'
import OwnerBookings from './components/OwnerBookings.jsx'
import { useWorkspace } from './components/WorkspaceContext.jsx'
import { canManageTeam, inScope } from './utils/workspace.js'
import { IconPlus, IconX } from './components/icons.jsx'
import { rankByWinback } from './utils/winbackScore.js'
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

  // Loads from the workspace owner's data root and filters to the
  // member's scope (rules filter server-side too).
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
        const snapshot = await db
          .collection('users')
          .doc(workspace.ownerUid)
          .collection('inquiries')
          .get()
        if (cancelled) return
        const uid = window.firebase?.auth?.().currentUser?.uid
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
  const [form, setForm] = useState({
    name: '',
    phone: '',
    service: '',
    value: '',
    status: 'new',
  })
  const [formError, setFormError] = useState('')

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

  async function handleAddInquiry(event) {
    event.preventDefault()

    if (
      !form.name.trim() ||
      !form.phone.trim() ||
      !form.service.trim() ||
      !form.value
    ) {
      setFormError('Please complete all required fields.')
      return
    }

    try {
      await addInquiryDoc({
        name: form.name.trim(),
        phone: form.phone.trim(),
        service: form.service.trim(),
        value: Number(form.value),
        status: form.status,
        date: 'Just now',
        createdAt: Date.now(),
        assignedTo: '',
        branchId: workspace?.role === 'branch_manager' ? workspace.branchId || '' : '',
      })
      setForm({ name: '', phone: '', service: '', value: '', status: 'new' })
      setFormError('')
      setShowAddInquiry(false)
    } catch (error) {
      console.error('Add inquiry failed:', error)
      setFormError('Could not save — please try again.')
    }
  }

  async function handleBookingAsInquiry(booking) {
    try {
      await addInquiryDoc({
        name: booking.customerName,
        phone: booking.customerPhone,
        service: `Booking request — ${booking.preferredDate}${booking.preferredTime ? ` at ${booking.preferredTime}` : ''}`,
        value: 0,
        status: 'new',
        date: 'Just now',
        createdAt: Date.now(),
        assignedTo: '',
        branchId: workspace?.role === 'branch_manager' ? workspace.branchId || '' : '',
      })
    } catch (error) {
      console.error('Add booking as inquiry failed:', error)
    }
  }

  const options = [
    ['all', 'All statuses'],
    ['new', 'New'],
    ['followup', 'Follow up'],
    ['replied', 'Replied'],
    ['recovered', 'Recovered'],
    ['lost', 'Lost'],
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
      statusFilter === 'all' || item.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const displayed = sortByScore
    ? rankByWinback(filtered).map(r => r.inquiry)
    : filtered

  return (
    <div className="inquiries-page">
      <div className="inquiries-inner">

        <header className="inquiries-header">
          <div>
            <span className="app-eyebrow">INQUIRIES</span>
            <h1>Inquiry pipeline</h1>
            <p>Track every opportunity from first inquiry to recovery.</p>
          </div>

          {workspace?.role !== 'sales_rep' && (
            <button
              type="button"
              className="primary-button"
              onClick={() => setShowAddInquiry(true)}
            >
              <IconPlus width={13} height={13} /> Add inquiry
            </button>
          )}
        </header>

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
            {displayed.map(item => (
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
          </div>

        </section>

        {canManageTeam(workspace?.role) && (
          <OwnerBookings onAddInquiry={handleBookingAsInquiry} />
        )}

        <Modal open={showAddInquiry} onClose={() => setShowAddInquiry(false)}>
          <div className="modal-header">
            <div>
              <span className="app-eyebrow">NEW CUSTOMER</span>
              <h2>Add inquiry</h2>
              <p>Capture a customer before the opportunity disappears.</p>
            </div>

            <button
              type="button"
              className="modal-close"
              onClick={() => setShowAddInquiry(false)}
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
                  onChange={e => setForm({ ...form, phone: e.target.value })}
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
            </div>

            {formError && <div className="form-error">{formError}</div>}

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => setShowAddInquiry(false)}
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
