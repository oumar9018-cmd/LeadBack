import { recoveryForecast } from '../utils/forecast.js'
import { IconTrendUp } from './icons.jsx'
import './ForecastWidget.css'

function money(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Recovery Forecast — "what will I recover?" widget.
 *
 * Honest prediction: open pipeline value × the owner's own historical
 * conversion rate. Shows a range, never a fake precise number. When there
 * isn't enough history yet, it says so and explains what to do.
 */
export default function ForecastWidget({ inquiries }) {
  const f = recoveryForecast(inquiries)

  return (
    <div className="forecast-widget">
      <div className="forecast-head">
        <span className="app-eyebrow">FORECAST</span>
        <h3>
          <IconTrendUp width={18} height={18} />
          Expected recovery
        </h3>
      </div>

      {f.ready ? (
        <>
          <div className="forecast-range">
            <strong>{money(f.mid)}</strong>
            <span>likely recovery from your open pipeline</span>
          </div>
          <div className="forecast-bar" aria-hidden="true">
            <span className="forecast-low" style={{ width: `${(f.low / f.pipelineValue) * 100}%` }} />
            <span className="forecast-mid" style={{ width: `${((f.mid - f.low) / f.pipelineValue) * 100}%` }} />
            <span className="forecast-high" style={{ width: `${((f.high - f.mid) / f.pipelineValue) * 100}%` }} />
          </div>
          <div className="forecast-labels">
            <span>{money(f.low)}</span>
            <span>{money(f.high)}</span>
          </div>
          <p className="forecast-basis">{f.basis}</p>
          <p className="forecast-pipeline">
            Open pipeline: <strong>{money(f.pipelineValue)}</strong>
          </p>
        </>
      ) : (
        <>
          <div className="forecast-range">
            <strong>—</strong>
            <span>not enough history yet</span>
          </div>
          <p className="forecast-basis">{f.basis}</p>
          {f.pipelineValue > 0 && (
            <p className="forecast-pipeline">
              Open pipeline: <strong>{money(f.pipelineValue)}</strong>
            </p>
          )}
        </>
      )}
    </div>
  )
}
