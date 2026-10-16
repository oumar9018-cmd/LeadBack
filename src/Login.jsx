import React, { useState, useEffect, useRef } from 'react'
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
      <path d="M12 3.2 2.4 20h19.2L12 3.2z" fill="currentColor" />
      <rect x="11.1" y="8.8" width="1.8" height="6" rx="0.9" fill="#0c0a09" />
      <circle cx="12" cy="16.9" r="1.15" fill="#0c0a09" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12.5l5 5L20 6.5" />
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

/** Gold-gradient Wynback "W" mark for the login brand (Molten Gold theme). */
function GoldMark() {
  const gid = `wynl-g-${Math.random().toString(36).slice(2, 8)}`
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F6D98A">
            <animate attributeName="stop-color" values="#F6D98A;#E8B44A;#F6D98A" dur="5s" repeatCount="indefinite" />
          </stop>
          <stop offset="55%" stopColor="#E8B44A">
            <animate attributeName="stop-color" values="#E8B44A;#FF6B35;#E8B44A" dur="5s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="#FF6B35">
            <animate attributeName="stop-color" values="#FF6B35;#F6D98A;#FF6B35" dur="5s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill={`url(#${gid})`} />
      <path
        d="M9 27 L14 13 L19 24 L24 13"
        stroke="#0C0A09"
        strokeWidth={3.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22.5 26 L31.5 16.5"
        stroke="#0C0A09"
        strokeWidth={3.6}
        strokeLinecap="round"
        opacity={0.85}
      />
    </svg>
  )
}

function IconPhoneMissed() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
      <path d="M17.5 4.5l4.5 4.5M22 4.5l-4.5 4.5" strokeWidth="2.2" />
    </svg>
  )
}

function IconChat() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12a8 8 0 0 1-8 8H4l2.3-2.9A8 8 0 1 1 21 12z" />
      <path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" strokeWidth="2.6" />
    </svg>
  )
}

function IconZap() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13 2L4.5 13.5H11L9.5 22 19 10h-6.5L13 2z" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Gold ember particle field                                          */
/* ------------------------------------------------------------------ */

