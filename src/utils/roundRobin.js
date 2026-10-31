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
 * Shape (round-3 fix, 2026-10-31): the members LIST and the rotation
 * pointer are read OUTSIDE the transaction, and each pick attempt
 * runs a transaction over DOCUMENT refs only (member doc + settings
 * doc). The old code passed the members COLLECTION ref to tx.get(),
 * which Firestore rejects — tx.get() accepts a document ref only —
 * so every route attempt threw "Expected type 'DocumentReference',
 * but it was: a custom CollectionReference object" (minified live as
 * 'G' / 'cB') and every row stayed unassigned. The round-2 error
 * surfacing is what finally exposed that error instead of blaming
 * "no available agent".
 *
 * Safe fallbacks (never block creation):
 * - No candidates → unassigned (admins see it in the unassigned queue).
 * - Any failure (e.g. a branch manager creates a row: managers cannot
 *   list members under the rules, so their rows queue unassigned for
 *   admins) → unassigned.
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
 *
 * The returned object also carries a `routing` marker so callers
 * that REPORT outcomes can tell the two unassigned causes apart
 * (creation call sites only read the assignedTo/assignedAt/
 * assignedBy/assignedEmail fields and are unaffected):
 * - 'no-candidates': the pick ran and found no available agent.
 * - 'error' (+ `routingError`): the pick threw. The old code
 *   collapsed this into the same shape as no-candidates, so the UI
 *   blamed every stayed row on "no available agent".
 */
export async function assignNext(db, ownerUid, { branchId = '' } = {}) {
  const fallback = { assignedTo: '', assignedAt: '', assignedBy: '', assignedEmail: '' }
  if (!db || !ownerUid) {
    return { ...fallback, routing: 'error', routingError: 'routing unavailable' }
  }
  try {
    const membersCol = db.collection('users').doc(ownerUid).collection('members')
    const settingsRef = db
      .collection('users')
      .doc(ownerUid)
      .collection('settings')
      .doc('workspace')

    // List + pointer read outside the transaction (see header: a
    // collection ref inside tx.get() throws).
    const settingsSnap = await settingsRef.get()
    const pointerUid = settingsSnap.exists
      ? (settingsSnap.data()?.roundRobin?.pointerUid || '')
      : ''
    const membersSnap = await membersCol.get()
    const candidates = membersSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(m => {
        if (m.available !== true) return false
        if (m.role === 'sales_rep') return true
        if (m.role === 'admin' && m.takesLeads === true) return true
        return false
      })
      .filter(m => !branchId || (m.branchId || '') === branchId)

    if (!candidates.length) return { ...fallback, routing: 'no-candidates' }

    // Rank: least-loaded first; ties break by the rotation pointer
    // (first member-id after the pointer, wrapping to the start).
    const byCount = [...candidates]
      .map(m => ({ ...m, count: typeof m.assignedCount === 'number' ? m.assignedCount : 0 }))
      .sort((a, b) => a.count - b.count)
    const ranked = []
    for (let i = 0; i < byCount.length;) {
      let j = i
      while (j < byCount.length && byCount[j].count === byCount[i].count) j++
      const group = byCount.slice(i, j).map(m => m.id).sort()
      const after = pointerUid ? group.filter(id => id > pointerUid) : []
      const order = after.length
        ? [...after, ...group.filter(id => id <= pointerUid)]
        : group
      order.forEach(id => ranked.push(byCount.find(m => m.id === id)))
      i = j
    }

    // Try candidates in rank order; each attempt is one transaction
    // over doc refs only. A member who went unavailable since the
    // list read is skipped, not fatal. A transaction error (e.g.
    // rules) would hit every candidate the same way, so stop there
    // and surface it instead of burning through the list.
    let lastError = null
    let pickedId = null
    for (const candidate of ranked) {
      try {
        const result = await db.runTransaction(async tx => {
          const memberRef = membersCol.doc(candidate.id)
          const memberSnap = await tx.get(memberRef)
          if (!memberSnap.exists || memberSnap.data()?.available !== true) return null
          const freshCount = typeof memberSnap.data()?.assignedCount === 'number'
            ? memberSnap.data().assignedCount
            : 0
          tx.update(memberRef, { assignedCount: freshCount + 1 })
          tx.set(
            settingsRef,
            { roundRobin: { pointerUid: candidate.id, updatedAt: new Date().toISOString() } },
            { merge: true }
          )
          return candidate.id
        })
        if (result) { pickedId = result; break }
      } catch (e) {
        lastError = e
        break
      }
    }

    if (!pickedId) {
      if (lastError) throw lastError
      return { ...fallback, routing: 'no-candidates' }
    }

    // Email for the audit line ("assigned to <email>"). Read outside
    // the transaction; a failed read never blocks the assignment.
    let assignedEmail = ''
    try {
      const snap = await membersCol.doc(pickedId).get()
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
    return { ...fallback, routing: 'error', routingError: error?.message || String(error) }
  }
}
