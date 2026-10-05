/**
 * Build-time SEO prerenderer.
 *
 * Why this exists
 * ---------------
 * LeadBack is a Vite SPA deployed on GitHub Pages. Without this step every URL
 * (/features, /pricing, …) is served the *same* index.html, so crawlers and
 * social scrapers — which do not always run JavaScript — see the homepage's
 * <title>, description and canonical on every page. That is close to the worst
 * possible setup for ranking.
 *
 * What it does
 * ------------
 *   1. Server-renders each page in src/seo/pages.js to static HTML.
 *   2. Bakes that markup into <div id="root"> of a copy of index.html.
 *   3. Rewrites <title>, description, keywords, canonical, Open Graph,
 *      Twitter card and JSON-LD for that specific route.
 *   4. Writes dist/<route>/index.html so GitHub Pages serves a real file.
 *   5. Regenerates sitemap.xml and robots.txt from the manifest.
 *
 * Run via `npm run build` (vite build && node scripts/prerender-seo.mjs).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { SEO_PAGES } from '../src/seo/pages.js'
import { SITE, SITE_ORIGIN, canonicalUrl, ogImageUrl } from '../src/seo/site.js'
import { schemaJson } from '../src/seo/schema.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')

/* ---------------------------- helpers ---------------------------- */

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Escape for use inside an HTML attribute. */
function attr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Escape for use as HTML text content. */
function text(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function setTitle(html, title) {
  return html.replace(
    /<title>[\s\S]*?<\/title>/i,
    () => `<title>${text(title)}</title>`
  )
}

/** Replace <meta attr="key" ...> if present, otherwise append before </head>. */
function upsertMeta(html, attribute, key, content) {
  const pattern = new RegExp(
    `<meta\\s+${attribute}="${escapeRegExp(key)}"[^>]*>`,
    'i'
  )
  const replacement = `<meta ${attribute}="${key}" content="${attr(content)}" />`

  if (pattern.test(html)) {
    return html.replace(pattern, () => replacement)
  }
  return html.replace('</head>', () => `    ${replacement}\n  </head>`)
}

function upsertCanonical(html, href) {
  const pattern = /<link\s+rel="canonical"[^>]*>/i
  const replacement = `<link rel="canonical" href="${attr(href)}" />`

  if (pattern.test(html)) {
    return html.replace(pattern, () => replacement)
  }
  return html.replace('</head>', () => `    ${replacement}\n  </head>`)
}

function setJsonLd(html, json) {
  const pattern =
    /(<script\s+type="application\/ld\+json">)([\s\S]*?)(<\/script>)/i

  if (pattern.test(html)) {
    return html.replace(pattern, (_match, open, _old, close) => open + json + close)
  }
  return html.replace(
    '</head>',
    () =>
      `    <script type="application/ld+json">${json}</script>\n  </head>`
  )
}

function setRoot(html, body) {
  const pattern = /<div\s+id="root"><\/div>/i

  if (pattern.test(html)) {
    return html.replace(pattern, () => `<div id="root">${body}</div>`)
  }
  // Fall back to injecting just before </body> if the root div changes shape.
  return html.replace(
    '</body>',
    () => `<div id="root">${body}</div>\n  </body>`
  )
}

/* --------------------------- rendering --------------------------- */

function renderHead(html, page) {
  const canonical = canonicalUrl(page.path)

  let out = setTitle(html, page.title)

  out = upsertMeta(out, 'name', 'description', page.description)
  if (page.keywords) {
    out = upsertMeta(out, 'name', 'keywords', page.keywords)
  }
  out = upsertMeta(out, 'name', 'robots', 'index, follow, max-image-preview:large')
  out = upsertMeta(out, 'name', 'author', SITE.name)

  out = upsertMeta(out, 'property', 'og:type', 'website')
  out = upsertMeta(out, 'property', 'og:site_name', SITE.name)
  out = upsertMeta(out, 'property', 'og:locale', SITE.locale)
  out = upsertMeta(out, 'property', 'og:title', page.title)
  out = upsertMeta(out, 'property', 'og:description', page.description)
  out = upsertMeta(out, 'property', 'og:url', canonical)
  out = upsertMeta(out, 'property', 'og:image', ogImageUrl())

  out = upsertMeta(out, 'name', 'twitter:card', 'summary_large_image')
  out = upsertMeta(out, 'name', 'twitter:site', SITE.twitter)
  out = upsertMeta(out, 'name', 'twitter:title', page.title)
  out = upsertMeta(out, 'name', 'twitter:description', page.description)
  out = upsertMeta(out, 'name', 'twitter:image', ogImageUrl())

  out = upsertCanonical(out, canonical)
  out = setJsonLd(out, schemaJson(page))

  return out
}

/* ------------------------- sitemap/robots ------------------------ */

function buildSitemap() {
  const lastmod = new Date().toISOString().slice(0, 10)

  const urls = SEO_PAGES.map((page) => {
    const depth = page.path.split('/').filter(Boolean).length
    const priority = depth === 0 ? '1.0' : depth === 1 ? '0.9' : '0.8'

    return [
      '  <url>',
      `    <loc>${canonicalUrl(page.path)}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      '    <changefreq>weekly</changefreq>',
      `    <priority>${priority}</priority>`,
      '  </url>',
    ].join('\n')
  }).join('\n\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

${urls}

</urlset>
`
}

function buildRobots() {
  return `User-agent: *
Allow: /

# Private / app surfaces — no value in the index, and they need auth anyway.
Disallow: /app
Disallow: /app/
Disallow: /ceo
Disallow: /trial
Disallow: /login

Sitemap: ${SITE_ORIGIN}/sitemap.xml
`
}

/* ------------------------------ main ----------------------------- */

async function main() {
  const templatePath = path.join(DIST, 'index.html')

  if (!fs.existsSync(templatePath)) {
    throw new Error(
      'dist/index.html not found — run `vite build` before prerendering.'
    )
  }

  const template = fs.readFileSync(templatePath, 'utf8')

  // Vite dev server in middleware mode: gives us the JSX/CSS transform
  // pipeline so Node can import React components directly.
  const vite = await createServer({
    root: ROOT,
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'warn',
  })

  try {
    const { renderRoute } = await vite.ssrLoadModule(
      '/scripts/entry-server.jsx'
    )

    for (const page of SEO_PAGES) {
      let html = renderHead(template, page)
      html = setRoot(html, renderRoute(page))

      const outFile =
        page.path === '/'
          ? templatePath
          : path.join(DIST, page.path, 'index.html')

      fs.mkdirSync(path.dirname(outFile), { recursive: true })
      fs.writeFileSync(outFile, html, 'utf8')

      const relative = path.relative(ROOT, outFile)
      const bytes = Buffer.byteLength(html, 'utf8')
      console.log(
        `  ✓ ${page.path.padEnd(34)} → ${relative} (${(bytes / 1024).toFixed(1)} kB)`
      )
    }

    fs.writeFileSync(path.join(DIST, 'sitemap.xml'), buildSitemap(), 'utf8')
    fs.writeFileSync(path.join(DIST, 'robots.txt'), buildRobots(), 'utf8')

    console.log(`\n  ✓ sitemap.xml + robots.txt written for ${SEO_PAGES.length} URLs`)
  } finally {
    await vite.close()
  }
}

main().catch((error) => {
  console.error('\n  ✗ SEO prerender failed:\n')
  console.error(error)
  process.exit(1)
})
