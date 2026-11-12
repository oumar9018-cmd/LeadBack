import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

/* ------------------------------------------------------------------ */
/* Boot-failure recovery (plain DOM — React may be what failed).      */
/*                                                                    */
/* index.html paints a branded splash inside #root and React          */
/* replaces it on mount. If the mount never happens — a render        */
/* crash before ErrorBoundary can catch it, a global error or an      */
/* unhandled rejection before first paint — the splash (white         */
/* background, small centred logo) would sit there forever and read   */
/* as a stuck white page. This watchdog swaps the splash for a        */
/* friendly "couldn't load — reload" panel in that case. Once the     */
/* splash is gone (React has painted), the watchdog disarms and       */
/* later errors are ErrorBoundary's job, exactly as before.           */
/*                                                                    */
/* Known limit: if the JS bundle itself never downloads/executes,     */
/* this file never runs either — that half of the watchdog would      */
/* have to live in an inline script in index.html (not changed here). */
/* ------------------------------------------------------------------ */

const BOOT_TIMEOUT_MS = 15000

let booted = false
let bootFailed = false
let bootTimer = 0
let bootPoll = 0

function splashStillShowing() {
  return Boolean(document.getElementById('backwon-splash'))
}

function showBootFailure() {
  if (booted || bootFailed) return
  bootFailed = true
  disarmBootWatchdog()
  const root = document.getElementById('root')
  if (!root) return
  root.innerHTML = ''
  const wrap = document.createElement('div')
  wrap.setAttribute('role', 'alert')
  wrap.style.cssText =
    'min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F8FAFC;font-family:Inter,system-ui,sans-serif;padding:24px;box-sizing:border-box;'
  const card = document.createElement('div')
  card.style.cssText = 'max-width:420px;text-align:center;'
  const mark = document.createElement('div')
  mark.textContent = 'B'
  mark.style.cssText =
    'width:56px;height:56px;margin:0 auto 16px;border-radius:16px;background:#2563EB;color:#fff;font-weight:700;font-size:28px;display:flex;align-items:center;justify-content:center;'
  const heading = document.createElement('h1')
  heading.textContent = "Couldn't load BackWon"
  heading.style.cssText = 'font-size:20px;color:#0f172a;margin:0 0 8px;'
  const copy = document.createElement('p')
  copy.textContent =
    'Something interrupted the app while it was starting. Your data is safe — reloading usually fixes it.'
  copy.style.cssText =
    'font-size:14px;line-height:1.55;color:#64748b;margin:0 0 20px;'
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = 'Reload BackWon'
  button.style.cssText =
    'background:#2563EB;color:#fff;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;cursor:pointer;'
  button.addEventListener('click', () => window.location.reload())
  card.append(mark, heading, copy, button)
  wrap.appendChild(card)
  root.appendChild(wrap)
}

function disarmBootWatchdog() {
  window.clearTimeout(bootTimer)
  window.clearInterval(bootPoll)
  window.removeEventListener('error', handleBootError)
  window.removeEventListener('unhandledrejection', handleBootError)
}

function handleBootError() {
  // Only pre-paint failures belong to the watchdog: if the splash is
  // still on screen the app never painted, so offer recovery instead
  // of leaving it stuck. Anything after first paint is ignored here.
  if (!booted && splashStillShowing()) showBootFailure()
}

window.addEventListener('error', handleBootError)
window.addEventListener('unhandledrejection', handleBootError)

// React has painted once the splash node is gone from #root.
bootPoll = window.setInterval(() => {
  if (!splashStillShowing()) {
    booted = true
    disarmBootWatchdog()
  }
}, 250)

// Mount deadline: bundle executed but the app never painted.
bootTimer = window.setTimeout(() => {
  if (!booted && splashStillShowing()) showBootFailure()
}, BOOT_TIMEOUT_MS)

try {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  )
} catch (error) {
  console.error('BackWon failed to start:', error)
  showBootFailure()
}
