/**
 * Audit log — append-only security record (batch 3 enterprise foundation).
 *
 * Every entry: who (uid + email) did what, to which lead, when.
 * Writes are fire-and-forget: a failed audit write is console-logged
 * but NEVER blocks the user's action. Reads, updates and deletes are
 * governed by firestore.rules: only owner/admins may read; NOBODY
 * (not even the owner) may update or delete an audit record.
 *
 * Actions: 'status_changed' | 'member_added' | 'member_removed' |
 * 'member_role_changed' | 'member_availability_changed' |
 * 'inquiry_assigned' | 'export' (export is reserved — no export
 * feature exists yet; the future export path must log here).
 */

export const AUDIT_ACTIONS = [
  'status_changed',
  'member_added',
  'member_removed',
  'member_role_changed',
  'member_availability_changed',
  'inquiry_assigned',
  'export',
]

export async function logAudit(ownerUid, { action, inquiryId = '', detail = '' } = {}) {
  try {
    const auth = window.firebase?.auth?.()
    const db = window.firebase?.firestore?.()
    const user = auth?.currentUser
    if (!user || !db || !ownerUid) return
    if (!AUDIT_ACTIONS.includes(action)) return

    await db
      .collection('users')
      .doc(ownerUid)
      .collection('audit')
      .add({
        actorUid: user.uid,
        actorEmail: user.email || '',
        action,
        inquiryId: String(inquiryId || ''),
        detail: String(detail || ''),
        createdAt: new Date().toISOString(),
      })
  } catch (error) {
    // Audit must never break the action it records.
    console.error('Audit log failed:', error)
  }
}
