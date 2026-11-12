import React, { createContext, useContext, useEffect, useState } from 'react'
import { resolveWorkspace } from '../utils/workspace.js'

/**
 * WorkspaceContext — batch 4 (enterprise Phase 2).
 *
 * Resolves the signed-in user's workspace ONCE (owner uid + role +
 * branch) and shares it with every /app/* page through AppLayout's
 * <Outlet/>. Pages use workspace.ownerUid as their Firestore data
 * root instead of the signed-in uid, so a team member lands in the
 * owner's workspace with their role applied, while a solo owner
 * keeps exactly today's behaviour (ownerUid = own uid, role 'owner').
 *
 * While `loading` is true, pages must not load data yet — otherwise
 * they would first load the member's own empty workspace and then
 * reload. RequireAuth already guarantees a signed-in user here.
 * AppLayout enforces this at the shell level: it renders the shared
 * <AppLoading/> instead of <Outlet/> until `loading` is false, so no
 * page ever paints its empty pre-data state (the old "white page in
 * between").
 *
 * `error` is non-null when resolution could not run at all — the
 * Firebase compat SDK (window.firebase) is missing/blocked, or
 * Firestore is unavailable. In that case `loading` is false and
 * `workspace` stays null, and AppLayout shows a reload panel instead
 * of letting pages render as if the workspace were simply empty.
 * (resolveWorkspace itself never throws for a failed memberships
 * read — it falls back to the solo workspace — so a null workspace
 * after loading means the SDK/db layer is missing, not a data miss.)
 */
const WorkspaceContext = createContext({
  workspace: null,
  loading: true,
  user: null,
  error: null,
})

export function WorkspaceProvider({ children }) {
  const [workspace, setWorkspace] = useState(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const auth = window.firebase?.auth?.()
    const db = window.firebase?.firestore?.()
    if (!auth || !db) {
      // Firebase CDN scripts slow/blocked (or init failed in
      // index.html): there is no way to resolve a workspace. Surface
      // it as an error instead of silently reporting "loaded, no
      // workspace", which pages used to render as empty data.
      setError('firebase-unavailable')
      setLoading(false)
      return undefined
    }
    // Guards against a stale async resolution overwriting a newer
    // one (auth callbacks can fire again on token refresh, and
    // StrictMode mounts effects twice in dev).
    let requestId = 0
    const unsubscribe = auth.onAuthStateChanged(async nextUser => {
      const myRequest = ++requestId
      setUser(nextUser)
      if (!nextUser) {
        setWorkspace(null)
        setError(null)
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const resolved = await resolveWorkspace(db, nextUser)
        if (myRequest !== requestId) return
        setWorkspace(resolved)
        setError(resolved ? null : 'workspace-unresolved')
      } catch (resolveError) {
        // resolveWorkspace already falls back internally for data
        // errors; reaching here means something unexpected — keep
        // the shell in its recoverable error state, never blank.
        console.error('Workspace resolution failed:', resolveError)
        if (myRequest !== requestId) return
        setWorkspace(null)
        setError('workspace-unresolved')
      } finally {
        if (myRequest === requestId) setLoading(false)
      }
    })
    return unsubscribe
  }, [])

  return (
    <WorkspaceContext.Provider value={{ workspace, loading, user, error }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  return useContext(WorkspaceContext)
}
