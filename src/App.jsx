import React, { useEffect, useState } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useSearchParams,
  useLocation,
} from 'react-router-dom'
import Home from './Home.jsx'
import SEOPage from './SEOPage.jsx'
import Customers from './Customers.jsx'
import Settings from './Settings.jsx'
import Profile from './Profile.jsx'
import Login from './Login.jsx'
import Inquiries from './Inquiries.jsx'
import Followups from './Followups.jsx'
import Revenue from './Revenue.jsx'
import CEO from './CEO.jsx'
import AppLayout from './AppLayout.jsx'
import { ROUTER_BASENAME } from './basePath.js'
// Single source of truth for the marketing routes — see src/seo/pages.js.
// Adding a page to SEO_PAGES registers its route, nav link, sitemap entry and
// prerendered HTML automatically.
import { ROUTED_SEO_PAGES } from './seo/pages.js'
import WhatsAppActions from './components/WhatsAppActions.jsx'
import DripSequences from './components/DripSequences.jsx'
import SmartComposer from './components/SmartComposer.jsx'
import ForecastWidget from './components/ForecastWidget.jsx'
import VoiceInput from './components/VoiceInput.jsx'
import BlitzMode from './components/BlitzMode.jsx'
import BookingPage from './BookingPage.jsx'
import OfferPage from './OfferPage.jsx'
import Offers from './Offers.jsx'
import WinbackScoreBadge from './components/WinbackScore.jsx'
import { GraveyardCounter } from './components/GraveyardCounter.jsx'
import LossReasonModal, { LOSS_REASON_LABELS } from './components/LossReasonModal.jsx'
import LossIntelligence from './components/LossIntelligence.jsx'
import StreakWidget from './components/StreakWidget.jsx'
import OfferBuilder from './components/OfferBuilder.jsx'
import {
  IconPlus,
  IconX,
  IconChevronDown,
  IconTrendUp,
  IconClock,
  IconMessage,
  IconZap,
} from './components/icons.jsx'
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
/* Premium motion helpers — visual only, no logic changes.             */
/* ------------------------------------------------------------------ */

/** Count-up animation for hero numbers. Returns the eased value. */
function useCountUp(target, duration = 1100) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    const end = Number(target) || 0
    if (end <= 0) {
      setValue(0)
      return undefined
    }

    let raf = 0
    const start = performance.now()

    const tick = now => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(end * eased))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return value
}

/**
 * Frosted modal shell with buttery open/close animation.
 * Purely visual: delays unmount by the close animation, calls onClose
 * on backdrop click exactly like the previous inline markup did.
 */
function Modal({ open, onClose, wide = false, children }) {
  const [rendered, setRendered] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (open) {
      setRendered(true)
      setClosing(false)
      return undefined
    }
    if (!rendered) return undefined
    setClosing(true)
    const timer = setTimeout(() => {
      setRendered(false)
      setClosing(false)
    }, 260)
    return () => clearTimeout(timer)
  }, [open, rendered])

  if (!rendered) return null

  return (
    <div
      className={`modal-backdrop${closing ? ' is-closing' : ''}`}
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className={`inquiry-modal${wide ? ' detail-modal' : ''}${closing ? ' is-closing' : ''}`}
      >
        {children}
      </div>
    </div>
  )
}

