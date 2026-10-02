import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const statusLabels = {
  new: 'New',
  followup: 'Follow up',
  replied: 'Replied',
  recovered: 'Recovered',
  lost: 'Lost',
}

function money(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function Customers() {
  const navigate = useNavigate()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    const auth = window.firebase?.auth?.()
    const db = window.firebase?.firestore?.()

    if (!auth || !db) return

    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (!user) {
        setItems([])
        setLoading(false)
        setLoadError('')
        return
      }

      setLoading(true)
      setLoadError('')

      try {
        const snapshot = await db
          .collection('users')
          .doc(user.uid)
          .collection('inquiries')
          .get()

        setItems(
          snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }))
        )
      } catch (error) {
        console.error('Customers load failed:', error)
        setItems([])
        setLoadError('Unable to load customers. Please try again.')
      } finally {
        setLoading(false)
      }
    })

    return unsubscribe
  }, [])

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
      item.name.toLowerCase().includes(query) ||
      item.phone.toLowerCase().includes(query) ||
      item.service.toLowerCase().includes(query)

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
            onClick={() => navigate('/app')}
          >
            Back to dashboard
          </button>
        </header>

        <section className="dashboard-panel customers-panel">

          <div className="panel-header">
            <div>
              <h2>All customers</h2>
              <p>
                {filtered.length} customer
                {filtered.length === 1 ? '' : 's'}
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
                  onClick={() => navigate(`/app?inquiry=${item.id}`)}
                >
                  <strong>{item.name}</strong>
                  <span>{item.phone}</span>
                </button>

                <div className="customer-service">
                  <span>{item.service}</span>
                  <strong>{money(item.value)}</strong>
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
