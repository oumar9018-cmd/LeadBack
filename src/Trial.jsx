import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { activateFreeTrial, launchRazorpayCheckout } from './payments/razorpay.js'
import './Trial.css'

export default function Trial() {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')
  const isTestMode = import.meta.env.VITE_RAZORPAY_KEY_ID?.startsWith('rzp_test_')

  useEffect(() => {
    const auth = window.firebase?.auth?.()

    if (!auth) {
      setError('Firebase is not available.')
      setChecking(false)
      return
    }

    const unsubscribe = auth.onAuthStateChanged(currentUser => {
      setUser(currentUser)
      setChecking(false)
    })

    return unsubscribe
  }, [])

  async function startTrial() {
    if (!user || starting) return

    setStarting(true)
    setError('')

    try {
      if (isTestMode) {
        // Exercise the complete payment verification path with a test-only
        // ₹499 order; the successful test payment starts the free trial.
        await launchRazorpayCheckout({ plan: 'monthly', user, purpose: 'trial' })
      } else {
        await activateFreeTrial(user)
      }

      navigate('/app', { replace: true })
    } catch (err) {
      console.error('Trial checkout failed:', err)
      setError(err?.message || 'Unable to complete checkout. Please try again.')
    } finally {
      setStarting(false)
    }
  }

  if (checking) {
    return (
      <div className="trial-page">
        <div className="trial-card">
          <span className="trial-mark">L</span>
          <strong>Checking your account…</strong>
          <span>Please wait.</span>
        </div>
      </div>
    )
  }

  if (!user) {
    navigate('/login', { replace: true })
    return null
  }

  return (
    <div className="trial-page">
      <div className="trial-card">

        <span className="trial-eyebrow">
          WELCOME TO LEADBACK
        </span>

        <div className="trial-icon">
          L
        </div>

        <h1>Start your 1-month free trial.</h1>

        <p>
          Recover missed inquiries, follow up faster,
          and turn more conversations into customers.
        </p>

        <div className="trial-benefits">
          <div>
            <strong>1 month</strong>
            <span>Free access</span>
          </div>

          <div>
            <strong>₹499/mo</strong>
            <span>After trial</span>
          </div>

          <div>
            <strong>Cancel</strong>
            <span>Before renewal</span>
          </div>
        </div>

        {error && (
          <div className="trial-error" role="alert">
            {error}
          </div>
        )}

        <button
          className="trial-button"
          onClick={startTrial}
          disabled={starting}
        >
          {starting
            ? (isTestMode ? 'Verifying test payment…' : 'Activating trial…')
            : 'Start 1-month free trial'}
        </button>

        <small>
          {isTestMode
            ? '₹499 test checkout; no real funds are transferred in test mode.'
            : 'No charge during your free trial.'}
        </small>

      </div>
    </div>
  )
}
