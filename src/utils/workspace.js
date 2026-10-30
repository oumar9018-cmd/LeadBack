/**
 * Workspace resolution + role helpers — batch 4 (enterprise Phase 2).
 *
 * The app's data root used to be the signed-in user's own uid. A team
 * member's data root is the OWNER's uid instead, resolved from the
 * memberships mirror the member created at accept time:
 *   users/{memberUid}/memberships/{ownerUid} = { role, branchId }
 *
 * Roles (same strings as firestore.rules and the batch-3 Team card):
 *   'owner' (solo / workspace owner), 'admin', 'branch_manager',
 *   'sales_rep'.
 *
 * Permission summary (rules remain the enforcement — this file only
 * mirrors the matrix for UI gating and client-side list filtering):
 *   owner/admin: everything. Branch manager: only rows whose branchId
 *     equals their branch; cannot delete, cannot reassign, cannot move
 *     a row to another branch; settings read-only. Sales rep: only
 *     rows assigned to them; cannot delete, cannot reassign, cannot
 *     create, no settings at all. Unassigned / unbranched rows are
 *     visible to owner/admins only (safe default).
 *
 * Solo owners notice nothing: no memberships doc means the workspace
 * is their own uid with role 'owner'. If the memberships read fails
 * (e.g. the batch-3/4 rules are not deployed yet) resolution falls
 * back to solo the same way — a member simply sees their own empty
 * workspace until the owner publishes the rules.
 */

export const ROLE_LABELS = {
  owner: 'Owner',
  admin: 'Admin',
  branch_manager: 'Branch Manager',
  sales_rep: 'Sales Rep',
}

export function roleLabel(role) {
  return ROLE_LABELS[role] || role || 'Member'
}

/** Owner and admins manage the team, the audit log and branches. */
export function canManageTeam(role) {
  return role === 'owner' || role === 'admin'
}

/** Only owner/admins may delete an inquiry or an offer. */
export function canDelete(role) {
  return role === 'owner' || role === 'admin'
}

/** Only owner/admins may create second-chance offers. Rules deny
 *  offer creation to anyone whose uid is not the offer's ownerUid,
 *  so staff must never be shown the create button. */
export function canCreateOffers(role) {
  return role === 'owner'
}

/** Managers may read settings but never write them. Reps get no
 *  settings page at all. */
export function canViewSettings(role) {
  return role === 'owner' || role === 'admin' || role === 'branch_manager'
}

export function canWriteSettings(role) {
  return role === 'owner' || role === 'admin'
}

/** Client-side scope filter. Rules are NOT filters — they only allow
 *  or deny each doc, so every list query must ALSO be scoped
 *  server-side to what the rule allows (see Inquiries.jsx and App.jsx);
 *  this filter keeps scoped rows out of aggregates (revenue, customers,
 *  blitz) that read the whole list. */
export function inScope(item, workspace, uid) {
  if (!workspace) return false
  if (workspace.role === 'owner' || workspace.role === 'admin') return true
  if (workspace.role === 'branch_manager') {
    return (item.branchId || '') === (workspace.branchId || '')
  }
  if (workspace.role === 'sales_rep') {
    return (item.assignedTo || '') === uid
  }
  return false
}

/**
 * Resolve the signed-in user's workspace. Returns null when signed
 * out. A member with several memberships (edge case — the app invites
 * into one workspace at a time) resolves to the first one found;
 * multi-workspace switching is out of scope.
 */
export async function resolveWorkspace(db, user) {
  if (!db || !user) return null
  try {
    const snap = await db
      .collection('users')
      .doc(user.uid)
      .collection('memberships')
      .get()
    if (!snap.empty) {
      const doc = snap.docs[0]
      const data = doc.data() || {}
      return {
        ownerUid: doc.id,
        role: data.role || 'sales_rep',
        branchId: data.branchId || '',
        isMember: true,
      }
    }
  } catch (error) {
    // Memberships read denied (rules not deployed yet) or offline:
    // fall back to the solo workspace, exactly as before batch 4.
    console.error('Workspace resolution failed, using solo workspace:', error)
  }
  return {
    ownerUid: user.uid,
    role: 'owner',
    branchId: '',
    isMember: false,
  }
}
