import { winbackScore, bandLabel } from '../utils/winbackScore.js'
import './WinbackScore.css'

/**
 * Win-Back Score badge — a 0–100 likelihood ring for an inquiry.
 * Computed transparently from status, recency, attempts, value, engagement.
 * Hover/tap reveals the top reasons.
 */
export default function WinbackScoreBadge({ inquiry, showReasons = false }) {
  if (!inquiry || inquiry.status === 'recovered') return null

  const { score, band, reasons } = winbackScore(inquiry)

  // SVG ring: circumference for r=15.5
  const C = 2 * Math.PI * 15.5
  const offset = C - (score / 100) * C

  return (
    <span className={`wb-badge wb-${band}`} title={reasons.join(' · ')}>
      <svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true">
        <circle cx="20" cy="20" r="15.5" fill="none" stroke="#e8ecf5" strokeWidth="4.5" />
        <circle
          cx="20"
          cy="20"
          r="15.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          transform="rotate(-90 20 20)"
        />
      </svg>
      <span className="wb-score-text">
        <strong>{score}</strong>
        <small>{bandLabel(band)}</small>
      </span>
      {showReasons && reasons.length > 0 && (
        <span className="wb-reasons">{reasons.join(' · ')}</span>
      )}
    </span>
  )
}
