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
 */
const WorkspaceContext = createContext({
  workspace: null,
  loading: true,
  user: null,
})

export function WorkspaceProvider({ children }) {
  const [workspace, setWorkspace] = useState(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const auth = window.firebase?.auth?.()
    const db = window.firebase?.firestore?.()
    if (!auth) {
      setLoading(false)
      return undefined
    }
    const unsubscribe = auth.onAuthStateChanged(async nextUser => {
      setUser(nextUser)
      if (!nextUser) {
        setWorkspace(null)
        setLoading(false)
        return
      }
      setLoading(true)
      const resolved = await resolveWorkspace(db, nextUser)
      setWorkspace(resolved)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return (
    <WorkspaceContext.Provider value={{ workspace, loading, user }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  return useContext(WorkspaceContext)
}
