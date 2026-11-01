import { useState } from 'react'
import { pipelineHealth } from '../utils/pipelineHealth.js'
import { formatMoney } from '../utils/money.js'
import './PipelineHealth.css'

/**
 * #57 — Pipeline Health Analysis (dashboard, read-only).
 *
 * Verdict from counts: Critical when over 30% of open leads are stale
 * or SLA breaches exceed 5; Needs attention when anything is
 * unassigned, stale, or breached; otherwise Healthy. Thresholds live
 * in utils/pipelineHealth.js, not in this component.
 */
export default function PipelineHealth({ items, slaHours, currency }) {
  // Snapshot timestamp, captured once per mount (Date.now() directly
  // in render trips the purity lint; a lazy initializer does not).
  const [now] = useState(() => Date.now())
  const health = pipelineHealth(items, now, slaHours)
  const verdictLabel =
    health.verdict === 'healthy'
      ? 'Healthy'
      : health.verdict === 'critical'
        ? 'Critical'
        : 'Needs attention'
  const statusEntries = Object.entries(health.byStatus).sort(
    (a, b) => b[1] - a[1]
  )
  return (
    <section className="pipeline-health" aria-live="polite">
      <span className="app-eyebrow">PIPELINE HEALTH</span>
      <div className="pipeline-head">
        <strong>
          {health.openCount} open leads
          <span
            className={`pipeline-verdict pipeline-verdict-${health.verdict}`}
          >
            {verdictLabel}
          </span>
        </strong>
      </div>
      <ul className="pipeline-health-list">
        {statusEntries.map(([status, count]) => (
          <li key={status}>
            {status}: {count} — {formatMoney(health.valueByStatus[status], currency)}
          </li>
        ))}
        {health.notes.map(note => (
          <li key={note}>{note}</li>
        ))}
      </ul>
      <div className="pipeline-health-meta">
        Heuristic verdict from counts — stale share {health.staleShare}% of
        open leads
        {slaHours > 0 ? `, SLA target ${slaHours}h` : ', no SLA target set'}.
      </div>
    </section>
  )
}
