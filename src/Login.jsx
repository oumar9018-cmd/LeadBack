import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleGoogleLogin() {
    if (loading) return

    setLoading(true)
    setErrorMessage('')

    try {
      const firebase = window.firebase

      if (!firebase?.auth || !firebase?.firestore) {
        throw new Error('Firebase SDK is not available.')
      }

      const auth = firebase.auth()
      const provider = new firebase.auth.GoogleAuthProvider()

      provider.setCustomParameters({
        prompt: 'select_account',
      })

      // Prefer persistent browser auth.
      // If the browser blocks local persistence, fall back
      // to session persistence instead of failing immediately.
      try {
        await auth.setPersistence(
          firebase.auth.Auth.Persistence.LOCAL
        )
      } catch (persistenceError) {
        console.warn(
          'LOCAL auth persistence unavailable, using SESSION:',
          persistenceError
        )

        await auth.setPersistence(
          firebase.auth.Auth.Persistence.SESSION
        )
      }

      const result = await auth.signInWithPopup(provider)
      const user = result.user

      if (!user) {
        throw new Error('Google authentication returned no user.')
      }

      // Sync profile and determine the correct post-login destination.
      // New accounts receive the customer role.
      // Existing roles are preserved.
      let accountData = null

      try {
        const db = firebase.firestore()
        const userRef = db.collection('users').doc(user.uid)
        const userSnapshot = await userRef.get()

        const profileData = {
          uid: user.uid,
          name: user.displayName || '',
          email: user.email || '',
          photoURL: user.photoURL || '',
          updatedAt:
            firebase.firestore.FieldValue.serverTimestamp(),
        }

        if (userSnapshot.exists) {
          accountData = userSnapshot.data()

          await userRef.set(profileData, { merge: true })
        } else {
          accountData = {
            ...profileData,
            role: 'customer',
          }

          await userRef.set({
            ...profileData,
            role: 'customer',
            createdAt:
              firebase.firestore.FieldValue.serverTimestamp(),
          })
        }
      } catch (firestoreError) {
        console.error(
          'Profile sync failed:',
          firestoreError
        )
      }

      if (accountData?.role === 'ceo') {
        window.location.href = '/ceo'
      } else if (accountData?.trialRedeemed) {
        window.location.href = '/app'
      } else {
        window.location.href = '/trial'
      }
    } catch (error) {
      console.error('Google Sign-In failed:', error)

      switch (error?.code) {
        case 'auth/popup-closed-by-user':
          setErrorMessage(
            'Google sign-in was cancelled. Please try again.'
          )
          break

        case 'auth/popup-blocked':
          setErrorMessage(
            'Your browser blocked the Google sign-in window. Please allow pop-ups and try again.'
          )
          break

        case 'auth/cancelled-popup-request':
          setErrorMessage(
            'A Google sign-in request is already open.'
          )
          break

        case 'auth/network-request-failed':
          setErrorMessage(
            'Network connection failed. Check your internet and try again.'
          )
          break

        case 'auth/unauthorized-domain':
          setErrorMessage(
            'This website domain is not authorized for Google sign-in yet.'
          )
          break

        case 'auth/web-storage-unsupported':
          setErrorMessage(
            'This browser is blocking required storage. Please enable cookies/site storage and try again.'
          )
          break

        case 'auth/operation-not-supported-in-this-environment':
          setErrorMessage(
            'Google sign-in is not supported in this browser environment.'
          )
          break

        case 'auth/internal-error':
          setErrorMessage(
            'Google sign-in encountered a browser authentication error. Please close this tab, reopen LeadBack, and try again.'
          )
          break

        default:
          setErrorMessage(
            'Google sign-in could not be completed. Please try again.'
          )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <button
          className="auth-logo"
          onClick={() => navigate('/')}
        >
          <span className="auth-logo-mark">L</span>
          <span>LeadBack</span>
        </button>

        <div className="auth-heading">
          <span className="app-eyebrow">WELCOME BACK</span>
          <h1>Sign in to LeadBack</h1>
          <p>
            Continue to your revenue recovery workspace.
          </p>
        </div>

        <button
          type="button"
          className="google-button"
          disabled={loading}
          onClick={handleGoogleLogin}
        >
          <span className="google-icon">G</span>
          <span>
            {loading
              ? 'Connecting to Google…'
              : 'Continue with Google'}
          </span>
        </button>

        {errorMessage && (
          <div className="auth-error" role="alert">
            {errorMessage}
          </div>
        )}

        <div className="auth-divider">
          <span>Secure account access</span>
        </div>

        <p className="auth-terms">
          By continuing, you agree to LeadBack's terms and privacy policy.
        </p>

      </div>
    </div>
  )
}
