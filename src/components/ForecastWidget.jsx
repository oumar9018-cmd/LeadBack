import { recoveryForecast } from '../utils/forecast.js'
import { formatMoney } from '../utils/money.js'
import { IconTrendUp } from './icons.jsx'
import './ForecastWidget.css'

/**
 * Recovery Forecast — "what will I recover?" widget.
 *
 * Honest prediction: open pipeline value × the owner's own historical
 * conversion rate. Shows a range, never a fake precise number. When there
 * isn't enough history yet, it says so and explains what to do.
 */
export default function ForecastWidget({ inquiries, currency = 'INR' }) {
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
            <strong>{formatMoney(f.mid, currency)}</strong>
            <span>likely recovery from your open pipeline</span>
          </div>
          <div className="forecast-bar" aria-hidden="true">
            <span className="forecast-low" style={{ width: `${(f.low / f.pipelineValue) * 100}%` }} />
            <span className="forecast-mid" style={{ width: `${((f.mid - f.low) / f.pipelineValue) * 100}%` }} />
            <span className="forecast-high" style={{ width: `${((f.high - f.mid) / f.pipelineValue) * 100}%` }} />
          </div>
          <div className="forecast-labels">
            <span>{formatMoney(f.low, currency)}</span>
            <span>{formatMoney(f.high, currency)}</span>
          </div>
          <p className="forecast-basis">{f.basis}</p>
          <p className="forecast-pipeline">
            Open pipeline: <strong>{formatMoney(f.pipelineValue, currency)}</strong>
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
              Open pipeline: <strong>{formatMoney(f.pipelineValue, currency)}</strong>
            </p>
          )}
        </>
      )}
    </div>
  )
}
