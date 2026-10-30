import React, { useEffect, useRef, useState } from 'react'
import { NavLink, Link, Outlet } from 'react-router-dom'
import { url } from './basePath.js'
import { GraveyardPill } from './components/GraveyardCounter.jsx'
import {
  IconChartBar,
  IconMessage,
  IconClock,
  IconZap,
} from './components/icons.jsx'

/**
 * AppShell — shared topbar + drawer + bottom-tab-bar layout used by all
 * authenticated /app/* pages.
 *
 * Mobile-first (P0 rebuild): the hamburger lives INSIDE the sticky
 * topbar (never floating), the drawer is one component with body
 * scroll lock + focus trap + aria-expanded, and phones navigate via
 * a fixed bottom tab bar (Overview / Inquiries / Follow-ups / Blitz
 * + More opening the drawer). At >=900px the sidebar rail returns
 * and the tab bar + hamburger hide (see App.css MOBILE-FIRST SHELL).
 */
export default function AppLayout() {
  const [authUser, setAuthUser] = useState(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [businessName, setBusinessName] = useState('')
  const [profileName, setProfileName] = useState('')
  const drawerRef = useRef(null)
  const menuButtonRef = useRef(null)

  useEffect(() => {
    const auth = window.firebase?.auth?.()
    const db = window.firebase?.firestore?.()

    if (!auth) {
      setAuthUser(null)
      return
    }

    setAuthUser(auth.currentUser)

    const unsubscribe = auth.onAuthStateChanged(async user => {
      setAuthUser(user)

      if (!user) {
        setBusinessName('')
        setProfileName('')
        return
      }

      setProfileName(
        typeof user.displayName === 'string'
          ? user.displayName.trim()
          : ''
      )

      if (!db) return

      try {
        const snapshot = await db
          .collection('users')
          .doc(user.uid)
          .collection('settings')
          .doc('workspace')
          .get()

        const data = snapshot.exists ? snapshot.data() : {}
        const savedName = data?.businessName

        setBusinessName(
          typeof savedName === 'string'
            ? savedName.trim()
            : ''
        )
      } catch (error) {
        console.error('Workspace settings load failed:', error)
        setBusinessName('')
      }
    })

    return unsubscribe
  }, [])

  // Drawer: body scroll lock + focus trap + Escape to close.
  useEffect(() => {
    if (!sidebarOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const drawer = drawerRef.current
    const focusables = drawer
      ? drawer.querySelectorAll('a[href], button:not([disabled])')
      : []
    if (focusables.length > 0) focusables[0].focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setSidebarOpen(false)
        menuButtonRef.current?.focus()
        return
      }
      if (event.key !== 'Tab' || focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [sidebarOpen])

  async function handleSignOut() {
    try {
      await window.firebase?.auth?.()?.signOut()
    } catch (error) {
      console.error('Sign out failed:', error)
    }
    // Use replace to avoid going back to a protected page.
    window.location.replace(url('/login'))
  }

  function closeSidebar() {
    setSidebarOpen(false)
  }

  const displayName = businessName || 'My Workspace'
  const avatarLetter = (authUser?.displayName || authUser?.email || 'U')
    .charAt(0)
    .toUpperCase()

  return (
    <div className={`app-shell ${sidebarOpen ? 'sidebar-open' : ''}`}>
      {sidebarOpen && (
        <button
          type="button"
          className="mobile-sidebar-overlay"
          aria-label="Close navigation"
          onClick={closeSidebar}
        />
      )}

      <aside className="sidebar" ref={drawerRef} id="app-drawer" aria-label="Main navigation">
        <div className="sidebar-brand">
          <div className="brand-mark">W</div>
          <span>Wynback</span>
        </div>

        <div className="workspace">
          <span className="workspace-label">WORKSPACE</span>
          <strong>{displayName}</strong>
        </div>

        <nav className="side-nav">
          <NavLink to="/app" end onClick={closeSidebar}>Overview</NavLink>
          <NavLink to="/app/inquiries" onClick={closeSidebar}>Inquiries</NavLink>
          <NavLink to="/app/followups" onClick={closeSidebar}>Follow-ups</NavLink>
          <NavLink to="/app/blitz" onClick={closeSidebar}>Blitz Mode</NavLink>
          <NavLink to="/app/offers" onClick={closeSidebar}>Offers</NavLink>
          <NavLink to="/app/revenue" onClick={closeSidebar}>Revenue</NavLink>
          <NavLink to="/app/settings" onClick={closeSidebar}>Settings</NavLink>
          <NavLink to="/app/profile" onClick={closeSidebar}>Profile</NavLink>
        </nav>

        <div className="sidebar-bottom">
          <Link to="/" onClick={closeSidebar}>← Back to website</Link>
          <button type="button" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="app-main">
        <header className="app-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu-button"
              ref={menuButtonRef}
              aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={sidebarOpen}
              aria-controls="app-drawer"
              onClick={() => setSidebarOpen(value => !value)}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
            <span className="topbar-brand">
              <span className="brand-mark">W</span>
              Wynback
            </span>
          </div>

          <div className="topbar-right">
            <GraveyardPill />
            <button
              type="button"
              className="profile-button"
              aria-expanded={profileOpen}
              aria-haspopup="true"
              onClick={() => setProfileOpen(value => !value)}
            >
              {authUser?.photoURL ? (
                <img
                  src={authUser.photoURL}
                  alt={authUser.displayName || 'Profile'}
                  className="profile-avatar"
                />
              ) : (
                <span className="profile-avatar profile-avatar-fallback">
                  {avatarLetter}
                </span>
              )}

              <span className="profile-name">
                {authUser?.displayName || 'Account'}
              </span>

              <span className="profile-chevron">⌄</span>
            </button>

            {profileOpen && (
              <div className="profile-menu">
                <div className="profile-menu-user">
                  {authUser?.photoURL ? (
                    <img
                      src={authUser.photoURL}
                      alt=""
                      className="profile-menu-avatar"
                    />
                  ) : (
                    <span className="profile-menu-avatar profile-avatar-fallback">
                      {avatarLetter}
                    </span>
                  )}

                  <div>
                    <strong>{authUser?.displayName || 'Google account'}</strong>
                    <span>{authUser?.email || ''}</span>
                  </div>
                </div>

                <div className="profile-menu-divider" />

                <Link to="/app/settings" onClick={() => setProfileOpen(false)}>Settings</Link>

                <button type="button" onClick={handleSignOut}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Render the actual page (Dashboard, Inquiries, …) */}
        <Outlet />

        <footer className="app-footer">
          Wynback · Revenue recovery workspace
        </footer>
      </main>

      <nav className="bottom-tabbar" aria-label="Primary navigation">
        <NavLink to="/app" end>
          <IconChartBar />
          <span>Overview</span>
        </NavLink>
        <NavLink to="/app/inquiries">
          <IconMessage />
          <span>Inquiries</span>
        </NavLink>
        <NavLink to="/app/followups">
          <IconClock />
          <span>Follow-ups</span>
        </NavLink>
        <NavLink to="/app/blitz">
          <IconZap />
          <span>Blitz</span>
        </NavLink>
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="More pages"
        >
          <span className="tab-more-dots" aria-hidden="true">
            <i></i><i></i><i></i>
          </span>
          <span>More</span>
        </button>
      </nav>
    </div>
  )
}
