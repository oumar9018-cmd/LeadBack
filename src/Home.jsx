import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import './Home.css'
import { url } from './basePath.js'
// Marketing navigation + Home's SEO metadata, shared with the dedicated
// landing pages so the whole site links to the same canonical URLs.
import { NAV_LINKS, FOOTER_GROUPS, getSeoPage } from './seo/pages.js'
import { useSEO } from './seo/useSEO.js'
import {
  LogoMark,
  IconRadar, IconClock, IconTrendUp, IconCheck,
  IconArrowRight, IconArrowUpRight, IconPhoneMissed,
  IconMessage, IconMic, IconCalendar, IconZap, IconShield,
} from './components/icons.jsx'

/** SEO metadata for the homepage (title, description, canonical, JSON-LD…). */
const HOME_SEO = getSeoPage('home')

/* Scroll-triggered reveal wrapper */
function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--reveal-delay', `${delay}s`)
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('revealed')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [delay])
  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  )
}

/* Animated number counter */
function AnimatedCounter({ to, prefix = '', suffix = '', duration = 1600 }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true
          const t0 = performance.now()
          const tick = (t) => {
            const p = Math.min((t - t0) / duration, 1)
            const eased = 1 - Math.pow(1 - p, 4)
            setVal(Math.round(to * eased))
            if (p < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
          io.disconnect()
        }
      },
      { threshold: 0.4 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [to, duration])
  return (
    <strong ref={ref}>
      {prefix}{val.toLocaleString('en-IN')}{suffix}
    </strong>
  )
}

