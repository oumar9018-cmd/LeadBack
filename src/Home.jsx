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
  { value: '₹48K+', label: 'Recovered by early users' },
  { value: '70%', label: 'Win-back rate' },
  { value: '10s', label: 'To send a follow-up' },
  { value: '24/7', label: 'Inquiry capture, zero effort' },
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
            <a className="nav-login" href={url('/login')}>Log in</a>
            <a className="btn btn-primary btn-sm" href={url('/login')}>Get started</a>
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
                <a className="btn btn-primary" href={url('/login')}>
                  Get started <IconArrowRight width={16} height={16} />
                </a>
                <a className="btn btn-secondary" href={url('/how-it-works')}>
                  See how it works
                </a>
              </div>
              <p className="hero-note">Free during early access · No credit card required</p>
            </div>

            <div className="hero-visual" aria-label="Wynback dashboard preview">
              <div className="browser-frame">
                <div className="browser-bar">
                  <div className="browser-dots">
                    <i /><i /><i />
                  </div>
                  <span className="browser-url">wynback.com/app</span>
                </div>
                <div className="browser-body">
                  <div className="dash-top">
                    <div>
                      <span className="dash-eyebrow">Overview</span>
                      <strong className="dash-title">Good morning, Priya</strong>
                    </div>
                    <span className="dash-pill">Last 30 days</span>
                  </div>

                  <div className="dash-metrics">
                    <div className="dash-metric">
                      <span>Revenue recovered</span>
                      <strong>₹48,200</strong>
                      <small className="up">+23% this month</small>
                    </div>
                    <div className="dash-metric">
                      <span>Customers won back</span>
                      <strong>31</strong>
                      <small>from 44 inquiries</small>
                    </div>
                    <div className="dash-metric">
                      <span>Win-back rate</span>
                      <strong>70%</strong>
                      <small>Inquiry → customer</small>
                    </div>
                  </div>

                  <div className="dash-queue">
                    <div className="dash-queue-head">
                      <strong>Follow-up queue</strong>
                      <span className="dash-count">3 need you</span>
                    </div>
                    <div className="dash-row">
                      <span className="dash-avatar">RS</span>
                      <div className="dash-person">
                        <strong>Rohan Shah</strong>
                        <span>Missed call · 20 min ago</span>
                      </div>
                      <strong className="dash-value">₹3,500</strong>
                      <span className="dash-badge"><IconMic width={12} height={12} /> Voice note</span>
                    </div>
                    <div className="dash-row">
                      <span className="dash-avatar">PM</span>
                      <div className="dash-person">
                        <strong>Priya Mehta</strong>
                        <span>Hair coloring quote sent</span>
                      </div>
                      <strong className="dash-value">₹4,200</strong>
                      <span className="dash-badge"><IconMessage width={12} height={12} /> Replied</span>
                    </div>
                    <div className="dash-row">
                      <span className="dash-avatar">AK</span>
                      <div className="dash-person">
                        <strong>Amit Khanna</strong>
                        <span>Car service inquiry</span>
                      </div>
                      <strong className="dash-value">₹8,000</strong>
                      <span className="dash-badge"><IconPhoneMissed width={12} height={12} /> Follow up</span>
                    </div>
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

        {/* ---------------- TESTIMONIALS ---------------- */}
        <section className="section section-gray" id="testimonials">
          <div className="container">
            <Reveal>
              <div className="section-head">
                <span className="kicker">Customer stories</span>
                <h2>They stopped losing customers to silence</h2>
              </div>
            </Reveal>
            <div className="testimonials-grid">
              {testimonials.map((t, i) => (
                <Reveal key={t.name} delay={i * 0.08}>
                  <article className="testimonial-card">
                    <p className="testimonial-quote">“{t.quote}”</p>
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
            <p className="testimonials-note">Illustrative examples of how businesses could use Wynback — real customer stories coming soon.</p>
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
                <span className="kicker kicker-light">Early access</span>
                <h2>Give every missed customer a reason to come back</h2>
                <p>Join the waitlist and be first in when Wynback launches — with missed-call recovery, one-tap WhatsApp follow-ups, and voice-note win-backs.</p>
                <div className="cta-actions">
                  <a className="btn btn-white" href={url('/login')}>
                    Get early access <IconArrowRight width={16} height={16} />
                  </a>
                </div>
                <p className="cta-note">Free during early access · <IconShield width={14} height={14} /> Your data stays private</p>
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
                <li><Link to={url('/login')}>Log in</Link></li>
                <li><Link to={url('/login')}>Get early access</Link></li>
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
