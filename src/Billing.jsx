import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { launchRazorpayCheckout } from './payments/razorpay.js'

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

function timestampValue(value) {
  if (value?.toDate) return value.toDate().getTime()
  if (!value) return null

  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : null
}

export default function Billing() {
  const navigate = useNavigate()

  const [plan, setPlan] = useState('monthly')
  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState('')

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
          const data = snapshot.exists ? snapshot.data() : null
          setAccount(data)

          if (['monthly', 'yearly'].includes(data?.plan)) {
            setPlan(data.plan)
          }
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
  const hasPaidStatus = status === 'active' || status === 'subscribed'
  const subscriptionEnd = account?.subscriptionEndsAt
  const subscriptionEndTime = timestampValue(subscriptionEnd)
  const paidExpired =
    hasPaidStatus &&
    Number.isFinite(subscriptionEndTime) &&
    Date.now() >= subscriptionEndTime
  const isPaid = hasPaidStatus && !paidExpired

  const trialEnd = account?.trialEndsAt
  const trialEndTime = timestampValue(trialEnd)
  const trialExpired =
    status === 'trialing' &&
    Number.isFinite(trialEndTime) &&
    Date.now() >= trialEndTime
  const trialActive =
    status === 'trialing' &&
    Boolean(trialEnd) &&
    !trialExpired

  const currentStatus = isPaid
    ? 'Active'
    : paidExpired
      ? 'Expired'
      : trialExpired
        ? 'Trial ended'
        : trialActive
          ? 'Active'
          : 'Inactive'

  const currentPlan = isPaid || paidExpired
    ? (account?.plan || 'paid')
    : '1-month free trial'

  async function handlePayment() {
    if (loading || processingPayment) return

    const user = window.firebase?.auth?.()?.currentUser

    if (!user) {
      setPaymentError('Please sign in before continuing to checkout.')
      navigate('/login')
      return
    }

    setProcessingPayment(true)
    setPaymentError('')

    try {
      await launchRazorpayCheckout({ plan, user })

      try {
        const snapshot = await window.firebase
          .firestore()
          .collection('users')
          .doc(user.uid)
          .get()

        setAccount(snapshot.exists ? snapshot.data() : null)
      } catch (refreshError) {
        console.error('Verified billing account refresh failed:', refreshError)
      }
    } catch (error) {
      console.error('Razorpay checkout failed:', error)
      setPaymentError(
        error?.message || 'Payment could not be completed. Please try again.'
      )
    } finally {
      setProcessingPayment(false)
    }
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
                : paidExpired
                  ? 'Your paid access has ended. Choose a plan to continue.'
                  : trialExpired
                    ? 'Your free trial has ended. Choose a plan to continue.'
                    : trialActive
                      ? 'Your 1-month free trial is active.'
                      : 'Choose a plan to activate LeadBack.'}
            </p>

            {!isPaid && trialActive && (
              <p style={{ marginTop: 7 }}>
                Trial ends {formatDate(trialEnd)}
              </p>
            )}

            {isPaid && subscriptionEnd && (
              <p style={{ marginTop: 7 }}>
                Access through {formatDate(subscriptionEnd)}
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
                {isPaid || (trialActive && !loading)
                  ? 'Full product'
                  : 'Upgrade required'}
              </strong>
            </div>
          </div>
        </section>

        <button
          className="billing-upgrade"
          onClick={handlePayment}
          disabled={loading || processingPayment}
        >
          {processingPayment
            ? 'Verifying payment…'
            : `Continue with ${PLANS[plan].name.toLowerCase()} plan`}
        </button>

        <p className="billing-note" role={paymentError ? 'alert' : undefined}>
          {paymentError || `Secure Razorpay checkout. Selected plan: ${PLANS[plan].price} ${PLANS[plan].period}. This payment does not auto-renew.`}
        </p>

      </div>
    </div>
  )
}
