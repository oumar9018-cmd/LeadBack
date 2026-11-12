import React from 'react'
import { LogoMark } from './icons.jsx'
import './AppLoading.css'

/**
 * AppLoading — the ONE branded loading state for the authenticated
 * shell (/app/*).
 *
 * Why this exists: AppLayout used to render <Outlet/> the moment
 * RequireAuth passed, while WorkspaceProvider was still resolving
 * (an async Firestore round-trip). Every page therefore mounted with
 * workspace=null and rendered its pre-data state — empty lists, zero
 * stats, blank forms, and on /app/inquiry a literally empty fragment
 * — on the near-white --app-bg background. That empty in-between
 * render is the "white page" the founder reported.
 *
 * AppLayout now renders this component INSTEAD of <Outlet/> until
 * the workspace resolves (and as a recovery panel when resolution
 * finished with no workspace), so the shell always shows the brand,
 * a spinner and a skeleton instead of blank space. Pages keep their
 * own in-list loading rows for their per-page fetches afterwards.
 *
 * Props:
 * - title / message: copy for the state.
 * - showSpinner: false for the failure variant (nothing is loading).
 * - onReload: when provided, renders a Reload button (failure state).
 */
export default function AppLoading({
  title = 'Loading your workspace…',
  message = 'Just a moment — pulling in your latest inquiries.',
  showSpinner = true,
  onReload = null,
}) {
  return (
    <div className="app-loading" role="status" aria-live="polite">
      <div className="app-loading-inner">
        <LogoMark width={44} height={44} className="app-loading-logo" />
        {showSpinner && <div className="app-loading-spinner" aria-hidden="true" />}
        <h2 className="app-loading-title">{title}</h2>
        {message && <p className="app-loading-message">{message}</p>}
        {onReload && (
          <div className="app-loading-action">
            <button type="button" className="app-loading-reload" onClick={onReload}>
              Reload BackWon
            </button>
          </div>
        )}
        {showSpinner && (
          <div className="app-loading-skeleton" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        )}
      </div>
    </div>
  )
}
