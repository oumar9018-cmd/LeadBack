import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const PLANS = {
  monthly: {
    name: 'Monthly',
    price: '₹499',
    period: 'per month',
    description: 'Flexible monthly billing with full LeadBack access.',
  },
  yearly: {
    name: 'Yearly',
    price: '₹4,990',
    period: 'per year',
    description: 'One annual payment with a 12-month license.',
  },
}

function formatDate(value) {
  if (!value) return '—'

  try {
    const date = value?.toDate
      ? value.toDate()
      : new Date(value)

    if (Number.isNaN(date.getTime())) return '—'

    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date)
  } catch {
    return '—'
  }
}

export default function Billing() {
  const navigate = useNavigate()

  const [plan, setPlan] = useState('monthly')
  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const auth = window.firebase?.auth?.()
    const db = window.firebase?.firestore?.()

    if (!auth || !db) {
      setLoading(false)
      return
    }

    let active = true

    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (!active) return

      if (!user) {
        setAccount(null)
        setLoading(false)
        return
      }

      try {
        const snapshot = await db
          .collection('users')
          .doc(user.uid)
          .get()

        if (active) {
          setAccount(snapshot.exists ? snapshot.data() : null)
        }
      } catch (error) {
        console.error('Billing account load failed:', error)

        if (active) {
          setAccount(null)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const status = account?.subscriptionStatus || 'trialing'
  const isPaid =
    status === 'active' ||
    status === 'subscribed'

  const trialEnd = account?.trialEndsAt

  const trialEndTime = trialEnd?.toDate
    ? trialEnd.toDate().getTime()
    : trialEnd
      ? new Date(trialEnd).getTime()
      : null

  const trialExpired =
    status === 'trialing' &&
    Number.isFinite(trialEndTime) &&
    Date.now() >= trialEndTime

  const currentStatus = isPaid
    ? 'Active'
    : trialExpired
      ? 'Trial ended'
      : 'Active'

  const currentPlan = isPaid
    ? (account?.plan || 'paid')
    : '1-month free trial'

  function handlePayment() {
    console.log('Payment provider not connected yet.', {
      plan,
      price: PLANS[plan].price,
    })
  }

  return (
    <div className="billing-page">
      <div className="billing-inner">

        <header className="billing-header">
          <div>
            <span className="app-eyebrow">BILLING</span>
            <h1>Subscription & billing</h1>
            <p>Manage your LeadBack plan and license.</p>
          </div>

          <button
            className="primary-button"
            onClick={() => navigate('/app')}
          >
            Back to dashboard
          </button>
        </header>

        <section className="billing-current">
          <div>
            <span className="billing-label">CURRENT PLAN</span>

            <h2>
              {loading
                ? 'Checking your plan…'
                : currentPlan}
            </h2>

            <p>
              {isPaid
                ? 'Your LeadBack subscription is active.'
                : trialExpired
                  ? 'Your free trial has ended. Choose a plan to continue.'
                  : 'Your 1-month free trial is active.'}
            </p>

            {!isPaid && trialEnd && !trialExpired && (
              <p style={{ marginTop: 7 }}>
                Trial ends {formatDate(trialEnd)}
              </p>
            )}
          </div>

          <span className="billing-active">
            {currentStatus}
          </span>
        </section>

        <section className="billing-plans">

          {Object.entries(PLANS).map(([key, item]) => (
            <button
              key={key}
              className={`billing-plan ${plan === key ? 'selected' : ''}`}
              onClick={() => setPlan(key)}
            >
              <div className="plan-top">
                <span>{item.name}</span>
                {plan === key && <b>✓</b>}
              </div>

              <strong>{item.price}</strong>

              <span className="plan-period">
                {item.period}
              </span>

              <p>{item.description}</p>
            </button>
          ))}

        </section>

        <section className="license-card">
          <div>
            <span className="billing-label">LICENSE</span>
            <h3>LeadBack Pro License</h3>
          </div>

          <div className="license-grid">
            <div>
              <span>Status</span>
              <strong>{currentStatus}</strong>
            </div>

            <div>
              <span>Billing cycle</span>
              <strong>
                {PLANS[plan].name}
              </strong>
            </div>

            <div>
              <span>Access</span>
              <strong>
                {isPaid || (!trialExpired && !loading)
                  ? 'Full product'
                  : 'Upgrade required'}
              </strong>
            </div>
          </div>
        </section>

        <button
          className="billing-upgrade"
          onClick={handlePayment}
          disabled={loading}
        >
          Continue with {PLANS[plan].name.toLowerCase()} plan
        </button>

        <p className="billing-note">
          Secure payment will be enabled before production launch.
          Your selected plan is {PLANS[plan].price} {PLANS[plan].period}.
        </p>

      </div>
    </div>
  )
}
