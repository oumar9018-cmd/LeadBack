/**
 * Blitz sequence — Round 3 (pure helpers).
 *
 * A blitz is a rapid 3-touch follow-up sequence on ONE stale
 * inquiry: today, +2 days, +5 days. It is built entirely on the
 * existing drip-sequence machinery — the plan returned here is the
 * exact `dripSteps` shape App.jsx already persists on the inquiry
 * ({ day, templateId, dueDate, sent }) plus a `blitz: true` marker,
 * so due touches surface in the Follow-ups queue with their message
 * ready, exactly like a hand-built drip. Nothing is auto-sent:
 * each touch stays a human one-tap WhatsApp send, like every other
 * follow-up in BackWon. (The separate Blitz Mode page is a manual
 * step-through campaign across many inquiries — a different tool.)
 *
 * "Stale" is the codebase definition (utils/graveyard.js isStale):
 * an open inquiry with no activity for 30+ days. One active blitz
 * per inquiry: while any blitz touch is still unsent, a second
 * blitz is refused rather than stacked.
 */

import { isStale } from './graveyard.js'

export const BLITZ_TOUCHES = [
  { offsetDays: 0, templateId: 'firstFollowup' },
  { offsetDays: 2, templateId: 'bookingNudge' },
  { offsetDays: 5, templateId: 'winBack' },
]

/** The inquiry already has a blitz with touches still to send. */
export function hasActiveBlitz(inquiry) {
  return (inquiry?.dripSteps || []).some(
    step => step && step.blitz === true && !step.sent
  )
}

/** Open + stale (graveyard definition) + no blitz already running. */
export function isBlitzEligible(inquiry, nowMs = Date.now()) {
  if (!inquiry) return false
  if (inquiry.status === 'recovered' || inquiry.status === 'lost') {
    return false
  }
  if (hasActiveBlitz(inquiry)) return false
  return isStale(inquiry, nowMs)
}

/**
 * Plan the 3 blitz touches as dripSteps, or null when the inquiry
 * is not eligible. Due dates follow the App.jsx drip convention:
 * `day` is 1-based (day 1 = today) and dueDate = today + (day - 1),
 * computed with local setDate arithmetic exactly as the drip
 * builder's save handler does.
 */
export function planBlitzSequence(inquiry, nowMs = Date.now()) {
  if (!isBlitzEligible(inquiry, nowMs)) return null
  const base = new Date(nowMs)
  return BLITZ_TOUCHES.map(touch => {
    const due = new Date(base)
    due.setDate(due.getDate() + touch.offsetDays)
    return {
      day: touch.offsetDays + 1,
      templateId: touch.templateId,
      dueDate: due.toISOString().slice(0, 10),
      sent: false,
      blitz: true,
    }
  })
}
