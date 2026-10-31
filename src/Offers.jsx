import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BASE_PATH } from './basePath.js'
import { formatMoney } from './utils/money.js'
import { waLink, normalizePhone } from './utils/whatsapp.js'
import { IconGift, IconCopy, IconCheck, IconSend, IconTimer, IconTrash } from './components/icons.jsx'
import './Offers.css'
import { useWorkspace } from './components/WorkspaceContext.jsx'

/**
 * Owner's second-chance offers: sent -> viewed -> redeemed tracking,
 * with revenue attribution when a claim turns into a recovery.
 */

const STATUS_LABELS = {
  sent: 'Sent',
  viewed: 'Viewed',
  redeemed: 'Claimed',
  expired: 'Expired',
}

function offerStatus(offer) {
  if (offer.status === 'redeemed') return 'redeemed'
  if (Date.parse(offer.expiresAt) <= Date.now()) return 'expired'
  return offer.status
}

export default function Offers() {
  const navigate = useNavigate()
  // Batch 4: offers are owner-only — the rules let only the uid that
  // owns an offer list it, so staff see a notice, never a broken list.
  const { workspace, loading: wsLoading } = useWorkspace()
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  useEffect(() => {
    if (wsLoading || !workspace || workspace.role !== 'owner') {
      if (!wsLoading) {
        setOffers([])
        setLoading(false)
      }
      return undefined
    }
    const db = window.firebase?.firestore?.()
    if (!db) {
      setLoading(false)
      return undefined
    }
    let cancelled = false
    db.collection('offers')
      .where('ownerUid', '==', workspace.ownerUid)
      .get()
      .then(snap => {
        if (cancelled) return
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        list.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        setOffers(list)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [wsLoading, workspace])

  function offerUrl(offer) {
    return `${window.location.origin}${BASE_PATH}/o/${offer.code}`
  }

  function handleCopy(offer) {
    navigator.clipboard?.writeText(offerUrl(offer)).then(() => {
      setCopiedId(offer.id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  // Inline two-step confirm (same pattern as Delete inquiry): the old
  // window.confirm() never surfaced a dialog in some browsers, so the
  // button looked enabled and did nothing. First click arms the
  // confirm, second click deletes.
  async function handleDelete(offer) {
    if (deleteConfirmId !== offer.id) {
      setDeleteConfirmId(offer.id)
      return
    }
    setDeleteConfirmId(null)
    const db = window.firebase?.firestore?.()
    try {
      await db.collection('offers').doc(offer.id).delete()
      setOffers(current => current.filter(o => o.id !== offer.id))
    } catch {
      alert('Could not delete the offer. Try again.')
    }
  }

  async function handleMarkRecovered(offer) {
    const db = window.firebase?.firestore?.()
    if (!workspace || !db || !offer.inquiryId) return

    const valueStr = window.prompt(
      `How much revenue did ${offer.customerName || 'this customer'} bring back?`,
      ''
    )
    if (valueStr === null) return
    const value = Number(valueStr)
    if (!Number.isFinite(value) || value < 0) {
      alert('Enter a valid amount.')
      return
    }

    try {
      await db
        .collection('users')
        .doc(workspace.ownerUid)
        .collection('inquiries')
        .doc(String(offer.inquiryId))
        .update({
          status: 'recovered',
          recoveredAt: new Date().toISOString().slice(0, 10),
          recoveredViaOffer: offer.code,
        })
      await db.collection('offers').doc(offer.id).update({ recoveredValue: value })
      setOffers(current =>
        current.map(o => (o.id === offer.id ? { ...o, recoveredValue: value } : o))
      )
    } catch {
      alert('Could not update. The inquiry may have been deleted.')
    }
  }

  const claimed = offers.filter(o => offerStatus(o) === 'redeemed')
  const attributed = claimed.reduce((s, o) => s + (Number(o.recoveredValue) || 0), 0)

  // Staff never see offer data: the rules let only the owning uid list
  // offers, so a scoped list would be empty-or-denied, not scoped.
  if (!wsLoading && workspace && workspace.role !== 'owner') {
    return (
      <div className="offers-page">
        <div className="offers-inner">
          <header className="offers-header">
            <div>
              <span className="app-eyebrow">SECOND-CHANCE OFFERS</span>
              <h1>Win-back offers</h1>
              <p>Offers are managed by the workspace owner. Your role works leads from the Inquiries and Follow-ups pages.</p>
            </div>
          </header>
        </div>
      </div>
    )
  }

  return (
    <div className="offers-page">
      <div className="offers-inner">
        <header className="offers-header">
          <div>
            <span className="app-eyebrow">SECOND-CHANCE OFFERS</span>
            <h1>Win-back offers</h1>
            <p>Personal, expiring links that pull lost customers back — with closed-loop attribution.</p>
          </div>
          <button type="button" className="primary-action" onClick={() => navigate('/app/inquiries')}>
            New offer from pipeline
          </button>
        </header>

        <section className="offers-stats">
          <div className="offers-stat">
            <span>Offers sent</span>
            <strong>{offers.length}</strong>
          </div>
          <div className="offers-stat">
            <span>Claimed</span>
            <strong>{claimed.length}</strong>
            {offers.length > 0 && <small>{`${Math.round((claimed.length / offers.length) * 100)}% claim rate`}</small>}
          </div>
          <div className="offers-stat">
            <span>Revenue attributed</span>
            <strong>{formatMoney(attributed)}</strong>
            <small>from claimed offers</small>
          </div>
        </section>

        {loading && <div className="empty-state">Loading offers…</div>}

        {!loading && offers.length === 0 && (
          <div className="offers-empty">
            <span className="offers-empty-icon"><IconGift width={36} height={36} /></span>
            <h2>No offers yet</h2>
            <p>
              Open any inquiry, tap <strong>"Send second-chance offer"</strong>, and create a
              personal expiring link in seconds. Urgency + personal is the highest-converting
              reactivation mechanic there is.
            </p>
            <button type="button" className="primary-action" onClick={() => navigate('/app/inquiries')}>
              Open inquiry pipeline
            </button>
          </div>
        )}

        {!loading && offers.length > 0 && (
          <section className="offers-list">
            {offers.map(offer => {
              const status = offerStatus(offer)
              const waShare = normalizePhone(offer.customerPhone)
                ? waLink(
                    offer.customerPhone,
                    `Hi ${(offer.customerName || 'there').split(' ')[0]}! This is ${offer.businessName}. I put together something personal for you — ${offer.discountText}. Reserved just for you, but it expires soon: ${offerUrl(offer)}`
                  )
                : null

              return (
                <article className="offer-row" key={offer.id}>
                  <div className="offer-row-main">
                    <strong className="offer-row-customer">{offer.customerName || 'Customer'}</strong>
                    <span className="offer-row-discount">{offer.discountText}</span>
                    <span className="offer-row-meta">
                      <IconTimer width={13} height={13} />
                      {status === 'expired'
                        ? 'Expired'
                        : `Expires ${new Date(offer.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                      {' · '}{offer.views || 0} view{(offer.views || 0) === 1 ? '' : 's'}
                      {offer.recoveredValue ? ` · ${formatMoney(offer.recoveredValue)} recovered` : ''}
                    </span>
                  </div>

                  <span className={`offer-status offer-status-${status}`}>
                    {STATUS_LABELS[status]}
                  </span>

                  <div className="offer-row-actions">
                    <button type="button" title="Copy link" onClick={() => handleCopy(offer)}>
                      {copiedId === offer.id ? <IconCheck width={16} height={16} /> : <IconCopy width={16} height={16} />}
                    </button>
                    {waShare && (
                      <a href={waShare} target="_blank" rel="noopener noreferrer" title="Share on WhatsApp">
                        <IconSend width={16} height={16} />
                      </a>
                    )}
                    {status === 'redeemed' && !offer.recoveredValue && (
                      <button
                        type="button"
                        className="offer-recovered-btn"
                        onClick={() => handleMarkRecovered(offer)}
                        title="They came back — record the revenue"
                      >
                        Mark recovered
                      </button>
                    )}
                    {deleteConfirmId === offer.id ? (
                      <>
                        <button type="button" title="Yes, delete this offer" onClick={() => handleDelete(offer)}>
                          Yes, delete
                        </button>
                        <button type="button" title="Keep this offer" onClick={() => setDeleteConfirmId(null)}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button type="button" title="Delete offer" onClick={() => handleDelete(offer)}>
                        <IconTrash width={16} height={16} />
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </section>
        )}
      </div>
    </div>
  )
}
