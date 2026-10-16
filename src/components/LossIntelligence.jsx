import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { LOSS_REASONS, LOSS_REASON_LABELS } from './LossReasonModal.jsx'
import { formatMoney } from '../utils/money.js'
import { IconChartBar, IconArrowRight } from './icons.jsx'
import './LossIntelligence.css'

/**
 * Loss-reason intelligence: aggregates WHY deals are lost, shows trends,
 * and recommends a counter-play for the top reason.
 *
 * Props: items (inquiry list), currency.
 */

const COUNTER_PLAYS = {
  price: {
    title: 'Counter price objections with a personal offer',
    body: 'Send a time-limited second-chance offer to price-lost leads. Urgency + personal beats a discount blast.',
    cta: 'Create offers',
    to: '/app/offers',
  },
  timing: {
    title: 'Timing losses need a re-engagement blitz',
    body: '"Not now" means "remind me later". Run a blitz on timing-lost leads with a 30-day check-in angle.',
    cta: 'Start a blitz',
    to: '/app/blitz',
  },
  competitor: {
    title: 'Win back competitor-lost leads with your edge',
    body: 'Send a personal message about what you do differently. One honest differentiator beats ten features.',
    cta: 'Open pipeline',
    to: '/app/inquiries',
  },
  no_response: {
    title: 'Ghosted leads respond to voice, not text',
    body: 'A 10-second personal voice note from you converts far better than another template. Try it on quiet leads.',
    cta: 'Open pipeline',
    to: '/app/inquiries',
  },
  other: {
    title: 'Review your "other" losses for patterns',
    body: 'Read the notes on these losses — the pattern you spot becomes next month\'s playbook.',
    cta: 'Open pipeline',
    to: '/app/inquiries',
  },
}

function monthKey(dateStr) {
  return dateStr ? dateStr.slice(0, 7) : null // 'YYYY-MM'
}

export default function LossIntelligence({ items, currency = 'INR' }) {
  const navigate = useNavigate()

  const stats = useMemo(() => {
    const lost = (items || []).filter(i => i.status === 'lost')
    if (lost.length === 0) return null

    const now = new Date()
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`

    const counts = {}
    const thisMonthCounts = {}
    const lastMonthCounts = {}
    let lostValue = 0

    for (const item of lost) {
      const reason = item.lossReason || 'other'
      counts[reason] = (counts[reason] || 0) + 1
      lostValue += Number(item.value) || 0
      const mk = monthKey(item.lostAt)
      if (mk === thisMonth) thisMonthCounts[reason] = (thisMonthCounts[reason] || 0) + 1
      else if (mk === lastMonth) lastMonthCounts[reason] = (lastMonthCounts[reason] || 0) + 1
    }

    const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1])
    const max = ranked[0]?.[1] || 1
    const [topReason] = ranked[0] || []

    // Trend for the top reason: % change this month vs last month.
    let trend = null
    if (topReason) {
      const cur = thisMonthCounts[topReason] || 0
      const prev = lastMonthCounts[topReason] || 0
      if (prev > 0) {
        const pct = Math.round(((cur - prev) / prev) * 100)
        trend = { pct, direction: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat' }
      } else if (cur > 0) {
        trend = { pct: 100, direction: 'up', fresh: true }
      }
    }

    return { total: lost.length, lostValue, ranked, max, topReason, trend }
  }, [items])

  if (!stats) return null

  const play = COUNTER_PLAYS[stats.topReason] || COUNTER_PLAYS.other

  return (
    <section className="loss-intel" aria-label="Loss reason intelligence">
      <div className="loss-intel-head">
        <span className="app-eyebrow">LOSS INTELLIGENCE</span>
        <h3>
          <IconChartBar width={18} height={18} />
          Why deals die
        </h3>
        <p>
          {stats.total} lost lead{stats.total === 1 ? '' : 's'} ·{' '}
          {formatMoney(stats.lostValue, currency)} walked away
        </p>
      </div>

      <div className="loss-bars">
        {stats.ranked.map(([reason, count]) => {
          const meta = LOSS_REASONS.find(r => r.id === reason) || LOSS_REASONS[4]
          const Icon = meta.icon
          return (
            <div className="loss-bar-row" key={reason}>
              <span className="loss-bar-icon"><Icon width={16} height={16} /></span>
              <span className="loss-bar-label">{LOSS_REASON_LABELS[reason] || reason}</span>
              <div className="loss-bar-track">
                <div
                  className="loss-bar-fill"
                  style={{ width: `${Math.max((count / stats.max) * 100, 6)}%` }}
                />
              </div>
              <strong className="loss-bar-count">{count}</strong>
            </div>
          )
        })}
      </div>

      {stats.trend && stats.trend.direction !== 'flat' && (
        <p className={`loss-trend trend-${stats.trend.direction}`}>
          {LOSS_REASON_LABELS[stats.topReason]} objections{' '}
          {stats.trend.direction === 'up' ? 'up' : 'down'}{' '}
          {Math.abs(stats.trend.pct)}% this month
          {stats.trend.fresh ? ' (new this month)' : ''}
        </p>
      )}

      <div className="loss-play">
        <span className="loss-play-kicker">Recommended counter-play</span>
        <strong>{play.title}</strong>
        <p>{play.body}</p>
        <button type="button" className="loss-play-cta" onClick={() => navigate(play.to)}>
          {play.cta}
          <IconArrowRight width={15} height={15} />
        </button>
      </div>
    </section>
  )
}
