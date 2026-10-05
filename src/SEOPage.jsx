import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import './SEOPage.css'

const carDetailingPage = {
  title: 'LeadBack for Car Detailing Businesses — Recover More Customers',
  description: 'LeadBack helps car detailing businesses track missed inquiries, organize follow-ups, and turn more customer conversations into booked services.',
  sections: [
    {
      title: 'Stop losing car detailing inquiries',
      text: 'Customers often contact detailing businesses through calls, messages, forms, and social channels. LeadBack gives your team one place to track those inquiries so promising customers do not disappear.'
    },
    {
      title: 'Follow up before the customer moves on',
      text: 'Organize follow-ups by customer, inquiry, and status so your team knows who needs attention and when.'
    },
    {
      title: 'Track recovered opportunities',
      text: 'See which inquiries came back, which follow-ups converted, and how much revenue was recovered from previously missed opportunities.'
    },
    {
      title: 'Built for growing detailing teams',
      text: 'LeadBack keeps the workflow simple for independent detailers, mobile detailing businesses, studios, and growing local service teams.'
    }
  ]
}

const pages = {
  features: {
    title: 'LeadBack Features — Recover Missed Customer Inquiries',
    description:
      'Explore LeadBack features for tracking missed inquiries, organizing follow-ups, and measuring recovered revenue.',
    eyebrow: 'LEADBACK FEATURES',
    heading: 'Everything you need to recover missed inquiries.',
    intro:
      'LeadBack gives growing businesses a simple system for capturing inquiries, organizing follow-ups, and understanding which conversations turn into revenue.',
    sections: [
      ['Catch missed inquiries', 'Keep customer inquiries visible so promising conversations do not disappear between calls, messages, and busy workdays.'],
      ['Organize follow-ups', 'Create a clear follow-up workflow so your team knows who needs attention and when.'],
      ['Track recovered revenue', 'Record recovered opportunities and see how much revenue came back through follow-up.'],
      ['Built for local teams', 'Keep the workflow practical and focused on the day-to-day needs of growing service businesses.'],
    ],
  },

  'how-it-works': {
    title: 'How LeadBack Works — Turn Missed Inquiries Into Customers',
    description:
      'See how LeadBack helps businesses capture missed inquiries, follow up consistently, and recover more customer opportunities.',
    eyebrow: 'HOW IT WORKS',
    heading: 'A simple workflow for missed customer opportunities.',
    intro:
      'LeadBack turns a common business problem into a repeatable workflow: identify the inquiry, follow up, and track the result.',
    sections: [
      ['1. Capture the inquiry', 'Add or record the customer inquiry so it becomes part of one organized workspace instead of getting lost.'],
      ['2. Follow up', 'Use the follow-up workflow to keep promising conversations moving at the right time.'],
      ['3. Track the outcome', 'Record whether the opportunity was recovered, lost, or still needs attention.'],
      ['4. Understand revenue', 'Use the revenue view to understand the value generated from recovered opportunities.'],
    ],
  },

  pricing: {
    title: 'LeadBack Pricing — Simple Plans for Growing Businesses',
    description:
      'See LeadBack pricing. Start with a 1-month free trial, then choose monthly or yearly billing for continued access.',
    eyebrow: 'PRICING',
    heading: 'Simple pricing. One clear purpose.',
    intro:
      'LeadBack is designed to make revenue recovery accessible to growing businesses without complicated pricing structures.',
    sections: [
      ['1-month free trial', 'Start with one month of LeadBack access before deciding whether it fits your business workflow.'],
      ['Monthly — ₹499', 'Continue with a flexible monthly plan after the trial period.'],
      ['Yearly — ₹4,990', 'Choose annual billing for a full year of LeadBack access.'],
      ['No unnecessary complexity', 'The product focuses on inquiries, follow-ups, customers, and recovered revenue in one workspace.'],
    ],
  },

  industries: {
    title: 'LeadBack Industries — Revenue Recovery for Local Businesses',
    description:
      'Discover how LeadBack can help auto services, home services, salons, fitness businesses, photographers, and other local businesses recover missed inquiries.',
    eyebrow: 'INDUSTRIES',
    heading: 'Built around real local-business workflows.',
    intro:
      'Different businesses receive inquiries in different ways, but the problem is often similar: interested customers can be missed when teams are busy.',
    sections: [
      ['Auto Services', 'Keep vehicle-service inquiries organized and follow up with customers who have shown interest.'],
      ['Home Services', 'Create a clearer process for following up with people requesting quotes, visits, or services.'],
      ['Salons & Spas', 'Keep appointment-related inquiries visible and easier to follow through.'],
      ['Fitness', 'Organize prospective-member inquiries and keep follow-ups from being forgotten.'],
      ['Photography', 'Track potential clients who asked about dates, packages, or availability.'],
      ['Local Businesses', 'Use one simple workflow for customer inquiries and follow-up opportunities.'],
    ],
  },

  'car-detailing': carDetailingPage,
  resources: {
    title: 'LeadBack Resources — Customer Inquiry & Follow-Up Guides',
    description:
      'Practical LeadBack resources about missed customer inquiries, follow-up workflows, and recovering more business opportunities.',
    eyebrow: 'RESOURCES',
    heading: 'Practical ideas for recovering more opportunities.',
    intro:
      'LeadBack resources will focus on useful, actionable information for businesses that want to improve inquiry handling and follow-up.',
    sections: [
      ['Why inquiries get missed', 'Understand common points where customer opportunities disappear during busy business days.'],
      ['Building a follow-up workflow', 'Create a repeatable process that helps teams know who to contact and when.'],
      ['Measuring recovered revenue', 'Connect follow-up activity with actual business outcomes instead of measuring activity alone.'],
      ['Local-business growth', 'Explore practical systems for turning existing customer interest into more completed business.'],
    ],
  },
}

