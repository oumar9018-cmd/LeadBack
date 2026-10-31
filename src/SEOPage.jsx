import { createElement, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { NAV_LINKS, FOOTER_GROUPS, getSeoPage } from './seo/pages.js'
import { useSEO } from './seo/useSEO.js'
import { LogoMark } from './components/icons.jsx'
import './SEOPage.gold.css'

/**
 * Feather-style icon paths, kept as data so the manifest can reference an icon
 * by name without importing JSX (it is shared with the Node build script).
 */
const ICONS = {
  inbox: [
    ['path', { d: 'M22 12h-6l-2 3h-4l-2-3H2' }],
    ['path', { d: 'M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z' }],
  ],
  clock: [
    ['circle', { cx: 12, cy: 12, r: 10 }],
    ['path', { d: 'M12 6v6l4 2' }],
  ],
  trending: [
    ['path', { d: 'M23 6l-9.5 9.5-5-5L1 18' }],
    ['path', { d: 'M17 6h6v6' }],
  ],
  users: [
    ['path', { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }],
    ['circle', { cx: 9, cy: 7, r: 4 }],
    ['path', { d: 'M23 21v-2a4 4 0 0 0-3-3.87' }],
    ['path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' }],
  ],
  bell: [
    ['path', { d: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9' }],
    ['path', { d: 'M13.73 21a2 2 0 0 1-3.46 0' }],
  ],
  layers: [
    ['path', { d: 'M12 2 2 7l10 5 10-5-10-5z' }],
    ['path', { d: 'M2 17l10 5 10-5' }],
    ['path', { d: 'M2 12l10 5 10-5' }],
  ],
  zap: [['path', { d: 'M13 2 3 14h9l-1 8 10-12h-9l1-8z' }]],
  dollar: [
    ['path', { d: 'M12 1v22' }],
    ['path', { d: 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' }],
  ],
  check: [
    ['path', { d: 'M22 11.08V12a10 10 0 1 1-5.93-9.14' }],
    ['path', { d: 'M22 4 12 14.01l-3-3' }],
  ],
  shield: [['path', { d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' }]],
  phone: [
    ['path', { d: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z' }],
  ],
  message: [
    ['path', { d: 'M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z' }],
  ],
  heart: [
    ['path', { d: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' }],
  ],
  file: [
    ['path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }],
    ['path', { d: 'M14 2v6h6' }],
    ['path', { d: 'M16 13H8' }],
    ['path', { d: 'M16 17H8' }],
  ],
  calendar: [
    ['rect', { x: 3, y: 4, width: 18, height: 18, rx: 2 }],
    ['path', { d: 'M16 2v4' }],
    ['path', { d: 'M8 2v4' }],
    ['path', { d: 'M3 10h18' }],
  ],
  refresh: [
    ['path', { d: 'M23 4v6h-6' }],
    ['path', { d: 'M1 20v-6h6' }],
    ['path', { d: 'M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15' }],
  ],
  briefcase: [
    ['rect', { x: 2, y: 7, width: 20, height: 14, rx: 2 }],
    ['path', { d: 'M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16' }],
  ],
  grid: [
    ['rect', { x: 3, y: 3, width: 7, height: 7, rx: 1 }],
    ['rect', { x: 14, y: 3, width: 7, height: 7, rx: 1 }],
    ['rect', { x: 14, y: 14, width: 7, height: 7, rx: 1 }],
    ['rect', { x: 3, y: 14, width: 7, height: 7, rx: 1 }],
  ],
  search: [
    ['circle', { cx: 11, cy: 11, r: 8 }],
    ['path', { d: 'M21 21l-4.35-4.35' }],
  ],
  award: [
    ['circle', { cx: 12, cy: 8, r: 7 }],
    ['path', { d: 'M8.21 13.89 7 23l5-3 5 3-1.21-9.12' }],
  ],
  sparkles: [
    ['path', { d: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z' }],
  ],
  target: [
    ['circle', { cx: 12, cy: 12, r: 10 }],
    ['circle', { cx: 12, cy: 12, r: 6 }],
    ['circle', { cx: 12, cy: 12, r: 2 }],
  ],
}

/** Computed once at module load so the prerendered HTML and the client render agree. */
const CURRENT_YEAR = new Date().getFullYear()

/* ------------------------------------------------------------------ */
/* Industry identity — each vertical gets its own professional blue    */
/* accent paired with the light theme, plus a hero watermark icon.     */
/* ------------------------------------------------------------------ */

const INDUSTRY_ACCENTS = {
  salons: { accent: '#2563EB', glow: 'rgba(37,99,235,0.10)' }, // primary blue
  'auto-repair': { accent: '#1E40AF', glow: 'rgba(30,64,175,0.10)' }, // deep blue
  clinics: { accent: '#0284C7', glow: 'rgba(2,132,199,0.10)' }, // sky blue
  coaches: { accent: '#1D4ED8', glow: 'rgba(29,78,216,0.10)' }, // royal blue
  'real-estate': { accent: '#0369A1', glow: 'rgba(3,105,161,0.10)' }, // ocean blue
  freelancers: { accent: '#3B82F6', glow: 'rgba(59,130,246,0.10)' }, // bright blue
  'car-detailing': { accent: '#1E40AF', glow: 'rgba(30,64,175,0.10)' }, // deep blue
}

const DEFAULT_ACCENT = { accent: '#2563EB', glow: 'rgba(37,99,235,0.10)' }

const INDUSTRY_TYPES = new Set(Object.keys(INDUSTRY_ACCENTS))

const INDUSTRY_ICONS = {
  salons: 'sparkles',
  'auto-repair': 'briefcase',
  clinics: 'shield',
  coaches: 'target',
  'real-estate': 'layers',
  freelancers: 'zap',
  'car-detailing': 'refresh',
}


function Icon({ name, className }) {
  const shapes = ICONS[name] || ICONS.sparkles

  return (
    <svg
      className={className || 'seo-icon'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {shapes.map(([tag, props], index) =>
        createElement(tag, { key: index, ...props })
      )}
    </svg>
  )
}

/**
 * Scroll-reveal: elements with .reveal fade/rise into view once.
 * Runs only in the browser (effects never execute during the
 * build-time static render), so the prerendered markup stays identical.
 *
 * Re-runs when the page type changes: every SEO page renders the SAME
 * <SEOPage> component, so React keeps the instance across navigation
 * and a mount-only effect never observes the new page's sections —
 * they stayed opacity:0 forever (the blank-middle bug on SEO pages).
 */
function useReveal(type) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.seo-shell .reveal'))
    if (els.length === 0) return undefined
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'))
      return undefined
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -6% 0px' }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [type])
}

/* ------------------------------------------------------------------ */
/* Shared marketing header / footer used by every SEO landing page      */
/* ------------------------------------------------------------------ */

function SeoHeader() {
  return (
    <header className="seo-nav">
      <Link className="seo-brand" to="/" aria-label="Wynback home">
        <LogoMark width={34} height={34} className="seo-brand-logo" />
        <span>Wynback</span>
      </Link>

      <nav className="seo-nav-links" aria-label="Main navigation">
        {NAV_LINKS.map((link) => (
          <Link key={link.to} to={link.to}>
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="seo-nav-actions">
        <Link className="seo-nav-login" to="/login">
          Log in
        </Link>
        <Link className="seo-nav-cta" to="/login">
          Start free
        </Link>
      </div>
    </header>
  )
}

function SeoFooter() {
  return (
    <footer className="seo-footer">
      <div className="seo-footer-top">
        <div className="seo-footer-brand">
          <Link className="seo-brand" to="/">
            <LogoMark width={34} height={34} className="seo-brand-logo" />
            <span>Wynback</span>
          </Link>
          <p>Turn missed inquiries into customers.</p>
        </div>

        <div className="seo-footer-groups">
          {FOOTER_GROUPS.map((group) => (
            <div className="seo-footer-group" key={group.title}>
              <p className="seo-footer-title">{group.title}</p>
              <ul>
                {group.links.map((link) => (
                  <li key={`${group.title}-${link.to}-${link.label}`}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="seo-footer-bottom">
        <span>© {CURRENT_YEAR} Wynback. All rights reserved.</span>
        <span>Revenue recovery software.</span>
      </div>
    </footer>
  )
}

/* ------------------------------------------------------------------ */
/* Page sections                                                       */
/* ------------------------------------------------------------------ */

function Hero({ page, industry }) {
  const isManifesto = page.type === 'manifesto'
  const watermarkIcon = industry ? INDUSTRY_ICONS[page.type] : null

  return (
    <section className={`seo-hero${isManifesto ? ' seo-hero-manifesto' : ''}`}>
      {watermarkIcon && (
        <span className="seo-hero-watermark" aria-hidden="true">
          <Icon name={watermarkIcon} className="seo-hero-watermark-icon" />
        </span>
      )}
      <div className="seo-hero-glow" aria-hidden="true" />

      <span className="seo-eyebrow hero-anim" style={{ '--d': '60ms' }}>
        {page.eyebrow}
      </span>
      <h1 className="hero-anim" style={{ '--d': '160ms' }}>
        {page.heading}
      </h1>
      <p
        className={`seo-hero-intro${isManifesto ? ' seo-hero-intro-quote' : ''} hero-anim`}
        style={{ '--d': '260ms' }}
      >
        {page.intro}
      </p>

      <div className="seo-hero-actions hero-anim" style={{ '--d': '360ms' }}>
        <Link className="seo-button seo-button-primary" to="/login">
          Start free <span aria-hidden="true">→</span>
        </Link>
        <Link className="seo-button seo-button-ghost" to="/how-it-works">
          See how it works
        </Link>
      </div>

      {Array.isArray(page.stats) && page.stats.length > 0 && (
        <dl className="seo-stats hero-anim" style={{ '--d': '460ms' }}>
          {page.stats.map((stat) => (
            <div className="seo-stat" key={stat.label}>
              <dt>{stat.value}</dt>
              <dd>{stat.label}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}

function Steps({ page }) {
  if (!Array.isArray(page.steps) || page.steps.length === 0) return null

  return (
    <section className="seo-block">
      <div className="seo-block-heading reveal">
        <span className="seo-kicker">THE WORKFLOW</span>
        {/* The old hardcoded heading promised four steps; pages with a
            different step count (e.g. Integrations has three) set their
            own heading instead of showing a wrong count. */}
        <h2>{page.stepsHeading || 'Four steps, repeated daily.'}</h2>
      </div>

      <ol className="seo-steps">
        {page.steps.map((step, index) => (
          <li
            className="seo-step reveal"
            key={step.title}
            style={{ '--d': `${index * 90}ms` }}
          >
            <span className="seo-step-index">{String(index + 1).padStart(2, '0')}</span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Cards({ page }) {
  if (!Array.isArray(page.sections) || page.sections.length === 0) return null

  return (
    <section className="seo-block">
      <div className="seo-block-heading reveal">
        <span className="seo-kicker">WHAT YOU GET</span>
        <h2>Everything focused on the same outcome.</h2>
      </div>

      <div className="seo-card-grid">
        {page.sections.map((section, index) => (
          <article
            className="seo-card reveal"
            key={section.title}
            style={{ '--d': `${(index % 3) * 90}ms` }}
          >
            <span className="seo-card-icon">
              <Icon name={section.icon} />
            </span>
            <h3>{section.title}</h3>
            <p>{section.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

/**
 * Manifesto chapters: the belief statements rendered as a cinematic
 * editorial sequence — giant ghost numerals, oversized serif statements,
 * long dramatic pauses between chapters.
 */
function Chapters({ page }) {
  if (page.type !== 'manifesto') return null
  if (!Array.isArray(page.sections) || page.sections.length === 0) return null

  return (
    <section className="manifesto-chapters" aria-label="The beliefs">
      {page.sections.map((section, index) => (
        <article className="manifesto-chapter reveal" key={section.title}>
          <span className="manifesto-numeral" aria-hidden="true">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className="manifesto-chapter-body">
            <h2>{section.title}</h2>
            <p>{section.text}</p>
          </div>
        </article>
      ))}

      <blockquote className="manifesto-pullquote reveal">
        <p>
          “The customer already contacted you. Everything after that is just
          refusing to let silence win.”
        </p>
        <cite>— The Wynback creed</cite>
      </blockquote>
    </section>
  )
}

function Plans({ page }) {
  if (!Array.isArray(page.plans) || page.plans.length === 0) return null

  return (
    <section className="seo-block seo-block-soft">
      <div className="seo-block-heading reveal">
        <span className="seo-kicker">PLANS</span>
        <h2>Start free. Stay only if it pays for itself.</h2>
      </div>

      <div className="seo-plan-grid">
        {page.plans.map((plan, index) => (
          <article
            className={`seo-plan reveal${plan.featured ? ' seo-plan-featured' : ''}`}
            key={plan.name}
            style={{ '--d': `${index * 90}ms` }}
          >
            {plan.badge && <span className="seo-plan-badge">{plan.badge}</span>}
            <h3>{plan.name}</h3>

            <p className="seo-plan-price">
              <strong>{plan.price}</strong>
              <span>{plan.period}</span>
            </p>

            <p className="seo-plan-tagline">{plan.tagline}</p>

            <ul className="seo-plan-features">
              {plan.features.map((feature) => (
                <li key={feature}>
                  <span className="seo-plan-check" aria-hidden="true">
                    ✓
                  </span>
                  {feature}
                </li>
              ))}
            </ul>

            <Link
              className={`seo-button ${
                plan.featured ? 'seo-button-primary' : 'seo-button-ghost'
              } seo-plan-cta`}
              to="/login"
            >
              {plan.cta}
            </Link>
          </article>
        ))}
      </div>

      <p className="seo-plan-note">
        Every feature is free — no paid plans, no per-seat charges, no setup fees.
      </p>
    </section>
  )
}

function Showcase({ page }) {
  if (!page.showcase) return null

  return (
    <section className="seo-block">
      <div className="seo-block-heading reveal">
        <span className="seo-kicker">GO DEEPER</span>
        <h2>{page.showcase.title}</h2>
        <p className="seo-block-sub">{page.showcase.text}</p>
      </div>

      <div className="seo-showcase-grid">
        {page.showcase.items.map((item, index) => (
          <Link
            className="seo-showcase-card reveal"
            to={item.to}
            key={item.to}
            style={{ '--d': `${(index % 3) * 90}ms` }}
          >
            <h3>{item.title}</h3>
            <p>{item.text}</p>
            <span aria-hidden="true">→</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

function Faq({ page }) {
  if (!Array.isArray(page.faq) || page.faq.length === 0) return null

  return (
    <section className="seo-block seo-block-soft">
      <div className="seo-block-heading reveal">
        <span className="seo-kicker">FAQ</span>
        <h2>Questions people ask before starting.</h2>
      </div>

      <div className="seo-faq">
        {page.faq.map((entry, index) => (
          <details
            className="seo-faq-item reveal"
            key={entry.q}
            style={{ '--d': `${Math.min(index, 4) * 60}ms` }}
          >
            <summary>
              <span>{entry.q}</span>
              <span className="seo-faq-marker" aria-hidden="true">
                +
              </span>
            </summary>
            <p>{entry.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="seo-final-cta">
      <div className="seo-final-cta-panel reveal">
        <span className="seo-kicker">WYNBACK</span>
        <h2>Turn missed inquiries into customers.</h2>
        <p>
          Start free and build a clearer follow-up
          workflow for your business. Every feature is free — no paid plans, no gates.
        </p>
        <Link className="seo-button seo-button-primary" to="/login">
          Start free <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function SEOPage({ type }) {
  const page = getSeoPage(type)

  useSEO(page)
  useReveal(type)

  if (!page) return null

  const isIndustry = INDUSTRY_TYPES.has(type)
  const isManifesto = type === 'manifesto'
  const accent = INDUSTRY_ACCENTS[type] || DEFAULT_ACCENT

  return (
    <div
      className={`seo-shell${isIndustry ? ' seo-industry' : ''}${isManifesto ? ' seo-manifesto' : ''}`}
      style={{ '--accent': accent.accent, '--accent-glow': accent.glow }}
    >
      <SeoHeader />

      <main>
        <Hero page={page} industry={isIndustry} />

        {isManifesto ? (
          <>
            <Chapters page={page} />
            <Faq page={page} />
          </>
        ) : (
          <>
            <Steps page={page} />
            <Cards page={page} />
            
            <Plans page={page} />
            <Showcase page={page} />
            <Faq page={page} />
          </>
        )}

        <FinalCta />
      </main>

      <SeoFooter />
    </div>
  )
}
