import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { computeGraveyard } from '../utils/graveyard.js'
import { formatMoney, formatMoneyCompact } from '../utils/money.js'
import { IconAlert, IconTrendingDown, IconZap } from './icons.jsx'
import './GraveyardCounter.css'

/**
 * Animated count-up hook. Eases from 0 to `target` over ~1.2s.
 */
export function useCountUp(target, duration = 1200) {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef(null)

  useEffect(() => {
    const start = performance.now()
    const from = 0
    const to = Number(target) || 0

    if (to === 0) {
      setDisplay(0)
      return
    }

    const tick = now => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(from + (to - from) * eased))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration])

  return display
}

/**
 * Full-width urgent banner for the dashboard hero.
 * Props: items (inquiry list), currency.
 */
export function GraveyardCounter({ items, currency = 'INR' }) {
  const navigate = useNavigate()
  const grave = computeGraveyard(items)
  const animated = useCountUp(grave.total)

  if (grave.count === 0) return null

  return (
    <section className="graveyard-banner" aria-live="polite">
      <div className="graveyard-pulse" aria-hidden="true" />
      <div className="graveyard-icon">
        <IconAlert width={30} height={30} />
      </div>
      <div className="graveyard-copy">
        <span className="graveyard-kicker">Money rotting in dead leads</span>
        <strong className="graveyard-amount">
          {formatMoney(animated, currency)}
        </strong>
        <span className="graveyard-detail">
          {grave.lostCount > 0 && (
            <>{grave.lostCount} lost lead{grave.lostCount === 1 ? '' : 's'}</>
          )}
          {grave.lostCount > 0 && grave.staleCount > 0 && ' · '}
          {grave.staleCount > 0 && (
            <>{grave.staleCount} gone quiet 30+ days</>
          )}
        </span>
      </div>
      <button
        type="button"
        className="graveyard-cta"
        onClick={() => navigate('/app/blitz')}
      >
        <IconZap width={16} height={16} />
        Recover it now
      </button>
    </section>
  )
}

/**
 * Compact pill for the app header / sidebar — visible on every screen.
 * Fetches the inquiry list itself so it works outside the Dashboard.
 */
export function useGraveyardValue() {
  const [value, setValue] = useState(null)

  useEffect(() => {
    const auth = window.firebase?.auth?.()
    const db = window.firebase?.firestore?.()
    if (!auth || !db) return

    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (!user) {
        setValue(null)
        return
      }
      try {
        const snap = await db
          .collection('users')
          .doc(user.uid)
          .collection('inquiries')
          .get()
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setValue(computeGraveyard(items))
      } catch {
        setValue(null)
      }
    })

    return unsubscribe
  }, [])

  return value
}

export function GraveyardPill({ currency = 'INR' }) {
  const navigate = useNavigate()
  const grave = useGraveyardValue()

  if (!grave || grave.count === 0) return null

  return (
    <button
      type="button"
      className="graveyard-pill"
      onClick={() => navigate('/app/blitz')}
      title={`${grave.count} dead leads worth ${formatMoney(grave.total, currency)} — recover them now`}
    >
      <IconTrendingDown width={15} height={15} />
      <span>{formatMoneyCompact(grave.total, currency)} at risk</span>
    </button>
  )
}