export default function SEOPage({ type }) {
  const page = pages[type]

  useEffect(() => {
    if (!page) return

    document.title = page.title

    let description = document.querySelector('meta[name="description"]')

    if (!description) {
      description = document.createElement('meta')
      description.name = 'description'
      document.head.appendChild(description)
    }

    description.content = page.description

    return () => {
      document.title = 'LeadBack — Turn Missed Inquiries Into Customers'
    }
  }, [page])

  if (!page) return null

  return (
    <div className="seo-shell">
      <header className="seo-nav">
        <Link className="seo-brand" to="/">
          <span className="seo-brand-mark">L</span>
          <span>LeadBack</span>
        </Link>

        <nav>
          <Link to="/features">Features</Link>
          <Link to="/how-it-works">How it works</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/industries">Industries</Link>
        </nav>

        <Link className="seo-nav-cta" to="/">
          Start free
        </Link>
      </header>

      <main className="seo-main">
        <section className="seo-hero">
          <span className="seo-eyebrow">{page.eyebrow}</span>
          <h1>{page.heading}</h1>
          <p>{page.intro}</p>
        </section>

        <section className="seo-grid">
          {page.sections.map(([title, text]) => (
            <article className="seo-card" key={title}>
              <h2>{title}</h2>
              <p>{text}</p>
            </article>
          ))}
        </section>

        <section className="seo-cta">
          <span>LEADBACK</span>
          <h2>Turn missed inquiries into customers.</h2>
          <p>
            Start with a 1-month free trial and build a clearer follow-up
            workflow for your business.
          </p>
          <Link to="/" className="seo-cta-button">
            Start free 1-month trial →
          </Link>
        </section>
      </main>

      <footer className="seo-footer">
        <span>© LeadBack</span>
        <div>
          <Link to="/">Home</Link>
          <Link to="/features">Features</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/industries">Industries</Link>
        </div>
      </footer>
    </div>
  )
}
