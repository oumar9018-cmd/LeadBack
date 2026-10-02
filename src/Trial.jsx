import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Trial.css'

export default function Trial() {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')

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
      const db = window.firebase.firestore()
      const firebase = window.firebase

      const userRef = db
        .collection('users')
        .doc(user.uid)

      const snapshot = await userRef.get()

      const existing = snapshot.exists
        ? snapshot.data()
        : {}

      if (existing.trialStartedAt || existing.trialEndsAt) {
        navigate('/app', { replace: true })
        return
      }

      const now = new Date()
      const ends = new Date(now)

      ends.setMonth(ends.getMonth() + 1)

      await userRef.set(
        {
          trialStartedAt: firebase.firestore.Timestamp.fromDate(now),
          trialEndsAt: firebase.firestore.Timestamp.fromDate(ends),
          subscriptionStatus: 'trialing',
          plan: 'trial',
          trialRedeemed: true,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      )

      navigate('/app', { replace: true })
    } catch (err) {
      console.error('Trial activation failed:', err)
      setError('Unable to start your free trial. Please try again.')
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
          <div className="trial-error">
            {error}
          </div>
        )}

        <button
          className="trial-button"
          onClick={startTrial}
          disabled={starting}
        >
          {starting
            ? 'Activating trial…'
            : 'Start 1-month free trial'}
        </button>

        <small>
          No charge during your free trial.
        </small>

      </div>
    </div>
  )
}
