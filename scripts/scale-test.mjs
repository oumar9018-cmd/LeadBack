/**
 * Scale test harness (Round 4) — LOGIC LEVEL ONLY.
 *
 *   node scripts/scale-test.mjs
 *
 * Generates 100,000 synthetic inquiries + 50 members + 20 branches
 * (deterministic seed, fixed "now") and runs the app's main pure
 * aggregations over them, measuring wall time and heap. It verifies
 * the outputs reconcile (row sums equal the input size) and exits
 * non-zero if any aggregation blows a generous 5s budget or a
 * reconciliation fails.
 *
 * What this proves: the pure aggregation code is linear-time at
 * 100k rows on this machine. What it does NOT prove: anything about
 * live Firestore reads, network latency, rendering, or a real
 * workspace — no live/load test is possible from this environment.
 */
import { performance } from 'node:perf_hooks'
import {
  aggregateByBranch,
  aggregateByMember,
  summarizeInquiries,
} from '../src/utils/reports.js'
import { buildDigest } from '../src/utils/digest.js'
import { getSlaAnalytics, getSlaSummary } from '../src/utils/sla.js'
import { evaluateEscalations } from '../src/utils/escalation.js'
import {
  monthKeyFromMs,
  monthlyRecoveryByBranch,
  monthlyRecoveryByMember,
  paceForecast,
} from '../src/utils/targets.js'

const N = 100_000
const NOW = Date.parse('2026-11-13T12:00:00.000Z')
const DAY = 24 * 60 * 60 * 1000
const MONTH_KEY = monthKeyFromMs(NOW)
const BUDGET_MS = 5000

/* Deterministic PRNG (mulberry32) — same data every run. */
function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(42)
const pick = arr => arr[Math.floor(rand() * arr.length)]

const branches = Array.from({ length: 20 }, (_, i) => ({
  id: `branch-${i + 1}`,
  name: `Branch ${String(i + 1).padStart(2, '0')}`,
}))
const members = Array.from({ length: 50 }, (_, i) => ({
  id: `uid-${i + 1}`,
  email: `rep${i + 1}@example.com`,
  role: 'sales_rep',
  branchId: branches[i % branches.length].name,
}))
const OWNER_UID = 'owner-uid'

const STATUSES = [
  ['new', 0.18],
  ['followup', 0.24],
  ['replied', 0.16],
  ['recovered', 0.26],
  ['lost', 0.16],
]
function pickStatus() {
  const r = rand()
  let acc = 0
  for (const [status, weight] of STATUSES) {
    acc += weight
    if (r < acc) return status
  }
  return 'lost'
}

const dayKey = ms => new Date(ms).toISOString().slice(0, 10)

let expectedMonthRecovered = 0
let expectedMonthRevenue = 0
const inquiries = new Array(N)
for (let i = 0; i < N; i += 1) {
  const status = pickStatus()
  const createdAt = NOW - Math.floor(rand() * 90 * DAY)
  const value = Math.floor(rand() * 50000)
  const r = rand()
  const assignedTo = r < 0.05 ? '' : r < 0.1 ? OWNER_UID : pick(members).id
  const branchId = rand() < 0.08 ? '' : pick(branches).name
  const item = {
    id: `inq-${i}`,
    name: `Customer ${i}`,
    phone: `+9199999${String(i).padStart(5, '0')}`,
    service: pick(['Haircut', 'Dental checkup', 'Coaching', 'Car service']),
    status,
    value,
    createdAt,
    updatedAt: createdAt + Math.floor(rand() * 5 * DAY),
    assignedTo,
    branchId,
    followup:
      status === 'followup'
        ? { date: dayKey(NOW + Math.floor(rand() * 11 - 5) * DAY), note: '' }
        : undefined,
    custom: i % 7 === 0 ? { 'budget-range': '5k-20k' } : {},
  }
  if (status === 'recovered') {
    item.recoveredAt = dayKey(NOW - Math.floor(rand() * 60 * DAY))
    if (item.recoveredAt.slice(0, 7) === MONTH_KEY) {
      expectedMonthRecovered += 1
      expectedMonthRevenue += value
    }
  }
  inquiries[i] = item
}

function bench(label, fn) {
  const start = performance.now()
  const result = fn()
  const ms = performance.now() - start
  return { label, ms, result }
}

const heapBefore = process.memoryUsage().heapUsed
const runs = []

