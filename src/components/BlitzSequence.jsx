import React, { useState } from 'react'
import {
  hasActiveBlitz,
  isBlitzEligible,
  planBlitzSequence,
} from '../utils/blitz.js'
import { IconZap, IconCheck } from './icons.jsx'
import './BlitzSequence.css'

/**
 * Blitz sequence (Round 3) — one-click 3-touch follow-up sequence
 * on a stale inquiry: today, +2 days, +5 days.
 *
 * Renders only when it can honestly act: the inquiry is stale
 * (30+ days without activity, the graveyard definition) and no
 * blitz is already running on it — or a blitz IS running, in which
 * case it says so instead of offering a second one. Starting writes
 * the touches as drip steps (utils/blitz.js), so they surface in
 * the Follow-ups queue on their days with the message ready to
 * send by hand — nothing is auto-sent.
 *
 * Props:
 * - inquiry: the inquiry in the detail panel
 * - onStart: (steps) => void — the caller persists the steps
 *   (App.jsx merges them into the inquiry's dripSteps).
 */
export default function BlitzSequence({ inquiry, onStart }) {
  const [started, setStarted] = useState(false)

  if (!inquiry) return null
  const blitzSteps = (inquiry.dripSteps || []).filter(
    step => step && step.blitz === true
  )
  const active = hasActiveBlitz(inquiry)
  const eligible = isBlitzEligible(inquiry)
  if (!active && !eligible && !started) return null

  const remaining = blitzSteps.filter(step => !step.sent).length

  function handleStart() {
    const steps = planBlitzSequence(inquiry)
    if (!steps) return
    onStart?.(steps)
    setStarted(true)
  }

  return (
    <div className="blitz-seq">
      <div className="blitz-seq-heading">
        <span className="app-eyebrow">BLITZ</span>
        <h3>
          <IconZap width={18} height={18} /> Blitz — 3-touch sequence
        </h3>
        {active || started ? (
          <p>
            A blitz is running on this inquiry:{' '}
            {remaining} of {blitzSteps.length || 3} touches still to send.
            Each touch appears in your Follow-ups queue on its day with the
            message ready — sending stays in your hands.
          </p>
        ) : (
          <p>
            This inquiry has gone quiet for 30+ days. Start a rapid
            3-touch sequence — today, in 2 days and in 5 days — and each
            touch will appear in your Follow-ups queue with the message
            ready to send.
          </p>
        )}
      </div>

      {!active && !started && (
        <div className="blitz-seq-actions">
          <button type="button" className="save-button" onClick={handleStart}>
            <IconZap width={16} height={16} />
            Start blitz (today · +2 days · +5 days)
          </button>
        </div>
      )}

      {started && !active && (
        <p className="blitz-seq-note">
          <IconCheck width={14} height={14} />
          Blitz started — the first touch is in today&rsquo;s Follow-ups
          queue.
        </p>
      )}
    </div>
  )
}
