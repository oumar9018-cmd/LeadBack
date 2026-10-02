import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const statusLabels = {
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

export default function Revenue() {
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
        console.error('Revenue load failed:', error)
        setItems([])
        setLoadError('Unable to load revenue records. Please try again.')
      } finally {
        setLoading(false)
      }
    })

    return unsubscribe
  }, [])

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showMenu, setShowMenu] = useState(false)

  const recovered = items.filter(item => item.status === 'recovered')
  const lost = items.filter(item => item.status === 'lost')

  const recoveredRevenue = recovered.reduce(
    (sum, item) => sum + Number(item.value || 0),
    0
  )

  const lostRevenue = lost.reduce(
    (sum, item) => sum + Number(item.value || 0),
    0
  )

  const totalValue = items.reduce(
    (sum, item) => sum + Number(item.value || 0),
    0
  )

  const recoveryRate = items.length
    ? Math.round((recovered.length / items.length) * 100)
    : 0

  const averageRecovery = recovered.length
    ? Math.round(recoveredRevenue / recovered.length)
    : 0

  const serviceBreakdown = useMemo(() => {
    const map = {}

    recovered.forEach(item => {
      const service = item.service || 'Other'
      map[service] = (map[service] || 0) + Number(item.value || 0)
    })

    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
  }, [items])

  const options = [
    ['all', 'All revenue'],
    ['recovered', 'Recovered'],
    ['lost', 'Lost opportunity'],
  ]

  const selectedLabel =
    options.find(([value]) => value === filter)?.[1] ||
    'All revenue'

  const filtered = items
    .filter(item => {
      if (filter === 'all') return item.status === 'recovered' || item.status === 'lost'
      return item.status === filter
    })
    .filter(item => {
      const query = search.toLowerCase().trim()

      return (
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.service.toLowerCase().includes(query)
      )
    })

  return (
    <div className="revenue-page">
      <div className="revenue-inner">

        <header className="revenue-header">
          <div>
            <span className="app-eyebrow">REVENUE</span>
            <h1>Revenue recovery</h1>
            <p>See the value your follow-up process is recovering.</p>
          </div>

          <button
            className="primary-button"
            onClick={() => navigate('/app')}
          >
            Back to dashboard
          </button>
        </header>

        <section className="revenue-stats">

          <div className="revenue-stat featured">
            <span>Total recovered</span>
            <strong>{money(recoveredRevenue)}</strong>
            <small>Revenue from recovered inquiries</small>
          </div>

          <div className="revenue-stat">
            <span>Recovered inquiries</span>
            <strong>{recovered.length}</strong>
            <small>Customers converted</small>
          </div>

          <div className="revenue-stat">
            <span>Average recovery</span>
            <strong>{money(averageRecovery)}</strong>
            <small>Average value per recovery</small>
          </div>

          <div className="revenue-stat">
            <span>Recovery rate</span>
            <strong>{recoveryRate}%</strong>
            <small>Across all inquiries</small>
          </div>

        </section>

        <section className="revenue-overview">

          <div className="revenue-overview-card">
            <div>
              <span className="revenue-label">OPPORTUNITY VALUE</span>
              <h2>{money(totalValue)}</h2>
              <p>Total value across all tracked inquiries.</p>
            </div>

            <div className="revenue-opportunity">
              <div>
                <span>Recovered</span>
                <strong>{money(recoveredRevenue)}</strong>
              </div>

              <div>
                <span>Lost</span>
                <strong>{money(lostRevenue)}</strong>
              </div>
            </div>
          </div>

          <div className="revenue-overview-card">
            <span className="revenue-label">RECOVERED BY SERVICE</span>

            {serviceBreakdown.length > 0 ? (
              <div className="service-breakdown">
                {serviceBreakdown.map(([service, value]) => {
                  const percent = recoveredRevenue
                    ? Math.round((value / recoveredRevenue) * 100)
                    : 0

                  return (
                    <div className="service-row" key={service}>
                      <div>
                        <span>{service}</span>
                        <strong>{money(value)}</strong>
                      </div>

                      <div className="service-bar">
                        <span style={{ width: `${percent}%` }}></span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="revenue-empty-small">
                Recovered revenue will appear here.
              </p>
            )}
          </div>

        </section>

        <section className="revenue-panel">

          <div className="revenue-toolbar">
            <div>
              <h2>Revenue activity</h2>
              <p>
                {filtered.length} record
                {filtered.length === 1 ? '' : 's'}
              </p>
            </div>

            <div className="revenue-tools">

              <input
                type="search"
                placeholder="Search customer or service"
                value={search}
                onChange={event => setSearch(event.target.value)}
              />

              <div className="revenue-filter-wrap">
                <button
                  type="button"
                  className="revenue-filter-button"
                  onClick={() => setShowMenu(value => !value)}
                >
                  <span>{selectedLabel}</span>
                  <span className={`filter-chevron ${showMenu ? 'open' : ''}`}>
                    ↓
                  </span>
                </button>

                {showMenu && (
                  <div className="revenue-filter-menu">
                    {options.map(([value, label]) => (
                      <button
                        type="button"
                        key={value}
                        className={`revenue-filter-option ${
                          filter === value ? 'active' : ''
                        }`}
                        onClick={() => {
                          setFilter(value)
                          setShowMenu(false)
                        }}
                      >
                        <span>{label}</span>
                        {filter === value && <span>✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

          <div className="revenue-list">

            {filtered.map(item => (
              <button
                type="button"
                className="revenue-row"
                key={item.id}
                onClick={() =>
                  navigate(`/app?inquiry=${item.id}`)
                }
              >
                <div className="revenue-customer">
                  <strong>{item.name}</strong>
                  <span>{item.service}</span>
                </div>

                <span
                  className={`status status-${item.status}`}
                >
                  {statusLabels[item.status]}
                </span>

                <strong className="revenue-row-value">
                  {money(item.value)}
                </strong>
              </button>
            ))}

            {loading && (
              <div className="revenue-empty">
                Loading revenue records…
              </div>
            )}

            {!loading && loadError && (
              <div className="revenue-empty">
                {loadError}
              </div>
            )}

            {!loading && !loadError && filtered.length === 0 && (
              <div className="revenue-empty">
                No revenue records found.
              </div>
            )}

          </div>

        </section>

      </div>
    </div>
  )
}
