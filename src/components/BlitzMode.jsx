import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { rankByWinback } from '../utils/winbackScore.js'
import { composeMessage, upcomingOccasion } from '../utils/smartComposer.js'
import { waLink, normalizePhone, bookingLinkFor } from '../utils/whatsapp.js'
import { IconMessage, IconCheck, IconZap } from './icons.jsx'
import {
  CURRENCY_CODES,
  defaultCurrencyForBrowser,
  formatMoney,
} from '../utils/money.js'
import './BlitzMode.css'
import { useWorkspace } from './WorkspaceContext.jsx'
import { inScope } from '../utils/workspace.js'

/**
 * Blitz Mode — one-click re-engagement campaigns.
 *
 * Pick lost / cooling inquiries, then step through them one by one:
 * each card shows a personalized win-back message (Smart Composer),
 * one tap opens WhatsApp, mark done or skip. Progress bar + summary.
 * Every send is logged to the inquiry's activity history.
 */
export default function BlitzMode() {
  const navigate = useNavigate()
  // Batch 4: workspace root + role.
  const { workspace, loading: wsLoading } = useWorkspace()

  const [items, setItems] = useState([])
  const [businessName, setBusinessName] = useState('')
  const [businessSlug, setBusinessSlug] = useState('')
  const [currency, setCurrency] = useState(() => defaultCurrencyForBrowser())
  const [loading, setLoading] = useState(true)

  const [selected, setSelected] = useState({}) // id -> true
  const [started, setStarted] = useState(false)
  const [queue, setQueue] = useState([]) // ordered inquiry objects
  const [cursor, setCursor] = useState(0)
  const [done, setDone] = useState([]) // ids contacted
  const [skipped, setSkipped] = useState([])

  const occasion = useMemo(() => upcomingOccasion(), [])

  // Loads from the workspace owner's data root, filtered to scope.
  useEffect(() => {
    const db = window.firebase?.firestore?.()
    if (!db) { setLoading(false); return }
    if (wsLoading || !workspace) {
      if (!wsLoading) setItems([])
      setLoading(false)
      return undefined
    }

    let cancelled = false
    ;(async () => {
      try {
        const snap = await db.collection('users').doc(workspace.ownerUid).collection('inquiries').get()
        if (cancelled) return
        const uid = window.firebase?.auth?.().currentUser?.uid
        setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(item => inScope(item, workspace, uid)))

        const settings = await db.collection('users').doc(workspace.ownerUid).collection('settings').doc('workspace').get()
        const data = settings.data() || {}
        setBusinessName(data.businessName || '')
        setBusinessSlug(data.businessSlug || data.slug || '')
        if (CURRENCY_CODES.includes(data.currency)) setCurrency(data.currency)
      } catch (e) {
        console.error('Blitz load failed:', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [wsLoading, workspace])

  const ranked = useMemo(() => rankByWinback(items), [items])
  const selectedCount = Object.values(selected).filter(Boolean).length

  function toggleSelect(id) {
    setSelected(s => ({ ...s, [id]: !s[id] }))
  }

  function selectAllWarm() {
    const next = {}
    ranked.forEach(r => { if (r.inquiry.status === 'lost' || r.band !== 'cold') next[r.inquiry.id] = true })
    setSelected(next)
  }

  function startBlitz() {
    const picked = ranked
      .filter(r => selected[r.inquiry.id])
      .map(r => r.inquiry)
    if (!picked.length) return
    setQueue(picked)
    setCursor(0)
    setDone([])
    setSkipped([])
    setStarted(true)
  }

  async function logActivity(inquiryId, text) {
    try {
      const db = window.firebase?.firestore?.()
      if (!workspace || !db) return
      const ref = db.collection('users').doc(workspace.ownerUid).collection('inquiries').doc(String(inquiryId))
      const snap = await ref.get()
      const history = snap.data()?.followupHistory || []
      history.push({
        id: `blitz-${Date.now()}`,
        type: 'Blitz campaign',
        note: text,
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toTimeString().slice(0, 5),
      })
      await ref.set({ followupHistory: history }, { merge: true })
    } catch (e) {
      console.error('Blitz log failed:', e)
    }
  }

  function handleSend(current) {
    const { text } = composeMessage(current, {
      tone: 'friendly',
      businessName,
      bookingLink: bookingLinkFor(businessSlug),
      occasion,
      currency,
    })
    const link = waLink(current.phone, text)
    if (link) window.open(link, '_blank', 'noopener')
    logActivity(current.id, 'Win-back WhatsApp opened via Blitz')
    setDone(d => [...d, current.id])
    setCursor(c => c + 1)
  }

  function handleSkip(current) {
    setSkipped(s => [...s, current.id])
    setCursor(c => c + 1)
  }

  const finished = started && cursor >= queue.length
  const current = !finished && started ? queue[cursor] : null
  const progress = queue.length ? Math.round((cursor / queue.length) * 100) : 0

  // ---- selection screen ----
  if (!started) {
    return (
      <div className="blitz-page">
        <div className="blitz-inner">
          <header className="blitz-header">
            <div>
              <span className="app-eyebrow">BLITZ MODE</span>
              <h1>Re-engagement blitz</h1>
              <p>Win back lost customers in one focused session. Pick who to contact, then power through them one by one.</p>
            </div>
            <button className="primary-button" onClick={() => navigate('/app/inquiries')}>Back to inquiries</button>
          </header>

          {loading && <div className="empty-state">Loading inquiries…</div>}

          {!loading && ranked.length === 0 && (
            <div className="empty-state">No open inquiries to blitz. Add some first.</div>
          )}

          {!loading && ranked.length > 0 && (
            <>
              <div className="blitz-toolbar">
                <p>{selectedCount} selected</p>
                <div>
                  <button type="button" className="ghost-button" onClick={selectAllWarm}>
                    Auto-pick warm + lost
                  </button>
                  <button
                    type="button"
                    className="primary-button"
                    disabled={!selectedCount}
                    onClick={startBlitz}
                  >
                    <IconZap width={16} height={16} />
                    Start blitz ({selectedCount})
                  </button>
                </div>
              </div>

              <div className="blitz-list">
                {ranked.map(({ inquiry, score, band }) => (
                  <label key={inquiry.id} className={`blitz-row ${selected[inquiry.id] ? 'picked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={!!selected[inquiry.id]}
                      onChange={() => toggleSelect(inquiry.id)}
                    />
                    <span className="blitz-who">
                      <strong>{inquiry.name}</strong>
                      <span>{inquiry.service} · {formatMoney(Number(inquiry.value) || 0, currency)}</span>
                    </span>
                    <span className={`wb-mini wb-${band}`}>{score}</span>
                    <span className={`status status-${inquiry.status}`}>{inquiry.status}</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // ---- summary screen ----
  if (finished) {
    const contacted = queue.filter(q => done.includes(q.id))
    const totalValue = contacted.reduce((s, q) => s + (Number(q.value) || 0), 0)
    return (
      <div className="blitz-page">
        <div className="blitz-inner blitz-summary">
          <span className="blitz-done-icon"><IconCheck width={40} height={40} /></span>
          <h1>Blitz complete</h1>
          <p>You contacted <strong>{done.length}</strong> customer{done.length === 1 ? '' : 's'} ({skipped.length} skipped).</p>
          <div className="blitz-summary-value">
            <span>Pipeline value touched</span>
            <strong>{formatMoney(totalValue, currency)}</strong>
          </div>
          <div className="blitz-summary-actions">
            <button type="button" className="primary-button" onClick={() => { setStarted(false); setSelected({}) }}>
              Run another blitz
            </button>
            <button type="button" className="ghost-button" onClick={() => navigate('/app/inquiries')}>
              Back to inquiries
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ---- step-through screen ----
  const { text } = composeMessage(current, {
    tone: 'friendly',
    businessName,
    bookingLink: bookingLinkFor(businessSlug),
    occasion,
    currency,
  })

  return (
    <div className="blitz-page">
      <div className="blitz-inner">
        <div className="blitz-progress">
          <div className="blitz-progress-bar"><span style={{ width: `${progress}%` }} /></div>
          <span>{cursor + 1} of {queue.length}</span>
        </div>

        <div className="blitz-card">
          <span className="app-eyebrow">NOW CONTACTING</span>
          <h2>{current.name}</h2>
          <p className="blitz-meta">{current.service} · {formatMoney(Number(current.value) || 0, currency)} · {current.phone}</p>

          <div className="sc-preview">
            <span className="sc-preview-label">Personalized message</span>
            <p>{text}</p>
          </div>

          <div className="blitz-actions">
            <button type="button" className="blitz-send" onClick={() => handleSend(current)}>
              <IconMessage width={18} height={18} />
              Open WhatsApp &amp; mark done
            </button>
            <button type="button" className="ghost-button" onClick={() => handleSkip(current)}>
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
