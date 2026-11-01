import React, { useEffect, useState } from 'react'
import { useWorkspace } from './components/WorkspaceContext.jsx'
import { inScope } from './utils/workspace.js'
import { formatMoney } from './utils/money.js'
import { CURRENCY_CODES } from './utils/money.js'
import { LOSS_REASON_LABELS } from './components/LossReasonModal.jsx'
import {
  earlyWarnings,
  ghostingRows,
  decayPredictions,
  probabilityBands,
  rankedRecovery,
  forensicsByReason,
  competitorDepth,
  rejectionByMonth,
  attribution,
  vaultTotals,
} from './utils/recovery.js'
import './Recovery.css'

/**
 * Wave 3 — Recovery page (/app/recovery).
 *
 * One place for the recovery views: early warnings (#162), ghosting
 * (#34), decay prediction (#163), probability map (#164), ranked
 * recovery (#36), forensics (#24), competitor depth (#35), rejection
 * patterns (#43), attribution (#41), proof vault (#42), and ROI (#40).
 * All computations are pure views over scoped data the user can
 * already see (same role-scoped inquiry query as the Inquiries page).
 * Scores are heuristic estimates from the rules-based win-back engine,
 * labelled as such — never conversion promises.
 */

function money(value, currency) {
  return formatMoney(Number(value) || 0, currency)
}

