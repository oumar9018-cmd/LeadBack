import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import './Home.css'
import { url } from './basePath.js'
// Marketing navigation + Home's SEO metadata, shared with the dedicated
// landing pages so the whole site links to the same canonical URLs.
import { NAV_LINKS, FOOTER_GROUPS, getSeoPage } from './seo/pages.js'
import { useSEO } from './seo/useSEO.js'
import {
  LogoMark,
  IconRadar, IconClock, IconTrendUp,
  IconArrowRight, IconPhoneMissed,
  IconMessage, IconMic, IconShield,
} from './components/icons.jsx'

/** SEO metadata for the homepage (title, description, canonical, JSON-LD…). */
const HOME_SEO = getSeoPage('home')

/* Subtle scroll-triggered fade-in wrapper (opacity only, minimal movement) */
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

const features = [
  {
    icon: 'radar',
    title: 'Catch every missed inquiry',
    text: 'Missed calls, unread DMs, unanswered quotes — every inquiry lands in one clean queue instead of disappearing into the void.',
  },
  {
    icon: 'message',
    title: 'Follow up in one tap',
    text: 'Open WhatsApp with the right message already written. Timing is everything — Wynback makes sure you never miss the window.',
  },
  {
    icon: 'mic',
    title: 'Win back with a voice note',
    text: 'Send a personal 10-second voice note that no competitor can copy. Customers respond to a human voice, not a template.',
  },
  {
    icon: 'trend',
    title: 'See revenue come back',
    text: 'Know exactly which conversations turned into paying customers — and how much revenue your follow-ups recovered.',
  },
]

const steps = [
  {
    number: '1',
    title: 'Capture every inquiry',
    text: 'Log missed calls, messages and quotes in one place. Nothing falls through the cracks when you are busy serving customers.',
  },
  {
    number: '2',
    title: 'Follow up in one tap',
    text: 'Wynback nudges you at the right moment. One tap sends the perfect WhatsApp message — or a personal voice note.',
  },
  {
    number: '3',
    title: 'Watch revenue return',
    text: 'Every recovered customer is tracked against its value. You will see, in plain numbers, what the follow-up earned you.',
  },
]

const industries = [
  'Salons & Spas',
  'Auto Services',
  'Home Services',
  'Clinics',
  'Fitness Studios',
  'Photographers',
  'Coaching Centers',
  'Freelancers',
]

const stats = [
  { value: 'Free', label: 'Every feature free — no paid plan, ever' },
  { value: '10s', label: 'To send a follow-up' },
  { value: '24/7', label: 'Inquiry capture, zero effort' },
  { value: '1 tap', label: 'WhatsApp message or voice note' },
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
    a: 'Yes. Your inquiries live in your private workspace, under your control — delete any inquiry permanently, anytime. We never sell data and never show ads.',
  },
  {
    q: 'How much does Wynback cost?',
    a: 'Wynback is completely free — every feature included, no paid plans, no feature gates, no credit card. Tools like this usually charge for automations, reminders and analytics; we would rather earn your trust first.',
  },
  {
    q: 'Which businesses is Wynback for?',
    a: 'Any local business where one customer is worth real money: salons, spas, auto repair, clinics, coaching centers, photographers, home services, fitness studios.',
  },
]

