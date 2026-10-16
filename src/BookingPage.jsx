import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { LogoMark, IconCalendar, IconPhone, IconCheck } from './components/icons.jsx'
import './BookingPage.gold.css'

/**
 * Public booking page: wynback.app/b/{businessSlug}
 * A customer opens this from a WhatsApp message and picks a slot.
 * No login required — this is the business's public face.
 */
export default function BookingPage() {
  const { slug } = useParams()
  const [business, setBusiness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [booked, setBooked] = useState(false)

  useEffect(() => {
    const db = window.firebase?.firestore?.()
    if (!db || !slug) {
      setLoading(false)
      return
    }
    db.collection('businesses')
      .where('slug', '==', slug)
      .limit(1)
      .get()
      .then((snap) => {
        if (!snap.empty) setBusiness({ id: snap.docs[0].id, ...snap.docs[0].data() })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug])

  // Demo slots — in production these come from the business's availability
  const slots = [
    'Today · 4:00 PM', 'Today · 5:30 PM',
    'Tomorrow · 10:00 AM', 'Tomorrow · 12:30 PM',
    'Tomorrow · 4:00 PM', 'Tomorrow · 6:00 PM',
  ]

  // Group "Day · Time" strings by day for a calmer picker
  const slotGroups = useMemo(() => {
    const groups = []
    slots.forEach((slot) => {
      const [day, time] = slot.split(' · ')
      let group = groups.find((g) => g.day === day)
      if (!group) {
        group = { day, items: [] }
        groups.push(group)
      }
      group.items.push({ label: slot, time })
    })
    return groups
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleBook(e) {
    e.preventDefault()
    if (!selectedSlot || !name.trim() || !phone.trim()) return
    const db = window.firebase?.firestore?.()
    if (db && business) {
      await db.collection('businesses').doc(business.id)
        .collection('bookings').add({
          slot: selectedSlot,
          customerName: name.trim(),
          customerPhone: phone.trim(),
          status: 'pending',
          source: 'wynback-link',
          createdAt: new Date().toISOString(),
        })
    }
    setBooked(true)
  }

  if (loading) {
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

  if (!business) {
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
          <span className="success-rings" aria-hidden="true">
            <span className="ring ring-1" />
            <span className="ring ring-2" />
          </span>
          <span className="success-icon">
            <svg viewBox="0 0 72 72" width="40" height="40" aria-hidden="true">
              <defs>
                <linearGradient id="successGold" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#E8B44A" />
                  <stop offset="1" stopColor="#FF6B35" />
                </linearGradient>
              </defs>
              <circle className="success-circle" cx="36" cy="36" r="32" />
              <path className="success-tick" d="M23 37.5 32 46l17-19" />
            </svg>
          </span>
          <h1 className="success-title">You&rsquo;re booked!</h1>
          <p className="success-copy">
            <strong>{business.name}</strong> will confirm{' '}
            <strong className="success-slot">{selectedSlot}</strong> shortly on WhatsApp.
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
            <span>Book your slot</span>
          </div>
        </div>

        <h1>Pick a time that works for you</h1>
        <p className="booking-sub">Choose a slot below — we&rsquo;ll confirm on WhatsApp.</p>

        <div className="slot-days">
          {slotGroups.map((group) => (
            <div className="slot-day" key={group.day}>
              <p className="slot-day-label">{group.day}</p>
              <div className="slot-grid">
                {group.items.map(({ label, time }) => (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={selectedSlot === label}
                    className={selectedSlot === label ? 'slot selected' : 'slot'}
                    onClick={() => setSelectedSlot(label)}
                  >
                    <IconCalendar width={16} height={16} />
                    {time}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleBook} className="booking-form">
          <label>
            Your name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya Sharma"
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
          <button type="submit" className="button button-primary" disabled={!selectedSlot}>
            <IconPhone width={18} height={18} />
            Confirm booking
          </button>
          {!selectedSlot && <small className="hint">Pick a slot above first</small>}
        </form>

        <p className="booking-powered">Powered by Wynback</p>
      </div>
    </div>
  )
}
