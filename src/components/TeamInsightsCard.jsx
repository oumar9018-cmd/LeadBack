import { useEffect, useState } from 'react'
import { useWorkspace } from './WorkspaceContext.jsx'
import { promiseScores, repPerformance } from '../utils/teamInsights.js'
import './AutomationLists.css'
import '../Recovery.css'

/**
 * #23 + #56 — Team analytics (owner/admin page only).
 *
 * Promise scores: kept vs broken callbacks per rep, from follow-up
 * history (attributed to the currently assigned rep — history does not
 * record who scheduled). Rep performance: assigned / recovered / lost /
 * open per rep with a recovery rate over closed leads. Both are
 * read-only aggregates; no new data is written.
 */
export default function TeamInsightsCard() {
  const { workspace, loading: wsLoading } = useWorkspace()
  const [items, setItems] = useState(null)

  useEffect(() => {
    if (wsLoading || !workspace) return
    const db = window.firebase?.firestore?.()
    if (!db) return
    db.collection('users')
      .doc(workspace.ownerUid)
      .collection('inquiries')
      .get()
      .then(snap => setItems(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => setItems([]))
  }, [wsLoading, workspace])

  const promises = items ? promiseScores(items) : []
  const perf = items ? repPerformance(items) : []

  return (
    <div className="settings-card">
      <div className="settings-card-header">
        <div>
          <h2>Team insights</h2>
          <p>Promise scores and rep performance — from follow-up history.</p>
        </div>
      </div>

      {!items && <p>Loading team insights…</p>}

      {items && (
        <>
          <h3>Promise scores</h3>
          {promises.length === 0 ? (
            <p>No scheduled follow-ups on record yet.</p>
          ) : (
            <ul className="auto-list">
              {promises.map(row => (
                <li key={row.rep}>
                  <strong>{row.rep}</strong> — {row.kept} kept, {row.broken}{' '}
                  broken, {row.pending} pending
                  {row.score !== null && (
                    <span className="rec-score">{row.score}%</span>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="rec-meta">
            Attributed to the currently assigned rep — history does not
            record who scheduled. A promise counts as kept when the rep
            acted afterwards or the lead replied/recovered.
          </p>

          <h3>Rep performance</h3>
          {perf.length === 0 ? (
            <p>No inquiries on record yet.</p>
          ) : (
            <ul className="auto-list">
              {perf.map(row => (
                <li key={row.rep}>
                  <strong>{row.rep}</strong> — {row.assigned} assigned,{' '}
                  {row.recovered} recovered, {row.lost} lost, {row.open} open
                  {row.recoveryRate !== null &&
                    ` — ${row.recoveryRate}% recovery`}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
