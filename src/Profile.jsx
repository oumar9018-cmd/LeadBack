import React, { useEffect, useState } from 'react'
import { url } from './basePath.js'
import { useWorkspace } from './components/WorkspaceContext.jsx'
import { roleLabel } from './utils/workspace.js'

export default function Profile() {
  const { workspace } = useWorkspace()
  const [user, setUser] = useState(() => (
    window.firebase?.auth?.().currentUser || null
  ))

  useEffect(() => {
    const auth = window.firebase?.auth?.()

    if (!auth) return

    const unsubscribe = auth.onAuthStateChanged(currentUser => {
      setUser(currentUser)
    })

    return unsubscribe
  }, [])

  async function handleSignOut() {
    try {
      await window.firebase.auth().signOut()
    } catch (error) {
      console.error('Sign out failed:', error)
    }
    // Use replace so the browser's Back button can't return to a protected page.
    window.location.replace(url('/login'))
  }

  const displayName = user?.displayName || 'Google account'
  const email = user?.email || '—'
  const initial = (displayName || email || 'U')
    .charAt(0)
    .toUpperCase()

  return (
    <div className="profile-page">
      <div className="profile-page-header">
        <div>
          <span className="app-eyebrow">ACCOUNT</span>
          <h1>Profile</h1>
          <p>Your account.</p>
        </div>
      </div>

      <section className="profile-card">
        <div className="profile-hero">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={displayName}
              className="profile-page-avatar"
            />
          ) : (
            <span className="profile-page-avatar profile-page-avatar-fallback">
              {initial}
            </span>
          )}

          <div className="profile-identity">
            <h2>{displayName}</h2>
            <p>{email}</p>
          </div>
        </div>

        <div className="profile-divider" />

        <div className="profile-section-label">
          PROFILE INFORMATION
        </div>

        <div className="profile-info-list">
          <div className="profile-info-row">
            <span>Name</span>
            <strong>{displayName}</strong>
          </div>

          <div className="profile-info-row">
            <span>Email</span>
            <strong>{email}</strong>
          </div>

          <div className="profile-info-row">
            <span>Sign-in method</span>
            <strong>Google</strong>
          </div>

          <div className="profile-info-row">
            <span>Account status</span>
            <strong className="profile-status">Connected</strong>
          </div>

          <div className="profile-info-row">
            <span>Role</span>
            <strong>{workspace ? roleLabel(workspace.role) : '—'}</strong>
          </div>

          <div className="profile-info-row">
            <span>Workspace</span>
            <strong>
              {workspace
                ? workspace.isMember
                  ? `Team workspace${workspace.branchId ? ` · ${workspace.branchId}` : ''}`
                  : 'Your workspace'
                : '—'}
            </strong>
          </div>
        </div>

        <div className="profile-divider" />

        <button
          type="button"
          className="profile-signout"
          onClick={handleSignOut}
        >
          Sign out
        </button>
      </section>
    </div>
  )
}
