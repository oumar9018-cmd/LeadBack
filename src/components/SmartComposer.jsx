import { useMemo, useState } from 'react'
import { composeMessage, TONES, upcomingOccasion } from '../utils/smartComposer.js'
import { waLink, normalizePhone, bookingLinkFor } from '../utils/whatsapp.js'
import { IconMessage, IconZap } from './icons.jsx'
import './SmartComposer.css'

/**
 * Smart Composer — writes the perfect follow-up from real inquiry context.
 *
 * The owner picks a tone; the composer assembles a message using the
 * customer's name, service, value, days since inquiry, attempt count and
 * status. Every variable used is listed transparently below the preview.
 * One tap opens WhatsApp with the message ready.
 */
export default function SmartComposer({ inquiry, businessName, businessSlug, currency = 'INR', onAction }) {
  const [tone, setTone] = useState('friendly')
  const [copied, setCopied] = useState(false)

  const occasion = useMemo(() => upcomingOccasion(), [])

  const { text, variables } = useMemo(
    () =>
      composeMessage(inquiry || {}, {
        tone,
        businessName,
        bookingLink: bookingLinkFor(businessSlug),
        occasion,
        currency,
      }),
    [inquiry, tone, businessName, businessSlug, occasion, currency]
  )

  if (!inquiry) return null

  const hasPhone = !!normalizePhone(inquiry.phone)
  const link = hasPhone ? waLink(inquiry.phone, text) : null

  function handleSend() {
    if (!link) return
    window.open(link, '_blank', 'noopener')
    onAction?.('smart-composer', tone)
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable — ignore
    }
  }

  return (
    <div className="smart-composer">
      <div className="sc-heading">
        <span className="app-eyebrow">SMART COMPOSER</span>
        <h3>
          <IconZap width={18} height={18} />
          Message written for you
        </h3>
        <p>Built from this inquiry's real context — pick a tone, review, send.</p>
      </div>

      <div className="sc-tones" role="group" aria-label="Message tone">
        {Object.values(TONES).map(t => (
          <button
            key={t.id}
            type="button"
            className={tone === t.id ? 'sc-tone active' : 'sc-tone'}
            onClick={() => setTone(t.id)}
            title={t.hint}
          >
            {t.label}
          </button>
        ))}
      </div>

      {occasion && (
        <p className="sc-occasion">Seasonal touch applied: {occasion} is near.</p>
      )}

      <div className="sc-preview">
        <span className="sc-preview-label">Your message</span>
        <p>{text}</p>
      </div>

      <div className="sc-variables">
        {Object.entries(variables).map(([key, value]) => (
          <span key={key} className="sc-var" title={`Used: ${key}`}>
            {key}: {String(value)}
          </span>
        ))}
      </div>

      <div className="sc-actions">
        <button
          type="button"
          className="sc-send"
          onClick={handleSend}
          disabled={!hasPhone}
        >
          <IconMessage width={18} height={18} />
          Send on WhatsApp
        </button>
        <button type="button" className="sc-copy" onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy text'}
        </button>
      </div>

      {!hasPhone && (
        <p className="sc-no-phone">Add a phone number to enable one-tap send.</p>
      )}
    </div>
  )
}
