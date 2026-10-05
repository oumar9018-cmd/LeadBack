import { useEffect } from 'react'
import { SITE, canonicalUrl, ogImageUrl } from './site.js'
import { schemaJson } from './schema.js'

/**
 * Imperative helpers for <head>.
 *
 * React 19 supports rendering <title>/<meta> as elements, but this app has a
 * router-less server (GitHub Pages serves static files) and we also bake meta
 * into prerendered HTML at build time. Managing <head> imperatively keeps the
 * runtime behaviour and the build-time output identical.
 */

function upsertMeta(attr, key, content) {
  if (!content) return

  let tag = document.head.querySelector(`meta[${attr}="${key}"]`)

  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, key)
    document.head.appendChild(tag)
  }

  tag.setAttribute('content', content)
}

const JSONLD_ID = 'leadback-jsonld'

/**
 * Apply a page's SEO metadata to the document head.
 *
 * Sets: <title>, description, keywords, robots, canonical, Open Graph,
 * Twitter card and a JSON-LD @graph. Everything is restored to the site
 * defaults on unmount so a client-side navigation back to Home is clean.
 *
 * @param {object} page - one entry from src/seo/pages.js
 */
export function useSEO(page) {
  useEffect(() => {
    if (!page) return undefined

    const canonical = canonicalUrl(page.path)
    const previousTitle = document.title

    document.title = page.title
    document.documentElement.setAttribute('lang', 'en')

    upsertMeta('name', 'description', page.description)
    upsertMeta('name', 'keywords', page.keywords)
    upsertMeta('name', 'robots', 'index, follow, max-image-preview:large')
    upsertMeta('name', 'author', SITE.name)

    upsertMeta('property', 'og:type', 'website')
    upsertMeta('property', 'og:site_name', SITE.name)
    upsertMeta('property', 'og:locale', SITE.locale)
    upsertMeta('property', 'og:title', page.title)
    upsertMeta('property', 'og:description', page.description)
    upsertMeta('property', 'og:url', canonical)
    upsertMeta('property', 'og:image', ogImageUrl())

    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:site', SITE.twitter)
    upsertMeta('name', 'twitter:title', page.title)
    upsertMeta('name', 'twitter:description', page.description)
    upsertMeta('name', 'twitter:image', ogImageUrl())

    let canonicalTag = document.head.querySelector('link[rel="canonical"]')
    if (!canonicalTag) {
      canonicalTag = document.createElement('link')
      canonicalTag.setAttribute('rel', 'canonical')
      document.head.appendChild(canonicalTag)
    }
    canonicalTag.setAttribute('href', canonical)

    let jsonld = document.getElementById(JSONLD_ID)
    if (!jsonld) {
      jsonld = document.createElement('script')
      jsonld.type = 'application/ld+json'
      jsonld.id = JSONLD_ID
      document.head.appendChild(jsonld)
    }
    jsonld.textContent = schemaJson(page)

    return () => {
      document.title = previousTitle
    }
  }, [page])
}

export default useSEO
