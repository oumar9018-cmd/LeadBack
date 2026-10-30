import React, { useEffect, useRef, useState } from 'react'
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
import OwnerBookings from './components/OwnerBookings.jsx'
import BookingPage from './BookingPage.jsx'
import OfferPage from './OfferPage.jsx'
import Offers from './Offers.jsx'
import WinbackScoreBadge from './components/WinbackScore.jsx'
import { GraveyardCounter } from './components/GraveyardCounter.jsx'
import LossReasonModal, { LOSS_REASON_LABELS } from './components/LossReasonModal.jsx'
import Modal from './components/Modal.jsx'
import {
  CURRENCY_CODES,
  currencySymbol,
  defaultCurrencyForBrowser,
} from './utils/money.js'
import { logAudit } from './utils/audit.js'
import { assignNext } from './utils/roundRobin.js'
import {
  canCreateOffers,
  canDelete,
  canManageTeam,
  inScope,
} from './utils/workspace.js'
import { WorkspaceProvider, useWorkspace } from './components/WorkspaceContext.jsx'
import AcceptInvite from './components/AcceptInvite.jsx'
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
import { bookingLinkFor, waLink, TEMPLATES, fillTemplate, normalizePhone } from './utils/whatsapp.js'
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
    AED: 'en-AE',
    AUD: 'en-AU',
    CAD: 'en-CA',
    SGD: 'en-SG',
    JPY: 'ja-JP',
    MXN: 'es-MX',
    NZD: 'en-NZ',
  }

  const code = locales[currency] ? currency : 'USD'

  return new Intl.NumberFormat(locales[code], {
    style: 'currency',
    currency: code,
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

/** Blue radar illustration for empty states. Pure SVG, no emojis. */
function EmptyArt({ compact = false }) {
  return (
    <svg
      viewBox="0 0 160 120"
      className={`empty-art${compact ? ' empty-art-compact' : ''}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ea-blue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2563eb" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
        <radialGradient id="ea-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#2563eb" stopOpacity="0.12" />
          <stop offset="1" stopColor="#2563eb" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="80" cy="106" rx="54" ry="8" fill="rgba(37,99,235,0.06)" />
      <circle cx="80" cy="60" r="44" fill="url(#ea-glow)" />
      <circle cx="80" cy="60" r="34" fill="none" stroke="url(#ea-blue)" strokeWidth="2.5" opacity="0.9" />
      <circle cx="80" cy="60" r="24" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.35" />
      <circle cx="80" cy="60" r="14" fill="none" stroke="#2563eb" strokeWidth="1" strokeDasharray="2 4" opacity="0.25" />
      <circle cx="80" cy="60" r="4.5" fill="url(#ea-blue)" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Dashboard — inquiry-detail host.                                    */
/* Batch 2 (2026-10-30): the Overview dashboard page was removed on   */
/* the owner's order. /app now redirects to /app/inquiries, and this   */
/* component survives only at /app/inquiry, where it renders the      */
/* inquiry detail modal (and its write actions) and nothing else.     */
/* The sidebar/header/footer shell is provided by <AppLayout/> so     */
/* this component renders only its content.                            */
/* ------------------------------------------------------------------ */
function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  // Batch 4 (enterprise Phase 2): the workspace (owner uid + role +
  // branch) resolves once in WorkspaceProvider. Solo owners get
  // ownerUid = own uid, role 'owner' — exactly today's behaviour.
  // Members get the owner's uid, so every load/write below lands in
  // the owner's workspace with their role applied.
  const { workspace, loading: wsLoading } = useWorkspace()
  // Detail-only mode: on /app/inquiry the page sections below are gated
  // off (see the {!detailOnly && ...} wrapper around the return body), so
  // no Overview content ever renders on this route — only the modals.
  const detailOnly = location.pathname === '/app/inquiry'
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
  // New workspaces default to the browser-timezone currency (see
  // utils/money.js); a saved workspace currency always wins below.
  const [currency, setCurrency] = useState(() => defaultCurrencyForBrowser())
  // Team members of this workspace (batch 3). Empty for solo owners —
  // the assign dropdown below renders only when members exist.
  const [members, setMembers] = useState([])
  // Branches of this workspace (batch 4). The detail-modal branch
  // select below draws from this list (owner/admin only).
  const [branches, setBranches] = useState([])
  const [googleReviewLink, setGoogleReviewLink] = useState('')

  // Workspace settings + members + branches, loaded from the workspace
  // owner's data root (not the signed-in uid) so members see the
  // owner's business name, currency, review link and team.
  useEffect(() => {
    if (wsLoading) return undefined
    const db = window.firebase?.firestore?.()
    const auth = window.firebase?.auth?.()
    if (!workspace || !db) {
      setBusinessName('')
      setProfileName('')
      setGoogleReviewLink('')
      setMembers([])
      setBranches([])
      return undefined
    }

    setProfileName(
      typeof auth?.currentUser?.displayName === 'string'
        ? auth.currentUser.displayName.trim()
        : ''
    )

    let cancelled = false
    ;(async () => {
      try {
        const snapshot = await db
          .collection('users')
          .doc(workspace.ownerUid)
          .collection('settings')
          .doc('workspace')
          .get()
        if (cancelled) return

        const data = snapshot.exists ? snapshot.data() : {}
        const savedName = data?.businessName
        const savedCurrency = data?.currency
        const savedReviewLink = data?.googleReviewLink

        setBusinessName(
          typeof savedName === 'string' ? savedName.trim() : ''
        )

        setCurrency(
          CURRENCY_CODES.includes(savedCurrency)
            ? savedCurrency
            : defaultCurrencyForBrowser()
        )

        setGoogleReviewLink(
          typeof savedReviewLink === 'string' ? savedReviewLink.trim() : ''
        )
      } catch (error) {
        console.error('Workspace settings load failed:', error)
        if (!cancelled) {
          setBusinessName('')
          setGoogleReviewLink('')
        }
      }

      try {
        const membersSnap = await db
          .collection('users')
          .doc(workspace.ownerUid)
          .collection('members')
          .get()
        if (!cancelled) {
          setMembers(
            membersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          )
        }
      } catch (error) {
        // Members list is owner/admin-only in the rules; staff get [].
        console.error('Members load failed:', error)
        if (!cancelled) setMembers([])
      }

      try {
        const branchesSnap = await db
          .collection('users')
          .doc(workspace.ownerUid)
          .collection('settings')
          .doc('branches')
          .get()
        if (!cancelled) {
          setBranches(
            branchesSnap.exists ? branchesSnap.data()?.branches || [] : []
          )
        }
      } catch (error) {
        console.error('Branches load failed:', error)
        if (!cancelled) setBranches([])
      }
    })()

    return () => {
      cancelled = true
    }
  }, [wsLoading, workspace])

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

  // Inquiries load from the workspace owner's data root, filtered to
  // the member's scope (owner/admins see all; managers their branch;
  // reps their assigned rows). Gate 6 fix: Firestore rules are NOT
  // filters — an unfiltered collection get is denied outright for
  // staff, so the query itself is scoped server-side to exactly what
  // the per-doc rule allows. The client filter below stays as
  // belt-and-braces so aggregates (revenue, counts) match the rows
  // actually shown.
  useEffect(() => {
    if (wsLoading) return undefined
    const db = window.firebase?.firestore?.()
    if (!workspace || !db) {
      setItems([])
      setInquiriesLoaded(false)
      setInquiriesLoading(false)
      setInquiriesError('')
      return undefined
    }

    let cancelled = false
    setInquiriesLoading(true)
    setInquiriesError('')
    ;(async () => {
      try {
        const uid = window.firebase?.auth?.().currentUser?.uid
        let query = db
          .collection('users')
          .doc(workspace.ownerUid)
          .collection('inquiries')
        let scoped = false
        if (workspace.role === 'sales_rep') {
          query = query.where('assignedTo', '==', uid || '')
          scoped = true
        } else if (workspace.role === 'branch_manager') {
          query = query.where('branchId', '==', workspace.branchId || '')
          scoped = true
        }
        // Scoped queries skip orderBy: an equality filter plus
        // orderBy on a different field needs a composite index, so
        // the newest-first sort happens client-side below instead.
        if (!scoped) query = query.orderBy('createdAt', 'desc')
        const snapshot = await query.get()
        if (cancelled) return
        const remoteItems = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
        if (scoped) {
          const createdTime = value =>
            typeof value === 'number' ? value : value ? Date.parse(value) || 0 : 0
          remoteItems.sort(
            (a, b) => createdTime(b.createdAt) - createdTime(a.createdAt)
          )
        }
        setItems(remoteItems.filter(item => inScope(item, workspace, uid)))
      } catch (error) {
        console.error('Inquiry load failed:', error)
        if (!cancelled) {
          setItems([])
          setInquiriesError('Unable to load inquiries. Please try again.')
        }
      } finally {
        if (!cancelled) {
          setInquiriesLoading(false)
          setInquiriesLoaded(true)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [wsLoading, workspace])

  useEffect(() => {
    if (!inquiriesLoaded || !workspace) return

    const db = window.firebase?.firestore?.()

    if (!db) return

    const batch = db.batch()
    const userRef = db.collection('users').doc(workspace.ownerUid)

    items.forEach(item => {
      const inquiryRef = userRef.collection('inquiries').doc(String(item.id))
      batch.set(inquiryRef, item, { merge: true })
    })

    if (items.length > 0) {
      batch.commit().catch(error => {
        console.error('Inquiry save failed:', error)
      })
    }
  }, [items, inquiriesLoaded, workspace])

  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showAddInquiry, setShowAddInquiry] = useState(false)
  const [selectedInquiry, setSelectedInquiry] = useState(null)
  // The detail modal below has a 260ms close animation: it keeps rendering
  // AFTER selectedInquiry is set back to null. Freeze the last opened
  // inquiry so the closing frame never reads `.name` (etc.) off null.
  // The modal is ALSO only mounted once detailInquiry is non-null (see the
  // {detailInquiry && (...)} guard at its usage): JSX children expressions
  // are evaluated during Dashboard render even while the Modal shell itself
  // returns null, so an unguarded detailInquiry.name crashed /app on load.
  const lastInquiryRef = useRef(null)
  if (selectedInquiry !== null) lastInquiryRef.current = selectedInquiry
  const detailInquiry = selectedInquiry ?? lastInquiryRef.current
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  // In detail-only mode the modal IS the page: closing it returns to the
  // Inquiries list instead of leaving a blank shell behind.
  function closeDetail() {
    setSelectedInquiry(null)
    setDeleteConfirmId(null)
    if (detailOnly) navigate('/app/inquiries')
  }

  // Review requests (batch 2): the saved Google review link, or '' when
  // blank or malformed. The button must never render — and never send —
  // a broken or empty link, so validation happens here, not at click time.
  function validReviewLink() {
    const link = (googleReviewLink || '').trim()
    if (!link) return ''
    try {
      const parsed = new URL(link)
      return parsed.protocol === 'http:' || parsed.protocol === 'https:'
        ? link
        : ''
    } catch {
      return ''
    }
  }

  // Permanent delete (the UI had no way to remove an inquiry before).
  // The items->Firestore sync only ever SETs docs for items in state, so an
  // explicit doc delete + state removal stays deleted across reloads.
  async function deleteInquiry(id) {
    setDeleteConfirmId(null)
    setSelectedInquiry(null)
    if (detailOnly) navigate('/app/inquiries')
    setItems(prev => prev.filter(item => String(item.id) !== String(id)))
    try {
      const db = window.firebase?.firestore?.()
      if (workspace && db) {
        await db
          .collection('users')
          .doc(workspace.ownerUid)
          .collection('inquiries')
          .doc(String(id))
          .delete()
      }
    } catch (error) {
      console.error('Inquiry delete failed:', error)
    }
  }
  const [lossTarget, setLossTarget] = useState(null)
  const [offerTarget, setOfferTarget] = useState(null)

  const [searchParams] = useSearchParams()

  // Direct-link resolution for /app/inquiry?inquiry=<id>. The list
  // path wins whenever the row is already loaded; otherwise (empty
  // list, or a row outside it) fetch the single doc directly — a
  // single-doc get IS allowed by the per-doc rule even when a
  // collection get is not, so a rep opening their own row's link no
  // longer lands on an empty list. One attempt per inquiry id; a
  // denied or missing row simply leaves the modal closed.
  const detailFetchRef = useRef({ id: null, done: false })
  React.useEffect(() => {
    const inquiryId = searchParams.get('inquiry')
    if (!inquiryId) {
      detailFetchRef.current = { id: null, done: false }
      return
    }

    const inquiry = items.find(item => String(item.id) === inquiryId)
    if (inquiry) {
      setSelectedInquiry(inquiry)
      return
    }

    if (
      detailFetchRef.current.id === inquiryId &&
      detailFetchRef.current.done
    ) {
      return
    }
    const db = window.firebase?.firestore?.()
    if (!workspace || !db) return
    detailFetchRef.current = { id: inquiryId, done: true }
    ;(async () => {
      try {
        const snap = await db
          .collection('users')
          .doc(workspace.ownerUid)
          .collection('inquiries')
          .doc(String(inquiryId))
          .get()
        if (snap.exists) {
          setSelectedInquiry({ id: snap.id, ...snap.data() })
        }
      } catch (error) {
        console.error('Inquiry detail load failed:', error)
      }
    })()
  }, [items, searchParams, workspace])

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
    const prev = items.find(item => item.id === id)
    setItems(current =>
      current.map(item => (item.id === id ? { ...item, status } : item))
    )
    if (prev && prev.status !== status) {
      logAudit(workspace?.ownerUid, {
        action: 'status_changed',
        inquiryId: id,
        detail: `${prev.status || ''} -> ${status}`,
      })
    }
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
    logAudit(workspace?.ownerUid, {
      action: 'status_changed',
      inquiryId: id,
      detail: '-> recovered',
    })
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
    logAudit(workspace?.ownerUid, {
      action: 'status_changed',
      inquiryId: id,
      detail: `-> lost (${LOSS_REASON_LABELS[reason] || reason})`,
    })
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

    // Batch 5: route before the whole-list sync writes the row. The
    // routing fields travel inside the item object like every other
    // field, so the sync effect needs no change. Routing never blocks
    // creation — assignNext falls back to unassigned on any failure.
    const db = window.firebase?.firestore?.()
    const branchId = workspace?.role === 'branch_manager' ? workspace.branchId || '' : ''
    const route = await assignNext(db, workspace?.ownerUid, { branchId })

    const newInquiry = {
      id: Date.now(),
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
      // Managers create rows in their own branch (rules require it);
      // owners/admins create unbranched rows (admin-visible only).
      branchId,
    }

    setItems(current => [newInquiry, ...current])

    if (route.assignedTo) {
      logAudit(workspace?.ownerUid, {
        action: 'status_changed',
        inquiryId: String(newInquiry.id),
        detail: `assigned to ${route.assignedEmail || route.assignedTo}`,
      })
    }

    setForm({ name: '', phone: '', service: '', value: '', status: 'new' })
    setFormError('')
    setShowAddInquiry(false)
    setFilter('all')
    setSearch('')
  }

  // Detail-only route without an inquiry to show is not a page — send the
  // owner back to the list instead of rendering a blank shell. The second
  // guard covers a stale/unknown id (e.g. a deleted inquiry's deep link)
  // once the list has loaded.
  if (detailOnly && !searchParams.get('inquiry')) {
    return <Navigate to="/app/inquiries" replace />
  }
  if (
    detailOnly &&
    inquiriesLoaded &&
    !items.some(item => String(item.id) === searchParams.get('inquiry'))
  ) {
    return <Navigate to="/app/inquiries" replace />
  }

  return (
    <>
      {!detailOnly && (
      <>
      <div className="dashboard-overview-header">
        <div>
          <span className="app-eyebrow">OVERVIEW</span>
          <h1>Good to see you, {profileName || 'there'}.</h1>
          <p>Here's what is happening with your customer inquiries.</p>
        </div>

        <div className="header-actions">
          {/* Sales Reps cannot create inquiries (rules deny it), so the
              button is hidden for them instead of failing on save. */}
          {workspace?.role !== 'sales_rep' && (
            <button
              className="primary-action"
              type="button"
              onClick={() => setShowAddInquiry(true)}
            >
              <IconPlus width={13} height={13} /> Add inquiry
            </button>
          )}
        </div>
      </div>

      <GraveyardCounter items={items} currency={currency} />

      {/* Booking requests are an owner/admin view: the bookings query
          is keyed by the workspace owner, and staff never convert
          booking requests into inquiries. */}
      {canManageTeam(workspace?.role) && (
        <OwnerBookings
          onAddInquiry={(booking) => {
          const newInquiry = {
            id: Date.now(),
            name: booking.customerName,
            phone: booking.customerPhone,
            service: `Booking request — ${booking.preferredDate}${booking.preferredTime ? ` at ${booking.preferredTime}` : ''}`,
            value: 0,
            status: 'new',
            date: 'Just now',
            createdAt: Date.now(),
            assignedTo: '',
            branchId: '',
          }
          setItems(current => [newInquiry, ...current])
        }}
      />
      )}

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
        <ForecastWidget inquiries={items} currency={currency} />
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
      </section>
      </>
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

      {detailInquiry && (
      <Modal
        open={selectedInquiry !== null}
        onClose={closeDetail}
        wide
      >
            <div className="modal-header">
              <div>
                <span className="app-eyebrow">INQUIRY DETAILS</span>
                <h2>{detailInquiry.name}</h2>
                <p>{detailInquiry.phone}</p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeDetail}
                aria-label="Close"
              >
                <IconX width={15} height={15} />
              </button>
            </div>

            <div className="detail-grid">
              <div className="detail-card">
                <span>Service</span>
                <strong>{detailInquiry.service}</strong>
              </div>

              <div className="detail-card">
                <span>Estimated value</span>
                <strong>{money(Number(detailInquiry.value) || 0, currency)}</strong>
              </div>

              <div className="detail-card">
                <span>Status</span>
                <strong>
                  <span className={`status status-${detailInquiry.status}`}>
                    {statusLabels[detailInquiry.status]}
                  </span>
                </strong>
              </div>

              <div className="detail-card">
                <span>Added</span>
                <strong>{detailInquiry.date}</strong>
              </div>

              {/* Assignment is owner/admin-only: managers and reps
                  cannot reassign (rules deny it), so the control is
                  hidden for them instead of failing on save. */}
              {canManageTeam(workspace?.role) && members.length > 0 && (
                <div className="detail-card">
                  <span>Assigned to</span>
                  <select
                    value={detailInquiry.assignedTo || ''}
                    onChange={e => {
                      const assignedTo = e.target.value
                      setItems(current =>
                        current.map(item =>
                          item.id === detailInquiry.id
                            ? { ...item, assignedTo }
                            : item
                        )
                      )
                      setSelectedInquiry(current =>
                        current ? { ...current, assignedTo } : current
                      )
                      // Gate 8 fix: the items sync effect persists
                      // this change without logging it, so log the
                      // assignment here (manual moves only — routing
                      // logs its own lines at creation time).
                      if (assignedTo !== (detailInquiry.assignedTo || '')) {
                        const assignee = members.find(m => m.id === assignedTo)
                        logAudit(workspace?.ownerUid, {
                          action: 'inquiry_assigned',
                          inquiryId: detailInquiry.id,
                          detail: assignedTo
                            ? `assigned to ${assignee?.email || assignedTo}`
                            : 'unassigned',
                        })
                      }
                    }}
                  >
                    <option value="">Unassigned</option>
                    {members.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.email || member.id}
                        {member.role ? ` (${member.role})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Branch is owner/admin-only: moving a row to another
                  branch is denied for managers, and reps never see
                  rows outside their assignment. */}
              {canManageTeam(workspace?.role) && branches.length > 0 && (
                <div className="detail-card">
                  <span>Branch</span>
                  <select
                    value={detailInquiry.branchId || ''}
                    onChange={e => {
                      const branchId = e.target.value
                      setItems(current =>
                        current.map(item =>
                          item.id === detailInquiry.id
                            ? { ...item, branchId }
                            : item
                        )
                      )
                      setSelectedInquiry(current =>
                        current ? { ...current, branchId } : current
                      )
                    }}
                  >
                    <option value="">No branch (owner/admin only)</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.name}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {detailInquiry.status === 'lost' && detailInquiry.lossReason && (
                <div className="detail-card detail-card-loss">
                  <span>Lost reason</span>
                  <strong>{LOSS_REASON_LABELS[detailInquiry.lossReason] || detailInquiry.lossReason}</strong>
                  {detailInquiry.lossNote && <small>{detailInquiry.lossNote}</small>}
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
              inquiry={detailInquiry}
              businessName={businessName}
              bookingLink={bookingLinkFor(businessSlug)}
              onAction={(type, templateId) => {
                logActivity(detailInquiry.id, type === 'voice-note' ? 'Voice note opened' : `WhatsApp opened (${templateId})`)
              }}
            />

            {/* Review requests (batch 2). The ask renders ONLY for a
                recovered inquiry with a saved, valid review link and a
                valid phone. No auto-send: the owner taps, WhatsApp opens
                pre-filled, the owner sends. The tap is logged ("Review
                requested") so it shows in the timeline — the same
                persisted state as every other action (the whole-list
                sync effect writes it to Firestore). */}
            {detailInquiry.status === 'recovered' && validReviewLink() && normalizePhone(detailInquiry.phone) && (
              <section className="review-request-section">
                <div>
                  <span className="app-eyebrow">GOOGLE REVIEW</span>
                  <h3>Ask for a review</h3>
                  <p>This customer recovered — a review ask is welcome now.</p>
                </div>
                <a
                  className="review-request-button"
                  href={waLink(detailInquiry.phone, fillTemplate(TEMPLATES.reviewRequest.text, {
                    name: detailInquiry.name,
                    business: businessName,
                    service: detailInquiry.service,
                    link: validReviewLink(),
                  }))}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => logActivity(detailInquiry.id, 'Review requested')}
                >
                  Ask for Google review
                </a>
              </section>
            )}

            {detailInquiry.status === 'recovered' && !validReviewLink() && normalizePhone(detailInquiry.phone) && (
              <p className="review-request-hint">
                Add your Google review link in Settings to ask this customer for a review.
              </p>
            )}

            {/* Review Rescue: a lost customer NEVER gets a review ask —
                not even with a saved link. They get a private recovery
                draft instead, and only become review-eligible if the
                conversation is reopened and the customer recovers again
                (replied → Mark recovered), at which point the section
                above renders. A stale lossReason on a re-recovered
                inquiry does not block the ask: eligibility is the live
                status, and the history stays intact for loss
                intelligence. */}
            {detailInquiry.status === 'lost' && normalizePhone(detailInquiry.phone) && (
              <section className="review-request-section review-rescue-section">
                <div>
                  <span className="app-eyebrow">REVIEW RESCUE</span>
                  <h3>Win them back first</h3>
                  <p>This customer was lost, so no review ask goes out. Send a private recovery message — and if they come back, reopen the conversation so they can recover properly.</p>
                </div>
                <div className="review-rescue-actions">
                  <a
                    className="review-request-button review-rescue-button"
                    href={waLink(detailInquiry.phone, fillTemplate(TEMPLATES.recoveryDraft.text, {
                      name: detailInquiry.name,
                      business: businessName,
                      service: detailInquiry.service,
                      link: '',
                    }))}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => logActivity(detailInquiry.id, 'Recovery message opened')}
                  >
                    Send recovery message
                  </a>
                  <button
                    type="button"
                    className="save-button"
                    onClick={() => {
                      updateStatus(detailInquiry.id, 'replied')
                      setSelectedInquiry({ ...detailInquiry, status: 'replied' })
                      logActivity(detailInquiry.id, 'Conversation reopened for recovery')
                    }}
                  >
                    Reopen conversation
                  </button>
                </div>
              </section>
            )}

            <SmartComposer
              inquiry={detailInquiry}
              businessName={businessName}
              businessSlug={businessSlug}
              currency={currency}
              onAction={(type, tone) => {
                logActivity(detailInquiry.id, `Smart message opened (${tone})`)
              }}
            />

            <DripSequences
              inquiry={detailInquiry}
              businessName={businessName}
              initialSteps={detailInquiry.dripSteps}
              onSave={(steps) => {
                // Persist the steps onto the inquiry (the whole-list sync
                // effect writes them to Firestore) and surface due steps
                // in the follow-up queue. Due dates are computed from the
                // day the sequence was saved.
                const today = new Date()
                const dripSteps = steps.map((step) => {
                  const due = new Date(today)
                  due.setDate(due.getDate() + Math.max(0, Number(step.day) - 1))
                  return { ...step, dueDate: due.toISOString().slice(0, 10), sent: false }
                })
                const updated = { ...detailInquiry, dripSteps }
                setItems(prev => prev.map(item => String(item.id) === String(detailInquiry.id) ? updated : item))
                setSelectedInquiry(updated)
                logActivity(detailInquiry.id, `Drip sequence saved (${steps.length} steps)`)
              }}
            />

            {detailInquiry.followupHistory?.length > 0 && (
              <div className="followup-history">
                <div className="followup-history-header">
                  <div>
                    <span className="app-eyebrow">ACTIVITY</span>
                    <h3>Follow-up history</h3>
                  </div>
                  <span>
                    {detailInquiry.followupHistory.length} event
                    {detailInquiry.followupHistory.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="history-list">
                  {[...detailInquiry.followupHistory].reverse().map(entry => (
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

              {detailInquiry.status === 'new' && (
                <button
                  type="button"
                  className="save-button"
                  onClick={() => {
                    updateStatus(detailInquiry.id, 'followup')
                    setSelectedInquiry({ ...detailInquiry, status: 'followup' })
                  }}
                >
                  Start follow-up
                </button>
              )}

              {detailInquiry.status === 'followup' && (
                <button
                  type="button"
                  className="save-button"
                  onClick={() => {
                    updateStatus(detailInquiry.id, 'replied')
                    setSelectedInquiry({ ...detailInquiry, status: 'replied' })
                  }}
                >
                  Mark replied
                </button>
              )}

              {detailInquiry.status === 'replied' && (
                <button
                  type="button"
                  className="save-button"
                  onClick={() => markRecovered(detailInquiry.id)}
                >
                  Mark recovered
                </button>
              )}

              {/* Offers are owner-created (rules require the offer's
                  ownerUid to equal the creator's uid). */}
              {canCreateOffers(workspace?.role) && ['new', 'followup', 'replied'].includes(detailInquiry.status) && (
                <button
                  type="button"
                  className="offer-action-button"
                  onClick={() => setOfferTarget(detailInquiry)}
                >
                  Send second-chance offer
                </button>
              )}

              {['new', 'followup', 'replied'].includes(detailInquiry.status) && (
                <button
                  type="button"
                  className="danger-outline-button"
                  onClick={() => setLossTarget(detailInquiry)}
                >
                  Mark lost
                </button>
              )}

              <button
                type="button"
                className="cancel-button"
                onClick={closeDetail}
              >
                Close
              </button>

              {/* Delete is owner/admin-only (rules deny it for staff),
                  so the button is hidden rather than failing. */}
              {canDelete(workspace?.role) && (deleteConfirmId === detailInquiry.id ? (
                <>
                  <span className="delete-confirm-text">
                    Delete this inquiry permanently?
                  </span>
                  <button
                    type="button"
                    className="danger-solid-button"
                    onClick={() => deleteInquiry(detailInquiry.id)}
                  >
                    Yes, delete
                  </button>
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => setDeleteConfirmId(null)}
                  >
                    Keep it
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="danger-outline-button"
                  onClick={() => setDeleteConfirmId(detailInquiry.id)}
                >
                  Delete inquiry
                </button>
              ))}
            </div>
      </Modal>
      )}

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
          path="/accept"
          element={
            <RequireAuth>
              <AcceptInvite />
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

        {/* Authenticated workspace — all wrapped in AppLayout (with sidebar).
            WorkspaceProvider resolves the member's workspace once so every
            /app/* page reads the owner's data root with the role applied. */}
        <Route
          element={
            <RequireAuth>
              <WorkspaceProvider>
                <AppLayout />
              </WorkspaceProvider>
            </RequireAuth>
          }
        >
          {/* Batch 3 (2026-10-30): Overview is back as the post-login
              landing page on the owner's order — but WITHOUT the Revenue
              summary panel (removed from the Dashboard below). /app/inquiry
              keeps the Dashboard component alive as the inquiry-detail
              host only (see detailOnly in Dashboard). */}
          <Route path="/app" element={<Dashboard />} />
          <Route path="/app/inquiry" element={<Dashboard />} />
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
