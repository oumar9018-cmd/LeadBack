// #23 + #56 — team analytics (pure, unit-tested).
//
// #23 promise score: a promise is a followupHistory entry of type
// 'scheduled'. It counts as KEPT when the rep acted afterwards (any
// later history entry) or the lead replied/recovered; BROKEN when its
// date passed with no later action; PENDING while its date is ahead.
// Attribution note (shown in the UI): history does not record WHO
// scheduled, so promises are attributed to the currently assigned rep.
// #56 rep performance: assigned / recovered / lost / open per rep,
// with a recovery rate over closed leads only.

export function promiseScores(items, nowMs = Date.now()) {
  const perRep = new Map()
  for (const item of items || []) {
    const history = Array.isArray(item.followupHistory)
      ? item.followupHistory
      : []
    const rep = item.assignedTo || 'Unassigned'
    history.forEach((entry, idx) => {
      if (entry.type !== 'scheduled') return
      const dueMs = Date.parse(`${entry.date || ''}T${entry.time || '10:00'}`)
      const later = history.slice(idx + 1).length > 0
      const outcome = item.status === 'replied' || item.status === 'recovered'
      const kept = outcome || later
      let kind
      if (kept) kind = 'kept'
      else if (Number.isFinite(dueMs) && dueMs <= nowMs) kind = 'broken'
      else kind = 'pending'
      const agg = perRep.get(rep) || { rep, kept: 0, broken: 0, pending: 0 }
      agg[kind]++
      perRep.set(rep, agg)
    })
  }
  return [...perRep.values()]
    .map(agg => ({
      ...agg,
      promised: agg.kept + agg.broken + agg.pending,
      score:
        agg.kept + agg.broken > 0
          ? Math.round((agg.kept / (agg.kept + agg.broken)) * 100)
          : null,
    }))
    .sort((a, b) => b.promised - a.promised)
}

export function repPerformance(items) {
  const perRep = new Map()
  for (const item of items || []) {
    const rep = item.assignedTo || 'Unassigned'
    const agg = perRep.get(rep) || {
      rep,
      assigned: 0,
      recovered: 0,
      lost: 0,
      open: 0,
    }
    agg.assigned++
    if (item.status === 'recovered') agg.recovered++
    else if (item.status === 'lost') agg.lost++
    else agg.open++
    perRep.set(rep, agg)
  }
  return [...perRep.values()]
    .map(agg => ({
      ...agg,
      closed: agg.recovered + agg.lost,
      recoveryRate:
        agg.recovered + agg.lost > 0
          ? Math.round((agg.recovered / (agg.recovered + agg.lost)) * 100)
          : null,
    }))
    .sort((a, b) => b.recovered - a.recovered)
}
