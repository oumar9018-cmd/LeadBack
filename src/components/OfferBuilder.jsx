import { useState } from 'react'
import { BASE_PATH } from '../basePath.js'
import { waLink, normalizePhone } from '../utils/whatsapp.js'
import { IconGift, IconCopy, IconCheck, IconSend } from './icons.jsx'
import { useWorkspace } from './WorkspaceContext.jsx'
import {
  MAX_LADDER_STEPS,
  validateLadderSteps,
  ladderSuggestedDate,
  randomCode,
} from '../utils/offers.js'
import './OfferBuilder.css'

/**
 * Second-chance offer builder. Creates a personal, expiring offer link
 * for a lost/quiet customer: "20% off, reserved for you, expires in 48h".
 *
 * Props:
 * - inquiry: { id, name, phone, service, value }
 * - businessName: string
 * - onClose: () => void
 * - onCreated: (offer) => void — for activity logging
 */

const EXPIRY_OPTIONS = [
  { hours: 24, label: '24 hours' },
  { hours: 48, label: '48 hours' },
  { hours: 72, label: '3 days' },
]

export default function OfferBuilder({ inquiry, businessName, onClose, onCreated }) {
  // Batch 4: offers are stamped with the WORKSPACE owner's uid (rules
  // require ownerUid == creator uid, so only the owner ever reaches
  // this builder — Dashboard gates the button to owners).
  const { workspace } = useWorkspace()
  const [discountText, setDiscountText] = useState('20% off your next visit')
  const [note, setNote] = useState('')
  const [expiryHours, setExpiryHours] = useState(48)
  // #38 — decaying ladder: this offer is step 1; steps[] are follow-up
  // offers sent later by hand from the Offers page, never automatically.
  const [ladderEnabled, setLadderEnabled] = useState(false)
  const [ladderSteps, setLadderSteps] = useState([
    { discountText: '', daysAfter: 3 },
  ])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState(null)
  const [copied, setCopied] = useState(false)

  if (!inquiry) return null

  const firstName = (inquiry.name || 'there').split(' ')[0]
  const offerUrl = created
    ? `${window.location.origin}${BASE_PATH}/o/${created.code}`
    : ''

  async function handleCreate() {
    setSaving(true)
    setError('')

    const auth = window.firebase?.auth?.()
    const db = window.firebase?.firestore?.()
    const user = auth?.currentUser

    if (!user || !db || !workspace) {
      setError('You need to be signed in to create offers.')
      setSaving(false)
      return
    }

    if (!discountText.trim()) {
      setError('Describe the offer first.')
      setSaving(false)
      return
    }

    // #38 — ladder validation; steps are stored on the offer doc and
    // advanced by hand from the Offers page.
    let ladder = null
    if (ladderEnabled) {
      const steps = ladderSteps.map(s => ({
        discountText: s.discountText.trim(),
        daysAfter: Number(s.daysAfter),
      }))
      const ladderError = validateLadderSteps(steps)
      if (ladderError) {
        setError(ladderError)
        setSaving(false)
        return
      }
      if (steps.length > 0) ladder = { steps, currentStep: 0 }
    }

    const code = randomCode()
    const expiresAt = new Date(Date.now() + expiryHours * 3600 * 1000).toISOString()

    const offer = {
      code,
      ownerUid: workspace.ownerUid,
      businessName: businessName || 'Wynback business',
      inquiryId: String(inquiry.id),
      customerName: inquiry.name || '',
      customerPhone: inquiry.phone || '',
      service: inquiry.service || '',
      discountText: discountText.trim(),
      note: note.trim(),
      expiresAt,
      status: 'sent',
      views: 0,
      createdAt: new Date().toISOString(),
      ...(ladder ? { ladder } : {}),
    }

    try {
      // Doc ID = code so the public page can fetch it with a direct get().
      await db.collection('offers').doc(code).set(offer)
      setCreated({ ...offer })
      onCreated?.(offer)
    } catch (e) {
      console.error('Offer create failed:', e)
      setError('Could not create the offer. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  function handleCopy() {
    navigator.clipboard?.writeText(offerUrl).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      },
      () => setError('Copy failed — long-press the link to copy it manually.')
    )
  }

  const waMessage = created
    ? `Hi ${firstName}! This is ${created.businessName}. I put together something personal for you — ${created.discountText}. Reserved just for you, but it expires soon: ${offerUrl}`
    : ''
  const waShareLink = created && normalizePhone(inquiry.phone)
    ? waLink(inquiry.phone, waMessage)
    : null

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Create second-chance offer">
      <div className="offer-builder" onClick={e => e.stopPropagation()}>
        {!created ? (
          <>
            <span className="app-eyebrow">SECOND-CHANCE OFFER</span>
            <h3>
              <IconGift width={22} height={22} />
              Win back {firstName}
            </h3>
            <p className="offer-builder-sub">
              A personal, expiring link — urgency + personal is the highest-converting reactivation mechanic there is.
            </p>

            <label className="offer-field">
              The offer
              <input
                value={discountText}
                onChange={e => setDiscountText(e.target.value)}
                placeholder="e.g. 20% off your next visit"
                maxLength={80}
              />
            </label>

            <label className="offer-field">
              Personal note (optional)
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder={`e.g. ${firstName}, we saved your favourite slot…`}
                rows={2}
                maxLength={200}
              />
            </label>

            <div className="offer-field">
              <span className="offer-field-label">Expires in</span>
              <div className="offer-expiry-row">
                {EXPIRY_OPTIONS.map(opt => (
                  <button
                    key={opt.hours}
                    type="button"
                    className={`offer-expiry${expiryHours === opt.hours ? ' selected' : ''}`}
                    onClick={() => setExpiryHours(opt.hours)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="offer-field">
              <input
                type="checkbox"
                checked={ladderEnabled}
                onChange={e => {
                  setLadderEnabled(e.target.checked)
                  if (e.target.checked && ladderSteps.length === 0)
                    setLadderSteps([{ discountText: '', daysAfter: 3 }])
                }}
              />{' '}
              Decaying ladder — follow-up offers if this one goes unanswered
            </label>

            {ladderEnabled && (
              <div className="offer-field">
                <span className="offer-field-label">
                  Follow-up steps (this offer is step 1 of{' '}
                  {ladderSteps.length + 1})
                </span>
                {ladderSteps.map((step, idx) => (
                  <div key={idx} className="offer-ladder-row">
                    <input
                      value={step.discountText}
                      onChange={e =>
                        setLadderSteps(current =>
                          current.map((s, i) =>
                            i === idx
                              ? { ...s, discountText: e.target.value }
                              : s
                          )
                        )
                      }
                      placeholder={`Step ${idx + 2} offer, e.g. 30% off`}
                      maxLength={80}
                    />
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={step.daysAfter}
                      onChange={e =>
                        setLadderSteps(current =>
                          current.map((s, i) =>
                            i === idx
                              ? { ...s, daysAfter: e.target.value }
                              : s
                          )
                        )
                      }
                      aria-label="Days after previous step"
                      className="offer-ladder-days"
                    />
                    <span className="offer-ladder-suffix">days later</span>
                    {ladderSteps.length > 1 && (
                      <button
                        type="button"
                        className="cancel-button"
                        onClick={() =>
                          setLadderSteps(current =>
                            current.filter((_, i) => i !== idx)
                          )
                        }
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                {ladderSteps.length < MAX_LADDER_STEPS - 1 && (
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() =>
                      setLadderSteps(current => [
                        ...current,
                        { discountText: '', daysAfter: 3 },
                      ])
                    }
                  >
                    Add step
                  </button>
                )}
                <p className="offer-builder-sub">
                  Steps are sent by hand from the Offers page — never
                  automatically. The incentive grows only if the earlier
                  step goes unanswered.
                </p>
              </div>
            )}

            {error && <p className="offer-error">{error}</p>}

            <div className="offer-builder-actions">
              <button type="button" className="cancel-button" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="offer-create"
                disabled={saving || !discountText.trim()}
                onClick={handleCreate}
              >
                {saving ? 'Creating…' : 'Create offer link'}
              </button>
            </div>
          </>
        ) : (
          <>
            <span className="app-eyebrow">OFFER READY</span>
            <h3>
              <IconCheck width={22} height={22} />
              Link created
            </h3>
            <p className="offer-builder-sub">
              Share this with {firstName}. You'll see when it's viewed and claimed.
            </p>

            <div className="offer-link-box">
              <code>{offerUrl}</code>
              <button type="button" className="offer-copy" onClick={handleCopy}>
                {copied ? <IconCheck width={16} height={16} /> : <IconCopy width={16} height={16} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            {created.ladder && (
              <p className="offer-builder-sub">
                Ladder: step 1 of {created.ladder.steps.length + 1}. Next
                step “{created.ladder.steps[0].discountText}” suggested
                after{' '}
                {ladderSuggestedDate(created, 0)?.toLocaleDateString(
                  'en-IN',
                  { day: 'numeric', month: 'short' }
                )}
                . Send it by hand from the Offers page.
              </p>
            )}

            {waShareLink ? (
              <a
                className="offer-whatsapp"
                href={waShareLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <IconSend width={16} height={16} />
                Send via WhatsApp
              </a>
            ) : (
              <p className="offer-no-phone">
                No phone number on this inquiry — copy the link and send it manually.
              </p>
            )}

            {error && <p className="offer-error">{error}</p>}

            <div className="offer-builder-actions">
              <button type="button" className="save-button" onClick={onClose}>
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
