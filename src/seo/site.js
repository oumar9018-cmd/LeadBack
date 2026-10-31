/**
 * Site-wide SEO constants.
 *
 * Plain ESM, no browser APIs and no JSX, so this module can be imported by
 * BOTH the React app (via src/seo/useSEO.js) and the Node build script
 * (scripts/prerender-seo.mjs). Keeping one source of truth means the
 * prerendered static HTML and the client-rendered meta can never drift apart.
 */

/** Canonical origin — MUST match the real deployment URL or Google ignores every canonical. */
export const SITE_ORIGIN = 'https://oumar9018-cmd.github.io/LeadBack'

export const SITE = {
  name: 'Wynback',
  tagline: 'Win back every customer you almost lost.',

  /** Fallback title/description (also the defaults baked into index.html). */
  title: 'Wynback — Win Back Every Customer You Almost Lost',
  description:
    'Wynback helps local businesses win back missed calls and cold inquiries with one-tap WhatsApp follow-ups, personal voice notes, and structured follow-up sequences.',

  /** Absolute path (from the site root) of the social share image. */
  ogImage: '/og-image.png',

  /** Open Graph locale. (No social handle is claimed — none is verified.) */
  locale: 'en_US',

  /** Structured data shared by every page. */
  sameAs: [],
}

/**
 * Absolute canonical URL for an app path, e.g. '/features'.
 * The homepage keeps its trailing slash so '/' and '' are not two URLs.
 */
export function canonicalUrl(path) {
  return `${SITE_ORIGIN}${path}`
}

/** Absolute URL for the social share image. */
export function ogImageUrl() {
  return `${SITE_ORIGIN}${SITE.ogImage}`
}
