import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { logAudit } from '../utils/audit.js'

/**
 * Accept invite — batch 4 (enterprise Phase 2).
 *
 * No email is ever sent (no email backend exists). The owner invites
 * by email and shares the app link; the invited member signs in with
 * Google using the invited email and opens /accept. The app then:
 *   1. looks up inviteIndex/{lowercased email} -> { ownerUid }
 *   2. reads users/{ownerUid}/invites/{email} (must be pending)
 *   3. creates users/{ownerUid}/members/{uid} (rules check the pending
 *      invite + role match — the member can never self-grant a role)
 *   4. creates users/{uid}/memberships/{ownerUid} (the mirror the
 *      member app uses to resolve its workspace)
 *   5. marks the invite 'accepted' and deletes its inviteIndex entry
 *   6. logs a member_added audit record in the owner's workspace
 * Every step is rule-checked; if the rules are not deployed yet the
 * writes fail with a plain message saying so. Nothing here sends
 * email, and no invite is ever accepted for a different email than
 * the signed-in account's.
 */
export default function AcceptInvite() {
  const [state, setState] = useState('looking') // looking | found | done | error | none
  const [invite, setInvite] = useState(null)
  const [ownerUid, setOwnerUid] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const auth = window.firebase?.auth?.()
    const db = window.firebase?.firestore?.()
    if (!auth || !db) {
      setState('error')
      setMessage('Could not reach the workspace service. Please try again.')
      return undefined
    }
    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (!user || !user.email) {
        setState('error')
        setMessage('Please sign in with Google first.')
        return
      }
      const emailLower = user.email.trim().toLowerCase()
      try {
        const indexSnap = await db
          .collection('inviteIndex')
          .doc(emailLower)
          .get()
        if (!indexSnap.exists) {
          setState('none')
          return
        }
        const foundOwnerUid = indexSnap.data()?.ownerUid
        if (!foundOwnerUid) {
          setState('none')
          return
        }
        const inviteSnap = await db
          .collection('users')
          .doc(foundOwnerUid)
          .collection('invites')
          .doc(emailLower)
          .get()
        if (!inviteSnap.exists || inviteSnap.data()?.status !== 'pending') {
          setState('none')
          return
        }
        setOwnerUid(foundOwnerUid)
        setInvite({ id: inviteSnap.id, ...inviteSnap.data() })
        setState('found')
      } catch (error) {
        console.error('Invite lookup failed:', error)
        setState('error')
        setMessage(
          'Could not find your invite — the updated security rules may not be published yet. Ask the workspace owner to publish firestore.rules, then try again.'
        )
      }
    })
    return unsubscribe
  }, [])

  async function handleAccept() {
    const auth = window.firebase?.auth?.()
    const db = window.firebase?.firestore?.()
    const user = auth?.currentUser
    if (!user || !db || !invite || !ownerUid) return
    const emailLower = (user.email || '').trim().toLowerCase()
    setBusy(true)
    setMessage('')
    try {
      // 1. Member record — rules require the pending invite + role match.
      await db
        .collection('users')
        .doc(ownerUid)
        .collection('members')
        .doc(user.uid)
        .set({
          email: emailLower,
          role: invite.role,
          branchId: invite.branchId || '',
          status: 'active',
          acceptedAt: new Date().toISOString(),
          // Batch 5: routing defaults — safe side first. Nobody gets
          // leads by accident; availability is opt-in, and admins do
          // not take routed leads unless they opt in too.
          available: false,
          takesLeads: false,
          assignedCount: 0,
        })
      // 2. Membership mirror — rules require the member record + role match.
      await db
        .collection('users')
        .doc(user.uid)
        .collection('memberships')
        .doc(ownerUid)
        .set({
          role: invite.role,
          branchId: invite.branchId || '',
        })
      // 3. Void the invite (invitee may only flip status pending->accepted)
      //    and remove its index entry, so it cannot be accepted twice.
      await db
        .collection('users')
        .doc(ownerUid)
        .collection('invites')
        .doc(emailLower)
        .update({ status: 'accepted' })
      try {
        await db.collection('inviteIndex').doc(emailLower).delete()
      } catch (indexError) {
        // The invite itself is already accepted; a stale index entry
        // only means a second accept attempt shows "already accepted".
        console.error('Invite index cleanup failed:', indexError)
      }
      await logAudit(ownerUid, {
        action: 'member_added',
        detail: `${emailLower} accepted as ${invite.role}`,
      })
      setState('done')
    } catch (error) {
      console.error('Accept invite failed:', error)
      setMessage(
        'Could not accept the invite — the updated security rules may not be published yet, or this invite was already used. Ask the workspace owner to publish firestore.rules, then try again.'
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="settings-page">
      <div className="settings-inner">
        <header className="settings-header">
          <div>
            <span className="app-eyebrow">TEAM INVITE</span>
            <h1>Join a workspace</h1>
            <p>Accept your team invite and start working your assigned leads.</p>
          </div>
        </header>

        <section className="settings-card">
          {state === 'looking' && <p>Looking for your invite…</p>}

          {state === 'none' && (
            <>
              <h2>No pending invite found</h2>
              <p>
                No invite exists for the email you signed in with. Ask the
                workspace owner to invite exactly this email address, then
                open this page again.
              </p>
              <p>
                <Link to="/app">Back to the app</Link>
              </p>
            </>
          )}

          {state === 'error' && (
            <>
              <h2>Something went wrong</h2>
              <p>{message}</p>
              <p>
                <Link to="/app">Back to the app</Link>
              </p>
            </>
          )}

          {state === 'found' && invite && (
            <>
              <h2>You are invited</h2>
              <p>
                Role: <strong>{invite.role || 'sales_rep'}</strong>
                {invite.branchId ? (
                  <>
                    {' '}· Branch: <strong>{invite.branchId}</strong>
                  </>
                ) : null}
              </p>
              <p>
                Accepting joins the workspace that invited{' '}
                <strong>{invite.email}</strong>. You will only see the
                leads your role allows — assigned leads for Sales Reps,
                your branch for Branch Managers — and you can never
                delete data.
              </p>
              {message && <div className="form-error">{message}</div>}
              <div className="settings-save-row">
                <button
                  type="button"
                  className="settings-save-button"
                  onClick={handleAccept}
                  disabled={busy}
                >
                  {busy ? 'Joining…' : 'Accept invite'}
                </button>
              </div>
            </>
          )}

          {state === 'done' && (
            <>
              <h2>Welcome to the team</h2>
              <p>
                Your invite is accepted. Your workspace is ready — open
                the app to see your leads.
              </p>
              <p>
                <Link to="/app">Open the app</Link>
              </p>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
