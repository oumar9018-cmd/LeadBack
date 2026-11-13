import { leadBandLabel, leadScore } from '../utils/scoring.js'
import './LeadScoreBadge.css'

/**
 * Lead score pill (Round 6) — the explained, rule-based priority
 * score from utils/scoring.js: value, age, contact and follow-up
 * state, source, SLA state and offer-ladder progress on the
 * inquiry's own data. Closed inquiries have no score and render
 * nothing. The reasons ride in the title so the number is never a
 * black box; the detail view lists them in full. Not the win-back
 * score (that is the Recovery page's recovery-likelihood ring).
 */
export default function LeadScoreBadge({ inquiry, firstResponseHours = 0 }) {
  const result = leadScore(inquiry, { firstResponseHours })
  if (!result) return null

  return (
    <span
      className={`lead-badge lead-${result.band}`}
      title={`Lead score — ${result.reasons.join(' · ')}`}
    >
      <span className="lead-badge-label">Lead</span>
      <strong>{result.score}</strong>
      <small>{leadBandLabel(result.band)}</small>
    </span>
  )
}
