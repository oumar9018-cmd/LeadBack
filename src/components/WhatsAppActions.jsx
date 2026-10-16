import { useState } from 'react'
import { waLink, TEMPLATES, fillTemplate, normalizePhone } from '../utils/whatsapp.js'
import { IconMessage, IconMic, IconPhoneMissed } from './icons.jsx'
import './WhatsAppActions.css'

/**
 * One-tap WhatsApp actions for an inquiry.
 * Opens wa.me with a pre-filled template — no API, no backend.
 *
 * Props:
 * - inquiry: { name, phone, service }
 * - businessName: string
 * - bookingLink: string (optional)
 * - onAction: (type: 'whatsapp' | 'voice-note') => void — for activity logging
 */
export default function WhatsAppActions({ inquiry, businessName, bookingLink, onAction }) {
  const [templateId, setTemplateId] = useState('firstFollowup')
  const hasPhone = !!normalizePhone(inquiry?.phone)

  if (!inquiry) return null

  const template = TEMPLATES[templateId]
  const message = fillTemplate(template.text, {
    name: inquiry.name?.split(' ')[0],
    business: businessName,
    service: inquiry.service,
    link: bookingLink,
  })
  const link = hasPhone ? waLink(inquiry.phone, message) : null

  function handleWhatsApp() {
    if (!link) return
    window.open(link, '_blank', 'noopener')
    onAction?.('whatsapp', templateId)
  }

  function handleVoiceNote() {
    if (!link) return
    // Open WhatsApp to the chat — the owner records a voice note manually.
    // This is the "nobody has done this" workflow: personal voice > template.
    const chatLink = `https://wa.me/${normalizePhone(inquiry.phone)}`
    window.open(chatLink, '_blank', 'noopener')
    onAction?.('voice-note')
  }

  return (
    <div className="wa-actions">
      <div className="wa-heading">
        <span className="app-eyebrow">REACH OUT</span>
        <h3>Message on WhatsApp</h3>
        <p>One tap opens WhatsApp with the message ready to send.</p>
      </div>

      {!hasPhone && (
        <p className="wa-no-phone">Add a phone number to enable WhatsApp actions.</p>
      )}

      {hasPhone && (
        <>
          <div className="wa-templates">
            {Object.values(TEMPLATES)
              .filter(t => t.id !== 'voiceNotePrompt')
              .map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={templateId === t.id ? 'wa-template active' : 'wa-template'}
                  onClick={() => setTemplateId(t.id)}
                >
                  {t.label}
                </button>
              ))}
          </div>

          <div className="wa-preview">
            <span className="wa-preview-label">Preview</span>
            <p>{message}</p>
          </div>

          <div className="wa-buttons">
            <button
              type="button"
              className="wa-send"
              onClick={handleWhatsApp}
            >
              <IconMessage width={18} height={18} />
              Send on WhatsApp
            </button>
            <button
              type="button"
              className="wa-voice"
              onClick={handleVoiceNote}
              title="Open chat to record a personal voice note"
            >
              <IconMic width={18} height={18} />
              Voice note
            </button>
          </div>

          <p className="wa-tip">
            <IconMic width={14} height={14} />
            Tip: a 10-second voice note in your own voice converts better than any template.
          </p>
        </>
      )}
    </div>
  )
}

/**
 * Missed-call nudge card — shows in the follow-up queue when an inquiry
 * came from a missed call and hasn't been contacted yet.
 */
export function MissedCallNudge({ inquiry, businessName, onVoiceNote, onDismiss }) {
  const chatLink = `https://wa.me/${normalizePhone(inquiry.phone)}`
  return (
    <div className="missed-nudge">
      <span className="missed-nudge-icon">
        <IconPhoneMissed width={22} height={22} />
      </span>
      <div className="missed-nudge-text">
        <strong>{inquiry.name} called {inquiry.missedAgo || 'recently'}</strong>
        <span>Send a voice note now — strike while it's warm.</span>
      </div>
      <div className="missed-nudge-actions">
        <a
          href={chatLink}
          target="_blank"
          rel="noopener noreferrer"
          className="missed-nudge-voice"
          onClick={() => onVoiceNote?.(inquiry)}
        >
          <IconMic width={16} height={16} />
          Voice note
        </a>
        <button
          type="button"
          className="missed-nudge-dismiss"
          onClick={() => onDismiss?.(inquiry)}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  )
}