export default function Recovery() {
  const { workspace, loading: wsLoading } = useWorkspace()
  const [items, setItems] = useState([])
  const [offers, setOffers] = useState([])
  const [memberEmail, setMemberEmail] = useState({})
  const [currency, setCurrency] = useState('INR')

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
        if (!cancelled) {
          setItems(
            snapshot.docs
              .map(doc => ({ id: doc.id, ...doc.data() }))
              .filter(item => inScope(item, workspace, uid))
          )
        }
      } catch (error) {
        console.error('Recovery inquiries load failed:', error)
        if (!cancelled) setItems([])
      }
      try {
        const offersSnap = await db
          .collection('offers')
          .where('ownerUid', '==', workspace.ownerUid)
          .get()
        if (!cancelled) {
          setOffers(offersSnap.docs.map(d => ({ id: d.id, ...d.data() })))
        }
      } catch {
        if (!cancelled) setOffers([])
      }
      try {
        const membersSnap = await db
          .collection('users')
          .doc(workspace.ownerUid)
          .collection('members')
          .get()
        if (!cancelled) {
          const map = {}
          membersSnap.docs.forEach(d => {
            map[d.id] = d.data()?.email || d.id
          })
          setMemberEmail(map)
        }
      } catch {
        if (!cancelled) setMemberEmail({})
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
      } catch {
        // Currency falls back to INR.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [wsLoading, workspace])

  // Snapshot timestamp, captured once per mount (Date.now() directly
  // in render trips the purity lint; a lazy initializer does not).
  const [now] = useState(() => Date.now())
  const warnings = earlyWarnings(items, now).slice(0, 10)
  const ghosts = ghostingRows(items, now).slice(0, 10)
  const decay = decayPredictions(items, now).slice(0, 15)
  const bands = probabilityBands(items)
  const ranked = rankedRecovery(items, 20)
  const lost = items.filter(i => i.status === 'lost')
  const recovered = items.filter(i => i.status === 'recovered')
  const forensics = forensicsByReason(lost, LOSS_REASON_LABELS)
  const competitor = competitorDepth(lost)
  const patterns = rejectionByMonth(lost)
  const attrib = attribution(recovered, memberEmail)
  const vault = vaultTotals(recovered, offers)
  const redeemedOffers = offers.filter(o => Number(o.recoveredValue) > 0)

  return (
    <div className="settings-page">
      <div className="settings-inner">
        <header className="settings-header">
          <div>
            <span className="app-eyebrow">RECOVERY</span>
            <h1>Recovery</h1>
            <p>
              Everything about winning back quiet and lost leads, in one
              place. Scores are heuristic estimates from the rules-based
              win-back engine — a guide for where to act first, not a
              promise of conversion.
            </p>
          </div>
        </header>

        <section className="settings-card">
          <span className="settings-label">EARLY WARNINGS</span>
          <h2>About to rot (quiet 21–29 days)</h2>
          {warnings.length === 0 ? (
            <p>No early warnings — nothing is about to rot.</p>
          ) : (
            <ul className="rec-list">
              {warnings.map(row => (
                <li key={row.item.id}>
                  {row.item.name} — {row.item.service} — quiet {row.quietDays}{' '}
                  days — {money(row.item.value, currency)}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="settings-card">
          <span className="settings-label">GHOSTING</span>
          <h2>Replied, then silent 14+ days</h2>
          {ghosts.length === 0 ? (
            <p>No ghosting detected.</p>
          ) : (
            <ul className="rec-list">
              {ghosts.map(row => (
                <li key={row.item.id}>
                  {row.item.name} — {row.item.service} — silent {row.quietDays}{' '}
                  days — {money(row.item.value, currency)}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="settings-card">
          <span className="settings-label">DECAY PREDICTION</span>
          <h2>Score if nothing happens</h2>
          {decay.length === 0 ? (
            <p>No open inquiries to predict.</p>
          ) : (
            <ul className="rec-list">
              {decay.map(row => (
                <li key={row.item.id}>
                  {row.item.name} — now {row.now} → 7 days {row.in7} → 14
                  days {row.in14}
                  {row.noAge && ' (no age data — flat line)'}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="settings-card">
          <span className="settings-label">PROBABILITY MAP</span>
          <h2>Open pipeline by win-back band</h2>
          <ul className="rec-list">
            {bands.map(band => (
              <li key={band.id}>
                <span className={`rec-chip rec-chip-${band.id}`}>
                  {band.id}
                </span>{' '}
                {band.label}: {band.count} leads — {money(band.value, currency)}
              </li>
            ))}
          </ul>
        </section>

        <section className="settings-card">
          <span className="settings-label">RANKED RECOVERY</span>
          <h2>Act on these first</h2>
          {ranked.length === 0 ? (
            <p>Nothing to rank.</p>
          ) : (
            <ol className="rec-ranked">
              {ranked.map(row => (
                <li key={row.inquiry.id}>
                  {row.inquiry.name} — {row.inquiry.service} —{' '}
                  <span className="rec-score">{row.score}</span>
                  {row.reasons[0] ? ` — ${row.reasons[0]}` : ''}
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="settings-card">
          <span className="settings-label">FORENSICS</span>
          <h2>Why leads were lost</h2>
          {forensics.byReason.length === 0 ? (
            <p>No lost leads yet.</p>
          ) : (
            <>
              <ul className="rec-list">
                {forensics.byReason.map(row => (
                  <li key={row.label}>
                    {row.label}: {row.count} leads — {money(row.value, currency)}
                  </li>
                ))}
              </ul>
              <h3>Top services lost</h3>
              <ul className="rec-list">
                {forensics.byService.map(row => (
                  <li key={row.service}>
                    {row.service}: {row.count} leads — {money(row.value, currency)}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="settings-card">
          <span className="settings-label">COMPETITOR LOSSES</span>
          <h2>What competitors took</h2>
          {competitor.count === 0 ? (
            <p>No competitor losses recorded.</p>
          ) : (
            <>
              <p>
                {competitor.count} leads — {money(competitor.value, currency)}
                {competitor.latestMs
                  ? ` — most recent ${new Date(competitor.latestMs).toISOString().slice(0, 10)}`
                  : ''}
              </p>
              <ul className="rec-list">
                {competitor.services.map(row => (
                  <li key={row.service}>
                    {row.service}: {row.count}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="settings-card">
          <span className="settings-label">REJECTION PATTERNS</span>
          <h2>Losses by month and reason</h2>
          {patterns.length === 0 ? (
            <p>No lost leads yet.</p>
          ) : (
            <ul className="rec-list">
              {patterns.map(row => (
                <li key={row.month}>
                  {row.month}:{' '}
                  {Object.entries(row.reasons)
                    .map(
                      ([reason, count]) =>
                        `${LOSS_REASON_LABELS[reason] || reason} ${count}`
                    )
                    .join(' · ')}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="settings-card">
          <span className="settings-label">ATTRIBUTION</span>
          <h2>Recovered value, by source and rep</h2>
          {recovered.length === 0 ? (
            <p>Nothing recovered yet.</p>
          ) : (
            <>
              <h3>By source</h3>
              <ul className="rec-list">
                {attrib.bySource.map(row => (
                  <li key={row.key}>
                    {row.key}: {row.count} — {money(row.value, currency)}
                  </li>
                ))}
              </ul>
              <h3>By rep</h3>
              <ul className="rec-list">
                {attrib.byRep.map(row => (
                  <li key={row.key}>
                    {row.key}: {row.count} — {money(row.value, currency)}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="settings-card">
          <span className="settings-label">PROOF VAULT</span>
          <h2>Recovery evidence, in one place</h2>
          <p>
            {vault.recoveredCount} recovered — {money(vault.recoveredValue, currency)}
            {' · '}
            {vault.claimedOffers} offers redeemed — {money(vault.claimedValue, currency)}{' '}
            claimed
          </p>
          {recovered.length > 0 && (
            <ul className="rec-list">
              {recovered.slice(0, 10).map(row => (
                <li key={row.id}>
                  {row.name} — {row.service} — {money(row.value, currency)}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="settings-card">
          <span className="settings-label">ROI</span>
          <h2>Return on recovery offers</h2>
          <p>
            {offers.length} offers sent · {redeemedOffers.length} redeemed ·{' '}
            {money(vault.claimedValue, currency)} recovered through offers
          </p>
          <p className="rec-meta">
            Note: offer discounts are free text, not amounts, so a numeric
            ROI ratio against discount cost is not computed — this
            section tracks the return side. Cost-side ROI needs numeric
            discount amounts on offers.
          </p>
        </section>
      </div>
    </div>
  )
}
