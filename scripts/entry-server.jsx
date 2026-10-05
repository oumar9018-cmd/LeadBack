/**
 * Server-rendering entry used only by scripts/prerender-seo.mjs.
 *
 * It is loaded through Vite's SSR pipeline (never by the browser), which is
 * what lets this file import .jsx and .css modules while running in Node.
 *
 * We use renderToStaticMarkup (not renderToString) because the client boots
 * with createRoot, not hydrateRoot — so no hydration markers are wanted.
 * React replaces this markup with the identical client render on mount.
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import SEOPage from '../src/SEOPage.jsx'
import Home from '../src/Home.jsx'
import { BASE_PATH, ROUTER_BASENAME } from '../src/basePath.js'

/** Router basename, e.g. '/LeadBack' on the GitHub Pages project site. */
export const basename = ROUTER_BASENAME

/**
 * Render one marketing page to a static HTML string.
 *
 * @param {{ path: string, type: string }} page - entry from src/seo/pages.js
 * @returns {string} markup for the inside of <div id="root">
 */
export function renderRoute(page) {
  // StaticRouter needs the *full* pathname (base included) so that <Link>
  // emits hrefs with the deployment base, e.g. '/LeadBack/features'.
  const location =
    page.path === '/'
      ? `${BASE_PATH}/`
      : `${BASE_PATH}${page.path}`

  const element =
    page.path === '/' ? <Home /> : <SEOPage type={page.type} />

  return renderToStaticMarkup(
    <StaticRouter location={location} basename={basename}>
      {element}
    </StaticRouter>
  )
}
