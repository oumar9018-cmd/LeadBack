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
 *
 * #12 — Workload mode (settings/routing doc, Team page card):
 * 'balanced' (default) ranks by lifetime assignedCount; 'workload'
 * ranks by live OPEN inquiries (status new/followup/replied) with an
 * optional capacity cap. The open-count query reads the whole open
 * set once per creation — fine at this app's scale; if open volume
 * ever grows huge, replace it with a per-member counter. A failed
 * workload query falls back to balanced ranking, never to unassigned.
 */

/** Shared rank: lowest count first; ties rotate by the pointer. */
function rankByCount(items, getCount, pointerUid) {
  const withCount = items
    .map(m => ({ ...m, count: getCount(m) }))
    .sort((a, b) => a.count - b.count)
  const ranked = []
  for (let i = 0; i < withCount.length;) {
    let j = i
    while (j < withCount.length && withCount[j].count === withCount[i].count) j++
    const group = withCount.slice(i, j).map(m => m.id).sort()
    const after = pointerUid ? group.filter(id => id > pointerUid) : []
    const order = after.length
      ? [...after, ...group.filter(id => id <= pointerUid)]
      : group
    order.forEach(id => ranked.push(withCount.find(m => m.id === id)))
    i = j
  }
  return ranked
}

/** Balanced ranking: lifetime routed count (today's behaviour). */
export function rankBalanced(candidates, pointerUid) {
  return rankByCount(
    candidates,
    m => (typeof m.assignedCount === 'number' ? m.assignedCount : 0),
    pointerUid
  )
}

/**
 * Workload ranking: fewest OPEN leads first. Reps at capacity are
 * skipped — unless every candidate is at capacity, in which case the
 * cap is ignored (routing never strands a row while reps exist).
 */
export function rankByOpenLoad(candidates, openCounts, pointerUid, capacity) {
  const cap = Number(capacity)
  let eligible = candidates
  if (Number.isInteger(cap) && cap > 0) {
    const under = candidates.filter(m => (openCounts[m.id] || 0) < cap)
    if (under.length > 0) eligible = under
  }
  return rankByCount(eligible, m => openCounts[m.id] || 0, pointerUid)
}

async function countOpenByAssignee(db, ownerUid) {
  const snap = await db
    .collection('users')
    .doc(ownerUid)
    .collection('inquiries')
    .where('status', 'in', ['new', 'followup', 'replied'])
    .get()
  const counts = {}
  snap.docs.forEach(d => {
    const assignee = d.data()?.assignedTo
    if (assignee) counts[assignee] = (counts[assignee] || 0) + 1
  })
  return counts
}

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
    // #12 — routing mode + capacity (settings/routing doc). Any read
    // failure means balanced, today's behaviour.
    let routingMode = 'balanced'
    let routingCapacity = 0
    try {
      const routingSnap = await db
        .collection('users')
        .doc(ownerUid)
        .collection('settings')
        .doc('routing')
        .get()
      if (routingSnap.exists) {
        const data = routingSnap.data() || {}
        if (data.mode === 'workload') routingMode = 'workload'
        const cap = Number(data.capacity)
        if (Number.isInteger(cap) && cap >= 0) routingCapacity = cap
      }
    } catch (e) {
      console.error('Routing settings read failed, using balanced:', e)
    }
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
    // Balanced = lifetime routed count; workload = live open leads.
    let ranked
    if (routingMode === 'workload') {
      try {
        const openCounts = await countOpenByAssignee(db, ownerUid)
        ranked = rankByOpenLoad(candidates, openCounts, pointerUid, routingCapacity)
      } catch (e) {
        console.error('Workload counts failed, falling back to balanced:', e)
        ranked = rankBalanced(candidates, pointerUid)
      }
    } else {
      ranked = rankBalanced(candidates, pointerUid)
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
      routingMode,
    }
  } catch (error) {
    console.error('Round-robin assignment failed, leaving unassigned:', error)
    return { ...fallback, routing: 'error', routingError: error?.message || String(error) }
  }
}
