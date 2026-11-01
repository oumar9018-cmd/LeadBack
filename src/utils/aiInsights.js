// Wave 4 heuristic AI — rules-based, $0, NO model or LLM calls anywhere.
// Every output is labelled "heuristic" in the UI. Scores are the existing
// winbackScore; nothing here is a measured probability or a prediction
// trained on data — it is a readable reading of the same signals.

import { winbackScore } from './winbackScore.js'
import { lastActivityMs, isStale } from './graveyard.js'

const DAY = 86400000
const OPEN = ['new', 'followup', 'replied']

function followupDueMs(item) {
  if (!item.followup?.date) return null
  const ms = Date.parse(`${item.followup.date}T${item.followup.time || '10:00'}`)
  return Number.isFinite(ms) ? ms : null
}

function quietDays(item, nowMs) {
  const last = lastActivityMs(item)
  return Number.isFinite(last) ? Math.floor((nowMs - last) / DAY) : null
}

// #49 — one next action per inquiry. Read-only: it suggests, never acts.
export function nextBestAction(item, nowMs = Date.now()) {
  if (!item) return { action: '—', reason: '' }
  const { score } = winbackScore(item)
  const due = followupDueMs(item)
  const quiet = quietDays(item, nowMs)
  if (item.status === 'recovered')
    return {
      action: 'Ask for a Google review',
      reason: 'Recovered — the relationship is warmest right now.',
    }
  if (item.status === 'lost')
    return {
      action:
        (Number(item.value) || 0) >= 5000
          ? 'Send a win-back offer (high value)'
          : 'Send a light win-back message',
      reason: `Lost lead, score ${score} — a personal offer is the highest-converting reactivation.`,
    }
  if (item.status === 'replied' && quiet !== null && quiet >= 14)
    return {
      action: 'Re-engage — they went quiet',
      reason: `Replied, then ${quiet} days of silence. A short check-in beats a new pitch.`,
    }
  if (item.status === 'followup' && due !== null && due <= nowMs)
    return {
      action: 'Follow up today — date passed',
      reason: 'The scheduled follow-up date is already past.',
    }
  if (item.status === 'replied')
    return {
      action: 'Follow up now — they replied',
      reason: 'A reply is the hottest signal in the pipeline.',
    }
  if (item.status === 'followup')
    return {
      action: 'Wait for the scheduled follow-up',
      reason: item.followup?.date
        ? `Scheduled ${item.followup.date}. Chasing early burns goodwill.`
        : 'A follow-up is already scheduled.',
    }
  const attempts = (item.followupHistory || []).length
  return {
    action: attempts === 0 ? 'Make first contact' : 'Follow up again',
    reason:
      attempts === 0
        ? 'New lead, no contact yet.'
        : `${attempts} prior attempt${attempts === 1 ? '' : 's'} on record.`,
  }
}

// #59 — recovery probability, honestly framed: the score band in words.
export function recoveryProbability(item) {
  const { score, band } = winbackScore(item)
  const label = band === 'hot' ? 'High' : band === 'warm' ? 'Medium' : 'Low'
  return {
    score,
    band,
    label,
    note: 'Heuristic estimate from the rules-based score — not a measured conversion rate.',
  }
}

// #47 — deal risk for OPEN inquiries only.
export function dealRisk(item, nowMs = Date.now()) {
  if (!OPEN.includes(item.status)) return { level: 'closed', flags: [] }
  const flags = []
  if (!item.assignedTo) flags.push('Unassigned')
  const due = followupDueMs(item)
  if (due !== null && due <= nowMs) flags.push('Follow-up overdue')
  if (isStale(item, nowMs)) flags.push('Quiet 30+ days')
  if ((item.followupHistory || []).length >= 5) flags.push('5+ attempts, no close')
  const level = flags.length >= 2 ? 'high' : flags.length === 1 ? 'medium' : 'low'
  return { level, flags }
}

// #48 — intent from status + engagement history.
export function detectIntent(item) {
  const history = item.followupHistory || []
  const engaged = history.some(
    e => e.type === 'whatsapp' || /call|visit|replied|meeting/i.test(e.note || '')
  )
  if (item.status === 'replied')
    return { intent: 'Ready to talk', signals: ['Customer replied'] }
  if (item.status === 'recovered')
    return { intent: 'Won', signals: ['Recovered'] }
  if (item.status === 'lost')
    return { intent: 'Disengaged', signals: ['Marked lost'] }
  if (engaged)
    return { intent: 'Engaged', signals: ['Prior conversation on record'] }
  if ((Number(item.value) || 0) >= 5000)
    return { intent: 'Exploring', signals: ['High value, no reply yet'] }
  return { intent: 'New — unknown yet', signals: ['No engagement on record'] }
}

// #52 — lost-deal reason analyzer: this row's reason in the context of
// all lost leads (share + the service most often lost for that reason).
export function analyzeLostReason(item, allLost) {
  const reason = item.lossReason || 'other'
  const total = (allLost || []).length
  const same = (allLost || []).filter(i => (i.lossReason || 'other') === reason)
  const byService = new Map()
  for (const row of same) {
    const svc = row.service || 'Unknown'
    byService.set(svc, (byService.get(svc) || 0) + 1)
  }
  const topService = [...byService.entries()].sort((a, b) => b[1] - a[1])[0]
  return {
    reason,
    count: same.length,
    total,
    share: total > 0 ? Math.round((same.length / total) * 100) : 0,
    topService: topService ? topService[0] : null,
  }
}
