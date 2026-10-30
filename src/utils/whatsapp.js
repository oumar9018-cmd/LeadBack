/**
 * Wynback WhatsApp utilities.
 *
 * One-tap deep links that open WhatsApp with a pre-filled message.
 * No API keys, no backend — works via wa.me on every device.
 */

/**
 * Normalize an Indian phone number to wa.me format (country code + digits).
 * Accepts: 9876543210, +91 98765 43210, 91-9876543210, etc.
 * Returns: "919876543210" or null if invalid.
 */
export function normalizePhone(raw) {
  if (!raw) return null
  const digits = String(raw).replace(/\D/g, '')
  if (digits.length === 10) return '91' + digits
  if (digits.length === 12 && digits.startsWith('91')) return digits
  if (digits.length === 11 && digits.startsWith('0')) return '91' + digits.slice(1)
  return digits.length >= 10 ? digits : null
}

/**
 * Build a wa.me deep link with pre-filled text.
 */
export function waLink(phone, message) {
  const normalized = normalizePhone(phone)
  if (!normalized) return null
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
}

/**
 * Message templates. {name}, {business}, {service}, {link} are interpolated.
 * Keep them short, warm, and human — not corporate.
 */
export const TEMPLATES = {
  firstFollowup: {
    id: 'firstFollowup',
    label: 'First follow-up',
    text: 'Hi {name}, this is {business}. You had asked about {service} — just checking if you still need it? Happy to help.',
  },
  missedCall: {
    id: 'missedCall',
    label: 'Missed call',
    text: 'Hi {name}, this is {business}. Sorry I missed your call! How can I help you today?',
  },
  bookingNudge: {
    id: 'bookingNudge',
    label: 'Booking nudge',
    text: 'Hi {name}, this is {business}. Your slot for {service} is still open — want me to book it for you? {link}',
  },
  winBack: {
    id: 'winBack',
    label: 'Win-back offer',
    text: 'Hi {name}, this is {business}. We miss you! Come back for {service} — I have kept a slot aside for you this week.',
  },
  voiceNotePrompt: {
    id: 'voiceNotePrompt',
    label: 'Voice note opener',
    text: 'Hi {name}, this is {business}. Sending you a quick voice note — one moment.',
  },
  // Batch 2 (2026-10-30): review requests. Only ever sent to a RECOVERED
  // customer (see the detail modal's guardrails) — never to a lost one.
  reviewRequest: {
    id: 'reviewRequest',
    label: 'Google review request',
    text: 'Hi {name}, this is {business}. Thanks for choosing us for {service}! If you have a minute, a Google review would mean a lot: {link}',
  },
  // Review Rescue: the private recovery draft a LOST customer gets
  // instead of a review ask. No review link, no review mention — the
  // only path back to review-eligible is rescue, then re-recovery.
  recoveryDraft: {
    id: 'recoveryDraft',
    label: 'Recovery draft',
    text: 'Hi {name}, this is {business}. I know {service} did not work out last time, and I would love the chance to make it right. Can we talk about what would work for you?',
  },
}

export function fillTemplate(templateText, { name, business, service, link }) {
  return templateText
    .replace('{name}', name || 'there')
    .replace('{business}', business || 'us')
    .replace('{service}', service || 'our service')
    .replace('{link}', link || '')
    .trim()
}

/**
 * Get the booking link for a business.
 * In production this resolves to the public booking page.
 */
export function bookingLinkFor(businessSlug) {
  if (!businessSlug) return ''
  const base = typeof window !== 'undefined' ? window.location.origin : ''
  // Respect the Vite base path for GitHub Pages deployments
  const basePath = import.meta.env?.BASE_URL || '/'
  const clean = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath
  return `${base}${clean}/b/${businessSlug}`
}
