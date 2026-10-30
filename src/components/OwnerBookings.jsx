import React, { useEffect, useState } from 'react'

/**
 * Owner bookings — booking requests customers sent from the public
 * booking link (/b/{slug}). Bookings live under the business's public
 * `businesses` doc, so the owner reads them here (a public visitor can
 * never write into the owner's private inquiries collection).
 *
 * Props:
 * - onAddInquiry: (booking) => void — adds the booking as an inquiry
 *   on the dashboard (owner-signed-in write, so it is allowed).
 */
export default function OwnerBookings({ onAddInquiry }) {
  const [bookings, setBookings] = useState([])
  const [businessId, setBusinessId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const auth = window.firebase?.auth?.()
    const db = window.firebase?.firestore?.()
    if (!auth || !db) { setLoading(false); return }

    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (!user) { setBookings([]); setBusinessId(null); setLoading(false); return }
      try {
        const snap = await db.collection('businesses')
          .where('ownerUid', '==', user.uid).limit(1).get()
        if (snap.empty) { setBookings([]); setBusinessId(null); return }
        const doc = snap.docs[0]
        setBusinessId(doc.id)
        const books = await db.collection('businesses').doc(doc.id)
          .collection('bookings').orderBy('createdAt', 'desc').get()
        setBookings(books.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (error) {
        console.error('Owner bookings load failed:', error)
        setBookings([])
      } finally {
        setLoading(false)
      }
    })
    return unsubscribe
  }, [])

  async function markAdded(booking) {
    onAddInquiry?.(booking)
    setBookings(prev => prev.map(b =>
      b.id === booking.id ? { ...b, status: 'added' } : b
    ))
    try {
      const db = window.firebase?.firestore?.()
      if (db && businessId) {
        await db.collection('businesses').doc(businessId)
          .collection('bookings').doc(booking.id)
          .set({ status: 'added' }, { merge: true })
      }
    } catch (error) {
      console.error('Mark booking added failed:', error)
    }
  }

  if (loading || bookings.length === 0) return null

  const pending = bookings.filter(b => b.status === 'pending')
  if (pending.length === 0) return null

  return (
    <section className="owner-bookings">
      <div>
        <span className="app-eyebrow">BOOKING REQUESTS</span>
        <h2>{pending.length} booking request{pending.length === 1 ? '' : 's'} from your booking link</h2>
        <p>Customers asked for a preferred day and time. Confirm on WhatsApp, then add them as inquiries so they enter your follow-up queue.</p>
      </div>
      <div className="owner-bookings-list">
        {pending.map(booking => (
          <div className="owner-booking-row" key={booking.id}>
            <div>
              <strong>{booking.customerName}</strong>
              <span>{booking.customerPhone}</span>
            </div>
            <div>
              <strong>{booking.preferredDate}{booking.preferredTime ? ` at ${booking.preferredTime}` : ''}</strong>
              {booking.note && <span>{booking.note}</span>}
            </div>
            <button
              type="button"
              className="primary-button"
              onClick={() => markAdded(booking)}
            >
              Add as inquiry
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
