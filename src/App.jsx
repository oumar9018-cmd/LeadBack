import React, { useEffect, useState } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useSearchParams,
  useLocation,
} from 'react-router-dom'
import Home from './Home.jsx'
import SEOPage from './SEOPage.jsx'
import Customers from './Customers.jsx'
import Billing from './Billing.jsx'
import Settings from './Settings.jsx'
import Profile from './Profile.jsx'
import Login from './Login.jsx'
import Inquiries from './Inquiries.jsx'
import Followups from './Followups.jsx'
import Revenue from './Revenue.jsx'
import CEO from './CEO.jsx'
import Trial from './Trial.jsx'
import AppLayout from './AppLayout.jsx'
import { ROUTER_BASENAME } from './basePath.js'
// Single source of truth for the marketing routes — see src/seo/pages.js.
// Adding a page to SEO_PAGES registers its route, nav link, sitemap entry and
// prerendered HTML automatically.
import { ROUTED_SEO_PAGES } from './seo/pages.js'
import './App.css'

const statusLabels = {
  new: 'New',
  followup: 'Follow up',
  replied: 'Replied',
  recovered: 'Recovered',
  lost: 'Lost',
}

function money(value, currency = 'INR') {
  const locales = {
    INR: 'en-IN',
    USD: 'en-US',
    GBP: 'en-GB',
    EUR: 'de-DE',
  }

  return new Intl.NumberFormat(locales[currency] || 'en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

/* ------------------------------------------------------------------ */
/* Dashboard — main overview page.                                     */
/* The sidebar/header/footer shell is now provided by <AppLayout/> so  */
/* this component renders only its content.                            */
/* ------------------------------------------------------------------ */
function Dashboard() {
  const [authUser, setAuthUser] = useState(
    () => window.firebase?.auth?.().currentUser || null
  )
  const [profileOpen, setProfileOpen] = useState(false)
  const [businessName, setBusinessName] = useState('')
  const [profileName, setProfileName] = useState('')
  const [currency, setCurrency] = useState('INR')

  useEffect(() => {
    const auth = window.firebase?.auth?.()
    const db = window.firebase?.firestore?.()

    if (!auth || !db) return

    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (!user) {
        setBusinessName('')
        setProfileName('')
        return
      }

      setProfileName(
        typeof user.displayName === 'string' ? user.displayName.trim() : ''
      )

      try {
        const snapshot = await db
          .collection('users')
          .doc(user.uid)
          .collection('settings')
          .doc('workspace')
          .get()

        const data = snapshot.exists ? snapshot.data() : {}
        const savedName = data?.businessName
        const savedCurrency = data?.currency

        setBusinessName(
          typeof savedName === 'string' ? savedName.trim() : ''
        )

        setCurrency(
          ['INR', 'USD', 'GBP', 'EUR'].includes(savedCurrency)
            ? savedCurrency
            : 'INR'
        )
      } catch (error) {
        console.error('Workspace settings load failed:', error)
        setBusinessName('')
      }
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    const firebaseAuth = window.firebase?.auth?.()
    if (!firebaseAuth) return

    setAuthUser(firebaseAuth.currentUser)

    const unsubscribe = firebaseAuth.onAuthStateChanged(user => {
      setAuthUser(user)
    })

    return unsubscribe
  }, [])

  const [items, setItems] = useState([])
  const [inquiriesLoaded, setInquiriesLoaded] = useState(false)
  const [inquiriesLoading, setInquiriesLoading] = useState(true)
  const [inquiriesError, setInquiriesError] = useState('')

  useEffect(() => {
    const auth = window.firebase?.auth?.()
    const db = window.firebase?.firestore?.()

    if (!auth || !db) return

    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (!user) {
        setItems([])
        setInquiriesLoaded(false)
        setInquiriesLoading(false)
        setInquiriesError('')
        return
      }

      setInquiriesLoading(true)
      setInquiriesError('')

      try {
        const snapshot = await db
          .collection('users')
          .doc(user.uid)
          .collection('inquiries')
          .orderBy('createdAt', 'desc')
          .get()

        const remoteItems = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))

        setItems(remoteItems)
      } catch (error) {
        console.error('Inquiry load failed:', error)
        setItems([])
        setInquiriesError('Unable to load inquiries. Please try again.')
      } finally {
        setInquiriesLoading(false)
        setInquiriesLoaded(true)
      }
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    if (!inquiriesLoaded) return

    const auth = window.firebase?.auth?.()
    const db = window.firebase?.firestore?.()
    const user = auth?.currentUser

    if (!user || !db) return

    const batch = db.batch()
    const userRef = db.collection('users').doc(user.uid)

    items.forEach(item => {
      const inquiryRef = userRef.collection('inquiries').doc(String(item.id))
      batch.set(inquiryRef, item, { merge: true })
    })

    if (items.length > 0) {
      batch.commit().catch(error => {
        console.error('Inquiry save failed:', error)
      })
    }
  }, [items, inquiriesLoaded])

  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showAddInquiry, setShowAddInquiry] = useState(false)
  const [selectedInquiry, setSelectedInquiry] = useState(null)

  const [searchParams] = useSearchParams()

  React.useEffect(() => {
    const inquiryId = searchParams.get('inquiry')
    if (!inquiryId) return

    const inquiry = items.find(item => String(item.id) === inquiryId)
    if (inquiry) {
      setSelectedInquiry(inquiry)
    }
  }, [items, searchParams])

  const [followupForm, setFollowupForm] = useState({
    date: '',
    time: '',
    note: '',
  })

  const [form, setForm] = useState({
    name: '',
    phone: '',
    service: '',
    value: '',
    status: 'new',
  })

  const [formError, setFormError] = useState('')

  const recovered = items.filter(item => item.status === 'recovered')
  const pending = items.filter(item => item.status === 'followup')
  const replied = items.filter(item => item.status === 'replied')

  const recoveredRevenue = recovered.reduce(
    (sum, item) => sum + Number(item.value || 0),
    0
  )

  const filteredItems = items.filter(item => {
    const matchesFilter = filter === 'all' || item.status === filter
    const query = search.toLowerCase()

    const matchesSearch =
      item.name?.toLowerCase().includes(query) ||
      item.service?.toLowerCase().includes(query)

    return matchesFilter && matchesSearch
  })

  function updateStatus(id, status) {
    setItems(current =>
      current.map(item => (item.id === id ? { ...item, status } : item))
    )
  }

  function getFollowupState(item) {
    if (!item.followup?.date || !item.followup?.time) return null

    const scheduled = new Date(`${item.followup.date}T${item.followup.time}`)
    const now = new Date()

    if (scheduled < now) return 'overdue'

    const today = now.toISOString().slice(0, 10)
    if (item.followup.date === today) return 'today'

    return 'upcoming'
  }

  function scheduleFollowup() {
    if (!selectedInquiry) return
    if (!followupForm.date || !followupForm.time) return

    const followup = {
      date: followupForm.date,
      time: followupForm.time,
      note: followupForm.note.trim(),
    }

    const historyEntry = {
      id: Date.now(),
      type: 'scheduled',
      date: followup.date,
      time: followup.time,
      note: followup.note,
    }

    setItems(current =>
      current.map(item =>
        item.id === selectedInquiry.id
          ? {
              ...item,
              status: 'followup',
              followup,
              followupHistory: [...(item.followupHistory || []), historyEntry],
            }
          : item
      )
    )

    setSelectedInquiry({
      ...selectedInquiry,
      status: 'followup',
      followup,
      followupHistory: [
        ...(selectedInquiry.followupHistory || []),
        historyEntry,
      ],
    })

    setFollowupForm({ date: '', time: '', note: '' })
  }

  function handleAddInquiry(event) {
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

    const newInquiry = {
      id: Date.now(),
      name: form.name.trim(),
      phone: form.phone.trim(),
      service: form.service.trim(),
      value: Number(form.value),
      status: form.status,
      date: 'Just now',
      createdAt: Date.now(),
    }

    setItems(current => [newInquiry, ...current])

    setForm({ name: '', phone: '', service: '', value: '', status: 'new' })
    setFormError('')
    setShowAddInquiry(false)
    setFilter('all')
    setSearch('')
  }

  return (
    <>
      <div className="dashboard-overview-header">
        <div>
          <span className="app-eyebrow">OVERVIEW</span>
          <h1>Good to see you, {profileName || 'there'}.</h1>
          <p>Here's what is happening with your customer inquiries.</p>
        </div>

        <div className="header-actions">
          <button className="date-button" type="button">Last 30 days⌄</button>

          <button
            className="primary-action"
            type="button"
            onClick={() => setShowAddInquiry(true)}
          >
            + Add inquiry
          </button>
        </div>
      </div>

      <section className="stats-grid">
        <div className="stat-card">
          <span>Recovered revenue</span>
          <strong>{money(recoveredRevenue, currency)}</strong>
          <small>Revenue from recovered inquiries</small>
        </div>

        <div className="stat-card">
          <span>Pending follow-ups</span>
          <strong>{pending.length}</strong>
          <small>Customers waiting for follow-up</small>
        </div>

        <div className="stat-card">
          <span>Replies</span>
          <strong>{replied.length}</strong>
          <small>Customers who replied</small>
        </div>

        <div className="stat-card">
          <span>Recovery rate</span>
          <strong>
            {items.length ? Math.round((recovered.length / items.length) * 100) : 0}%
          </strong>
          <small>Inquiries converted to revenue</small>
        </div>
      </section>

      <section className="dashboard-panel">
        <div className="panel-header">
          <div>
            <h2>Customer inquiries</h2>
            <p>Track every opportunity from first contact to recovery.</p>
          </div>

          <input
            className="search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customers..."
          />
        </div>

        <div className="filter-row">
          {['all', 'new', 'followup', 'replied', 'recovered', 'lost'].map(
            status => (
              <button
                key={status}
                className={filter === status ? 'filter active' : 'filter'}
                onClick={() => setFilter(status)}
                type="button"
              >
                {status === 'all' ? 'All' : statusLabels[status]}
              </button>
            )
          )}
        </div>

        <div className="inquiry-list">
          {filteredItems.map(item => (
            <div className="inquiry-row" key={item.id}>
              <div className="customer-info">
                <div className="customer-avatar">{item.name?.charAt(0)}</div>

                <div>
                  <button
                    type="button"
                    className="customer-name-button"
                    onClick={() => setSelectedInquiry(item)}
                  >
                    {item.name}
                  </button>
                  <span>{item.phone}</span>
                </div>
              </div>

              <div className="inquiry-service">
                <strong>{item.service}</strong>
                <span>{item.date}</span>
              </div>

              <div className="inquiry-value">
                {money(Number(item.value) || 0, currency)}
              </div>

              <div>
                <span className={`status status-${item.status}`}>
                  {statusLabels[item.status]}
                </span>
              </div>

              <div className="row-action">
                {item.status === 'followup' && (
                  <button
                    type="button"
                    onClick={() => updateStatus(item.id, 'replied')}
                  >
                    Mark replied
                  </button>
                )}

                {item.status === 'replied' && (
                  <button
                    type="button"
                    onClick={() => updateStatus(item.id, 'recovered')}
                  >
                    Mark recovered
                  </button>
                )}

                {(item.status === 'new' || item.status === 'lost') && (
                  <button
                    type="button"
                    onClick={() => updateStatus(item.id, 'followup')}
                  >
                    Follow up
                  </button>
                )}

                {item.status === 'recovered' && (
                  <span className="completed">Completed</span>
                )}
              </div>
            </div>
          ))}

          {inquiriesLoading && <div className="empty-state">Loading inquiries…</div>}

          {!inquiriesLoading && inquiriesError && (
            <div className="empty-state">{inquiriesError}</div>
          )}

          {!inquiriesLoading && !inquiriesError && filteredItems.length === 0 && (
            <div className="empty-state">No inquiries found.</div>
          )}
        </div>
      </section>

      <section className="bottom-grid">
        <div className="dashboard-panel compact-panel">
          <div className="panel-header">
            <div>
              <h2>Follow-up queue</h2>
              <p>Customers who need attention.</p>
            </div>
          </div>

          {pending.slice(0, 5).map(item => {
            const followupState = getFollowupState(item)

            return (
              <div className="queue-row" key={item.id}>
                <div>
                  <button
                    type="button"
                    className="queue-customer-button"
                    onClick={() => setSelectedInquiry(item)}
                  >
                    {item.name}
                  </button>
                  <span>
                    {item.followup
                      ? `${item.followup.date} · ${item.followup.time}`
                      : item.service}
                  </span>
                  {item.followup?.note && <small>{item.followup.note}</small>}
                  {followupState && (
                    <em className={`queue-status queue-${followupState}`}>
                      {followupState === 'overdue'
                        ? 'Overdue'
                        : followupState === 'today'
                          ? 'Due today'
                          : 'Upcoming'}
                    </em>
                  )}
                </div>
                <strong>{money(Number(item.value) || 0, currency)}</strong>
              </div>
            )
          })}
        </div>

        <div className="dashboard-panel compact-panel">
          <div className="panel-header">
            <div>
              <h2>Revenue summary</h2>
              <p>Recovered customer value.</p>
            </div>
          </div>

          <div className="revenue-highlight">
            <span>Total recovered</span>
            <strong>{money(recoveredRevenue, currency)}</strong>
          </div>

          <div className="revenue-line">
            <span>Recovered inquiries</span>
            <strong>{recovered.length}</strong>
          </div>

          <div className="revenue-line">
            <span>Average recovery</span>
            <strong>
              {recovered.length
                ? money(Math.round(recoveredRevenue / recovered.length), currency)
                : money(0, currency)}
            </strong>
          </div>
        </div>
      </section>

      {showAddInquiry && (
        <div
          className="modal-backdrop"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setShowAddInquiry(false)
          }}
        >
          <div className="inquiry-modal">
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
                ×
              </button>
            </div>

            <form onSubmit={handleAddInquiry}>
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
                    <span>₹</span>
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
          </div>
        </div>
      )}

      {selectedInquiry && (
        <div
          className="modal-backdrop"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setSelectedInquiry(null)
          }}
        >
          <div className="inquiry-modal detail-modal">
            <div className="modal-header">
              <div>
                <span className="app-eyebrow">INQUIRY DETAILS</span>
                <h2>{selectedInquiry.name}</h2>
                <p>{selectedInquiry.phone}</p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() => setSelectedInquiry(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="detail-grid">
              <div className="detail-card">
                <span>Service</span>
                <strong>{selectedInquiry.service}</strong>
              </div>

              <div className="detail-card">
                <span>Estimated value</span>
                <strong>{money(Number(selectedInquiry.value) || 0)}</strong>
              </div>

              <div className="detail-card">
                <span>Status</span>
                <strong>
                  <span className={`status status-${selectedInquiry.status}`}>
                    {statusLabels[selectedInquiry.status]}
                  </span>
                </strong>
              </div>

              <div className="detail-card">
                <span>Added</span>
                <strong>{selectedInquiry.date}</strong>
              </div>
            </div>

            <div className="followup-section">
              <div className="followup-heading">
                <span className="app-eyebrow">FOLLOW-UP</span>
                <h3>Schedule next contact</h3>
                <p>Set when you want to contact this customer again.</p>
              </div>

              <div className="followup-grid">
                <label>
                  Date
                  <input
                    type="date"
                    value={followupForm.date}
                    onChange={e =>
                      setFollowupForm({ ...followupForm, date: e.target.value })
                    }
                  />
                </label>

                <label>
                  Time
                  <input
                    type="time"
                    value={followupForm.time}
                    onChange={e =>
                      setFollowupForm({ ...followupForm, time: e.target.value })
                    }
                  />
                </label>

                <label className="full-field">
                  Note
                  <textarea
                    value={followupForm.note}
                    onChange={e =>
                      setFollowupForm({ ...followupForm, note: e.target.value })
                    }
                    placeholder="e.g. Customer asked to call after payday"
                    rows="3"
                  />
                </label>
              </div>
            </div>

            {selectedInquiry.followupHistory?.length > 0 && (
              <div className="followup-history">
                <div className="followup-history-header">
                  <div>
                    <span className="app-eyebrow">ACTIVITY</span>
                    <h3>Follow-up history</h3>
                  </div>
                  <span>
                    {selectedInquiry.followupHistory.length} event
                    {selectedInquiry.followupHistory.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="history-list">
                  {[...selectedInquiry.followupHistory].reverse().map(entry => (
                    <div className="history-item" key={entry.id}>
                      <div className="history-dot"></div>

                      <div className="history-content">
                        <strong>
                          {entry.type === 'scheduled'
                            ? 'Follow-up scheduled'
                            : entry.type}
                        </strong>

                        <span>
                          {entry.date} · {entry.time}
                        </span>

                        {entry.note && <p>{entry.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="detail-actions">
              <button
                type="button"
                className="save-button"
                onClick={scheduleFollowup}
                disabled={!followupForm.date || !followupForm.time}
              >
                Save follow-up
              </button>

              {selectedInquiry.status === 'new' && (
                <button
                  type="button"
                  className="save-button"
                  onClick={() => {
                    updateStatus(selectedInquiry.id, 'followup')
                    setSelectedInquiry({ ...selectedInquiry, status: 'followup' })
                  }}
                >
                  Start follow-up
                </button>
              )}

              {selectedInquiry.status === 'followup' && (
                <button
                  type="button"
                  className="save-button"
                  onClick={() => {
                    updateStatus(selectedInquiry.id, 'replied')
                    setSelectedInquiry({ ...selectedInquiry, status: 'replied' })
                  }}
                >
                  Mark replied
                </button>
              )}

              {selectedInquiry.status === 'replied' && (
                <button
                  type="button"
                  className="save-button"
                  onClick={() => {
                    updateStatus(selectedInquiry.id, 'recovered')
                    setSelectedInquiry({ ...selectedInquiry, status: 'recovered' })
                  }}
                >
                  Mark recovered
                </button>
              )}

              <button
                type="button"
                className="cancel-button"
                onClick={() => setSelectedInquiry(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Auth / route guards                                                 */
/* ------------------------------------------------------------------ */
function RequireAuth({ children }) {
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [account, setAccount] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const auth = window.firebase?.auth?.()
    const db = window.firebase?.firestore?.()

    if (!auth || !db) {
      setChecking(false)
      return
    }

    let active = true

    const unsubscribe = auth.onAuthStateChanged(async currentUser => {
      if (!active) return

      if (!currentUser) {
        setUser(null)
        setAccount(null)
        setChecking(false)
        return
      }

      setUser(currentUser)
      setChecking(true)

      try {
        const snapshot = await db
          .collection('users')
          .doc(currentUser.uid)
          .get()

        if (!active) return
        setAccount(snapshot.exists ? snapshot.data() : null)
      } catch (error) {
        console.error('Account access check failed:', error)
        if (active) setAccount(null)
      } finally {
        if (active) setChecking(false)
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  if (checking) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-card">
          <span className="auth-logo-mark">L</span>
          <strong>Checking your account…</strong>
          <span>Please wait.</span>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  const isBillingPage = location.pathname === '/app/billing'
  const isTrialPage = location.pathname === '/trial'

  const hasPaidStatus =
    account?.subscriptionStatus === 'active' ||
    account?.subscriptionStatus === 'subscribed'

  const subscriptionEndsAt = account?.subscriptionEndsAt
  const subscriptionEndTime = subscriptionEndsAt?.toDate
    ? subscriptionEndsAt.toDate().getTime()
    : subscriptionEndsAt
      ? new Date(subscriptionEndsAt).getTime()
      : null
  const paidExpired =
    hasPaidStatus &&
    Number.isFinite(subscriptionEndTime) &&
    Date.now() >= subscriptionEndTime
  const isPaid = hasPaidStatus && !paidExpired

  const trialEndsAt = account?.trialEndsAt

  let trialEndTime = null
  if (trialEndsAt?.toDate) {
    trialEndTime = trialEndsAt.toDate().getTime()
  } else if (trialEndsAt) {
    trialEndTime = new Date(trialEndsAt).getTime()
  }

  const trialExpired =
    account?.subscriptionStatus === 'trialing' &&
    Number.isFinite(trialEndTime) &&
    Date.now() >= trialEndTime

  if ((trialExpired || paidExpired) && !isBillingPage) {
    return <Navigate to="/app/billing" replace />
  }

  if (
    !account?.trialRedeemed &&
    !isPaid &&
    !isTrialPage &&
    !isBillingPage
  ) {
    return <Navigate to="/trial" replace />
  }

  return children
}

function RequireCEO({ children }) {
  const [allowed, setAllowed] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const auth = window.firebase?.auth?.()
    const db = window.firebase?.firestore?.()

    if (!auth || !db) {
      setChecking(false)
      return
    }

    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (!user) {
        setAllowed(false)
        setChecking(false)
        return
      }

      try {
        const snapshot = await db.collection('users').doc(user.uid).get()

        setAllowed(
          snapshot.exists && snapshot.data()?.role === 'ceo'
        )
      } catch (error) {
        console.error('CEO access check failed:', error)
        setAllowed(false)
      } finally {
        setChecking(false)
      }
    })

    return unsubscribe
  }, [])

  if (checking) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-card">
          <span className="auth-logo-mark">L</span>
          <strong>Checking CEO access…</strong>
          <span>Please wait.</span>
        </div>
      </div>
    )
  }

  if (!allowed) return <Navigate to="/app" replace />

  return children
}

/* ------------------------------------------------------------------ */
/* App root                                                            */
/* ------------------------------------------------------------------ */

/**
 * Reset scroll on navigation. Without this, clicking a link in the footer of a
 * long landing page lands the user halfway down the next page.
 *
 * Skipped for in-page hash links (e.g. the "#top" brand link) so anchors
 * still jump within the page instead of scrolling back to the top.
 */
function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, hash])

  return null
}

function App() {
  return (
    <BrowserRouter basename={ROUTER_BASENAME}>
      <ScrollToTop />
      <Routes>
        {/* Public marketing pages */}
        <Route path="/" element={<Home />} />

        {/*
          Dedicated SEO landing pages, generated from the manifest in
          src/seo/pages.js: /features, /use-cases (+3 sub-pages), /pricing,
          /how-it-works, /industries, /industries/car-detailing, /about and
          /resources. Each one renders <SEOPage> with its own <title>,
          description, canonical, Open Graph/Twitter tags and JSON-LD.
        */}
        {ROUTED_SEO_PAGES.map((page) => (
          <Route
            key={page.path}
            path={page.path}
            element={<SEOPage type={page.type} />}
          />
        ))}

        {/* Auth pages */}
        <Route path="/login" element={<Login />} />
        <Route
          path="/trial"
          element={
            <RequireAuth>
              <Trial />
            </RequireAuth>
          }
        />
        <Route
          path="/ceo"
          element={
            <RequireCEO>
              <CEO />
            </RequireCEO>
          }
        />

        {/* Authenticated workspace — all wrapped in AppLayout (with sidebar) */}
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path="/app" element={<Dashboard />} />
          <Route path="/app/inquiries" element={<Inquiries />} />
          <Route path="/app/followups" element={<Followups />} />
          <Route path="/app/revenue" element={<Revenue />} />
          <Route path="/app/customers" element={<Customers />} />
          <Route path="/app/billing" element={<Billing />} />
          <Route path="/app/settings" element={<Settings />} />
          <Route path="/app/profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
