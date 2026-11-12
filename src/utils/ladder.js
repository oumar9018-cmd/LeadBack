/**
 * Offer ladder (inquiry checklist) — Round 3 (pure helpers).
 *
 * A win-back checklist stored on the INQUIRY doc as `offerLadder`:
 * three steps the rep works through by hand — a first small offer,
 * a stronger one, then the best final offer — ticking each off as
 * it is made. It is deliberately just a checklist: writing the
 * offers and sending them stays manual (the Offers feature, with
 * its own ladder on the offer doc — utils/offers.js — is the
 * sendable-offer machinery; this one tracks what was tried on this
 * inquiry, next to its history).
 *
 * Shape: { steps: [{ text, done } x3] }. Normalization always
 * yields exactly 3 steps, so stored junk can never break the UI.
 */

export const LADDER_STEP_COUNT = 3

export const LADDER_STEP_HINTS = [
  'Step 1 — a small, easy yes (e.g. a free check, a small discount)',
  'Step 2 — a stronger offer (e.g. a bigger discount or a bonus)',
  'Step 3 — your best final offer (e.g. best price, this week only)',
]

function emptyStep() {
  return { text: '', done: false }
}

/** A fresh, empty 3-step ladder. */
export function createOfferLadder() {
  return { steps: Array.from({ length: LADDER_STEP_COUNT }, emptyStep) }
}

/** Coerce anything stored into a valid 3-step ladder. */
export function normalizeOfferLadder(raw) {
  const rawSteps = Array.isArray(raw?.steps) ? raw.steps : []
  const steps = []
  for (let i = 0; i < LADDER_STEP_COUNT; i += 1) {
    const step = rawSteps[i]
    steps.push({
      text: typeof step?.text === 'string' ? step.text : '',
      done: step?.done === true,
    })
  }
  return { steps }
}

/** Return a NEW ladder with one step patched ({ text } and/or
 * { done }); an out-of-range index returns the ladder unchanged. */
export function setLadderStep(ladder, index, patch = {}) {
  const normalized = normalizeOfferLadder(ladder)
  const i = Number(index)
  if (!Number.isInteger(i) || i < 0 || i >= LADDER_STEP_COUNT) {
    return normalized
  }
  const steps = normalized.steps.map((step, j) =>
    j === i
      ? {
          text:
            typeof patch.text === 'string' ? patch.text : step.text,
          done:
            typeof patch.done === 'boolean' ? patch.done : step.done,
        }
      : step
  )
  return { steps }
}

/** { done, total, complete } for the checklist header. */
export function ladderProgress(ladder) {
  const { steps } = normalizeOfferLadder(ladder)
  const done = steps.filter(step => step.done).length
  return {
    done,
    total: LADDER_STEP_COUNT,
    complete: done === LADDER_STEP_COUNT,
  }
}
