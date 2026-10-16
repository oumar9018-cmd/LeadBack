import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { LogoMark, IconCalendar, IconPhone, IconCheck } from '../components/icons.jsx'
import './BookingPage.css'

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
        <div className="booking-card"><p>Loading…</p></div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="booking-shell">
        <div className="booking-card">
          <LogoMark width={48} height={48} />
          <h1>Booking link not found</h1>
          <p>This link may be old or mistyped. Ask the business for a fresh link.</p>
        </div>
      </div>
    )
  }

  if (booked) {
    return (
      <div className="booking-shell">
        <div className="booking-card booking-success">
          <span className="success-icon"><IconCheck width={32} height={32} /></span>
          <h1>You're booked!</h1>
          <p>{business.name} will confirm <strong>{selectedSlot}</strong> shortly on WhatsApp.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="booking-shell">
      <div className="booking-card">
        <div className="booking-brand">
          <LogoMark width={40} height={40} />
          <div>
            <strong>{business.name}</strong>
            <span>Book your slot</span>
          </div>
        </div>

        <h1>Pick a time that works for you</h1>

        <div className="slot-grid">
          {slots.map((slot) => (
            <button
              key={slot}
              type="button"
              className={selectedSlot === slot ? 'slot selected' : 'slot'}
              onClick={() => setSelectedSlot(slot)}
            >
              <IconCalendar width={16} height={16} />
              {slot}
            </button>
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
