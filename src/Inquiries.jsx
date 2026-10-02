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

export default function Inquiries() {
  const navigate = useNavigate()

  const [items, setItems] = useState([])

  useEffect(() => {
    const auth = window.firebase?.auth?.()
    const db = window.firebase?.firestore?.()

    if (!auth || !db) return

    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (!user) {
        setItems([])
        return
      }

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
        console.error('Inquiries load failed:', error)
        setItems([])
      }
    })

    return unsubscribe
  }, [])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showMenu, setShowMenu] = useState(false)

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
      item.name.toLowerCase().includes(query) ||
      item.phone.toLowerCase().includes(query) ||
      item.service.toLowerCase().includes(query)

    const matchesStatus =
      statusFilter === 'all' || item.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="inquiries-page">
      <div className="inquiries-inner">

        <header className="inquiries-header">
          <div>
            <span className="app-eyebrow">INQUIRIES</span>
            <h1>Inquiry pipeline</h1>
            <p>Track every opportunity from first inquiry to recovery.</p>
          </div>

          <button
            className="primary-button"
            onClick={() => navigate('/app')}
          >
            Back to dashboard
          </button>
        </header>

        <section className="inquiries-panel">

          <div className="inquiries-toolbar">
            <div>
              <h2>All inquiries</h2>
              <p>
                {filtered.length} inquiry
                {filtered.length === 1 ? '' : 'ies'}
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

          <div className="inquiry-table-head">
            <span>Customer</span>
            <span>Service</span>
            <span>Value</span>
            <span>Status</span>
          </div>

          <div className="inquiry-list">
            {filtered.map(item => (
              <div className="inquiry-page-row" key={item.id}>

                <button
                  type="button"
                  className="inquiry-page-customer"
                  onClick={() =>
                    navigate(`/app?inquiry=${item.id}`)
                  }
                >
                  <strong>{item.name}</strong>
                  <span>{item.phone}</span>
                </button>

                <div className="inquiry-page-service">
                  {item.service}
                </div>

                <strong className="inquiry-page-value">
                  {money(item.value)}
                </strong>

                <span className={`status status-${item.status}`}>
                  {statusLabels[item.status]}
                </span>

              </div>
            ))}

            {filtered.length === 0 && (
              <div className="inquiries-empty">
                No inquiries found.
              </div>
            )}
          </div>

        </section>
      </div>
    </div>
  )
}
