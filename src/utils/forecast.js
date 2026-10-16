/**
 * Wynback Revenue Recovery Forecast.
 *
 * Honest, transparent prediction: expected recovery = open pipeline value
 * × the owner's OWN historical conversion rate. When there's no history
 * yet, it says so plainly instead of inventing numbers.
 *
 * Returns { ready, low, mid, high, conversionRate, pipelineValue, basis }
 */

const OPEN_STATUSES = ['new', 'followup', 'replied']

export function recoveryForecast(inquiries = []) {
  const items = inquiries || []

  const closed = items.filter(i => i.status === 'recovered' || i.status === 'lost')
  const recoveredCount = items.filter(i => i.status === 'recovered').length

  const pipelineValue = items
    .filter(i => OPEN_STATUSES.includes(i.status))
    .reduce((sum, i) => sum + (Number(i.value) || 0), 0)

  // Need a minimum sample before the forecast is meaningful
  if (closed.length < 3) {
    return {
      ready: false,
      low: 0,
      mid: 0,
      high: 0,
      conversionRate: 0,
      pipelineValue,
      basis: closed.length === 0
        ? 'Recover a few inquiries first — the forecast learns from your results.'
        : `Only ${closed.length} closed so far — the forecast needs at least 3.`,
    }
  }

  const conversionRate = recoveredCount / closed.length

  // Range: conservative (rate × 0.7) → expected (rate) → optimistic (rate × 1.3, capped)
  const mid = pipelineValue * conversionRate
  const low = pipelineValue * conversionRate * 0.7
  const high = Math.min(pipelineValue, pipelineValue * Math.min(1, conversionRate * 1.3))

  return {
    ready: true,
    low: Math.round(low),
    mid: Math.round(mid),
    high: Math.round(high),
    conversionRate: Math.round(conversionRate * 100),
    pipelineValue: Math.round(pipelineValue),
    basis: `Based on your ${Math.round(conversionRate * 100)}% conversion across ${closed.length} closed inquiries.`,
  }
}
