import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { LogoMark, IconCalendar, IconPhone, IconCheck } from './components/icons.jsx'
import './BookingPage.gold.css'

/**
 * Public booking page: /b/{businessSlug}
 * A customer opens this from a WhatsApp message and requests a time.
 * No login required — this is the business's public face.
 *
 * Honest by design: the customer picks a PREFERRED day/time, not a
 * guaranteed slot. Nothing here promises a slot the business never
 * offered. The request lands in the business's bookings and the owner
 * confirms it on WhatsApp — and can add it as an inquiry in one tap.
 * The business record itself is created from Settings (slug, services,
 * hours); this page only reads it.
 */
export default function BookingPage() {
  const { slug } = useParams()
  const [business, setBusiness] = useState(null)
  const [loadState, setLoadState] = useState('loading') // loading | ready | not-found | load-error
  const [preferredDate, setPreferredDate] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [note, setNote] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [booked, setBooked] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    const db = window.firebase?.firestore?.()
    if (!db || !slug) {
      setLoadState('not-found')
      return
    }
    db.collection('businesses')
      .where('slug', '==', slug)
      .limit(1)
      .get()
      .then((snap) => {
        if (!snap.empty) {
          setBusiness({ id: snap.docs[0].id, ...snap.docs[0].data() })
          setLoadState('ready')
        } else {
          setLoadState('not-found')
        }
      })
      .catch((error) => {
        console.error('Booking page load failed:', error)
        setLoadState('load-error')
      })
  }, [slug])

  async function handleBook(e) {
    e.preventDefault()
    if (!preferredDate || !name.trim() || !phone.trim()) return
    setSubmitError('')
    const db = window.firebase?.firestore?.()
    if (!db || !business) {
      setSubmitError('Could not send your request right now. Please try again, or message the business directly.')
      return
    }
    try {
      await db.collection('businesses').doc(business.id)
        .collection('bookings').add({
          customerName: name.trim(),
          customerPhone: phone.trim(),
          preferredDate,
          preferredTime: preferredTime || '',
          note: note.trim(),
          status: 'pending',
          source: 'wynback-link',
          createdAt: new Date().toISOString(),
        })
      setBooked(true)
    } catch (error) {
      console.error('Booking request failed:', error)
      setSubmitError('Could not send your request right now. Please try again, or message the business directly.')
    }
  }

  if (loadState === 'loading') {
    return (
      <div className="booking-shell">
        <div className="booking-card booking-loading" aria-label="Loading booking page">
          <div className="skel skel-brand" />
          <div className="skel skel-title" />
          <div className="skel skel-slots">
            <div className="skel skel-slot" />
            <div className="skel skel-slot" />
            <div className="skel skel-slot" />
            <div className="skel skel-slot" />
          </div>
          <div className="skel skel-input" />
          <div className="skel skel-input" />
          <div className="skel skel-button" />
        </div>
      </div>
    )
  }

  if (loadState === 'load-error') {
    return (
      <div className="booking-shell">
        <div className="booking-card booking-enter">
          <span className="booking-mark">
            <LogoMark width={44} height={44} />
          </span>
          <h1>Could not load this booking page</h1>
          <p className="booking-sub">Something went wrong loading the business details. Please try again in a moment, or ask the business for a fresh link.</p>
        </div>
      </div>
    )
  }

  if (loadState === 'not-found' || !business) {
    return (
      <div className="booking-shell">
        <div className="booking-card booking-enter">
          <span className="booking-mark">
            <LogoMark width={44} height={44} />
          </span>
          <h1>Booking link not found</h1>
          <p className="booking-sub">This link may be old or mistyped. Ask the business for a fresh link.</p>
        </div>
      </div>
    )
  }

  if (booked) {
    return (
      <div className="booking-shell">
        <div className="booking-card booking-success booking-enter">
          <span className="success-icon">
            <svg viewBox="0 0 72 72" width="40" height="40" aria-hidden="true">
              <defs>
                <linearGradient id="successBlue" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#2563EB" />
                  <stop offset="1" stopColor="#1D4ED8" />
                </linearGradient>
              </defs>
              <circle className="success-circle" cx="36" cy="36" r="32" />
              <path className="success-tick" d="M23 37.5 32 46l17-19" />
            </svg>
          </span>
          <h1 className="success-title">Request sent!</h1>
          <p className="success-copy">
            <strong>{business.name}</strong> will confirm{' '}
            {preferredTime ? (
              <>your preferred time of <strong className="success-slot">{preferredDate} at {preferredTime}</strong></>
            ) : (
              <>your preferred day of <strong className="success-slot">{preferredDate}</strong></>
            )}{' '}
            shortly on WhatsApp.
          </p>
          <p className="booking-powered">Powered by Wynback</p>
        </div>
      </div>
    )
  }

  return (
    <div className="booking-shell">
      <div className="booking-card booking-enter">
        <div className="booking-brand">
          <span className="booking-mark">
            <LogoMark width={38} height={38} />
          </span>
          <div>
            <strong>{business.name}</strong>
            <span>Request a booking</span>
          </div>
        </div>

        <h1>When would suit you?</h1>
        <p className="booking-sub">
          Tell us your preferred day and time — the business will confirm on WhatsApp.
          {business.services ? ` Services: ${business.services}.` : ''}
          {business.hours ? ` Open: ${business.hours}.` : ''}
        </p>

        <form onSubmit={handleBook} className="booking-form">
          <label>
            Preferred day
            <input
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              required
            />
          </label>
          <label>
            Preferred time (optional)
            <input
              type="time"
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
            />
          </label>
          <label>
            Anything we should know? (optional)
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. haircut and colour"
            />
          </label>
          <label>
            Your name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              autoComplete="name"
              required
            />
          </label>
          <label>
            Phone (for confirmation)
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="98765 43210"
              autoComplete="tel"
              required
            />
          </label>
          <button type="submit" className="button button-primary" disabled={!preferredDate}>
            <IconPhone width={18} height={18} />
            Send booking request
          </button>
          {!preferredDate && <small className="hint">Pick a preferred day first</small>}
          {submitError && <p className="booking-error" role="alert">{submitError}</p>}
        </form>

        <p className="booking-powered">Powered by Wynback</p>
      </div>
    </div>
  )
}
