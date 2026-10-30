/**
 * Round-robin routing — batch 5 (enterprise Phase 3).
 *
 * Fairness = least-loaded first among AVAILABLE agents, not pure
 * rotation (pure rotation breaks when reps join/leave mid-day).
 *
 * Candidates: active members with available === true AND
 *   (role === 'sales_rep' OR (role === 'admin' AND takesLeads === true))
 *   AND (no branch filter OR member.branchId === inquiry branchId).
 * Managers never take routed leads; the workspace owner is not a
 * member doc and is never a candidate.
 *
 * The pick + assignedCount increment + rotation-pointer advance
 * happen in ONE Firestore transaction, so two simultaneous arrivals
 * cannot double-assign the same rep or lose an increment.
 *
 * Safe fallbacks (never block creation):
 * - No candidates → unassigned (admins see it in the unassigned queue).
 * - Transaction fails for any reason (e.g. a branch manager creates
 *   a row: managers cannot list members under the rules, so their
 *   rows queue unassigned for admins) → unassigned.
 * - Solo workspace (no members) → unassigned, exactly today's
 *   behaviour. Zero regression by construction.
 *
 * Manual assignment (detail-modal dropdown) always wins over routing
 * and never touches assignedCount — a manual move is the owner's
 * decision, not the engine's load.
 */

/**
 * Route one new inquiry. Returns routing fields to store on the doc.
 * Never throws: on any failure it returns the unassigned shape.
 */
export async function assignNext(db, ownerUid, { branchId = '' } = {}) {
  const fallback = { assignedTo: '', assignedAt: '', assignedBy: '', assignedEmail: '' }
  if (!db || !ownerUid) return fallback
  try {
    const pickedId = await db.runTransaction(async tx => {
      const settingsRef = db
        .collection('users')
        .doc(ownerUid)
        .collection('settings')
        .doc('workspace')
      const settingsSnap = await tx.get(settingsRef)
      const pointerUid = settingsSnap.exists
        ? (settingsSnap.data()?.roundRobin?.pointerUid || '')
        : ''

      const membersSnap = await tx.get(
        db.collection('users').doc(ownerUid).collection('members')
      )
      const candidates = membersSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(m => {
          if (m.available !== true) return false
          if (m.role === 'sales_rep') return true
          if (m.role === 'admin' && m.takesLeads === true) return true
          return false
        })
        .filter(m => !branchId || (m.branchId || '') === branchId)

      if (!candidates.length) return null

      const withCounts = candidates.map(m => ({
        ...m,
        count: typeof m.assignedCount === 'number' ? m.assignedCount : 0,
      }))
      const minCount = Math.min(...withCounts.map(m => m.count))
      const least = withCounts
        .filter(m => m.count === minCount)
        .map(m => m.id)
        .sort()
      // Ties break by the rotation pointer: first member-id after the
      // pointer, wrapping to the start (circular order).
      let pickId = least[0]
      if (pointerUid) {
        const after = least.filter(id => id > pointerUid)
        pickId = after.length ? after[0] : least[0]
      }
      const picked = withCounts.find(m => m.id === pickId)
      tx.update(
        db.collection('users').doc(ownerUid).collection('members').doc(pickId),
        { assignedCount: picked.count + 1 }
      )
      tx.set(
        settingsRef,
        { roundRobin: { pointerUid: pickId, updatedAt: new Date().toISOString() } },
        { merge: true }
      )
      return pickId
    })

    if (!pickedId) return fallback
    // Email for the audit line ("assigned to <email>"). Read outside
    // the transaction; a failed read never blocks the assignment.
    let assignedEmail = ''
    try {
      const snap = await db
        .collection('users')
        .doc(ownerUid)
        .collection('members')
        .doc(pickedId)
        .get()
      assignedEmail = snap.exists ? (snap.data()?.email || '') : ''
    } catch (e) {
      console.error('Round-robin assignee email lookup failed:', e)
    }
    return {
      assignedTo: pickedId,
      assignedAt: new Date().toISOString(),
      assignedBy: 'round-robin',
      assignedEmail,
    }
  } catch (error) {
    console.error('Round-robin assignment failed, leaving unassigned:', error)
    return fallback
  }
}
