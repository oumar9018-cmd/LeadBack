import React, { useEffect, useRef, useState } from 'react'
import { NavLink, Link, Outlet } from 'react-router-dom'
import { url } from './basePath.js'
import { GraveyardPill } from './components/GraveyardCounter.jsx'
import {
  CURRENCY_CODES,
  defaultCurrencyForBrowser,
} from './utils/money.js'
import { roleLabel } from './utils/workspace.js'
import { useWorkspace } from './components/WorkspaceContext.jsx'
import {
  IconMessage,
  IconClock,
  IconZap,
  IconChartBar,
} from './components/icons.jsx'

/**
 * AppShell — shared topbar + drawer + bottom-tab-bar layout used by all
 * authenticated /app/* pages.
 *
 * Mobile-first (P0 rebuild): the hamburger lives INSIDE the sticky
 * topbar (never floating), the drawer is one component with body
 * scroll lock + focus trap + aria-expanded, and phones navigate via
 * a fixed bottom tab bar (Inquiries / Follow-ups / Blitz
 * + More opening the drawer). At >=900px the sidebar rail returns
 * and the tab bar + hamburger hide (see App.css MOBILE-FIRST SHELL).
 *
 * Batch 3 (2026-10-30): Overview is back as the post-login landing
 * page on the owner's order (Revenue summary panel removed from it in
 * App.jsx) — Overview is the first sidebar entry and first tab again.
 * Batch 2 (2026-10-30): the Overview dashboard page was removed, so
 * Inquiries is the first sidebar entry and the first tab.
 */
export default function AppLayout() {
  const [authUser, setAuthUser] = useState(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [businessName, setBusinessName] = useState('')
  const [currency, setCurrency] = useState(() => defaultCurrencyForBrowser())
  // Batch 5: members toggle their own routing availability here.
  // (Owner/admins toggle it in TeamMembers too; the member doc update
  // is covered by the narrow batch-5 rules allowance.)
  const [myAvailable, setMyAvailable] = useState(false)
  const [myTakesLeads, setMyTakesLeads] = useState(false)
  const [profileName, setProfileName] = useState('')
  const drawerRef = useRef(null)
  const menuButtonRef = useRef(null)
  // Batch 4: the workspace owner's settings + the member's role.
  const { workspace, loading: wsLoading } = useWorkspace()

  useEffect(() => {
    if (wsLoading || !workspace) return
    const db = window.firebase?.firestore?.()
    if (!db) return
    let cancelled = false
    db.collection('users')
      .doc(workspace.ownerUid)
      .collection('settings')
      .doc('workspace')
      .get()
      .then(snapshot => {
        if (cancelled) return
        const data = snapshot.exists ? snapshot.data() : {}
        const savedName = data?.businessName
        setBusinessName(
          typeof savedName === 'string' ? savedName.trim() : ''
        )
        if (CURRENCY_CODES.includes(data?.currency)) {
          setCurrency(data.currency)
        }
      })
      .catch(error => {
        console.error('Workspace settings load failed:', error)
        if (!cancelled) setBusinessName('')
      })
    return () => {
      cancelled = true
    }
  }, [wsLoading, workspace])

  useEffect(() => {
    if (wsLoading || !workspace?.isMember) return
    const db = window.firebase?.firestore?.()
    const uid = window.firebase?.auth?.().currentUser?.uid
    if (!db || !uid) return
    let cancelled = false
    db.collection('users')
      .doc(workspace.ownerUid)
      .collection('members')
      .doc(uid)
      .get()
      .then(snapshot => {
        if (cancelled || !snapshot.exists) return
        const data = snapshot.data() || {}
        setMyAvailable(data.available === true)
        setMyTakesLeads(data.takesLeads === true)
      })
      .catch(error => {
        console.error('Member availability load failed:', error)
      })
    return () => {
      cancelled = true
    }
  }, [wsLoading, workspace])

  async function toggleMyField(field, value) {
    const db = window.firebase?.firestore?.()
    const uid = window.firebase?.auth?.().currentUser?.uid
    if (!db || !uid || !workspace) return
    const previous = field === 'available' ? myAvailable : myTakesLeads
    if (field === 'available') setMyAvailable(value)
    else setMyTakesLeads(value)
    try {
      await db
        .collection('users')
        .doc(workspace.ownerUid)
        .collection('members')
        .doc(uid)
        .update({ [field]: value })
    } catch (error) {
      console.error('Availability toggle failed:', error)
      if (field === 'available') setMyAvailable(previous)
      else setMyTakesLeads(previous)
    }
  }

  useEffect(() => {
    const auth = window.firebase?.auth?.()
    if (!auth) {
      setAuthUser(null)
      return undefined
    }
    setAuthUser(auth.currentUser)
    const unsubscribe = auth.onAuthStateChanged(user => {
      setAuthUser(user)
      if (user) {
        setProfileName(
          typeof user.displayName === 'string' ? user.displayName.trim() : ''
        )
      } else {
        setProfileName('')
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
          {/* Members see their role here, so a scoped view is never a
              mystery ("why can't I see everything?"). */}
          {workspace?.isMember && (
            <span className="workspace-role">
              {roleLabel(workspace.role)}
              {workspace.branchId ? ` · ${workspace.branchId}` : ''}
            </span>
          )}
          {/* Batch 5: routing availability, self-served. Only roles
              that can receive routed leads see these toggles. */}
          {workspace?.isMember && (workspace.role === 'sales_rep' || workspace.role === 'admin') && (
            <label className="workspace-availability">
              <input
                type="checkbox"
                checked={myAvailable}
                onChange={e => toggleMyField('available', e.target.checked)}
              />
              Available for new leads
            </label>
          )}
          {workspace?.isMember && workspace.role === 'admin' && (
            <label className="workspace-availability">
              <input
                type="checkbox"
                checked={myTakesLeads}
                onChange={e => toggleMyField('takesLeads', e.target.checked)}
              />
              Take routed leads
            </label>
          )}
        </div>

        <nav className="side-nav">
          <NavLink to="/app" end onClick={closeSidebar}>Overview</NavLink>
          <NavLink to="/app/inquiries" onClick={closeSidebar}>Inquiries</NavLink>
          <NavLink to="/app/followups" onClick={closeSidebar}>Follow-ups</NavLink>
          <NavLink to="/app/blitz" onClick={closeSidebar}>Blitz Mode</NavLink>
          <NavLink to="/app/offers" onClick={closeSidebar}>Offers</NavLink>
          <NavLink to="/app/revenue" onClick={closeSidebar}>Revenue</NavLink>
          {/* Sales Reps get no settings page at all (rules deny it). */}
          {workspace?.role !== 'sales_rep' && (
            <NavLink to="/app/settings" onClick={closeSidebar}>Settings</NavLink>
          )}
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
            <GraveyardPill currency={currency} />
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

                {workspace?.role !== 'sales_rep' && (
                  <Link to="/app/settings" onClick={() => setProfileOpen(false)}>Settings</Link>
                )}

                <button type="button" onClick={handleSignOut}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Render the actual page (Inquiries, Follow-ups, …) */}
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