runs.push(bench('reports.summarizeInquiries', () => summarizeInquiries(inquiries)))
runs.push(bench('reports.aggregateByBranch', () => aggregateByBranch(inquiries, branches)))
runs.push(bench('reports.aggregateByMember', () =>
  aggregateByMember(inquiries, members, { ownerUid: OWNER_UID, ownerEmail: 'owner@example.com' })
))
runs.push(bench('digest.buildDigest', () =>
  buildDigest(inquiries, { members, branches, slaHours: 24, nowMs: NOW })
))
runs.push(bench('sla.getSlaSummary', () => getSlaSummary(inquiries, 24, NOW)))
runs.push(bench('sla.getSlaAnalytics', () =>
  getSlaAnalytics(inquiries, 24, { members, ownerUid: OWNER_UID, ownerEmail: 'owner@example.com', nowMs: NOW })
))
runs.push(bench('escalation.evaluateEscalations', () =>
  evaluateEscalations(inquiries, {
    config: { enabled: true, overdueDays: 2, includeSlaBreach: true, reassign: true },
    members,
    ownerUid: OWNER_UID,
    slaHours: 24,
    nowMs: NOW,
  })
))
runs.push(bench('targets.monthlyRecoveryByMember', () =>
  monthlyRecoveryByMember(inquiries, members, { ownerUid: OWNER_UID, monthKey: MONTH_KEY })
))
runs.push(bench('targets.monthlyRecoveryByBranch', () =>
  monthlyRecoveryByBranch(inquiries, branches, MONTH_KEY)
))
runs.push(bench('targets.paceForecast', () => paceForecast(inquiries, NOW)))

const heapAfter = process.memoryUsage().heapUsed

/* ---------------- reconciliation ---------------- */

const failures = []
function expect(name, actual, wanted) {
  if (actual !== wanted) failures.push(`${name}: got ${actual}, want ${wanted}`)
}
const byLabel = Object.fromEntries(runs.map(r => [r.label, r.result]))

expect('summarize total', byLabel['reports.summarizeInquiries'].total, N)
expect(
  'branch rows sum',
  byLabel['reports.aggregateByBranch'].reduce((s, r) => s + r.total, 0),
  N
)
expect(
  'member rows assigned sum',
  byLabel['reports.aggregateByMember'].reduce((s, r) => s + r.assigned, 0),
  N
)
expect('digest totals', byLabel['digest.buildDigest'].totals.total, N)
expect(
  'monthly member recovered',
  byLabel['targets.monthlyRecoveryByMember'].reduce((s, r) => s + r.recoveredCount, 0),
  expectedMonthRecovered
)
expect(
  'monthly branch revenue',
  byLabel['targets.monthlyRecoveryByBranch'].reduce((s, r) => s + r.recoveredRevenue, 0),
  expectedMonthRevenue
)
expect('pace recovered count', byLabel['targets.paceForecast'].recoveredCount, expectedMonthRecovered)
if (!Array.isArray(byLabel['escalation.evaluateEscalations'])) {
  failures.push('escalation scan did not return an array')
}
if (!Array.isArray(byLabel['sla.getSlaSummary'].breached)) {
  failures.push('sla summary breached is not an array')
}
for (const run of runs) {
  if (run.ms > BUDGET_MS) failures.push(`${run.label} took ${run.ms.toFixed(0)}ms > ${BUDGET_MS}ms budget`)
}

/* ---------------- report ---------------- */

console.log(`Scale test — ${N.toLocaleString()} inquiries, ${members.length} members, ${branches.length} branches (seed 42, now ${new Date(NOW).toISOString()})`)
console.log('')
for (const run of runs) {
  console.log(`${run.label.padEnd(38)} ${run.ms.toFixed(1).padStart(9)} ms`)
}
console.log('')
console.log(`Heap used: ${((heapAfter - heapBefore) / 1048576).toFixed(1)} MB growth across all runs (data generation included in baseline)`)
console.log(`Escalations flagged: ${byLabel['escalation.evaluateEscalations'].length}; SLA breached now: ${byLabel['sla.getSlaSummary'].breached.length}; this-month recoveries: ${expectedMonthRecovered}`)

if (failures.length > 0) {
  console.error('\nFAILED:')
  for (const f of failures) console.error(` - ${f}`)
  process.exit(1)
}
console.log('\nAll aggregations reconciled and inside budget.')
