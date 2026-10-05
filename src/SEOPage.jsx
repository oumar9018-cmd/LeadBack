import { createElement } from 'react'
import { Link } from 'react-router-dom'
import { NAV_LINKS, FOOTER_GROUPS, getSeoPage } from './seo/pages.js'
import { useSEO } from './seo/useSEO.js'
import './SEOPage.css'

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

function Icon({ name }) {
  const shapes = ICONS[name] || ICONS.sparkles

  return (
    <svg
      className="seo-icon"
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

/* ------------------------------------------------------------------ */
/* Shared marketing header / footer used by every SEO landing page      */
/* ------------------------------------------------------------------ */

function SeoHeader() {
  return (
    <header className="seo-nav">
      <Link className="seo-brand" to="/" aria-label="LeadBack home">
        <span className="seo-brand-mark">L</span>
        <span>LeadBack</span>
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
            <span className="seo-brand-mark">L</span>
            <span>LeadBack</span>
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
        <span>© {CURRENT_YEAR} LeadBack. All rights reserved.</span>
        <span>Revenue recovery software.</span>
      </div>
    </footer>
  )
}

/* ------------------------------------------------------------------ */
/* Page sections                                                       */
/* ------------------------------------------------------------------ */

function Hero({ page }) {
  return (
    <section className="seo-hero">
      <span className="seo-eyebrow">{page.eyebrow}</span>
      <h1>{page.heading}</h1>
      <p className="seo-hero-intro">{page.intro}</p>

      <div className="seo-hero-actions">
        <Link className="seo-button seo-button-primary" to="/login">
          Start free 1-month trial <span aria-hidden="true">→</span>
        </Link>
        <Link className="seo-button seo-button-ghost" to="/how-it-works">
          See how it works
        </Link>
      </div>

      {Array.isArray(page.stats) && page.stats.length > 0 && (
        <dl className="seo-stats">
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
      <div className="seo-block-heading">
        <span className="seo-kicker">THE WORKFLOW</span>
        <h2>Four steps, repeated daily.</h2>
      </div>

      <ol className="seo-steps">
        {page.steps.map((step, index) => (
          <li className="seo-step" key={step.title}>
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
      <div className="seo-block-heading">
        <span className="seo-kicker">WHAT YOU GET</span>
        <h2>Everything focused on the same outcome.</h2>
      </div>

      <div className="seo-card-grid">
        {page.sections.map((section) => (
          <article className="seo-card" key={section.title}>
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

function Plans({ page }) {
  if (!Array.isArray(page.plans) || page.plans.length === 0) return null

  return (
    <section className="seo-block seo-block-soft">
      <div className="seo-block-heading">
        <span className="seo-kicker">PLANS</span>
        <h2>Start free. Stay only if it pays for itself.</h2>
      </div>

      <div className="seo-plan-grid">
        {page.plans.map((plan) => (
          <article
            className={`seo-plan ${plan.featured ? 'seo-plan-featured' : ''}`}
            key={plan.name}
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
        All prices in INR. No setup fees, no per-seat charges, cancel anytime.
      </p>
    </section>
  )
}

function Showcase({ page }) {
  if (!page.showcase) return null

  return (
    <section className="seo-block">
      <div className="seo-block-heading">
        <span className="seo-kicker">GO DEEPER</span>
        <h2>{page.showcase.title}</h2>
        <p className="seo-block-sub">{page.showcase.text}</p>
      </div>

      <div className="seo-showcase-grid">
        {page.showcase.items.map((item) => (
          <Link className="seo-showcase-card" to={item.to} key={item.to}>
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
      <div className="seo-block-heading">
        <span className="seo-kicker">FAQ</span>
        <h2>Questions people ask before starting.</h2>
      </div>

      <div className="seo-faq">
        {page.faq.map((entry) => (
          <details className="seo-faq-item" key={entry.q}>
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

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function SEOPage({ type }) {
  const page = getSeoPage(type)

  useSEO(page)

  if (!page) return null

  return (
    <div className="seo-shell">
      <SeoHeader />

      <main>
        <Hero page={page} />
        <Steps page={page} />
        <Plans page={page} />
        <Cards page={page} />
        <Showcase page={page} />
        <Faq page={page} />

        <section className="seo-final-cta">
          <span className="seo-kicker">LEADBACK</span>
          <h2>Turn missed inquiries into customers.</h2>
          <p>
            Start with a 1-month free trial and build a clearer follow-up
            workflow for your business. No credit card required.
          </p>
          <Link className="seo-button seo-button-primary" to="/login">
            Start free 1-month trial <span aria-hidden="true">→</span>
          </Link>
        </section>
      </main>

      <SeoFooter />
    </div>
  )
}
