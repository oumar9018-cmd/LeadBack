import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Signup() {
  const navigate = useNavigate()

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
          <span className="app-eyebrow">START FREE</span>
          <h1>Create your LeadBack account</h1>
          <p>Start your 1-month free trial and recover more missed inquiries.</p>
        </div>

        <button
          type="button"
          className="google-button"
          onClick={async () => {
            try {
              const provider = new window.firebase.auth.GoogleAuthProvider()
              await window.firebase.auth().signInWithPopup(provider)
              navigate('/app')
            } catch (error) {
              console.error('Google Sign-In failed:', error)
              alert(error.message || 'Google Sign-In failed.')
            }
          }}
        >
          <span className="google-icon">G</span>
          <span>Continue with Google</span>
        </button>

        <div className="auth-benefits">
          <div>
            <span>✓</span>
            <p>1-month free trial</p>
          </div>
          <div>
            <span>✓</span>
            <p>No setup complexity</p>
          </div>
          <div>
            <span>✓</span>
            <p>Full LeadBack workspace</p>
          </div>
        </div>

        <p className="auth-terms">
          By continuing, you agree to LeadBack's terms and privacy policy.
        </p>

        <div className="auth-switch">
          <span>Already have an account?</span>
          <button onClick={() => navigate('/login')}>
            Sign in
          </button>
        </div>

      </div>
    </div>
  )
}