function EmberField() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let w = 0
    let h = 0
    const DPR = Math.min(window.devicePixelRatio || 1, 2)
    const COUNT = window.innerWidth < 980 ? 36 : 78

    const HUES = [
      [232, 180, 74],
      [246, 217, 138],
      [255, 107, 53],
      [212, 150, 45],
    ]

    function resize() {
      const rect = canvas.getBoundingClientRect()
      w = rect.width
      h = rect.height
      canvas.width = Math.max(1, Math.floor(w * DPR))
      canvas.height = Math.max(1, Math.floor(h * DPR))
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    }

    function makeParticle(seedY) {
      const c = HUES[Math.floor(Math.random() * HUES.length)]
      return {
        x: Math.random() * w,
        y: seedY !== undefined ? seedY : Math.random() * h,
        r: 0.7 + Math.random() * 2.2,
        vy: 0.16 + Math.random() * 0.5,
        sway: 0.3 + Math.random() * 1.1,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.25 + Math.random() * 0.55,
        color: c,
      }
    }

    let particles = Array.from({ length: COUNT }, () => makeParticle())
    let t = 0

    function tick() {
      t += 0.016
      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'
      for (const p of particles) {
        p.y -= p.vy
        p.x += Math.sin(t * 1.4 + p.phase) * p.sway * 0.35
        if (p.y < -12) {
          Object.assign(p, makeParticle(h + 12))
        }
        const twinkle = 0.72 + 0.28 * Math.sin(t * 2.4 + p.phase * 3)
        const [r, g, b] = p.color
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4)
        glow.addColorStop(0, `rgba(${r},${g},${b},${(p.alpha * twinkle).toFixed(3)})`)
        glow.addColorStop(1, `rgba(${r},${g},${b},0)`)
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalCompositeOperation = 'source-over'
      raf = requestAnimationFrame(tick)
    }

    resize()
    tick()
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="wynl-particles" aria-hidden="true" />
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
      {/* ---------------- Left: Molten Gold hero ---------------- */}
      <aside className="wynl-hero" aria-label="Why Wynback">
        <EmberField />
        <div className="wynl-shimmer" aria-hidden="true" />

        <div className="wynl-hero-inner">
          <button
            type="button"
            className="wynl-brand"
            onClick={() => navigate('/')}
            aria-label="Wynback home"
          >
            <span className="wynl-brand-mark">
              <GoldMark />
            </span>
            <span className="wynl-brand-name">Wynback</span>
          </button>

          <span className="wynl-kicker">
            Revenue recovery, on autopilot
          </span>
          <h1>
            Every missed call,
            <br />
            <span className="wynl-gold-text">won back.</span>
          </h1>
          <p className="wynl-hero-copy">
            Wynback follows up with every lost lead in seconds —
            a personal message, a booking link, a second chance —
            so no revenue slips through the cracks.
          </p>

          <div className="wynl-cards" aria-hidden="true">
            <div className="wynl-card-float">
              <span className="wynl-card-icon">
                <IconPhoneMissed />
              </span>
              <div className="wynl-card-body">
                <span className="wynl-card-title">Missed call detected</span>
                <span className="wynl-card-sub">Follow-up message sent instantly</span>
              </div>
              <span className="wynl-card-flash">LIVE</span>
            </div>

            <div className="wynl-card-float">
              <div className="wynl-ring">
                <svg viewBox="0 0 54 54" aria-hidden="true">
                  <defs>
                    <linearGradient id="wynlRingGrad" x1="0" y1="0" x2="54" y2="54" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#F6D98A" />
                      <stop offset="100%" stopColor="#FF6B35" />
                    </linearGradient>
                  </defs>
                  <circle className="wynl-ring-track" cx="27" cy="27" r="24" fill="none" strokeWidth="5" />
                  <circle className="wynl-ring-fill" cx="27" cy="27" r="24" fill="none" strokeWidth="5" />
                </svg>
                <span className="wynl-ring-label">87</span>
              </div>
              <div className="wynl-card-body">
                <span className="wynl-card-title">Win-Back Score</span>
                <span className="wynl-card-sub">This lead is hot — strike now</span>
              </div>
            </div>

            <div className="wynl-card-float">
              <span className="wynl-card-icon">
                <IconChat />
              </span>
              <div className="wynl-card-body">
                <span className="wynl-card-title">Smart follow-up</span>
                <span className="wynl-card-sub">“Sorry we missed you — here’s a booking link…”</span>
              </div>
              <span className="wynl-card-icon" style={{ flex: '0 0 30px', width: 30, height: 30, borderRadius: 10 }}>
                <IconZap />
              </span>
            </div>
          </div>

          <div className="wynl-ticks">
            <span className="wynl-tick"><CheckIcon /> Instant follow-up</span>
            <span className="wynl-tick"><CheckIcon /> Zero setup</span>
            <span className="wynl-tick"><CheckIcon /> WhatsApp-ready</span>
          </div>
        </div>
      </aside>

      {/* ---------------- Right: sign-in card ---------------- */}
      <main className="wynl-main">
        <div className="wynl-signin">
          <span className="wynl-eyebrow">Welcome back</span>
          <h1>Sign in to Wynback</h1>
          <p className="wynl-sub">
            Continue to your revenue recovery workspace.
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
            <span>Secure account access</span>
          </div>

          <p className="wynl-terms">
            By continuing, you agree to Wynback’s terms and privacy policy.
          </p>

          <ul className="wynl-mini-list">
            <li><CheckIcon /> Free to start</li>
            <li><CheckIcon /> No card required</li>
            <li><CheckIcon /> Cancel anytime</li>
          </ul>
        </div>

        <p className="wynl-footnote">
          <ShieldIcon />
          Protected by Google · Your data stays yours
        </p>
      </main>
    </div>
  )
}
