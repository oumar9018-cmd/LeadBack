import { computeStreaks } from '../utils/streaks.js'
import { formatMoney } from '../utils/money.js'
import { IconFlame, IconTrendUp } from './icons.jsx'
import { useCountUp } from './GraveyardCounter.jsx'
import './StreakWidget.css'

/**
 * Recovery Streaks — money dopamine for the owner.
 * "₹12,400 recovered this week · 3-day streak · best week ₹18,000"
 *
 * Props: items (inquiry list), currency.
 */
export default function StreakWidget({ items, currency = 'INR' }) {
  const s = computeStreaks(items)
  const animatedStreak = useCountUp(s.currentStreak, 900)
  const animatedWeek = useCountUp(s.weekValue, 1100)

  if (!s.hasData) {
    return (
      <section className="streak-widget streak-empty" aria-label="Recovery streaks">
        <div className="streak-flame streak-flame-dim">
          <IconFlame width={30} height={30} />
        </div>
        <div>
          <span className="app-eyebrow">RECOVERY STREAK</span>
          <h3>Your streak starts with the first win</h3>
          <p>Mark an inquiry as recovered and the flame lights up. Consecutive winning days build your streak.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="streak-widget" aria-label="Recovery streaks">
      {s.hitMilestone && (
        <div className="streak-celebration" role="status">
          <IconFlame width={20} height={20} />
          <strong>{s.hitMilestone}-day streak! You're on fire.</strong>
          <span>Only the most consistent owners get here.</span>
        </div>
      )}

      <div className="streak-main">
        <div className={`streak-flame${s.currentStreak > 0 ? ' lit' : ''}`}>
          <IconFlame width={34} height={34} />
        </div>
        <div className="streak-numbers">
          <strong className="streak-count">
            {animatedStreak}-day streak
          </strong>
          <span className="streak-sub">
            {s.currentStreak === 0
              ? 'Recovered yesterday? Win today to restart the flame.'
              : s.currentStreak === 1
                ? 'One winning day. Keep it burning tomorrow.'
                : `${s.longestStreak}-day personal best — beat it.`}
          </span>
        </div>
      </div>

      <div className="streak-stats">
        <div className="streak-stat">
          <span className="streak-stat-label">Recovered this week</span>
          <strong className="streak-stat-value">
            <IconTrendUp width={15} height={15} />
            {formatMoney(animatedWeek, currency)}
          </strong>
          <small>{s.weekCount} win{s.weekCount === 1 ? '' : 's'} so far</small>
        </div>
        <div className="streak-stat">
          <span className="streak-stat-label">Best week ever</span>
          <strong className="streak-stat-value">{formatMoney(s.bestWeekValue, currency)}</strong>
          <small>
            {s.weekValue >= s.bestWeekValue && s.bestWeekValue > 0
              ? 'New record pace — keep going!'
              : `${formatMoney(Math.max(s.bestWeekValue - s.weekValue, 0), currency)} to beat it`}
          </small>
        </div>
      </div>
    </section>
  )
}
