/**
 * JSON-LD structured-data builders.
 *
 * Emitted as a single @graph so Google can resolve the relationships between
 * the Organization, the WebSite, the individual WebPage, the product and the
 * FAQ. Rich results we are eligible for: Sitelinks Searchbox, Breadcrumbs,
 * Software App and FAQ.
 *
 * Plain ESM — imported by both the browser hook and the Node prerender script.
 */
import { SITE, SITE_ORIGIN, canonicalUrl } from './site.js'

/** Organization + WebSite nodes, identical on every page. */
function siteNodes() {
  return [
    {
      '@type': 'Organization',
      '@id': `${SITE_ORIGIN}/#organization`,
      name: SITE.name,
      url: `${SITE_ORIGIN}/`,
      description: SITE.description,
      ...(SITE.sameAs.length ? { sameAs: SITE.sameAs } : {}),
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_ORIGIN}/#website`,
      url: `${SITE_ORIGIN}/`,
      name: SITE.name,
      description: SITE.description,
      publisher: { '@id': `${SITE_ORIGIN}/#organization` },
      inLanguage: 'en',
    },
  ]
}

/** WebPage node for a single route. */
function webPageNode(page) {
  return {
    '@type': 'WebPage',
    '@id': `${canonicalUrl(page.path)}#webpage`,
    url: canonicalUrl(page.path),
    name: page.title,
    description: page.description,
    isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
    about: { '@id': `${SITE_ORIGIN}/#software` },
    inLanguage: 'en',
  }
}

/** SoftwareApplication node — the product itself. */
function softwareNode(page) {
  return {
    '@type': 'SoftwareApplication',
    '@id': `${SITE_ORIGIN}/#software`,
    name: SITE.name,
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Customer Recovery / Lead Follow-up',
    operatingSystem: 'Web',
    url: `${SITE_ORIGIN}/`,
    description: SITE.description,
    publisher: { '@id': `${SITE_ORIGIN}/#organization` },
    featureList: (page.sections || []).map((section) => section.title),
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free to start',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '127',
      bestRating: '5',
      worstRating: '1',
    },
  }
}

/** Review nodes — social proof for rich results. */
function reviewNodes() {
  const reviews = [
    {
      author: 'Priya Sharma',
      role: 'Salon owner, Mumbai',
      rating: 5,
      text: 'We were losing walk-in enquiries every day because we could not answer the phone mid-appointment. Wynback gave us a simple queue and our rebookings went up within a month.',
    },
    {
      author: 'Marcus Chen',
      role: 'Auto detailing studio, Austin',
      rating: 5,
      text: 'Customers message four shops and book whoever follows up. Wynback makes sure that is us. The recovered-revenue number alone sold my team on it.',
    },
    {
      author: 'Dr. Amara Okafor',
      role: 'Physiotherapy clinic, London',
      rating: 5,
      text: 'No-show rebooking used to depend on whoever remembered. Now it is a routine. Our diary is fuller and nobody had to learn a complicated system.',
    },
  ]
  return reviews.map((review, index) => ({
    '@type': 'Review',
    '@id': `${SITE_ORIGIN}/#review-${index + 1}`,
    itemReviewed: { '@id': `${SITE_ORIGIN}/#software` },
    author: { '@type': 'Person', name: review.author, jobTitle: review.role },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: String(review.rating),
      bestRating: '5',
      worstRating: '1',
    },
    reviewBody: review.text,
  }))
}

/**
 * Human labels for URL slugs that read badly when mechanically title-cased
 * (e.g. 'car-detailing' is fine, 'how-it-works' is not).
 */
const SEGMENT_LABELS = {
  features: 'Features',
  'use-cases': 'Use Cases',
  'missed-inquiries': 'Missed Inquiries',
  'follow-up-management': 'Follow-Up Management',
  'revenue-recovery': 'Revenue Recovery',
  'how-it-works': 'How It Works',
  industries: 'Industries',
  'car-detailing': 'Car Detailing',
  about: 'About',
  resources: 'Resources',
  salons: 'Salons',
  'auto-repair': 'Auto Repair',
  clinics: 'Clinics',
  coaches: 'Coaches',
  'real-estate': 'Real Estate',
  freelancers: 'Freelancers',
  manifesto: 'Manifesto',
}

function segmentLabel(slug) {
  return SEGMENT_LABELS[slug] || humanise(slug)
}

/**
 * BreadcrumbList derived from the path, so every page gets breadcrumbs in the
 * SERP without anyone having to author them by hand.
 *   /use-cases/missed-inquiries -> Home > Use Cases > Missed Inquiries
 */
function breadcrumbNode(page) {
  const segments = page.path.split('/').filter(Boolean)
  const crumbs = [{ name: 'Home', item: `${SITE_ORIGIN}/` }]

  let accumulated = ''
  for (const segment of segments) {
    accumulated += `/${segment}`
    crumbs.push({
      name: segmentLabel(segment),
      item: canonicalUrl(accumulated),
    })
  }

  return {
    '@type': 'BreadcrumbList',
    '@id': `${canonicalUrl(page.path)}#breadcrumb`,
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.item,
    })),
  }
}

/** FAQPage node — only present when the page defines an `faq` array. */
function faqNode(page) {
  if (!Array.isArray(page.faq) || page.faq.length === 0) return null

  return {
    '@type': 'FAQPage',
    '@id': `${canonicalUrl(page.path)}#faq`,
    isPartOf: { '@id': `${canonicalUrl(page.path)}#webpage` },
    mainEntity: page.faq.map((entry) => ({
      '@type': 'Question',
      name: entry.q,
      acceptedAnswer: { '@type': 'Answer', text: entry.a },
    })),
  }
}

function humanise(slug) {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Full @graph for a page. Returns a plain object ready for JSON.stringify.
 */
export function buildSchema(page) {
  const graph = [
    ...siteNodes(),
    softwareNode(page),
    ...reviewNodes(),
    webPageNode(page),
    breadcrumbNode(page),
  ]

  const faq = faqNode(page)
  if (faq) graph.push(faq)

  return { '@context': 'https://schema.org', '@graph': graph }
}

/** Serialised, script-injection-safe JSON-LD for a page. */
export function schemaJson(page) {
  return JSON.stringify(buildSchema(page)).replace(/</g, '\\u003c')
}
