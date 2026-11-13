/**
 * Email steps in follow-up sequences — Round 5 (pure helpers).
 *
 * A drip/Blitz step carries a `channel`: 'whatsapp' (the default —
 * every step saved before this round) or 'email'. WhatsApp steps
 * behave exactly as they always have (wa.me deep link, one tap).
 * An email step is prepared here as a mailto: link — subject and
 * body rendered from the step's template with the same
 * fillTemplate the WhatsApp path uses.
 *
 * Honest limit, stated in the builder and the queue too: BackWon
 * PREPARES the email and opens it in the user's own mail app — the
 * user presses send there. BackWon does not send email by itself.
 *
 * A step needs the customer's email address (inquiry.email, an
 * optional field on the inquiry). Without a valid one the step
 * cannot be prepared: buildEmailStep returns
 * { ok: false, reason: 'no_email' } and the queue shows the step as
 * skipped with that reason in plain words, instead of offering a
 * dead button.
 */

import { TEMPLATES, fillTemplate } from './whatsapp.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** The channel a saved step uses; anything but 'email' is the
 * historical WhatsApp default. */
export function stepChannel(step) {
  return step?.channel === 'email' ? 'email' : 'whatsapp'
}

export function isValidEmail(value) {
  return typeof value === 'string' && EMAIL_RE.test(value.trim())
}

/** The customer's usable email address, or '' when there is none. */
export function customerEmail(inquiry) {
  const email = typeof inquiry?.email === 'string' ? inquiry.email.trim() : ''
  return EMAIL_RE.test(email) ? email : ''
}

/**
 * Prepare an email step for the follow-up queue.
 * @returns null when the step is not an email step;
 *   { ok: false, channel: 'email', reason: 'no_email' } when the
 *   customer has no usable email address (the step is skipped);
 *   { ok: true, channel: 'email', to, subject, body, href }
 *   otherwise — `href` is the mailto: link the queue opens.
 */
export function buildEmailStep(inquiry, step, options = {}) {
  if (stepChannel(step) !== 'email') return null
  const to = customerEmail(inquiry)
  if (!to) return { ok: false, channel: 'email', reason: 'no_email' }

  const template = TEMPLATES[step?.templateId] || null
  const business = options.businessName || ''
  const body = template
    ? fillTemplate(template.text, {
        name: inquiry?.name?.split(' ')[0],
        business,
        service: inquiry?.service,
        link: options.link || '',
      })
    : ''
  const subject = template
    ? `${template.label} — ${business || 'BackWon'}`
    : `Follow-up — ${business || 'BackWon'}`
  const href =
    `mailto:${encodeURIComponent(to)}` +
    `?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`
  return { ok: true, channel: 'email', to, subject, body, href }
}
