import { useState } from 'react'
import { IconTag, IconClock, IconUsers, IconMessage, IconAlert } from './icons.jsx'
import './LossReasonModal.css'

/**
 * Micro-survey shown when an inquiry is marked lost.
 * One tap on a reason — every lost deal becomes market research.
 *
 * Props:
 * - inquiry: the inquiry being marked lost
 * - onConfirm: (reason: string, note: string) => void
 * - onCancel: () => void
 */

export const LOSS_REASONS = [
  { id: 'price', label: 'Price', hint: 'Too expensive / asked for discount', icon: IconTag },
  { id: 'timing', label: 'Timing', hint: 'Not now — maybe later', icon: IconClock },
  { id: 'competitor', label: 'Competitor', hint: 'Chose someone else', icon: IconUsers },
  { id: 'no_response', label: 'No response', hint: 'Ghosted after showing interest', icon: IconMessage },
  { id: 'other', label: 'Other', hint: 'Something else entirely', icon: IconAlert },
]

export const LOSS_REASON_LABELS = Object.fromEntries(
  LOSS_REASONS.map(r => [r.id, r.label])
)

export default function LossReasonModal({ inquiry, onConfirm, onCancel }) {
  const [reason, setReason] = useState(null)
  const [note, setNote] = useState('')

  return (
    <div className="modal-overlay" onClick={onCancel} role="dialog" aria-modal="true" aria-label="Why was this lead lost?">
      <div className="loss-modal" onClick={e => e.stopPropagation()}>
        <span className="app-eyebrow">LOST LEAD INTEL</span>
        <h3>Why did {inquiry?.name?.split(' ')[0] || 'this customer'} slip away?</h3>
        <p className="loss-modal-sub">
          One tap. Every answer trains your win-back strategy.
        </p>

        <div className="loss-reasons">
          {LOSS_REASONS.map(({ id, label, hint, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`loss-reason${reason === id ? ' selected' : ''}`}
              onClick={() => setReason(id)}
            >
              <span className="loss-reason-icon"><Icon width={20} height={20} /></span>
              <span className="loss-reason-text">
                <strong>{label}</strong>
                <small>{hint}</small>
              </span>
            </button>
          ))}
        </div>

        <label className="loss-note-label">
          Note (optional)
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="e.g. Wanted it under ₹400, competitor quoted ₹350"
            rows={2}
          />
        </label>

        <div className="loss-modal-actions">
          <button type="button" className="cancel-button" onClick={onCancel}>
            Keep as open
          </button>
          <button
            type="button"
            className="loss-confirm"
            disabled={!reason}
            onClick={() => onConfirm(reason, note.trim())}
          >
            Mark as lost
          </button>
        </div>
      </div>
    </div>
  )
}
