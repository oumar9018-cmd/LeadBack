import { useMemo, useState } from 'react'
import './MissedRevenueCalculator.css'

const DAYS_PER_MONTH = 30

function clampNumber(value, min, max) {
  const parsed = Number(value)
  if (Number.isNaN(parsed)) return min
  return Math.min(max, Math.max(min, parsed))
}

function formatInr(amount) {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`
}

/**
 * Missed-revenue calculator.
 *
 * Estimate — not a measured figure. The monthly figure is a simple model:
 * missed calls per day × 30 days × average deal value × close rate.
 * Nothing entered here is stored or sent anywhere.
 */
export default function MissedRevenueCalculator() {
  const [callsPerDay, setCallsPerDay] = useState(5)
  const [dealValue, setDealValue] = useState(2000)
  const [closeRate, setCloseRate] = useState(20)

  const estimate = useMemo(
    () => callsPerDay * DAYS_PER_MONTH * dealValue * (closeRate / 100),
    [callsPerDay, dealValue, closeRate]
  )

  function downloadCsv() {
    const rows = [
      ['BackWon missed revenue estimate'],
      ['Estimate — not a measured figure'],
      [],
      ['Missed calls per day', callsPerDay],
      ['Average deal value (INR)', dealValue],
      ['Close rate (%)', closeRate],
      ['Days per month (assumption)', DAYS_PER_MONTH],
      [],
      ['Estimated monthly lost revenue (INR)', Math.round(estimate)],
      ['Estimated yearly lost revenue (INR)', Math.round(estimate * 12)],
      [],
      [
        'Assumptions: 30 days/month; close rate applied evenly to missed calls; every missed call treated as a real opportunity.',
      ],
    ]
    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'backwon-missed-revenue-estimate.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(link.href)
  }

  return (
    <section className="mrc" aria-label="Missed revenue calculator">
      <div className="mrc-inner">
        <p className="mrc-estimate-label">
          Estimate — not a measured figure
        </p>

        <div className="mrc-grid">
          <div className="mrc-inputs">
            <label className="mrc-field" htmlFor="mrc-calls">
              <span>Missed calls per day</span>
              <input
                id="mrc-calls"
                type="number"
                min="0"
                max="1000"
                step="1"
                value={callsPerDay}
                onChange={(event) =>
                  setCallsPerDay(clampNumber(event.target.value, 0, 1000))
                }
              />
            </label>

            <label className="mrc-field" htmlFor="mrc-value">
              <span>Average deal value (₹)</span>
              <input
                id="mrc-value"
                type="number"
                min="0"
                max="1000000"
                step="100"
                value={dealValue}
                onChange={(event) =>
                  setDealValue(clampNumber(event.target.value, 0, 1000000))
                }
              />
            </label>

            <label className="mrc-field" htmlFor="mrc-rate">
              <span>Close rate (%)</span>
              <input
                id="mrc-rate"
                type="number"
                min="0"
                max="100"
                step="1"
                value={closeRate}
                onChange={(event) =>
                  setCloseRate(clampNumber(event.target.value, 0, 100))
                }
              />
            </label>
          </div>

          <div className="mrc-result">
            <span className="mrc-result-label">
              Estimated monthly lost revenue
            </span>
            <strong className="mrc-result-value">{formatInr(estimate)}</strong>
            <span className="mrc-result-sub">
              {formatInr(estimate * 12)} estimated per year
            </span>
            <button
              className="mrc-download"
              type="button"
              onClick={downloadCsv}
            >
              Download estimate (CSV)
            </button>
          </div>
        </div>

        <p className="mrc-assumptions">
          Assumptions: 30 days a month; your close rate applied evenly to
          missed calls; every missed call treated as a real opportunity. This
          is an estimate — not a measured figure.
        </p>
      </div>
    </section>
  )
}
