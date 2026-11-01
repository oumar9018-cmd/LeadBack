// #32 + #38 — offer helpers (pure, unit-tested).
//
// #32: an offer is "unanswered" when it was never redeemed AND it either
// expired or is older than 7 days. Views do NOT count as an answer —
// viewing a link is not replying to it.
// #38: a ladder is stored on the first offer: step 1 IS that offer,
// steps[] are follow-up offers to send later, one at a time, by hand.
// Nothing here auto-sends anything.

// Offer doc IDs are short random codes (the public /o/:code page fetches
// by direct get). Lives here, not in OfferBuilder, so the Offers page
// can mint step offers too without tripping the component-only lint.
export function randomCode(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  let code = ''
  const rand = new Uint32Array(length)
  window.crypto.getRandomValues(rand)
  for (let i = 0; i < length; i++) code += chars[rand[i] % chars.length]
  return code
}

export const UNANSWERED_STALE_DAYS = 7

export function unansweredOffers(offers, nowMs = Date.now()) {
  const out = []
  for (const offer of offers || []) {
    if (offer.status === 'redeemed') continue
    const createdMs = Date.parse(offer.createdAt)
    const expired =
      Number.isFinite(Date.parse(offer.expiresAt)) &&
      Date.parse(offer.expiresAt) <= nowMs
    const stale =
      Number.isFinite(createdMs) &&
      nowMs - createdMs > UNANSWERED_STALE_DAYS * 86400000
    if (!expired && !stale) continue
    out.push({ offer, reason: expired ? 'expired' : 'stale' })
  }
  return out.sort(
    (a, b) => Date.parse(a.offer.createdAt) - Date.parse(b.offer.createdAt)
  )
}

// Step 1 = the offer itself; at most 2 follow-up steps (3 steps total).
export const MAX_LADDER_STEPS = 3

export function validateLadderSteps(steps) {
  if (!Array.isArray(steps)) return 'Invalid ladder.'
  if (steps.length > MAX_LADDER_STEPS - 1)
    return `At most ${MAX_LADDER_STEPS - 1} follow-up steps.`
  for (const step of steps) {
    if (!step.discountText?.trim()) return 'Each ladder step needs an offer text.'
    const days = Number(step.daysAfter)
    if (!Number.isFinite(days) || days < 1 || days > 30)
      return 'Each ladder step needs days between 1 and 30.'
  }
  return ''
}

export function ladderNextStep(offer) {
  const ladder = offer?.ladder
  if (!ladder || !Array.isArray(ladder.steps)) return null
  const idx = Number(ladder.currentStep) || 0
  if (idx >= ladder.steps.length) return null
  return { step: ladder.steps[idx], index: idx, total: ladder.steps.length + 1 }
}

export function ladderSuggestedDate(offer, stepIndex) {
  // Suggested send date for a follow-up step: createdAt + the cumulative
  // daysAfter of every step up to and including it.
  const createdMs = Date.parse(offer?.createdAt)
  if (!Number.isFinite(createdMs)) return null
  const steps = offer?.ladder?.steps || []
  let days = 0
  for (let i = 0; i <= stepIndex && i < steps.length; i++)
    days += Number(steps[i].daysAfter) || 0
  return new Date(createdMs + days * 86400000)
}
