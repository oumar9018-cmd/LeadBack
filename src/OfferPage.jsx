import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { LogoMark, IconGift, IconTimer, IconCheck } from './components/icons.jsx'
import './OfferPage.css'

/**
 * Public second-chance offer page: /o/{code}
 * A customer opens this from WhatsApp. No login required.
 *
 * Lifecycle: sent -> viewed (first open) -> redeemed (claim tapped)
 *            \-> expired (past expiresAt)
 */

function useCountdown(expiresAt) {
  const [remaining, setRemaining] = useState(() => getRemaining(expiresAt))

  useEffect(() => {
    if (!expiresAt) return
    const id = setInterval(() => setRemaining(getRemaining(expiresAt)), 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  return remaining
}

function getRemaining(expiresAt) {
  if (!expiresAt) return null
  // expiresAt is an ISO string from OfferBuilder; tolerate a Firestore
  // Timestamp too, so a format change can never NaN the countdown.
  const ms =
    (typeof expiresAt === 'string'
      ? Date.parse(expiresAt)
      : expiresAt?.toDate
        ? expiresAt.toDate().getTime()
        : NaN) - Date.now()
  if (Number.isNaN(ms) || ms <= 0) return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    expired: false,
    days: Math.floor(ms / 86400000),
    hours: Math.floor((ms % 86400000) / 3600000),
    minutes: Math.floor((ms % 3600000) / 60000),
    seconds: Math.floor((ms % 60000) / 1000),
  }
}

function pad(n) {
  return String(n).padStart(2, '0')
}

export default function OfferPage() {
  const { code } = useParams()
  const [offer, setOffer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  // The countdown hook returns null until expiresAt is known; the render
  // below reads countdown.days unconditionally, so a null here used to
  // throw on the first render after the offer loaded and crash the page.
  // Default to zeros instead — never render from a null countdown.
  const countdown = useCountdown(offer?.expiresAt) ?? {
    expired: false, days: 0, hours: 0, minutes: 0, seconds: 0,
  }

  useEffect(() => {
    const db = window.firebase?.firestore?.()
    if (!db || !code) {
      setLoading(false)
      return
    }

    db.collection('offers')
      .doc(code)
      .get()
      .then(async doc => {
        if (!doc.exists) {
          setLoading(false)
          return
        }
        const data = { id: doc.id, ...doc.data() }
        setOffer(data)
        setLoading(false)

        // First view: sent -> viewed (public rules allow this transition only).
        if (data.status === 'sent') {
          try {
            await doc.ref.update({
              status: 'viewed',
              viewedAt: new Date().toISOString(),
              views: (Number(data.views) || 0) + 1,
            })
            setOffer(current => (current ? { ...current, status: 'viewed' } : current))
          } catch {
            // View tracking is best-effort; the offer still works.
          }
        }
      })
      .catch(() => setLoading(false))
  }, [code])

  async function handleClaim() {
    if (!offer || claiming) return
    setClaiming(true)
    const db = window.firebase?.firestore?.()
    try {
      await db.collection('offers').doc(offer.id).update({
        status: 'redeemed',
        redeemedAt: new Date().toISOString(),
      })
      setOffer({ ...offer, status: 'redeemed', redeemedAt: new Date().toISOString() })
    } catch {
      // If the write fails (offline etc.), still show the claim screen —
      // the owner can confirm manually. Never block the customer.
      setOffer({ ...offer, status: 'redeemed', redeemedAt: new Date().toISOString(), claimPending: true })
    } finally {
      setClaiming(false)
    }
  }

  if (loading) {
    return (
      <div className="offer-shell">
        <div className="offer-card"><p className="offer-muted">Loading your offer…</p></div>
      </div>
    )
  }

  if (!offer) {
    return (
      <div className="offer-shell">
        <div className="offer-card">
          <LogoMark width={48} height={48} />
          <h1>Offer not found</h1>
          <p className="offer-muted">This link may be old or mistyped. Ask the business for a fresh one.</p>
        </div>
      </div>
    )
  }

  const isExpired = countdown?.expired || Date.parse(offer.expiresAt) <= Date.now()
  const firstName = (offer.customerName || 'there').split(' ')[0]

  if (offer.status === 'redeemed') {
    return (
      <div className="offer-shell">
        <div className="offer-card offer-claimed">
          <span className="offer-check"><IconCheck width={34} height={34} /></span>
          <h1>Offer claimed!</h1>
          <p>
            Show this screen at <strong>{offer.businessName}</strong> to redeem{' '}
            <strong>{offer.discountText}</strong>.
          </p>
          {offer.claimPending && (
            <p className="offer-muted">If the screen doesn't load at the shop, just mention your name — they'll have your offer on file.</p>
          )}
          <div className="offer-brand">
            <LogoMark width={22} height={22} />
            <span>Powered by Wynback</span>
          </div>
        </div>
      </div>
    )
  }

  if (isExpired) {
    return (
      <div className="offer-shell">
        <div className="offer-card">
          <LogoMark width={48} height={48} />
          <h1>This offer expired</h1>
          <p className="offer-muted">
            Sorry {firstName} — this personal offer from {offer.businessName} has ended.
            Message them directly; they'd still love to have you back.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="offer-shell">
      <div className="offer-card">
        <span className="offer-eyebrow">A personal offer, just for you</span>
        <div className="offer-gift"><IconGift width={44} height={44} /></div>
        <h1>Hi {firstName}!</h1>
        <p className="offer-from">{offer.businessName} put this together for you:</p>
        <div className="offer-discount">{offer.discountText}</div>
        {offer.note && <p className="offer-note">"{offer.note}"</p>}

        <div className="offer-countdown" role="timer" aria-label="Offer expires in">
          <span className="offer-countdown-label">
            <IconTimer width={16} height={16} />
            Expires in
          </span>
          <div className="offer-countdown-digits">
            {countdown.days > 0 && (
              <span className="offer-digit"><strong>{pad(countdown.days)}</strong><small>days</small></span>
            )}
            <span className="offer-digit"><strong>{pad(countdown.hours)}</strong><small>hrs</small></span>
            <span className="offer-digit"><strong>{pad(countdown.minutes)}</strong><small>min</small></span>
            <span className="offer-digit"><strong>{pad(countdown.seconds)}</strong><small>sec</small></span>
          </div>
        </div>

        <button
          type="button"
          className="offer-claim"
          disabled={claiming}
          onClick={handleClaim}
        >
          {claiming ? 'Claiming…' : 'Claim this offer'}
        </button>

        <div className="offer-brand">
          <LogoMark width={22} height={22} />
          <span>Powered by Wynback</span>
        </div>
      </div>
    </div>
  )
}