const features = [
  {
    number: '01',
    icon: 'radar',
    title: 'Catch every missed inquiry',
    text: 'Missed calls, unread DMs, unanswered quotes — every inquiry lands in one queue instead of disappearing.'
  },
  {
    number: '02',
    icon: 'clock',
    title: 'Follow up at the right moment',
    text: 'One tap opens WhatsApp with the perfect message ready. Or send a personal voice note — nobody else does that.'
  },
  {
    number: '03',
    icon: 'trend',
    title: 'Watch revenue come back',
    text: 'See exactly which conversations turned into paying customers and how much you recovered.'
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

const testimonials = [
  {
    quote: 'A customer called while I was with another client. Wynback reminded me in 10 minutes — I sent a voice note and she booked a ₹2,500 hair spa the same evening.',
    name: 'Priya Nair',
    business: 'Glow Studio, Kochi',
    initials: 'PN',
  },
  {
    quote: 'I used to lose 3-4 inquiries every week because I forgot to call back. Now every missed call becomes a WhatsApp conversation. Recovered ₹18,000 last month.',
    name: 'Rajesh Kumar',
    business: 'City Auto Care, Delhi',
    initials: 'RK',
  },
  {
    quote: 'The voice note feature is genius. Customers feel I personally care — because I do. My rebooking rate doubled in two months.',
    name: 'Anita Desai',
    business: 'Serene Spa, Mumbai',
    initials: 'AD',
  },
]

const faqs = [
  {
    q: 'How is Wynback different from a CRM?',
    a: 'CRMs track deals you already have. Wynback recovers customers you almost lost — missed calls, unread messages, quotes that went cold. It is built for the follow-up, not the pipeline.',
  },
  {
    q: 'Do I need any technical setup?',
    a: 'No. Sign in with Google, add your business name, and start logging inquiries. The WhatsApp follow-up is one tap — no API keys, no integrations, no hardware.',
  },
  {
    q: 'What is the voice-note follow-up?',
    a: 'When someone calls and you miss it, Wynback nudges you to send a 10-second personal voice note on WhatsApp. Customers respond to a human voice far more than a template — and no competitor offers this workflow.',
  },
  {
    q: 'Is my customer data private?',
    a: 'Yes. Your inquiries live in your private workspace. We never sell data, never show ads, and you can export or delete everything anytime.',
  },
  {
    q: 'How much does Wynback cost?',
    a: 'Wynback is free during early access. Paid plans will be announced before launch — early members lock in founding pricing.',
  },
  {
    q: 'Which businesses is Wynback for?',
    a: 'Any local business where one customer is worth real money: salons, spas, auto repair, clinics, coaching centers, photographers, home services, fitness studios.',
  },
]

function App() {

  // Apply this page's <title>, meta description, canonical and JSON-LD.
  useSEO(HOME_SEO)

  // Live-feeling dashboard numbers (demo data, gently drifts)
  const [liveRevenue, setLiveRevenue] = useState(48200)
  const [liveWon, setLiveWon] = useState(31)
  useEffect(() => {
    const id = setInterval(() => {
      setLiveRevenue((r) => r + Math.floor(Math.random() * 400))
      if (Math.random() > 0.72) setLiveWon((w) => w + 1)
    }, 4200)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const auth = window.firebase?.auth?.()
    if (!auth) return

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) return

      try {
        const db = window.firebase.firestore()
        const snapshot = await db.collection('users').doc(user.uid).get()
        const account = snapshot.exists ? snapshot.data() : null

        if (account?.role === 'ceo') {
          window.location.href = url('/ceo')
        } else {
          window.location.href = url('/app')
        }
      } catch (error) {
        console.error('Homepage session check failed:', error)
      }
    })

    return unsubscribe
  }, [])

  return (
    <div className="site-shell">
      <header className="navbar">
        <a className="brand" href="#top" aria-label="Wynback home">
          <LogoMark width={32} height={32} className="brand-logo" />
          <span>Wynback</span>
        </a>

        {/*
          Real router links to the dedicated landing pages (not #anchors) so
          crawlers can discover and pass link equity to /features, /use-cases,
          /pricing, /how-it-works, /industries and /about.
        */}
        <nav className="nav-links" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="nav-actions">
          <a className="login-link" href={url('/login')}>Log in</a>
          <a className="button button-small" href={url('/login')}>Get early access</a>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-inner">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="status-dot" />
              Revenue recovery for growing businesses
            </div>

            <h1>
              Win back every
              <span className="grad-text"> customer you almost lost.</span>
            </h1>

            <p className="hero-text">
              Wynback catches missed calls and cold inquiries, then helps you
              follow up in <strong>one tap</strong> — WhatsApp message or personal
              voice note — so no customer ever slips away.
            </p>

            <div className="hero-actions">
              <a className="button button-primary" href={url('/login')}>
                Get early access
                <IconArrowRight width={18} height={18} />
              </a>
              <a className="button button-secondary" href="#how-it-works">
                See how it works
              </a>
            </div>

            <div className="trust-row">
              <div className="trust-item">
                <AnimatedCounter to={48200} prefix="₹" />
                <span>recovered by early users</span>
              </div>
              <div className="trust-divider" />
              <div className="trust-item">
                <AnimatedCounter to={70} suffix="%" />
                <span>win-back rate</span>
              </div>
              <div className="trust-divider" />
              <div className="trust-item">
                <AnimatedCounter to={10} suffix="s" />
                <span>to send a follow-up</span>
              </div>
            </div>
          </div>

          <div className="hero-visual" aria-label="Wynback dashboard preview">
            <div className="glow glow-one" />
            <div className="glow glow-two" />

            <div className="float-card float-a">
              <span className="fc-icon"><IconMessage width={19} height={19} /></span>
              <div>WhatsApp sent<small>Rohan Shah · just now</small></div>
            </div>
            <div className="float-card float-b">
              <span className="fc-icon"><IconTrendUp width={19} height={19} /></span>
              <div>+₹3,500 recovered<small>Hair spa booking confirmed</small></div>
            </div>

            <div className="dashboard-window">
              <div className="window-top">
                <div className="window-dots">
                  <i />
                  <i />
                  <i />
                </div>
                <span>Wynback / Overview</span>
                <span className="window-status">Live</span>
              </div>

              <div className="dashboard-body">
                <div className="dashboard-heading">
                  <div>
                    <span className="muted-label">Overview</span>
                    <h2>Your workspace overview</h2>
                  </div>
                  <button className="date-button">Last 30 days ▾</button>
                </div>

                <div className="metric-grid">
                  <div className="metric-card featured">
                    <span>Revenue recovered</span>
                    <strong>₹{liveRevenue.toLocaleString('en-IN')}</strong>
                    <small><IconTrendUp width={12} height={12} /> +23% this month</small>
                  </div>

                  <div className="metric-card">
                    <span>Customers won back</span>
                    <strong>{liveWon}</strong>
                    <small>from 44 inquiries</small>
                  </div>

                  <div className="metric-card">
                    <span>Win-back rate</span>
                    <strong>70%</strong>
                    <small>Inquiry → customer</small>
                  </div>
                </div>

                <div className="inquiry-card">
                  <div className="card-header">
                    <div>
                      <span className="muted-label">Follow-up queue</span>
                      <h3>Recent inquiries</h3>
                    </div>
                    <span className="queue-count">3 need you</span>
                  </div>

                  <div className="inquiry-list">
                    <div className="inquiry-row">
                      <div className="avatar avatar-one">RS</div>
                      <div className="inquiry-person">
                        <strong>Rohan Shah</strong>
                        <span>Missed call · 20 min ago</span>
                      </div>
                      <div className="inquiry-value">₹3,500</div>
                      <span className="voice-badge"><IconMic width={12} height={12} /> Voice note</span>
                    </div>

                    <div className="inquiry-row">
                      <div className="avatar avatar-two">PM</div>
                      <div className="inquiry-person">
                        <strong>Priya Mehta</strong>
                        <span>Hair coloring quote sent</span>
                      </div>
                      <div className="inquiry-value">₹4,200</div>
                      <span className="reply-badge"><IconMessage width={12} height={12} /> Replied</span>
                    </div>

                    <div className="inquiry-row">
                      <div className="avatar avatar-three">AK</div>
                      <div className="inquiry-person">
                        <strong>Amit Khanna</strong>
                        <span>Car service inquiry</span>
                      </div>
                      <div className="inquiry-value">₹8,000</div>
                      <span className="followup-badge"><IconPhoneMissed width={12} height={12} /> Follow up</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </section>

        <div className="ticker-strip" aria-hidden="true">
          <div className="ticker-track">
            {[0, 1].map((dup) => (
              <span key={dup} style={{ display: 'contents' }}>
                {industries.map((ind) => (
                  <span className="ticker-item" key={`${dup}-${ind}`}>
                    <IconZap width={16} height={16} /> {ind}
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>

        <Reveal className="proof-strip">
          <p>Built around one simple idea:</p>
          <strong>the easiest customer to win is the one who already called you.</strong>
        </Reveal>

        <section className="section" id="how-it-works">
          <Reveal>
          <div className="section-heading">
            <span className="section-kicker">How it works</span>
            <h2>Close the gap between<br />interest and action.</h2>
            <p>
              Wynback turns forgotten inquiries into an organized recovery
              process—without adding another complicated sales workflow.
            </p>
          </div>
          </Reveal>

          <div className="feature-grid" id="features">
            {features.map((feature, i) => (
              <Reveal key={feature.number} delay={i * 0.12}>
              <article className="feature-card">
                <span className="feature-number">{feature.number}</span>
                <div className="feature-icon">
                  {feature.icon === 'radar' && <IconRadar width={28} height={28} />}
                  {feature.icon === 'clock' && <IconClock width={28} height={28} />}
                  {feature.icon === 'trend' && <IconTrendUp width={28} height={28} />}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
              </Reveal>
            ))}
          </div>
        </section>

        <Reveal>
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
        </Reveal>

        <section className="section industries-section" id="industries">
          <Reveal>
          <div className="section-heading compact">
            <span className="section-kicker">Made for businesses where leads matter</span>
            <h2>Start where one customer<br />is worth something.</h2>
          </div>
          </Reveal>

          <div className="industry-grid">
            {industries.map((industry, index) => (
              <Reveal key={industry} delay={(index % 3) * 0.1}>
              <Link className="industry-card" to="/industries">
                <span>0{index + 1}</span>
                <strong>{industry}</strong>
                <span className="industry-arrow"><IconArrowUpRight width={18} height={18} /></span>
              </Link>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="section testimonials-section" id="testimonials">
          <Reveal>
          <div className="section-heading">
            <span className="section-kicker">Illustrative customer stories</span>
            <h2>They stopped losing<br />customers to silence.</h2>
          </div>
          </Reveal>

          <div className="testimonial-grid">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.12}>
              <article className="testimonial-card">
                <div className="testimonial-stars" aria-label="5 out of 5 stars">
                  {[0,1,2,3,4].map((s) => (
                    <svg key={s} viewBox="0 0 24 24" width="16" height="16" fill="#f59e0b" aria-hidden="true">
                      <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8L12 2z" />
                    </svg>
                  ))}
                </div>
                <p className="testimonial-quote">"{t.quote}"</p>
                <div className="testimonial-author">
                  <span className="testimonial-avatar">{t.initials}</span>
                  <div>
                    <strong>{t.name}</strong>
                    <span>{t.business}</span>
                  </div>
                </div>
              </article>
              </Reveal>
            ))}
          </div>
          <p className="testimonials-disclaimer">Illustrative examples of how businesses could use Wynback — real customer stories coming soon.</p>
        </section>

        <section className="section faq-section" id="faq">
          <Reveal>
          <div className="section-heading">
            <span className="section-kicker">Questions, answered</span>
            <h2>Everything else<br />you want to know.</h2>
          </div>
          </Reveal>

          <div className="faq-list">
            {faqs.map((faq, i) => (
              <Reveal key={i} delay={Math.min(i * 0.06, 0.3)}>
              <details className="faq-item" open={i === 0}>
                <summary>{faq.q}</summary>
                <p>{faq.a}</p>
              </details>
              </Reveal>
            ))}
          </div>
        </section>

        <Reveal>
        <section className="pricing-section" id="early-access">
          <div className="pricing-inner">
            <div className="pricing-copy">
              <span className="section-kicker">Early access</span>
              <h2>Be first in line.</h2>
              <p>
                We're rebuilding Wynback from the ground up. Join the waitlist
                and get early access when we launch.
              </p>
            </div>

            <div className="price-card">
              <div className="price-top">
                <span className="price-label">Early Access</span>
                <span className="popular">Coming soon</span>
              </div>

              <p className="price-description">
                Get notified when Wynback launches with missed-call recovery,
                one-tap WhatsApp follow-ups, voice-note win-backs, and more.
              </p>

              <a className="button button-dark" href={url('/login')}>
                Get early access <IconArrowRight width={18} height={18} />
              </a>

              <small className="price-note">Free during early access.</small>
            </div>
          </div>
        </section>
        </Reveal>

        <Reveal>
        <section className="final-cta" id="signup">
          <div>
            <span className="section-kicker">Don't leave money in the inbox.</span>
            <h2>Give every missed customer<br />a reason to come back.</h2>
            <a className="button button-primary" href={url('/login')}>
              Get early access <IconArrowRight width={18} height={18} />
            </a>
          </div>
        </section>
        </Reveal>
      </main>

      <footer className="footer">
        <div className="footer-inner">
        <div className="footer-top">
        <div className="footer-brand">
          <a className="brand" href="#top">
            <LogoMark width={28} height={28} className="brand-logo" />
            <span>Wynback</span>
          </a>
          <p>Win back every customer you almost lost.</p>
        </div>

        <div className="footer-nav">
          {FOOTER_GROUPS.map((group) => (
            <div className="footer-group" key={group.title}>
              <p className="footer-group-title">{group.title}</p>
              <ul>
                {group.links.map((link) => (
                  <li key={`${group.title}-${link.to}-${link.label}`}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="footer-group">
            <p className="footer-group-title">Get started</p>
            <ul>
              <li>
                <Link to="/login">Log in</Link>
              </li>
              <li>
                <Link to="/login">Get early access</Link>
              </li>
            </ul>
          </div>
        </div>

        </div>

        <div className="footer-bottom">
          <span>© 2026 Wynback. All rights reserved.</span>
          <span>Win-back software for local businesses.</span>
        </div>
        </div>
      </footer>
    </div>
  )
}

export default App