function App() {
  // Apply this page's <title>, meta description, canonical and JSON-LD.
  useSEO(HOME_SEO)

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
    <div className="home-page">
      <header className="nav">
        <div className="nav-inner">
          <Link className="nav-brand" to={url('/')} aria-label="Wynback home">
            <LogoMark width={30} height={30} className="nav-logo" />
            <span>Wynback</span>
          </Link>

          {/*
            Real router links to the dedicated landing pages (not #anchors) so
            crawlers can discover and pass link equity to the SEO pages.
          */}
          <nav className="nav-links" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <Link key={link.to} to={link.to}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="nav-actions">
            <Link className="nav-login" to="/login">Log in</Link>
            <Link className="btn btn-primary btn-sm" to="/login">Get started</Link>
          </div>
        </div>
      </header>

      <main>
        {/* ---------------- HERO ---------------- */}
        <section className="hero">
          <div className="container hero-layout">
            <div className="hero-copy">
              <h1>Win back every customer you almost lost</h1>
              <p className="hero-sub">
                Wynback catches every missed call and cold inquiry, then helps you
                win them back in one tap — a WhatsApp message or a personal voice
                note. Nothing slips away.
              </p>
              <div className="hero-actions">
                <Link className="btn btn-primary" to="/login">
                  Get started <IconArrowRight width={16} height={16} />
                </Link>
                <Link className="btn btn-secondary" to="/how-it-works">
                  See how it works
                </Link>
              </div>
              <p className="hero-note">Free forever · Every feature included · No credit card required</p>
            </div>

            <div className="hero-visual" aria-label="How Wynback works">
              <div className="browser-frame">
                <div className="browser-bar">
                  <div className="browser-dots">
                    <i /><i /><i />
                  </div>
                  <span className="browser-url">oumar9018-cmd.github.io/LeadBack/app</span>
                </div>
                <div className="browser-body flow-body">
                  <div className="dash-top">
                    <div>
                      <span className="dash-eyebrow">How it works</span>
                      <strong className="dash-title">Never lose an inquiry again</strong>
                    </div>
                    <span className="dash-pill">Free forever</span>
                  </div>

                  <div className="flow-steps">
                    <div className="flow-step">
                      <span className="flow-icon"><IconPhoneMissed width={16} height={16} /></span>
                      <div className="flow-text">
                        <strong>A customer reaches out</strong>
                        <span>Missed call, DM or quote — it lands in one queue</span>
                      </div>
                    </div>
                    <div className="flow-step">
                      <span className="flow-icon"><IconMessage width={16} height={16} /></span>
                      <div className="flow-text">
                        <strong>You follow up in one tap</strong>
                        <span>A WhatsApp message, already written for you</span>
                      </div>
                    </div>
                    <div className="flow-step">
                      <span className="flow-icon"><IconMic width={16} height={16} /></span>
                      <div className="flow-text">
                        <strong>Or send a personal voice note</strong>
                        <span>The human touch no template can copy</span>
                      </div>
                    </div>
                  </div>

                  <div className="flow-chips">
                    <span>Win-Back Score</span>
                    <span>Blitz Mode</span>
                    <span>Second-Chance Offers</span>
                    <span>Revenue Forecast</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- TRUSTED-BY STRIP ---------------- */}
        <section className="trusted">
          <div className="container">
            <p className="trusted-label">Built for businesses that never let a customer slip away</p>
            <div className="trusted-list">
              {industries.map((industry) => (
                <span key={industry} className="trusted-item">{industry}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- STATS ---------------- */}
        <section className="stats">
          <div className="container stats-grid">
            {stats.map((stat) => (
              <Reveal key={stat.label} className="stat">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------------- FEATURES ---------------- */}
        <section className="section section-gray" id="features">
          <div className="container">
            <Reveal>
              <div className="section-head">
                <span className="kicker">Features</span>
                <h2>Everything you need to win them back</h2>
                <p>One simple workspace for the follow-up — the part of the sale most businesses leave to chance.</p>
              </div>
            </Reveal>
            <div className="features-grid">
              {features.map((feature, i) => (
                <Reveal key={feature.title} delay={i * 0.08}>
                  <article className="feature-card">
                    <div className="feature-icon">
                      {feature.icon === 'radar' && <IconRadar width={24} height={24} />}
                      {feature.icon === 'message' && <IconMessage width={24} height={24} />}
                      {feature.icon === 'mic' && <IconMic width={24} height={24} />}
                      {feature.icon === 'trend' && <IconTrendUp width={24} height={24} />}
                    </div>
                    <h3>{feature.title}</h3>
                    <p>{feature.text}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- HOW IT WORKS ---------------- */}
        <section className="section" id="how-it-works">
          <div className="container">
            <Reveal>
              <div className="section-head">
                <span className="kicker">How it works</span>
                <h2>Three steps. Ten seconds each.</h2>
                <p>Wynback turns every forgotten inquiry into a second chance — without the CRM headache.</p>
              </div>
            </Reveal>
            <div className="steps-grid">
              {steps.map((step, i) => (
                <Reveal key={step.number} delay={i * 0.08}>
                  <article className="step-card">
                    <span className="step-number">{step.number}</span>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- FAQ ---------------- */}
        <section className="section" id="faq">
          <div className="container container-narrow">
            <Reveal>
              <div className="section-head">
                <span className="kicker">FAQ</span>
                <h2>Questions, answered</h2>
              </div>
            </Reveal>
            <div className="faq-list">
              {faqs.map((faq, i) => (
                <details className="faq-item" key={i} open={i === 0}>
                  <summary>{faq.q}</summary>
                  <p>{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- FINAL CTA ---------------- */}
        <section className="section" id="early-access">
          <div className="container">
            <Reveal>
              <div className="cta-panel">
                <span className="kicker kicker-light">Get started</span>
                <h2>Give every missed customer a reason to come back</h2>
                <p>Start free today — every feature included: missed-inquiry recovery, one-tap WhatsApp follow-ups, and voice-note win-backs.</p>
                <div className="cta-actions">
                  <Link className="btn btn-white" to="/login">
                    Start free <IconArrowRight width={16} height={16} />
                  </Link>
                </div>
                <p className="cta-note">Free forever · <IconShield width={14} height={14} /> Your data stays private</p>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ---------------- FOOTER ---------------- */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <Link className="nav-brand" to={url('/')}>
                <LogoMark width={26} height={26} className="nav-logo" />
                <span>Wynback</span>
              </Link>
              <p>Win back every customer you almost lost.</p>
              <p className="footer-cred"><IconClock width={14} height={14} /> Built for follow-ups that actually happen.</p>
            </div>

            {FOOTER_GROUPS.map((group) => (
              <div className="footer-group" key={group.title}>
                <p className="footer-title">{group.title}</p>
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
              <p className="footer-title">Get started</p>
              <ul>
                <li><Link to="/login">Log in</Link></li>
                <li><Link to="/login">Start free</Link></li>
              </ul>
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
