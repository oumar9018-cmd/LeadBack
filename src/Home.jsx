import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './Home.css'

const features = [
  {
    number: '01',
    title: 'Catch missed inquiries',
    text: 'Keep every customer inquiry visible instead of letting promising conversations disappear.'
  },
  {
    number: '02',
    title: 'Follow up at the right time',
    text: 'Turn follow-ups into a simple, organized workflow your team can actually maintain.'
  },
  {
    number: '03',
    title: 'See recovered revenue',
    text: 'Measure which conversations came back and how much revenue they generated.'
  }
]

const industries = [
  'Auto Services',
  'Home Services',
  'Salons & Spas',
  'Fitness',
  'Photography',
  'Local Businesses'
]

function App() {
  const [authBusy, setAuthBusy] = useState(false)

  useEffect(() => {
    const auth = window.firebase?.auth?.()
    if (!auth) return

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user || authBusy) return

      try {
        const db = window.firebase.firestore()
        const snapshot = await db.collection('users').doc(user.uid).get()
        const account = snapshot.exists ? snapshot.data() : null

        if (account?.role === 'ceo') {
          window.location.href = '/ceo'
        } else if (account?.trialRedeemed) {
          window.location.href = '/app'
        } else if (account) {
          window.location.href = '/trial'
        }
      } catch (error) {
        console.error('Homepage session check failed:', error)
      }
    })

    return unsubscribe
  }, [])

  async function handleHomeAuth() {
    if (authBusy) return

    const auth = window.firebase?.auth?.()
    const firebase = window.firebase

    if (!auth || !firebase) {
      window.location.href = '/login'
      return
    }

    setAuthBusy(true)

    try {
      await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)

      const provider = new firebase.auth.GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })

      const result = await auth.signInWithPopup(provider)
      const user = result.user

      const db = firebase.firestore()
      const userRef = db.collection('users').doc(user.uid)
      const snapshot = await userRef.get()

      if (!snapshot.exists) {
        await userRef.set({
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          role: 'customer',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        }, { merge: true })

        window.location.href = '/trial'
        return
      }

      const account = snapshot.data()

      if (account?.role === 'ceo') {
        window.location.href = '/ceo'
      } else if (account?.trialRedeemed) {
        window.location.href = '/app'
      } else {
        window.location.href = '/trial'
      }
    } catch (error) {
      console.error('Homepage Google sign-in failed:', error)

      if (
        error?.code === 'auth/popup-closed-by-user' ||
        error?.code === 'auth/cancelled-popup-request' ||
        error?.code === 'auth/popup-blocked'
      ) {
        console.log('Google sign-in cancelled or blocked.')
      }
    } finally {
      setAuthBusy(false)
    }
  }
  return (
    <div className="site-shell">
      <header className="navbar">
        <a className="brand" href="#top" aria-label="LeadBack home">
          <span className="brand-mark">L</span>
          <span>LeadBack</span>
        </a>

        <nav className="nav-links" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#features">Features</a>
          <a href="#industries">Industries</a>
          <a href="#pricing">Pricing</a>
        </nav>

        <div className="nav-actions">
          <button className="login-link" type="button" onClick={handleHomeAuth}>Log in</button>
          <button className="button button-small" type="button" onClick={handleHomeAuth}>Start free</button>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="status-dot" />
              Revenue recovery for growing businesses
            </div>

            <h1>
              Turn missed inquiries
              <span> into customers.</span>
            </h1>

            <p className="hero-text">
              LeadBack helps businesses follow up with customers who showed
              interest but never completed the booking.
            </p>

            <div className="hero-actions">
              <button className="button button-primary" type="button" onClick={handleHomeAuth}>
                Start free 1-month trial
                <span>→</span>
              </button>
              <a className="button button-secondary" href="#how-it-works">
                See how it works
              </a>
            </div>

            <div className="trust-row">
              <div className="trust-item">
                <strong>1 month</strong>
                <span>free trial</span>
              </div>
              <div className="trust-divider" />
              <div className="trust-item">
                <strong>0 setup</strong>
                <span>complexity</span>
              </div>
              <div className="trust-divider" />
              <div className="trust-item">
                <strong>Built for</strong>
                <span>local teams</span>
              </div>
            </div>
          </div>

          <div className="hero-visual" aria-label="LeadBack dashboard preview">
            <div className="glow glow-one" />
            <div className="glow glow-two" />

            <div className="dashboard-window">
              <div className="window-top">
                <div className="window-dots">
                  <i />
                  <i />
                  <i />
                </div>
                <span>LeadBack / Overview</span>
                <span className="window-status">● Live</span>
              </div>

              <div className="dashboard-body">
                <div className="dashboard-heading">
                  <div>
                    <span className="muted-label">Overview</span>
                    <h2>Your workspace overview</h2>
                  </div>
                  <button className="date-button">Last 30 days⌄</button>
                </div>

                <div className="metric-grid">
                  <div className="metric-card featured">
                    <span>Revenue recovered</span>
                    <strong>—</strong>
                    <small>Recovery overview · Live workspace</small>
                  </div>

                  <div className="metric-card">
                    <span>Customers recovered</span>
                    <strong>—</strong>
                    <small>Live workspace data</small>
                  </div>

                  <div className="metric-card">
                    <span>Recovery rate</span>
                    <strong>—</strong>
                    <small>Inquiry → customer</small>
                  </div>
                </div>

                <div className="inquiry-card">
                  <div className="card-header">
                    <div>
                      <span className="muted-label">Follow-up queue</span>
                      <h3>Recent inquiries</h3>
                    </div>
                    <span className="queue-count">Ready</span>
                  </div>

                  <div className="inquiry-list">
                    <div className="inquiry-row">
                      <div className="avatar avatar-one">+</div>
                      <div className="inquiry-person">
                        <strong>New inquiry</strong>
                        <span>Customer interest</span>
                      </div>
                      <div className="inquiry-value">—</div>
                      <span className="followup-badge">Follow up</span>
                    </div>

                    <div className="inquiry-row">
                      <div className="avatar avatar-two">+</div>
                      <div className="inquiry-person">
                        <strong>New inquiry</strong>
                        <span>Customer interest</span>
                      </div>
                      <div className="inquiry-value">—</div>
                      <span className="reply-badge">Replied</span>
                    </div>

                    <div className="inquiry-row">
                      <div className="avatar avatar-three">+</div>
                      <div className="inquiry-person">
                        <strong>New inquiry</strong>
                        <span>Customer interest</span>
                      </div>
                      <div className="inquiry-value">—</div>
                      <span className="followup-badge">Follow up</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="proof-strip">
          <p>Built around one simple idea:</p>
          <strong>the easiest sale to recover is the one you already earned interest for.</strong>
        </section>

        <section className="section" id="how-it-works">
          <div className="section-heading">
            <span className="section-kicker">How it works</span>
            <h2>Close the gap between<br />interest and action.</h2>
            <p>
              LeadBack turns forgotten inquiries into an organized recovery
              process—without adding another complicated sales workflow.
            </p>
          </div>

          <div className="feature-grid" id="features">
            {features.map((feature) => (
              <article className="feature-card" key={feature.number}>
                <span className="feature-number">{feature.number}</span>
                <div className="feature-icon">
                  {feature.number === '01' && '↗'}
                  {feature.number === '02' && '◷'}
                  {feature.number === '03' && '₹'}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="recovery-section">
          <div className="recovery-copy">
            <span className="section-kicker">The recovery loop</span>
            <h2>One missed inquiry can become one more sale.</h2>
            <p>
              Keep the process simple: capture the inquiry, schedule the
              follow-up, record the response, and understand what came back.
            </p>
          </div>

          <div className="loop-card">
            <div className="loop-step">
              <span>01</span>
              <div>
                <strong>Inquiry</strong>
                <small>Customer shows interest</small>
              </div>
            </div>
            <div className="loop-line" />
            <div className="loop-step">
              <span>02</span>
              <div>
                <strong>Follow-up</strong>
                <small>Conversation gets another chance</small>
              </div>
            </div>
            <div className="loop-line" />
            <div className="loop-step active">
              <span>03</span>
              <div>
                <strong>Recovered</strong>
                <small>Customer comes back</small>
              </div>
            </div>
          </div>
        </section>

        <section className="section industries-section" id="industries">
          <div className="section-heading compact">
            <span className="section-kicker">Made for businesses where leads matter</span>
            <h2>Start where one customer<br />is worth something.</h2>
          </div>

          <div className="industry-grid">
            {industries.map((industry, index) => (
              <div className="industry-card" key={industry}>
                <span>0{index + 1}</span>
                <strong>{industry}</strong>
                <span className="industry-arrow">↗</span>
              </div>
            ))}
          </div>
        </section>

        <section className="pricing-section" id="pricing">
          <div className="pricing-inner">
            <div className="pricing-copy">
              <span className="section-kicker">Simple pricing</span>
              <h2>Try it before<br />you commit.</h2>
              <p>
                Start with a 1-month free trial. Prove that recovered conversations
                are worth more than the software.
              </p>
            </div>

            <div className="price-card">
              <div className="price-top">
                <span className="price-label">LeadBack Pro</span>
                <span className="popular">Starting plan</span>
              </div>

              <div className="price">
                <strong>₹499</strong>
                <span>/ month</span>
              </div>

              <p className="price-description">
                Everything needed to organize and recover missed inquiries.
              </p>

              <ul className="price-list">
                <li>✓ Customer inquiry tracking</li>
                <li>✓ Follow-up queue</li>
                <li>✓ Recovery analytics</li>
                <li>✓ Revenue recovered tracking</li>
                <li>✓ 1-month free trial</li>
              </ul>

              <button className="button button-dark" type="button" onClick={handleHomeAuth}>
                Start free 1-month trial <span>→</span>
              </button>

              <small className="price-note">No credit card required for the pilot.</small>
            </div>
          </div>
        </section>

        <section className="final-cta" id="signup">
          <div>
            <span className="section-kicker">Don't leave money in the inbox.</span>
            <h2>Give every interested customer<br />another chance to say yes.</h2>
            <button className="button button-primary" type="button" onClick={handleHomeAuth}>
              Start free 1-month trial <span>→</span>
            </button>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-brand">
          <a className="brand" href="#top">
            <span className="brand-mark">L</span>
            <span>LeadBack</span>
          </a>
          <p>Turn missed inquiries into customers.</p>
        </div>

        <div className="footer-links">
          <a href="#how-it-works">How it works</a>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <Link to="/login">Get started</Link>
        </div>

        <div className="footer-bottom">
          <span>© 2026 LeadBack. All rights reserved.</span>
          <span>Revenue recovery software.</span>
        </div>
      </footer>
    </div>
  )
}

export default App
