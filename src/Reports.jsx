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
import { getSlaAnalytics, loadSlaSettings } from './utils/sla.js'
import { buildDigest, formatDigestText } from './utils/digest.js'
import {
  loadTargets,
  monthKeyFromMs,
  monthLabelFromMs,
  monthlyRecoveryByBranch,
  monthlyRecoveryByMember,
  paceForecast,
  targetProgress,
} from './utils/targets.js'
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
  const [slaHours, setSlaHours] = useState(0)
  const [copied, setCopied] = useState(false)
  const [digestNow, setDigestNow] = useState(null)
  const [slaNow, setSlaNow] = useState(null)
  const [targets, setTargets] = useState({ reps: {}, branches: {} })
  const [monthNow, setMonthNow] = useState(null)
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

      // SLA target for the Digest tab (settings/sla doc). 0 = SLA
      // off, so no breaches are claimed until the real setting is
      // known; loadSlaSettings itself falls back to its default.
      try {
        const sla = await loadSlaSettings(db, workspace.ownerUid)
        if (!cancelled) setSlaHours(sla.firstResponseHours)
      } catch (error) {
        console.error('Reports SLA settings load failed:', error)
      }

      // Monthly targets (settings/targets doc) for the this-month
      // progress columns. No doc yet = no targets; progress then
      // shows actuals only.
      try {
        const loadedTargets = await loadTargets(db, workspace.ownerUid)
        if (!cancelled) setTargets(loadedTargets)
      } catch (error) {
        console.error('Reports targets load failed:', error)
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
        if (!cancelled) {
          setLoading(false)
          // Pin the "this month" snapshot to the load moment (the
          // digest/sla pattern) so month math stays stable in render.
          setMonthNow(Date.now())
        }
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

  // This-month progress vs targets (settings/targets). Month figures
  // count inquiries marked recovered in the current month, by their
  // recoveredAt date — the same items/scope as the scorecards, just
  // bucketed by month. The snapshot is pinned at load / tab-open
  // (monthNow) so the math is stable while viewing.
  const monthKey = monthNow !== null ? monthKeyFromMs(monthNow) : null
  const monthLabel = monthNow !== null ? monthLabelFromMs(monthNow) : ''
  const monthMemberById = new Map(
    (monthKey
      ? monthlyRecoveryByMember(items, seedMembers, {
          ownerUid: canManageTeam(role) ? workspace?.ownerUid : undefined,
          ownerEmail: canManageTeam(role) ? user?.email || '' : undefined,
          monthKey,
        })
      : []
    ).map(row => [row.memberId, row])
  )
  const monthBranchById = new Map(
    (monthKey ? monthlyRecoveryByBranch(items, branches, monthKey) : []).map(
      row => [row.branchId, row]
    )
  )
  const pace = monthNow !== null ? paceForecast(items, monthNow) : null

  /** One cell of month progress: actuals always; a percentage only
   *  when a target exists for that part. */
  const monthProgressText = (month, target) => {
    const revenue = month?.recoveredRevenue || 0
    const count = month?.recoveredCount || 0
    if (!target) {
      return `${formatMoney(revenue, currency)} · ${count} recovered · no target set`
    }
    const parts = []
    if (target.revenue > 0) {
      parts.push(
        `${formatMoney(revenue, currency)} of ${formatMoney(target.revenue, currency)} (${targetProgress(revenue, target.revenue)}%)`
      )
    } else {
      parts.push(formatMoney(revenue, currency))
    }
    if (target.count > 0) {
      parts.push(`${count} of ${target.count} recoveries`)
    } else {
      parts.push(`${count} recovered`)
    }
    return parts.join(' · ')
  }

  const rows =
    view === 'branches' ? branchRows : view === 'team' ? teamRows : []
  const rateLabel = rate => (rate === null ? '—' : `${rate}%`)

  // Digest view: every figure is computed from the same scoped
  // items the other tabs use — rep/manager scoping already applied
  // at load, so the digest inherits it. The "as of" timestamp is
  // captured when the tab is opened (see the tab onClick), so the
  // digest is a stable snapshot for that viewing, not a moving
  // render-time value.
  const digest =
    view === 'digest' && digestNow !== null
      ? buildDigest(items, {
          members: seedMembers,
          branches,
          slaHours,
          nowMs: digestNow,
        })
      : null

  // SLA view: same scoped items and the workspace's real SLA target
  // (settings/sla). The snapshot is pinned to the moment the tab is
  // opened, like the digest. slaHours starts at 0 and loadSlaSettings
  // resolves the real value (0 only when the workspace turned SLA
  // off), so the tab waits for loading before claiming "off".
  const sla =
    view === 'sla' && slaNow !== null
      ? getSlaAnalytics(items, slaHours, {
          members: seedMembers,
          ownerUid: workspace?.ownerUid,
          ownerEmail: canManageTeam(role) ? user?.email || '' : '',
          nowMs: slaNow,
        })
      : null
  const slaRateLabel = window =>
    !window || window.breachRate === null
      ? '—'
      : `${window.breachRate}%`

  const copyDigest = async () => {
    if (!digest) return
    const text = formatDigestText(digest, currency)
    let ok = false
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        ok = true
      }
    } catch (error) {
      console.error('Digest clipboard write failed:', error)
    }
    if (!ok) {
      try {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        ok = document.execCommand('copy')
        document.body.removeChild(textarea)
      } catch (error) {
        console.error('Digest copy fallback failed:', error)
      }
    }
    if (ok) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    }
  }

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
            onClick={() => {
              setMonthNow(Date.now())
              setView('branches')
            }}
          >
            Branches
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'team'}
            className={view === 'team' ? 'reports-tab active' : 'reports-tab'}
            onClick={() => {
              setMonthNow(Date.now())
              setView('team')
            }}
          >
            Team
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'digest'}
            className={view === 'digest' ? 'reports-tab active' : 'reports-tab'}
            onClick={() => {
              setDigestNow(Date.now())
              setView('digest')
            }}
          >
            Digest
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'sla'}
            className={view === 'sla' ? 'reports-tab active' : 'reports-tab'}
            onClick={() => {
              setSlaNow(Date.now())
              setView('sla')
            }}
          >
            SLA
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

        {view !== 'digest' && view !== 'sla' && (
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

          {pace && !showLoading && !showError && (
            <div className="digest-highlights">
              <p>
                {monthLabel} pace:{' '}
                <strong>{formatMoney(pace.recoveredRevenue, currency)}</strong>{' '}
                recovered in the first {pace.daysElapsed} of {pace.daysInMonth}{' '}
                days.{' '}
                {pace.ready ? (
                  <>
                    At this pace, the month projects to about{' '}
                    <strong>{formatMoney(pace.projectedRevenue, currency)}</strong>{' '}
                    ({pace.projectedCount} recoveries) — a pace estimate, not a
                    promise.
                  </>
                ) : (
                  <>No recoveries yet this month, so there is no pace to project.</>
                )}
              </p>
            </div>
          )}

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
                    <th>This month vs target</th>
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
                      <td>{monthProgressText(monthBranchById.get(row.branchId), row.isUnassigned ? null : targets.branches[row.branchId])}</td>
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
                    <th>This month vs target</th>
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
                      <td>{monthProgressText(monthMemberById.get(row.memberId), row.isUnassigned ? null : targets.reps[row.memberId])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        )}

        {view === 'digest' && digest && (
          <>
            <section className="reports-panel digest-panel">
              <div className="reports-toolbar">
                <div>
                  <h2>Manager digest</h2>
                  <p>For {digest.generatedForDate}</p>
                </div>
                <button
                  type="button"
                  className="primary-button"
                  onClick={copyDigest}
                  disabled={showLoading || !!showError}
                >
                  {copied ? 'Copied' : 'Copy summary'}
                </button>
              </div>

              {showLoading && <div className="reports-empty">Loading reports…</div>}

              {!showLoading && showError && (
                <div className="reports-empty">{showError}</div>
              )}

              {!showLoading && !showError && (
                <>
                  <section className="reports-stats digest-stats">
                    <div className="reports-stat">
                      <span>New inquiries (7 days)</span>
                      <strong>{digest.newLast7Days}</strong>
                      <small>Created in the last 7 days</small>
                    </div>
                    <div className="reports-stat">
                      <span>Recovered</span>
                      <strong>{digest.totals.recovered}</strong>
                      <small>{formatMoney(digest.totals.recoveredRevenue, currency)} recovered revenue</small>
                    </div>
                    <div className="reports-stat">
                      <span>Follow-ups due today</span>
                      <strong>{digest.dueToday.count}</strong>
                      <small>Open inquiries due today</small>
                    </div>
                    <div className="reports-stat">
                      <span>Overdue follow-ups</span>
                      <strong>{digest.overdue.count}</strong>
                      <small>{formatMoney(digest.overdue.totalValue, currency)} in overdue value</small>
                    </div>
                    <div className="reports-stat">
                      <span>SLA breaches</span>
                      <strong>{digest.slaBreaches.count}</strong>
                      <small>{slaHours > 0 ? `First response target ${slaHours}h` : 'SLA is off'}</small>
                    </div>
                    <div className="reports-stat">
                      <span>Unassigned open</span>
                      <strong>{digest.unassigned.count}</strong>
                      <small>{formatMoney(digest.unassigned.value, currency)} in open value</small>
                    </div>
                    <div className="reports-stat">
                      <span>Escalated</span>
                      <strong>{digest.escalated.count}</strong>
                      <small>Open inquiries escalated</small>
                    </div>
                  </section>

                  {(digest.topBranch || digest.topRep) && (
                    <div className="digest-highlights">
                      {digest.topBranch && (
                        <p>
                          Top branch: <strong>{digest.topBranch.branch}</strong> —{' '}
                          {formatMoney(digest.topBranch.recoveredRevenue, currency)} recovered
                          ({digest.topBranch.recovered} recovered)
                        </p>
                      )}
                      {digest.topRep && (
                        <p>
                          Top rep: <strong>{digest.topRep.name}</strong> —{' '}
                          {formatMoney(digest.topRep.recoveredRevenue, currency)} recovered
                          ({digest.topRep.recovered} recovered)
                        </p>
                      )}
                    </div>
                  )}

                  <div className="digest-lists">
                    <div className="digest-list">
                      <h3>Due today</h3>
                      {digest.dueToday.top.length === 0 ? (
                        <p className="digest-empty">No follow-ups due today.</p>
                      ) : (
                        <ul>
                          {digest.dueToday.top.map((row, index) => (
                            <li key={`${row.name}-${index}`}>
                              <span>{row.name}</span>
                              <strong>{formatMoney(row.value, currency)}</strong>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="digest-list">
                      <h3>Overdue follow-ups</h3>
                      {digest.overdue.top.length === 0 ? (
                        <p className="digest-empty">Nothing overdue — the queue is clean.</p>
                      ) : (
                        <ul>
                          {digest.overdue.top.map((row, index) => (
                            <li key={`${row.name}-${index}`}>
                              <span>{row.name}</span>
                              <strong>
                                {formatMoney(row.value, currency)} · {row.daysOverdue}d overdue
                              </strong>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="digest-list">
                      <h3>SLA breaches</h3>
                      {digest.slaBreaches.top.length === 0 ? (
                        <p className="digest-empty">No SLA breaches right now.</p>
                      ) : (
                        <ul>
                          {digest.slaBreaches.top.map((row, index) => (
                            <li key={`${row.name}-${index}`}>
                              <span>{row.name}</span>
                              <strong>{row.ageHours}h old</strong>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="digest-list">
                      <h3>Unassigned</h3>
                      {digest.unassigned.count === 0 ? (
                        <p className="digest-empty">No unassigned open inquiries — everything open has an owner.</p>
                      ) : (
                        <p className="digest-empty">
                          {digest.unassigned.count} open {digest.unassigned.count === 1 ? 'inquiry' : 'inquiries'} worth{' '}
                          {formatMoney(digest.unassigned.value, currency)} have no assignee yet.
                        </p>
                      )}
                    </div>

                    <div className="digest-list">
                      <h3>Escalated</h3>
                      {digest.escalated.names.length === 0 ? (
                        <p className="digest-empty">Nothing escalated right now.</p>
                      ) : (
                        <ul>
                          {digest.escalated.names.map((name, index) => (
                            <li key={`${name}-${index}`}>
                              <span>{name}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </>
              )}
            </section>

            <p className="reports-footnote">
              This digest is generated in-app from live data when the tab is opened —
              BackWon has no email scheduler, so nothing is sent automatically.
            </p>
          </>
        )}

        {view === 'sla' && (
          <>
            <section className="reports-panel">
              <div className="reports-toolbar">
                <div>
                  <h2>SLA centre — first response</h2>
                  <p>
                    {slaHours > 0
                      ? `Target: first response within ${slaHours}h of a new inquiry`
                      : 'No first-response target is set'}
                  </p>
                </div>
              </div>

              {showLoading && <div className="reports-empty">Loading reports…</div>}

              {!showLoading && showError && (
                <div className="reports-empty">{showError}</div>
              )}

              {!showLoading && !showError && slaHours <= 0 && (
                <div className="reports-empty">
                  The first-response SLA is off for this workspace. Turn it on
                  in Settings (SLA targets) and breaches will be tracked here.
                </div>
              )}

              {!showLoading && !showError && sla && sla.enabled && (
                <>
                  <section className="reports-stats digest-stats">
                    <div className="reports-stat">
                      <span>Breaching now</span>
                      <strong>{sla.live.breachedCount}</strong>
                      <small>
                        {sla.live.oldestBreachHours !== null
                          ? `Oldest is ${sla.live.oldestBreachHours}h old`
                          : 'Nothing past the target'}
                      </small>
                    </div>
                    <div className="reports-stat">
                      <span>At risk</span>
                      <strong>{sla.live.atRiskCount}</strong>
                      <small>Past 75% of the target, still unanswered</small>
                    </div>
                    <div className="reports-stat">
                      <span>Breach rate — 7 days</span>
                      <strong>{slaRateLabel(sla.windows.days7)}</strong>
                      <small>
                        {sla.windows.days7.breached} of {sla.windows.days7.judged} judged
                        inquiries never answered in time
                      </small>
                    </div>
                    <div className="reports-stat">
                      <span>Breach rate — 30 days</span>
                      <strong>{slaRateLabel(sla.windows.days30)}</strong>
                      <small>
                        {sla.windows.days30.breached} of {sla.windows.days30.judged} judged
                        inquiries never answered in time
                      </small>
                    </div>
                  </section>

                  {(sla.worstBranch || sla.worstRep) && (
                    <div className="digest-highlights">
                      {sla.worstBranch && (
                        <p>
                          Most breaches by branch: <strong>{sla.worstBranch.label}</strong> —{' '}
                          {sla.worstBranch.count} breaching now
                        </p>
                      )}
                      {sla.worstRep && (
                        <p>
                          Most breaches by person: <strong>{sla.worstRep.label}</strong> —{' '}
                          {sla.worstRep.count} breaching now
                        </p>
                      )}
                    </div>
                  )}

                  {sla.live.breached.length === 0 ? (
                    <div className="reports-empty">
                      No SLA breaches right now — every new inquiry is inside
                      the {sla.targetHours}h target.
                    </div>
                  ) : (
                    <div className="reports-table-wrap">
                      <table className="reports-table">
                        <thead>
                          <tr>
                            <th>Customer</th>
                            <th>Service</th>
                            <th>Branch</th>
                            <th>Assigned to</th>
                            <th>Age</th>
                            <th>Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sla.live.breached.map(row => (
                            <tr key={row.id}>
                              <td><strong>{row.name}</strong></td>
                              <td>{row.service || '—'}</td>
                              <td>{row.branch}</td>
                              <td>{row.assignee}</td>
                              <td>{row.ageHours !== null ? `${row.ageHours}h` : '—'}</td>
                              <td>{formatMoney(row.value, currency)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </section>

            <p className="reports-footnote">
              The 7/30-day windows count inquiries created in that period. An
              inquiry counts as breached only while it is still unanswered past
              the target; BackWon does not record a first-response time, so an
              inquiry answered late cannot be told apart from one answered on
              time — answered inquiries count as responded, and the rate is
              breaches ÷ inquiries old enough to judge, never a guess.
            </p>
          </>
        )}

        <p className="reports-footnote">
          Recovery rate counts closed inquiries only (recovered ÷ recovered + lost) —
          open inquiries have not had their chance yet, so they are excluded rather
          than counted as failures. Recovered revenue is the value of recovered inquiries.
        </p>

        <p className="reports-footnote">
          “This month” counts inquiries marked recovered in the current month, by
          their recovery date. Monthly targets are set in Settings and apply every
          month until changed. The pace projection simply scales this month’s
          daily recovery rate to the full month — an estimate, not a promise.
        </p>
      </div>
    </div>
  )
}
