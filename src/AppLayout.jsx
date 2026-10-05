import React, { useEffect, useState } from 'react'
import { NavLink, Link, Outlet } from 'react-router-dom'
import { url } from './basePath.js'

/**
 * AppShell — shared sidebar + top-bar layout used by all authenticated /app/* pages.
 *
 * Fixes the bug where navigating to sub-pages (inquiries, billing, etc.)
 * hid the sidebar because each page rendered its own full-screen container.
 * Now every /app route is rendered inside <Outlet /> while the sidebar
 * stays mounted, enabling client-side navigation via NavLink.
 */
export default function AppLayout() {
  const [authUser, setAuthUser] = useState(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [businessName, setBusinessName] = useState('')
  const [profileName, setProfileName] = useState('')

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

  const displayName = businessName || 'AutoDetail Pro'

  return (
    <div className={`app-shell ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <button
        type="button"
        className="mobile-menu-button"
        aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
        onClick={() => setSidebarOpen(value => !value)}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {sidebarOpen && (
        <button
          type="button"
          className="mobile-sidebar-overlay"
          aria-label="Close navigation"
          onClick={closeSidebar}
        />
      )}

      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">L</div>
          <span>LeadBack</span>
        </div>

        <div className="workspace">
          <span className="workspace-label">WORKSPACE</span>
          <strong>{displayName}</strong>
        </div>

        <nav className="side-nav">
          <NavLink to="/app" end onClick={closeSidebar}>Overview</NavLink>
          <NavLink to="/app/inquiries" onClick={closeSidebar}>Inquiries</NavLink>
          <NavLink to="/app/followups" onClick={closeSidebar}>Follow-ups</NavLink>
          <NavLink to="/app/revenue" onClick={closeSidebar}>Revenue</NavLink>
          <NavLink to="/app/billing" onClick={closeSidebar}>Billing</NavLink>
          <NavLink to="/app/settings" onClick={closeSidebar}>Settings</NavLink>
          <NavLink to="/app/profile" onClick={closeSidebar}>Profile</NavLink>
        </nav>

        <div className="sidebar-bottom">
          <Link to="/" onClick={closeSidebar}>← Back to website</Link>
        </div>
      </aside>

      <main className="app-main">
        <header className="app-header app-header-subpage">
          <div>
            <span className="app-eyebrow">LEADBACK</span>
            <h1>{displayName}</h1>
            <p>Manage your workspace and customer recovery.</p>
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="profile-button"
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
                  {(authUser?.displayName || authUser?.email || 'U')
                    .charAt(0)
                    .toUpperCase()}
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
                      {(authUser?.displayName || authUser?.email || 'U')
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  )}

                  <div>
                    <strong>{authUser?.displayName || 'Google account'}</strong>
                    <span>{authUser?.email || ''}</span>
                  </div>
                </div>

                <div className="profile-menu-divider" />

                <Link to="/app/settings" onClick={() => setProfileOpen(false)}>Settings</Link>
                <Link to="/app/billing" onClick={() => setProfileOpen(false)}>Billing</Link>

                <button type="button" onClick={handleSignOut}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Render the actual page (Dashboard, Inquiries, Billing, …) */}
        <Outlet />

        <footer className="app-footer">
          LeadBack · Revenue recovery workspace
        </footer>
      </main>
    </div>
  )
}
