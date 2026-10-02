import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function money(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

function getFollowupState(item) {
  if (!item.followup?.date || !item.followup?.time) {
    return 'unscheduled'
  }

  const scheduled = new Date(
    `${item.followup.date}T${item.followup.time}`
  )

  const now = new Date()

  if (scheduled < now) return 'overdue'

  const today = new Date().toISOString().slice(0, 10)

  if (item.followup.date === today) return 'today'

  return 'upcoming'
}

const labels = {
  today: 'Due today',
  overdue: 'Overdue',
  upcoming: 'Upcoming',
  unscheduled: 'Unscheduled',
}

export default function Followups() {
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
        console.error('Followups load failed:', error)
        setItems([])
        setLoadError('Unable to load follow-ups. Please try again.')
      } finally {
        setLoading(false)
      }
    })

    return unsubscribe
  }, [])

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showMenu, setShowMenu] = useState(false)

  const options = [
    ['all', 'All follow-ups'],
    ['today', 'Due today'],
    ['overdue', 'Overdue'],
    ['upcoming', 'Upcoming'],
    ['unscheduled', 'Unscheduled'],
  ]

  const selectedLabel =
    options.find(([value]) => value === filter)?.[1] ||
    'All follow-ups'

  const followups = items
    .filter(item => item.status === 'followup')
    .map(item => ({
      ...item,
      followupState: getFollowupState(item),
    }))

  const filtered = followups.filter(item => {
    const query = search.toLowerCase().trim()

    const matchesSearch =
      !query ||
      item.name.toLowerCase().includes(query) ||
      item.phone.toLowerCase().includes(query) ||
      item.service.toLowerCase().includes(query)

    const matchesFilter =
      filter === 'all' || item.followupState === filter

    return matchesSearch && matchesFilter
  })

  return (
    <div className="followups-page">
      <div className="followups-inner">

        <header className="followups-header">
          <div>
            <span className="app-eyebrow">FOLLOW-UPS</span>
            <h1>Follow-up queue</h1>
            <p>Stay on top of every customer you still need to contact.</p>
          </div>

          <button
            className="primary-button"
            onClick={() => navigate('/app')}
          >
            Back to dashboard
          </button>
        </header>

        <div className="followup-summary">
          <div>
            <span>Due today</span>
            <strong>
              {followups.filter(x => x.followupState === 'today').length}
            </strong>
          </div>

          <div>
            <span>Overdue</span>
            <strong>
              {followups.filter(x => x.followupState === 'overdue').length}
            </strong>
          </div>

          <div>
            <span>Upcoming</span>
            <strong>
              {followups.filter(x => x.followupState === 'upcoming').length}
            </strong>
          </div>
        </div>

        <section className="followups-panel">

          <div className="followups-toolbar">
            <div>
              <h2>Follow-up queue</h2>
              <p>
                {filtered.length} customer
                {filtered.length === 1 ? '' : 's'}
              </p>
            </div>

            <div className="followups-tools">

              <input
                type="search"
                placeholder="Search name, phone or service"
                value={search}
                onChange={event => setSearch(event.target.value)}
              />

              <div className="followup-filter-wrap">
                <button
                  type="button"
                  className="followup-filter-button"
                  onClick={() => setShowMenu(value => !value)}
                >
                  <span>{selectedLabel}</span>
                  <span className={`filter-chevron ${showMenu ? 'open' : ''}`}>
                    ↓
                  </span>
                </button>

                {showMenu && (
                  <div className="followup-filter-menu">
                    {options.map(([value, label]) => (
                      <button
                        type="button"
                        key={value}
                        className={`followup-filter-option ${
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

          <div className="followup-list">
            {filtered.map(item => (
              <button
                type="button"
                className="followup-row"
                key={item.id}
                onClick={() => navigate(`/app?inquiry=${item.id}`)}
              >
                <div className="followup-customer">
                  <strong>{item.name}</strong>
                  <span>{item.phone}</span>
                </div>

                <div className="followup-service">
                  <strong>{item.service}</strong>
                  {item.followup?.note && (
                    <span>{item.followup.note}</span>
                  )}
                </div>

                <div className="followup-date">
                  {item.followup ? (
                    <>
                      <strong>
                        {item.followup.date}
                      </strong>
                      <span>
                        {item.followup.time}
                      </span>
                    </>
                  ) : (
                    <span>No time scheduled</span>
                  )}
                </div>

                <div className="followup-right">
                  <span className={`queue-status queue-${item.followupState}`}>
                    {labels[item.followupState]}
                  </span>
                  <strong>{money(item.value)}</strong>
                </div>
              </button>
            ))}

            {loading && (
              <div className="followups-empty">
                Loading follow-ups…
              </div>
            )}

            {!loading && loadError && (
              <div className="followups-empty">
                {loadError}
              </div>
            )}

            {!loading && !loadError && filtered.length === 0 && (
              <div className="followups-empty">
                No follow-ups found.
              </div>
            )}
          </div>

        </section>
      </div>
    </div>
  )
}