/** Gold radar-sweep illustration for empty states. Pure SVG, no emojis. */
function EmptyArt({ compact = false }) {
  return (
    <svg
      viewBox="0 0 160 120"
      className={`empty-art${compact ? ' empty-art-compact' : ''}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ea-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E8B44A" />
          <stop offset="1" stopColor="#FF6B35" />
        </linearGradient>
        <radialGradient id="ea-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#E8B44A" stopOpacity="0.28" />
          <stop offset="1" stopColor="#E8B44A" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="80" cy="106" rx="54" ry="8" fill="rgba(232,180,74,0.07)" />
      <circle cx="80" cy="60" r="44" fill="url(#ea-glow)" />
      <circle cx="80" cy="60" r="34" fill="none" stroke="url(#ea-gold)" strokeWidth="2.5" opacity="0.9" />
      <circle cx="80" cy="60" r="24" fill="none" stroke="#E8B44A" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.45" />
      <circle cx="80" cy="60" r="14" fill="none" stroke="#E8B44A" strokeWidth="1" strokeDasharray="2 4" opacity="0.3" />
      <path d="M80 60 L104 36" stroke="url(#ea-gold)" strokeWidth="2.5" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 80 60" to="360 80 60" dur="6s" repeatCount="indefinite" />
      </path>
      <circle cx="80" cy="60" r="4.5" fill="url(#ea-gold)" />
      <circle cx="104" cy="36" r="3" fill="#FF6B35" opacity="0.9">
        <animate attributeName="opacity" values="0.9;0.3;0.9" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Dashboard — main overview page.                                     */
/* The sidebar/header/footer shell is now provided by <AppLayout/> so  */
/* this component renders only its content.                            */
/* ------------------------------------------------------------------ */
function Dashboard() {
  const navigate = useNavigate()
  const [authUser, setAuthUser] = useState(
    () => window.firebase?.auth?.().currentUser || null
  )
  const [profileOpen, setProfileOpen] = useState(false)
  const [businessName, setBusinessName] = useState('')
  const businessSlug = (businessName || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
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
  const [lossTarget, setLossTarget] = useState(null)
  const [offerTarget, setOfferTarget] = useState(null)

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

  const recoveryRate = items.length
    ? Math.round((recovered.length / items.length) * 100)
    : 0

  // Animated hero numbers (visual only)
  const animatedRevenue = useCountUp(recoveredRevenue)
  const animatedPending = useCountUp(pending.length)
  const animatedReplied = useCountUp(replied.length)
  const animatedRate = useCountUp(recoveryRate)

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

  function todayKey() {
    return new Date().toISOString().slice(0, 10)
  }

  /** Mark recovered — stamps recoveredAt so streaks/forecasts count real wins. */
  function markRecovered(id) {
    const recoveredAt = todayKey()
    setItems(current =>
      current.map(item =>
        item.id === id ? { ...item, status: 'recovered', recoveredAt } : item
      )
    )
    setSelectedInquiry(current =>
      current && current.id === id
        ? { ...current, status: 'recovered', recoveredAt }
        : current
    )
    logActivity(id, 'Marked recovered')
  }

  /** Mark lost — stamps lostAt + lossReason for loss intelligence. */
  function markLost(id, reason, note) {
    const lostAt = todayKey()
    setItems(current =>
      current.map(item =>
        item.id === id
          ? { ...item, status: 'lost', lostAt, lossReason: reason, lossNote: note || '' }
          : item
      )
    )
    setSelectedInquiry(current =>
      current && current.id === id
        ? { ...current, status: 'lost', lostAt, lossReason: reason, lossNote: note || '' }
        : current
    )
    logActivity(id, `Marked lost (${LOSS_REASON_LABELS[reason] || reason})`)
    setLossTarget(null)
  }

  function logActivity(id, label) {
    const entry = {
      id: Date.now(),
      type: label,
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5),
      note: '',
    }
    setItems(current =>
      current.map(item =>
        item.id === id
          ? { ...item, followupHistory: [...(item.followupHistory || []), entry] }
          : item
      )
    )
    setSelectedInquiry(current =>
      current && current.id === id
        ? { ...current, followupHistory: [...(current.followupHistory || []), entry] }
        : current
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
          <button className="date-button" type="button">
            Last 30 days <IconChevronDown width={12} height={12} />
          </button>

          <button
            className="primary-action"
            type="button"
            onClick={() => setShowAddInquiry(true)}
          >
            <IconPlus width={13} height={13} /> Add inquiry
          </button>
        </div>
      </div>

      <GraveyardCounter items={items} currency={currency} />

      <section className="stats-grid">
        <div className="stat-card stat-hero">
          <div className="stat-icon stat-icon-gold">
            <IconTrendUp width={18} height={18} />
          </div>
          <span>Recovered revenue</span>
          <strong className="stat-number gold-number">
            {money(animatedRevenue, currency)}
          </strong>
          <small>Revenue from recovered inquiries</small>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <IconClock width={18} height={18} />
          </div>
          <span>Pending follow-ups</span>
          <strong className="stat-number">{animatedPending}</strong>
          <small>Customers waiting for follow-up</small>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <IconMessage width={18} height={18} />
          </div>
          <span>Replies</span>
          <strong className="stat-number">{animatedReplied}</strong>
          <small>Customers who replied</small>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <IconZap width={18} height={18} />
          </div>
          <span>Recovery rate</span>
          <strong className="stat-number">{animatedRate}%</strong>
          <small>Inquiries converted to revenue</small>
        </div>
      </section>

      <section className="dashboard-insights">
        <StreakWidget items={items} currency={currency} />
        <LossIntelligence items={items} currency={currency} />
      </section>

      <section className="dashboard-insights">
        <ForecastWidget inquiries={items} />
        <div className="blitz-promo">
          <span className="app-eyebrow">BLITZ MODE</span>
          <h3>Win back customers in one session</h3>
          <p>Pick your lost leads, power through personalized messages.</p>
          <button
            type="button"
            className="primary-action"
            onClick={() => navigate('/app/blitz')}
          >
            Start a blitz
          </button>
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

              <div className="inquiry-score">
                <WinbackScoreBadge inquiry={item} />
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
                    onClick={() => markRecovered(item.id)}
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

                {['new', 'followup', 'replied'].includes(item.status) && (
                  <button
                    type="button"
                    className="row-lost"
                    onClick={() => setLossTarget(item)}
                  >
                    Lost
                  </button>
                )}
              </div>
            </div>
          ))}

          {inquiriesLoading && (
            <div className="empty-state">
              <div className="empty-pulse" aria-hidden="true" />
              <strong>Loading inquiries…</strong>
            </div>
          )}

          {!inquiriesLoading && inquiriesError && (
            <div className="empty-state">
              <EmptyArt />
              <strong>Couldn't load inquiries</strong>
              <p>{inquiriesError}</p>
            </div>
          )}

          {!inquiriesLoading && !inquiriesError && filteredItems.length === 0 && (
            <div className="empty-state">
              <EmptyArt />
              <strong>No inquiries found.</strong>
              <p>New inquiries will appear here the moment a customer reaches out.</p>
            </div>
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
          {pending.length === 0 && (
            <div className="empty-state empty-compact">
              <EmptyArt compact />
              <strong>All caught up.</strong>
              <p>No pending follow-ups right now.</p>
            </div>
          )}
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
                  onResult={({ name, service, value, note }) => {
                    setForm(f => ({
                      ...f,
                      name: name || f.name,
                      service: service || f.service,
                      value: value || f.value,
                    }))
                    if (note) {
                      setFollowupForm(ff => ({ ...ff, note: ff.note ? ff.note + ' ' + note : note }))
                    }
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
      </Modal>

      <Modal
        open={selectedInquiry !== null}
        onClose={() => setSelectedInquiry(null)}
        wide
      >
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
                <IconX width={15} height={15} />
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

              {selectedInquiry.status === 'lost' && selectedInquiry.lossReason && (
                <div className="detail-card detail-card-loss">
                  <span>Lost reason</span>
                  <strong>{LOSS_REASON_LABELS[selectedInquiry.lossReason] || selectedInquiry.lossReason}</strong>
                  {selectedInquiry.lossNote && <small>{selectedInquiry.lossNote}</small>}
                </div>
              )}
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

            <WhatsAppActions
              inquiry={selectedInquiry}
              businessName={businessName}
              onAction={(type, templateId) => {
                logActivity(selectedInquiry.id, type === 'voice-note' ? 'Voice note opened' : `WhatsApp sent (${templateId})`)
              }}
            />

            <SmartComposer
              inquiry={selectedInquiry}
              businessName={businessName}
              businessSlug={businessSlug}
              onAction={(type, tone) => {
                logActivity(selectedInquiry.id, `Smart message sent (${tone})`)
              }}
            />

            <DripSequences
              inquiry={selectedInquiry}
              businessName={businessName}
              onSave={(steps) => {
                logActivity(selectedInquiry.id, `Drip sequence saved (${steps.length} steps)`)
              }}
            />

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
                  onClick={() => markRecovered(selectedInquiry.id)}
                >
                  Mark recovered
                </button>
              )}

              {['new', 'followup', 'replied'].includes(selectedInquiry.status) && (
                <button
                  type="button"
                  className="offer-action-button"
                  onClick={() => setOfferTarget(selectedInquiry)}
                >
                  Send second-chance offer
                </button>
              )}

              {['new', 'followup', 'replied'].includes(selectedInquiry.status) && (
                <button
                  type="button"
                  className="danger-outline-button"
                  onClick={() => setLossTarget(selectedInquiry)}
                >
                  Mark lost
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
      </Modal>

      {lossTarget && (
        <LossReasonModal
          inquiry={lossTarget}
          onCancel={() => setLossTarget(null)}
          onConfirm={(reason, note) => markLost(lossTarget.id, reason, note)}
        />
      )}

      {offerTarget && (
        <OfferBuilder
          inquiry={offerTarget}
          businessName={businessName}
          onClose={() => setOfferTarget(null)}
          onCreated={() => logActivity(offerTarget.id, 'Second-chance offer created')}
        />
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
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const auth = window.firebase?.auth?.()

    if (!auth) {
      setChecking(false)
      return
    }

    const unsubscribe = auth.onAuthStateChanged(currentUser => {
      setUser(currentUser)
      setChecking(false)
    })

    return unsubscribe
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

        {/* Public booking page — no login required */}
        <Route path="/b/:slug" element={<BookingPage />} />

        {/* Public second-chance offer page — no login required */}
        <Route path="/o/:code" element={<OfferPage />} />

        {/* Auth pages */}
        <Route path="/login" element={<Login />} />
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
          <Route path="/app/blitz" element={<BlitzMode />} />
          <Route path="/app/offers" element={<Offers />} />
          <Route path="/app/customers" element={<Customers />} />
          <Route path="/app/settings" element={<Settings />} />
          <Route path="/app/profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
