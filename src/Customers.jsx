import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CURRENCY_CODES,
  defaultCurrencyForBrowser,
  formatMoney,
} from './utils/money.js'
import { useWorkspace } from './components/WorkspaceContext.jsx'
import { inScope } from './utils/workspace.js'

const statusLabels = {
  new: 'New',
  followup: 'Follow up',
  replied: 'Replied',
  recovered: 'Recovered',
  lost: 'Lost',
}

export default function Customers() {
  const navigate = useNavigate()
  // Batch 4: workspace root + role (solo owners: own uid, role 'owner').
  const { workspace, loading: wsLoading } = useWorkspace()

  const [items, setItems] = useState([])
  const [currency, setCurrency] = useState(() => defaultCurrencyForBrowser())
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  // Loads from the workspace owner's data root. Gate 6 fix: Firestore
  // rules are NOT filters — an unfiltered collection get is denied
  // outright for staff, because the per-doc rule only allows rows in
  // their scope. The query itself is therefore scoped server-side to
  // exactly what the rule allows (rep: assignedTo == uid; manager:
  // branchId == branch). inScope() below stays as belt-and-braces.
  useEffect(() => {
    if (wsLoading || !workspace) {
      if (!wsLoading) {
        setItems([])
        setLoading(false)
        setLoadError('')
      }
      return undefined
    }
    const db = window.firebase?.firestore?.()
    if (!db) return undefined
    let cancelled = false
    setLoading(true)
    setLoadError('')
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
        console.error('Customers load failed:', error)
        if (!cancelled) {
          setItems([])
          setLoadError('Unable to load customers. Please try again.')
        }
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
        console.error('Customers currency load failed:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [wsLoading, workspace])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showStatusMenu, setShowStatusMenu] = useState(false)

  const statusOptions = [
    ['all', 'All statuses'],
    ['new', 'New'],
    ['followup', 'Follow up'],
    ['replied', 'Replied'],
    ['recovered', 'Recovered'],
    ['lost', 'Lost'],
  ]

  const selectedStatusLabel =
    statusOptions.find(([value]) => value === statusFilter)?.[1] ||
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

  return (
    <div className="customers-page">
      <div className="customers-page-inner">

        <header className="customers-page-header">
          <div>
            <span className="app-eyebrow">CUSTOMERS</span>
            <h1>Customer directory</h1>
            <p>Every inquiry and opportunity in one place.</p>
          </div>

          <button
            className="primary-button"
            onClick={() => navigate('/app/inquiries')}
          >
            Back to inquiries
          </button>
        </header>

        <section className="dashboard-panel customers-panel">

          <div className="panel-header">
            <div>
              <h2>All customers</h2>
              <p>
                {`${filtered.length} ${filtered.length === 1 ? 'customer' : 'customers'}`}
              </p>
            </div>

            <div className="customer-tools">
              <input
                className="customer-search"
                type="search"
                placeholder="Search name, phone or service"
                value={search}
                onChange={event => setSearch(event.target.value)}
              />

              <div className="status-filter-wrap">
                <button
                  type="button"
                  className="customer-status-filter"
                  onClick={() => setShowStatusMenu(value => !value)}
                >
                  <span>{selectedStatusLabel}</span>
                  <span className={`filter-chevron ${showStatusMenu ? 'open' : ''}`}>
                    ↓
                  </span>
                </button>

                {showStatusMenu && (
                  <div className="status-filter-menu">
                    {statusOptions.map(([value, label]) => (
                      <button
                        type="button"
                        key={value}
                        className={`status-filter-option ${
                          statusFilter === value ? 'active' : ''
                        }`}
                        onClick={() => {
                          setStatusFilter(value)
                          setShowStatusMenu(false)
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

          <div className="customer-list">

            {filtered.map(item => (
              <div className="customer-row" key={item.id}>

                <button
                  type="button"
                  className="customer-main customer-main-button"
                  onClick={() => navigate(`/app/inquiry?inquiry=${item.id}`)}
                >
                  <strong>{item.name}</strong>
                  <span>{item.phone}</span>
                </button>

                <div className="customer-service">
                  <span>{item.service}</span>
                  <strong>{formatMoney(item.value, currency)}</strong>
                </div>

                <span className={`status status-${item.status}`}>
                  {statusLabels[item.status]}
                </span>

              </div>
            ))}

            {loading && (
              <div className="empty-state">
                Loading customers…
              </div>
            )}

            {!loading && loadError && (
              <div className="empty-state">
                {loadError}
              </div>
            )}

            {!loading && !loadError && filtered.length === 0 && (
              <div className="empty-state">
                No customers found.
              </div>
            )}

          </div>
        </section>
      </div>
    </div>
  )
}
