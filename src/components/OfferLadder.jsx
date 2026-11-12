import React, { useEffect, useState } from 'react'
import {
  LADDER_STEP_HINTS,
  ladderProgress,
  normalizeOfferLadder,
  setLadderStep,
} from '../utils/ladder.js'
import { IconCheck } from './icons.jsx'
import './OfferLadder.css'

/**
 * Offer ladder checklist (Round 3) — a 3-step win-back checklist
 * stored on the inquiry itself (inquiry.offerLadder).
 *
 * The rep writes the offer for each step and ticks it off when it
 * has been made. This is a tracking checklist, not a sender: the
 * offers themselves are still sent by hand (or via the Offers
 * feature). Saves happen on tick and on leaving a text field, via
 * the caller's onSave — the same persist path as drip steps.
 *
 * Props:
 * - inquiry: the inquiry in the detail panel
 * - onSave: (ladder) => void — the caller persists the ladder.
 */
export default function OfferLadder({ inquiry, onSave }) {
  const [ladder, setLadder] = useState(() =>
    normalizeOfferLadder(inquiry?.offerLadder)
  )

  // A different inquiry in the panel means a different ladder.
  useEffect(() => {
    setLadder(normalizeOfferLadder(inquiry?.offerLadder))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inquiry?.id])

  if (!inquiry) return null
  const progress = ladderProgress(ladder)

  function apply(next) {
    setLadder(next)
    onSave?.(next)
  }

  return (
    <div className="offer-ladder">
      <div className="offer-ladder-heading">
        <span className="app-eyebrow">OFFER LADDER</span>
        <h3>Win-back offer ladder</h3>
        <p>
          Plan up to three offers for this customer — a small one first,
          your best one last — and tick each off as you make it.{' '}
          {progress.done} of {progress.total} steps done.
          {progress.complete && (
            <>
              {' '}
              <IconCheck width={14} height={14} /> All three offers tried.
            </>
          )}
        </p>
      </div>

      <div className="offer-ladder-steps">
        {ladder.steps.map((step, index) => (
          <div
            key={index}
            className={step.done ? 'offer-ladder-step done' : 'offer-ladder-step'}
          >
            <label className="offer-ladder-toggle">
              <input
                type="checkbox"
                checked={step.done}
                onChange={e =>
                  apply(setLadderStep(ladder, index, { done: e.target.checked }))
                }
              />
              <span>Step {index + 1}</span>
            </label>
            <input
              type="text"
              className="offer-ladder-input"
              value={step.text}
              placeholder={LADDER_STEP_HINTS[index]}
              onChange={e =>
                setLadder(setLadderStep(ladder, index, { text: e.target.value }))
              }
              onBlur={e =>
                apply(setLadderStep(ladder, index, { text: e.target.value }))
              }
            />
          </div>
        ))}
      </div>
    </div>
  )
}
