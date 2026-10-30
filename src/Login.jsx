import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { url } from './basePath.js'
import './Login.css'

/* ------------------------------------------------------------------ */
/*  Icons (pure SVG, no emojis)                                        */
/* ------------------------------------------------------------------ */

function GoogleG() {
  return (
    <svg className="wynl-google-g" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  )
}

function ButtonSpinner() {
  return (
    <svg className="wynl-spinner" viewBox="0 0 24 24" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.22"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg className="wynl-error-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9.2" fill="currentColor" opacity="0.12" />
      <circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="11.1" y="7" width="1.8" height="6.4" rx="0.9" fill="currentColor" />
      <circle cx="12" cy="16.2" r="1.15" fill="currentColor" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l7.5 3v5.5c0 4.6-3.2 8-7.5 9.5-4.3-1.5-7.5-4.9-7.5-9.5V6L12 3z" />
      <path d="M9 12l2.2 2.2L15.5 10" />
    </svg>
  )
}

/** Clean blue "W" mark for the login brand (light enterprise theme). */
function BrandMark() {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="#2563EB" />
      <path
        d="M9 27 L14 13 L19 24 L24 13"
        stroke="#FFFFFF"
        strokeWidth={3.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22.5 26 L31.5 16.5"
        stroke="#FFFFFF"
        strokeWidth={3.6}
        strokeLinecap="round"
        opacity={0.85}
      />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Login page                                                         */
/* ------------------------------------------------------------------ */

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
        window.location.href = url('/ceo')
      } else {
        window.location.href = url('/app')
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
            'Google sign-in encountered a browser authentication error. Please close this tab, reopen Wynback, and try again.'
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
    <div className="wynl">
      <main className="wynl-main">
        <div className="wynl-card">
          <button
            type="button"
            className="wynl-logo"
            onClick={() => navigate('/')}
            aria-label="Wynback home"
          >
            <span className="wynl-logo-mark">
              <BrandMark />
            </span>
            <span className="wynl-logo-name">Wynback</span>
          </button>

          <h1 className="wynl-title">Welcome back</h1>
          <p className="wynl-sub">
            Sign in to continue to your revenue recovery workspace.
          </p>

          <button
            type="button"
            className="wynl-google"
            disabled={loading}
            onClick={handleGoogleLogin}
          >
            {loading ? <ButtonSpinner /> : <GoogleG />}
            <span>
              {loading
                ? 'Connecting to Google…'
                : 'Continue with Google'}
            </span>
          </button>

          {errorMessage && (
            <div className="wynl-error" role="alert">
              <AlertIcon />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="wynl-divider">
            <span>Secure sign-in</span>
          </div>

          <p className="wynl-terms">
            By continuing, you agree to Wynback’s terms of service and privacy policy.
          </p>
        </div>

        <p className="wynl-footnote">
          <ShieldIcon />
          Protected by Google · Your data stays yours
        </p>
      </main>
    </div>
  )
}
