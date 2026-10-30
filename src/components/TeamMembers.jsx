import React, { useEffect, useState } from 'react'
import { logAudit } from '../utils/audit.js'
import { useWorkspace } from './WorkspaceContext.jsx'

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
  // Batch 4: team records live under the WORKSPACE owner, not the
  // viewer — an admin manages the owner's team, not their own.
  const { workspace } = useWorkspace()
  const [branches, setBranches] = useState([])
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
    if (!database || !workspace) return
    const ownerUid = workspace.ownerUid
    try {
      const invitesSnap = await database
        .collection('users')
        .doc(ownerUid)
        .collection('invites')
        .get()
      setInvites(invitesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    } catch (e) {
      console.error('Invites load failed:', e)
    }
    try {
      const membersSnap = await database
        .collection('users')
        .doc(ownerUid)
        .collection('members')
        .get()
      setMembers(membersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    } catch (e) {
      console.error('Members load failed:', e)
    }
    try {
      const branchesSnap = await database
        .collection('users')
        .doc(ownerUid)
        .collection('settings')
        .doc('branches')
        .get()
      setBranches(branchesSnap.exists ? branchesSnap.data()?.branches || [] : [])
    } catch (e) {
      console.error('Branches load failed:', e)
    }
  }

  useEffect(() => {
    if (!workspace) {
      setInvites([])
      setMembers([])
      return undefined
    }
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.ownerUid])

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
    if (!database || !user || !workspace) return
    if (!validEmail(cleanEmail)) {
      setError('Enter a valid email address.')
      return
    }
    setBusy(true)
    try {
      await database
        .collection('users')
        .doc(workspace.ownerUid)
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
      // Batch 4: the index lets the invited member find this invite
      // without knowing the owner's uid (see /accept).
      await database
        .collection('inviteIndex')
        .doc(cleanEmail)
        .set({
          email: cleanEmail,
          ownerUid: workspace.ownerUid,
        })
      await logAudit(workspace.ownerUid, {
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
    if (!database || !user || !workspace) return
    try {
      await database
        .collection('users')
        .doc(workspace.ownerUid)
        .collection('invites')
        .doc(invite.id)
        .delete()
      try {
        await database
          .collection('inviteIndex')
          .doc((invite.email || invite.id || '').toLowerCase())
          .delete()
      } catch (indexError) {
        console.error('Invite index cleanup failed:', indexError)
      }
      await logAudit(workspace.ownerUid, {
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
    if (!database || !user || !workspace) return
    try {
      await database
        .collection('users')
        .doc(workspace.ownerUid)
        .collection('members')
        .doc(member.id)
        .delete()
      // Remove the member's workspace mirror too, or their app would
      // keep resolving into a workspace whose rules now deny them.
      try {
        await database
          .collection('users')
          .doc(member.id)
          .collection('memberships')
          .doc(workspace.ownerUid)
          .delete()
      } catch (mirrorError) {
        console.error('Membership mirror cleanup failed:', mirrorError)
      }
      // Batch 5 (round-robin spec §6): a removed rep's rows return to
      // the unassigned queue — never silently re-dealt, because
      // re-dealing hides who was responsible. Admins reassign by hand.
      let unassignedCount = 0
      try {
        const assignedSnap = await database
          .collection('users')
          .doc(workspace.ownerUid)
          .collection('inquiries')
          .where('assignedTo', '==', member.id)
          .get()
        const docs = assignedSnap.docs
        for (let start = 0; start < docs.length; start += 400) {
          const batch = database.batch()
          docs.slice(start, start + 400).forEach(d => {
            batch.update(d.ref, { assignedTo: '', assignedBy: '' })
          })
          await batch.commit()
        }
        unassignedCount = docs.length
      } catch (unassignError) {
        console.error('Returning removed member rows to unassigned failed:', unassignError)
      }
      await logAudit(workspace.ownerUid, {
        action: 'member_removed',
        detail: `${member.email || member.id} (${unassignedCount} rows returned to unassigned)`,
      })
      reload()
    } catch (e) {
      console.error('Remove member failed:', e)
      setError('Could not remove the member. Please try again.')
    }
  }

  // Batch 5: routing availability. Owner/admins toggle these here;
  // members can also toggle their own (narrow rules allowance).
  async function toggleMemberField(member, field, value) {
    const database = db()
    const user = currentUser()
    if (!database || !user || !workspace) return
    try {
      await database
        .collection('users')
        .doc(workspace.ownerUid)
        .collection('members')
        .doc(member.id)
        .update({ [field]: value })
      // Gate 8 fix: toggles used to persist with no audit record at
      // all (the viewer only ever showed invites, roles and
      // removals). Audit must never break the toggle itself, and
      // logAudit is already fire-and-forget.
      await logAudit(workspace.ownerUid, {
        action: 'member_availability_changed',
        detail: `${member.email || member.id}: ${field} -> ${value}`,
      })
      reload()
    } catch (e) {
      console.error('Member availability toggle failed:', e)
      setError('Could not update availability — please try again.')
    }
  }

  async function changeMemberRole(member, nextRole) {    const database = db()
    const user = currentUser()
    if (!database || !user || !workspace || member.role === nextRole) return
    try {
      await database
        .collection('users')
        .doc(workspace.ownerUid)
        .collection('members')
        .doc(member.id)
        .update({ role: nextRole })
      // Keep the member's mirror in sync, or their app would resolve
      // the stale role while the rules enforce the new one.
      try {
        await database
          .collection('users')
          .doc(member.id)
          .collection('memberships')
          .doc(workspace.ownerUid)
          .update({ role: nextRole })
      } catch (mirrorError) {
        console.error('Membership mirror sync failed:', mirrorError)
        setError('Role changed, but the member’s workspace record did not update — please change it again.')
        reload()
        return
      }
      await logAudit(workspace.ownerUid, {
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
            leads. Staff can never delete data. Invites, role changes,
            availability toggles, assignments and removals are written
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
              list="team-branch-names"
            />
            <datalist id="team-branch-names">
              {branches.map(branch => (
                <option key={branch.id} value={branch.name} />
              ))}
            </datalist>
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
              {(member.role === 'sales_rep' || member.role === 'admin') && (
                <label className="team-availability">
                  <input
                    type="checkbox"
                    checked={member.available === true}
                    onChange={e => toggleMemberField(member, 'available', e.target.checked)}
                  />
                  Available for new leads
                </label>
              )}
              {member.role === 'admin' && (
                <label className="team-availability">
                  <input
                    type="checkbox"
                    checked={member.takesLeads === true}
                    onChange={e => toggleMemberField(member, 'takesLeads', e.target.checked)}
                  />
                  Takes routed leads
                </label>
              )}
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
        Note: invited members sign in with Google using the invited email,
        then open /accept to join. Their scoped workspace view is live:
        Sales Reps see only assigned leads, Branch Managers only their
        branch, and staff can never delete data or open settings.
      </p>
    </section>
  )
}
