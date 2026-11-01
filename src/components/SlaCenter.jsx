import { useNavigate } from 'react-router-dom'
import { getSlaSummary } from '../utils/sla.js'
import './SlaCenter.css'

/**
 * #8 SLA Command Center + #123 SLA Breach Analytics (dashboard section).
 *
 * Shows live first-response breaches (still 'new' past the target),
 * at-risk rows, and breach age buckets. Renders nothing when there is
 * nothing breached or at risk, so the dashboard stays quiet on a
 * healthy workspace. Rows come from the dashboard's already-scoped
 * items — nothing new is fetched and nothing leaks across scopes.
 */
export default function SlaCenter({ items, firstResponseHours }) {
  const navigate = useNavigate()
  if (!firstResponseHours || firstResponseHours <= 0) return null

  const summary = getSlaSummary(items, firstResponseHours)
  if (summary.breached.length === 0 && summary.atRisk.length === 0) {
    return null
  }

  const shown = summary.breached.slice(0, 5)
  return (
    <section className="sla-banner" aria-live="polite">
      <span className="app-eyebrow">SLA — FIRST RESPONSE</span>
      <div className="sla-head">
        <strong>
          {summary.breached.length} past the {firstResponseHours}h
          first-response target
          {summary.atRisk.length > 0 &&
            ` · ${summary.atRisk.length} at risk`}
        </strong>
        <div className="sla-sub">
          Breach ages: {summary.buckets.under48} under 48h
          {summary.buckets.over48 > 0 && ` · ${summary.buckets.over48} over 48h`}
          {summary.oldestBreachHours !== null &&
            ` · oldest ${summary.oldestBreachHours}h`}
        </div>
      </div>
      {shown.length > 0 && (
        <ul className="sla-list">
          {shown.map(row => (
            <li key={row.id}>
              {row.name} — {row.service} — {row.age}h unanswered
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        className="primary-button"
        onClick={() => navigate('/app/inquiries')}
      >
        View inquiries
      </button>
    </section>
  )
}
