import React, { useEffect, useState } from 'react'
import { logAudit } from '../utils/audit.js'

/**
 * Team — unlimited free seats (batch 3 enterprise foundation).
 *
 * The owner invites staff by email + role + branch. Two lists:
 * - Pending invites (`users/{uid}/invites/{email}`) — written by the
 *   owner now; the invited member accepts in the phase-2 member app.
 * - Active members (`users/{uid}/members/{memberUid}`) — created by the
 *   member at accept time, never by hand here.
 *
 * Permissions live in firestore.rules (Admin / Branch Manager /
 * Sales Rep matrix), not in this UI — this card only manages the
 * records. Until the batch-3 rules are deployed, these writes fail
 * with a permission error and the message below says so plainly.
 * No price, no seat limit, no paywall — ever.
 */

const ROLES = [
  { value: 'admin', label: 'Admin — full access' },
  { value: 'branch_manager', label: 'Branch Manager — own branch only, no delete' },
  { value: 'sales_rep', label: 'Sales Rep — assigned leads only, no delete' },
]

const ROLE_LABELS = {
  admin: 'Admin',
  branch_manager: 'Branch Manager',
  sales_rep: 'Sales Rep',
}

export default function TeamMembers() {
  const [invites, setInvites] = useState([])
  const [members, setMembers] = useState([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('sales_rep')
  const [branchId, setBranchId] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function db() {
    return window.firebase?.firestore?.()
  }

  function currentUser() {
    return window.firebase?.auth?.()?.currentUser || null
  }

  async function reload() {
    const database = db()
    const user = currentUser()
    if (!database || !user) return
    try {
      const invitesSnap = await database
        .collection('users')
        .doc(user.uid)
        .collection('invites')
        .get()
      setInvites(invitesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    } catch (e) {
      console.error('Invites load failed:', e)
    }
    try {
      const membersSnap = await database
        .collection('users')
        .doc(user.uid)
        .collection('members')
        .get()
      setMembers(membersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    } catch (e) {
      console.error('Members load failed:', e)
    }
  }

  useEffect(() => {
    const auth = window.firebase?.auth?.()
    if (!auth) return
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (!user) {
        setInvites([])
        setMembers([])
        return
      }
      reload()
    })
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }

  async function handleInvite(event) {
    event.preventDefault()
    setNotice('')
    setError('')
    const database = db()
    const user = currentUser()
    const cleanEmail = email.trim().toLowerCase()
    if (!database || !user) return
    if (!validEmail(cleanEmail)) {
      setError('Enter a valid email address.')
      return
    }
    setBusy(true)
    try {
      await database
        .collection('users')
        .doc(user.uid)
        .collection('invites')
        .doc(cleanEmail)
        .set({
          email: cleanEmail,
          role,
          branchId: branchId.trim(),
          status: 'pending',
          createdAt: new Date().toISOString(),
          createdBy: user.uid,
        })
      await logAudit(user.uid, {
        action: 'member_added',
        detail: `${cleanEmail} as ${role}`,
      })
      setEmail('')
      setBranchId('')
      setRole('sales_rep')
      setNotice(`Invite saved for ${cleanEmail}.`)
      reload()
    } catch (e) {
      console.error('Invite failed:', e)
      setError(
        'Could not save the invite — the updated security rules may not be published yet. Publish firestore.rules from Firebase Console, then try again.'
      )
    } finally {
      setBusy(false)
    }
  }

  async function removeInvite(invite) {
    const database = db()
    const user = currentUser()
    if (!database || !user) return
    try {
      await database
        .collection('users')
        .doc(user.uid)
        .collection('invites')
        .doc(invite.id)
        .delete()
      await logAudit(user.uid, {
        action: 'member_removed',
        detail: `${invite.email || invite.id} (invite)`,
      })
      reload()
    } catch (e) {
      console.error('Remove invite failed:', e)
      setError('Could not remove the invite. Please try again.')
    }
  }

  async function removeMember(member) {
    const database = db()
    const user = currentUser()
    if (!database || !user) return
    try {
      await database
        .collection('users')
        .doc(user.uid)
        .collection('members')
        .doc(member.id)
        .delete()
      await logAudit(user.uid, {
        action: 'member_removed',
        detail: `${member.email || member.id}`,
      })
      reload()
    } catch (e) {
      console.error('Remove member failed:', e)
      setError('Could not remove the member. Please try again.')
    }
  }

  async function changeMemberRole(member, nextRole) {
    const database = db()
    const user = currentUser()
    if (!database || !user || member.role === nextRole) return
    try {
      await database
        .collection('users')
        .doc(user.uid)
        .collection('members')
        .doc(member.id)
        .update({ role: nextRole })
      await logAudit(user.uid, {
        action: 'member_role_changed',
        detail: `${member.email || member.id}: ${member.role || ''} -> ${nextRole}`,
      })
      reload()
    } catch (e) {
      console.error('Role change failed:', e)
      setError('Could not change the role. Please try again.')
    }
  }

  return (
    <section className="settings-card">
      <div className="settings-card-header">
        <div>
          <span className="settings-label">TEAM</span>
          <h2>Team — unlimited seats, free</h2>
          <p>
            Invite staff by email. Admins see everything; Branch Managers
            see only their branch; Sales Reps see only their assigned
            leads. Staff can never delete data. Every change is written
            to the audit log.
          </p>
        </div>
      </div>

      <form onSubmit={handleInvite}>
        <div className="settings-grid">
          <label className="settings-full">
            <span>Staff email (they sign in with Google)</span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="staff@example.com"
            />
          </label>

          <label>
            <span>Role</span>
            <select value={role} onChange={e => setRole(e.target.value)}>
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Branch (for Branch Managers)</span>
            <input
              value={branchId}
              onChange={e => setBranchId(e.target.value)}
              placeholder="e.g. Andheri"
            />
          </label>
        </div>

        {error && <div className="form-error">{error}</div>}
        {notice && <p>{notice}</p>}

        <div className="settings-save-row">
          <button type="submit" className="settings-save-button" disabled={busy}>
            {busy ? 'Saving…' : 'Invite team member'}
          </button>
        </div>
      </form>

      {invites.length > 0 && (
        <div>
          <h3>Pending invites</h3>
          {invites.map(invite => (
            <div key={invite.id} className="team-row">
              <div>
                <strong>{invite.email || invite.id}</strong>
                <span>
                  {ROLE_LABELS[invite.role] || invite.role}
                  {invite.branchId ? ` · ${invite.branchId}` : ''}
                </span>
              </div>
              <button type="button" onClick={() => removeInvite(invite)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {members.length > 0 && (
        <div>
          <h3>Active members</h3>
          {members.map(member => (
            <div key={member.id} className="team-row">
              <div>
                <strong>{member.email || member.id}</strong>
                <span>
                  {member.branchId ? `${member.branchId} · ` : ''}
                  {ROLE_LABELS[member.role] || member.role}
                </span>
              </div>
              <select
                value={member.role || 'sales_rep'}
                onChange={e => changeMemberRole(member, e.target.value)}
                aria-label={`Role for ${member.email || member.id}`}
              >
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <button type="button" onClick={() => removeMember(member)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {invites.length === 0 && members.length === 0 && (
        <p>No team members yet. Add your first invite above — seats are unlimited and free.</p>
      )}

      <p>
        Note: invited members sign in with Google using the invited email.
        Their scoped workspace view arrives with the member-app update;
        the permissions above are already enforced in the security rules.
      </p>
    </section>
  )
}
