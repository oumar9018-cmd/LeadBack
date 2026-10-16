/**
 * Base path the app is deployed under.
 *
 * Derived from Vite's BASE_URL (set by `base` in vite.config.js) so this file
 * and the router basename can never drift apart:
 *   base: '/LeadBack/'  ->  BASE_PATH '/LeadBack', ROUTER_BASENAME '/LeadBack'
 *   base: '/'           ->  BASE_PATH '',           ROUTER_BASENAME '/'
 */
const trailingSlashStripped = import.meta.env.BASE_URL.replace(/\/+$/, '')

/** '' for a root deploy, '/LeadBack' for the GitHub Pages project site. */
export const BASE_PATH = trailingSlashStripped

/** Value for <BrowserRouter basename={...}>. */
export const ROUTER_BASENAME = trailingSlashStripped || '/'

/**
 * Prefix an app path for full-page (non-router) navigations such as
 * window.location.href = url('/login'). React Router <Link>/<Navigate>
 * already apply the basename, so they must NOT use this.
 */
export function url(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${BASE_PATH}${normalized}`
}
