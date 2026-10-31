import { useNavigate } from 'react-router-dom'
import { getUnassignedOpen, totalValue } from '../utils/detectors.js'
import { formatMoney } from '../utils/money.js'
import './UnassignedRevenue.css'

/**
 * #33 — Unassigned Revenue Detector (dashboard section).
 *
 * Open inquiries with no owner are revenue nobody is working. This section
 * shows the count and the total value at risk, and links to Inquiries
 * where the owner can route them. Renders nothing when everything open
 * is assigned, so the dashboard stays quiet on a healthy workspace.
 * Rows come from the dashboard's already-scoped items — nothing new is
 * fetched and nothing leaks across scopes.
 */
export default function UnassignedRevenue({ items, currency }) {
  const navigate = useNavigate()
  const unassigned = getUnassignedOpen(items)
  if (unassigned.length === 0) return null

  return (
    <section className="unassigned-banner" aria-live="polite">
      <div className="unassigned-copy">
        <span className="app-eyebrow">UNASSIGNED REVENUE</span>
        <strong>
          {unassigned.length}{' '}
          {unassigned.length === 1 ? 'open inquiry' : 'open inquiries'} with
          no owner — {formatMoney(totalValue(unassigned), currency)} waiting
        </strong>
        <span>
          Open inquiries only; recovered and lost are excluded. Route them
          before they go quiet.
        </span>
      </div>
      <button
        type="button"
        className="unassigned-cta"
        onClick={() => navigate('/app/inquiries')}
      >
        View inquiries
      </button>
    </section>
  )
}
