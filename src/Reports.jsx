import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkspace } from './components/WorkspaceContext.jsx'
import { canManageTeam, inScope, roleLabel } from './utils/workspace.js'
import {
  CURRENCY_CODES,
  defaultCurrencyForBrowser,
  formatMoney,
} from './utils/money.js'
import {
  aggregateByBranch,
  aggregateByMember,
  summarizeInquiries,
} from './utils/reports.js'
import './Reports.css'

/**
 * Reports — #115 Branch Comparison Dashboard + #70 per-branch
 * performance rollup (Branches view) and #116 Salesperson Comparison
 * + #89 scorecards (Team view).
 *
 * Access mirrors the rest of the app: every role may open the page,
 * but the inquiries query is scoped server-side exactly like
 * Inquiries/Customers/Revenue (rep: assignedTo == uid; branch
 * manager: branchId == their branch; owner/admin: all), with
 * inScope() as belt-and-braces — Firestore rules are not filters, so
 * an unscoped get would be denied outright for staff. On top of
 * that, Sales Reps see only their own row in the Team view, and
 * Branch Managers see scorecards for their own branch's members.
 * Recovery rate is recovered ÷ closed (recovered + lost), the
 * teamInsights.js definition; '—' when nothing has closed yet.
 */
export default function Reports() {
  const navigate = useNavigate()
  const { workspace, loading: wsLoading, user } = useWorkspace()

  const [view, setView] = useState('branches')
  const [items, setItems] = useState([])
  const [members, setMembers] = useState([])
  const [branches, setBranches] = useState([])
  const [currency, setCurrency] = useState(() => defaultCurrencyForBrowser())
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (wsLoading || !workspace) return undefined
    const db = window.firebase?.firestore?.()
    if (!db) return undefined
    let cancelled = false
    ;(async () => {
      try {
        const uid = window.firebase?.auth?.().currentUser?.uid
        let query = db
          .collection('users')
          .doc(workspace.ownerUid)
          .collection('inquiries')
        if (workspace.role === 'sales_rep') {
          query = query.where('assignedTo', '==', uid || '')
        } else if (workspace.role === 'branch_manager') {
          query = query.where('branchId', '==', workspace.branchId || '')
        }
        const snapshot = await query.get()
        if (cancelled) return
        setItems(
          snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(item => inScope(item, workspace, uid))
        )
      } catch (error) {
        console.error('Reports load failed:', error)
        if (!cancelled) {
          setItems([])
          setLoadError('Unable to load reports. Please try again.')
        }
      }

      // Members resolve assignee uids to names (Team.jsx pattern:
      // users/{ownerUid}/members). The list is owner/admin-readable;
      // staff may be denied — their rows then fall back gracefully
      // (a rep's own row is seeded from their session below).
      try {
        const membersSnap = await db
          .collection('users')
          .doc(workspace.ownerUid)
          .collection('members')
          .get()
        if (!cancelled) {
          setMembers(
            membersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          )
        }
      } catch (error) {
        console.error('Reports members load failed:', error)
        if (!cancelled) setMembers([])
      }

      try {
        const branchesSnap = await db
          .collection('users')
          .doc(workspace.ownerUid)
          .collection('settings')
          .doc('branches')
          .get()
        if (!cancelled) {
          setBranches(
            branchesSnap.exists ? branchesSnap.data()?.branches || [] : []
          )
        }
      } catch (error) {
        console.error('Reports branches load failed:', error)
      }

      try {
        const settingsSnap = await db
          .collection('users')
          .doc(workspace.ownerUid)
          .collection('settings')
          .doc('workspace')
          .get()
        const savedCurrency = settingsSnap.exists
          ? settingsSnap.data()?.currency
          : undefined
        if (!cancelled && CURRENCY_CODES.includes(savedCurrency)) {
          setCurrency(savedCurrency)
        }
      } catch (error) {
        console.error('Reports currency load failed:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [wsLoading, workspace])

  const role = workspace?.role
  const myUid = user?.uid || ''
  // Firebase absent (or workspace never resolved): the load effect
  // above no-ops, so surface the unavailable state from render
  // instead of spinning on "Loading…" forever.
  const dataUnavailable =
    !wsLoading && (!workspace || !window.firebase?.firestore?.())
  const showLoading = loading && !dataUnavailable
  const showError = dataUnavailable
    ? 'Workspace data is unavailable right now.'
    : loadError

  // Team-view seeding: managers see their branch's members; a rep's
  // own member doc may be unreadable to them, so seed their row from
  // the session — otherwise their inquiries would fold into
  // "Unassigned" in their own scorecard.
  let seedMembers = members
  if (role === 'branch_manager') {
    seedMembers = members.filter(
      member => (member.branchId || '') === (workspace.branchId || '')
    )
  }
  if (
    role === 'sales_rep' &&
    myUid &&
    !seedMembers.some(member => member.id === myUid)
  ) {
    seedMembers = [
      ...seedMembers,
      {
        id: myUid,
        email: user?.email || '',
        role: 'sales_rep',
        branchId: workspace.branchId || '',
      },
    ]
  }

  const totals = summarizeInquiries(items)
  const branchRows = aggregateByBranch(items, branches)

  let teamRows = aggregateByMember(items, seedMembers, {
    ownerUid: canManageTeam(role) ? workspace?.ownerUid : undefined,
    ownerEmail: canManageTeam(role) ? user?.email || '' : undefined,
  })
  if (role === 'sales_rep') {
    teamRows = teamRows.filter(row => row.memberId === myUid)
  }

  const rows = view === 'branches' ? branchRows : teamRows
  const rateLabel = rate => (rate === null ? '—' : `${rate}%`)

  return (
    <div className="reports-page">
      <div className="reports-inner">
        <header className="reports-header">
          <div>
            <span className="app-eyebrow">REPORTS</span>
            <h1>Reports</h1>
            <p>Compare branches and salespeople on the same numbers.</p>
          </div>
          <button
            className="primary-button"
            onClick={() => navigate('/app/inquiries')}
          >
            Back to inquiries
          </button>
        </header>

        <div className="reports-tabs" role="tablist" aria-label="Report view">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'branches'}
            className={view === 'branches' ? 'reports-tab active' : 'reports-tab'}
            onClick={() => setView('branches')}
          >
            Branches
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'team'}
            className={view === 'team' ? 'reports-tab active' : 'reports-tab'}
            onClick={() => setView('team')}
          >
            Team
          </button>
        </div>

        {role === 'sales_rep' && (
          <p className="reports-scope-note">
            Showing inquiries assigned to you.
            {view === 'team' ? ' The Team view shows only your own scorecard.' : ''}
          </p>
        )}
        {role === 'branch_manager' && (
          <p className="reports-scope-note">
            Showing your branch{workspace?.branchId ? ` (${workspace.branchId})` : ''} only.
          </p>
        )}

        <section className="reports-stats">
          <div className="reports-stat featured">
            <span>Recovered revenue</span>
            <strong>{formatMoney(totals.recoveredRevenue, currency)}</strong>
            <small>From {totals.recovered} recovered {totals.recovered === 1 ? 'inquiry' : 'inquiries'}</small>
          </div>
          <div className="reports-stat">
            <span>Total inquiries</span>
            <strong>{totals.total}</strong>
            <small>In this view&rsquo;s scope</small>
          </div>
          <div className="reports-stat">
            <span>Open</span>
            <strong>{totals.open}</strong>
            <small>Still being worked</small>
          </div>
          <div className="reports-stat">
            <span>Recovery rate</span>
            <strong>{rateLabel(totals.recoveryRate)}</strong>
            <small>Recovered of closed inquiries</small>
          </div>
        </section>

        <section className="reports-panel">
          <div className="reports-toolbar">
            <div>
              <h2>{view === 'branches' ? 'Branch comparison' : 'Team scorecards'}</h2>
              <p>
                {view === 'branches'
                  ? `${branchRows.length} ${branchRows.length === 1 ? 'branch' : 'branches'}`
                  : `${teamRows.length} ${teamRows.length === 1 ? 'person' : 'people'}`}
              </p>
            </div>
          </div>

          {showLoading && <div className="reports-empty">Loading reports…</div>}

          {!showLoading && showError && (
            <div className="reports-empty">{showError}</div>
          )}

          {!showLoading && !showError && rows.length === 0 && (
            <div className="reports-empty">
              {view === 'branches'
                ? 'No branches or inquiries yet. Branches are managed on the Team page; inquiries appear here as they are created.'
                : 'No team activity yet. Scorecards appear once inquiries are assigned.'}
            </div>
          )}

          {!showLoading && !showError && rows.length > 0 && view === 'branches' && (
            <div className="reports-table-wrap">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Branch</th>
                    <th>Total</th>
                    <th>Open</th>
                    <th>Recovered</th>
                    <th>Lost</th>
                    <th>Recovery rate</th>
                    <th>Recovered revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {branchRows.map(row => (
                    <tr key={row.branchId || '__unassigned__'} className={row.isUnassigned ? 'reports-row-unassigned' : undefined}>
                      <td><strong>{row.branch}</strong></td>
                      <td>{row.total}</td>
                      <td>{row.open}</td>
                      <td>{row.recovered}</td>
                      <td>{row.lost}</td>
                      <td>{rateLabel(row.recoveryRate)}</td>
                      <td><strong>{formatMoney(row.recoveredRevenue, currency)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!showLoading && !showError && rows.length > 0 && view === 'team' && (
            <div className="reports-table-wrap">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Salesperson</th>
                    <th>Assigned</th>
                    <th>Open</th>
                    <th>Recovered</th>
                    <th>Lost</th>
                    <th>Recovery rate</th>
                    <th>Recovered revenue</th>
                    <th>Follow-ups due today</th>
                  </tr>
                </thead>
                <tbody>
                  {teamRows.map(row => (
                    <tr key={row.memberId || '__unassigned__'} className={row.isUnassigned ? 'reports-row-unassigned' : undefined}>
                      <td>
                        <strong>{row.name}</strong>
                        {row.role && <span className="reports-role">{roleLabel(row.role)}</span>}
                      </td>
                      <td>{row.assigned}</td>
                      <td>{row.open}</td>
                      <td>{row.recovered}</td>
                      <td>{row.lost}</td>
                      <td>{rateLabel(row.recoveryRate)}</td>
                      <td><strong>{formatMoney(row.recoveredRevenue, currency)}</strong></td>
                      <td>{row.followupsDueToday}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="reports-footnote">
          Recovery rate counts closed inquiries only (recovered ÷ recovered + lost) —
          open inquiries have not had their chance yet, so they are excluded rather
          than counted as failures. Recovered revenue is the value of recovered inquiries.
        </p>
      </div>
    </div>
  )
}
