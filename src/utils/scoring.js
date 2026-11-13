/**
 * Lead score (Round 6) — an explained, rule-based priority score.
 *
 * Every OPEN inquiry gets a 0–100 score answering one question:
 * "how much does this lead deserve attention right now?" It is
 * computed only from signals already stored on the inquiry doc, and
 * every point is traceable: the result carries a plain-language
 * `reasons` list with one entry per adjustment, so the number is
 * never a black box. Closed inquiries (recovered / lost) return
 * null — there is nothing left to prioritise.
 *
 * This is rules on the workspace's own data — NOT machine learning,
 * NOT a prediction, and never labelled "AI" anywhere in the UI.
 * It is a different tool from the win-back score
 * (utils/winbackScore.js), which estimates recovery likelihood for
 * cold/lost work on the Recovery page; the two are named and placed
 * distinctly on purpose.
 *
 * Signals (baseline 50, points summed, clamped to 0–100):
 *  - Value size: bigger inquiries deserve earlier attention.
 *  - Inquiry age: fresh interest fades — bonuses under a week,
 *    penalties past two weeks.
 *  - Contact state: a live reply is the strongest signal; the days
 *    since the last recorded contact (follow-up history) fade it.
 *  - Follow-up state: an overdue or due-today follow-up raises
 *    priority; no follow-up scheduled on an open inquiry lowers it.
 *  - Source: booking-link inquiries came with direct intent;
 *    bulk-imported (CSV) rows are usually colder.
 *  - SLA state (only when a first-response target is configured and
 *    passed in): a breached or at-risk NEW inquiry jumps the queue.
 *  - Offer-ladder progress: offers already made mean a worked,
 *    engaged pipeline — except a completed ladder on a still-open
 *    inquiry, which needs a new angle instead.
 *
 * Bands follow the win-back convention: hot ≥ 70, warm 40–69,
 * cold < 40.
 *
 * `options.nowMs` pins "now" for tests; `options.firstResponseHours`
 * is the workspace SLA target (settings/sla). Without a positive
 * target the SLA signal is simply silent — never guessed.
 */
import { getSlaStatus } from './sla.js'
import { ladderProgress } from './ladder.js'

const DAY_MS = 1000 * 60 * 60 * 24

export const LEAD_BANDS = { hot: 70, warm: 40 }

/** Any stored timestamp → ms. Accepts epoch ms, ISO strings,
 * 'YYYY-MM-DD' dates, Firestore Timestamps (toMillis/toDate) and
 * { seconds } shapes; anything else is unknowable (NaN) — the same
 * honesty rule sla.js applies: never guessed. */
function toMs(value) {
  const n = Number(value)
  if (Number.isFinite(n) && n > 0) return n
  if (typeof value === 'string') {
    const t = Date.parse(value)
    if (Number.isFinite(t) && t > 0) return t
  }
  if (value && typeof value === 'object') {
    if (typeof value.toMillis === 'function') {
      const t = value.toMillis()
      if (Number.isFinite(t) && t > 0) return t
    } else if (typeof value.toDate === 'function') {
      const t = value.toDate().getTime()
      if (Number.isFinite(t) && t > 0) return t
    } else if (Number.isFinite(Number(value.seconds))) {
      return Number(value.seconds) * 1000
    }
  }
  return NaN
}

/** Whole days from `thenMs` to `nowMs`, floored at 0; null when the
 * start is unknowable. */
function daysBetween(thenMs, nowMs) {
  if (!Number.isFinite(thenMs)) return null
  return Math.max(0, Math.floor((nowMs - thenMs) / DAY_MS))
}

// Contact entries in the follow-up history — the same type/note
// matching winbackScore.js uses to count contact attempts, so the
// two scores agree on what "contacted" means.
const CONTACT_RE = /whatsapp|voice|call|message|sent|contact/i

/** ms of the most recent recorded contact, or null when the history
 * shows no contact at all. History entries carry 'YYYY-MM-DD' +
 * 'HH:MM'; an entry whose date cannot be read is skipped, never
 * guessed. */
export function lastContactMs(inquiry) {
  const history = Array.isArray(inquiry?.followupHistory)
    ? inquiry.followupHistory
    : []
  let latest = null
  for (const entry of history) {
    const text = `${String(entry?.type || '')} ${String(entry?.note || '')}`
    if (!CONTACT_RE.test(text)) continue
    if (typeof entry?.date !== 'string' || !entry.date) continue
    const t = Date.parse(`${entry.date}T${entry.time || '00:00'}`)
    if (!Number.isFinite(t)) continue
    if (latest === null || t > latest) latest = t
  }
  return latest
}

/** 'overdue' | 'today' | 'upcoming' | null for the scheduled
 * follow-up — the same states App.jsx getFollowupState derives,
 * computed from a pinned now. Date keys are UTC, the convention
 * Followups.jsx uses. */
export function followupStateOf(inquiry, nowMs = Date.now()) {
  const date = inquiry?.followup?.date
  const time = inquiry?.followup?.time
  if (!date || !time) return null
  const scheduled = Date.parse(`${date}T${time}`)
  if (!Number.isFinite(scheduled)) return null
  if (scheduled < nowMs) return 'overdue'
  if (date === new Date(nowMs).toISOString().slice(0, 10)) return 'today'
  return 'upcoming'
}

function bandFor(score) {
  if (score >= LEAD_BANDS.hot) return 'hot'
  if (score >= LEAD_BANDS.warm) return 'warm'
  return 'cold'
}

export function leadBandLabel(band) {
  return band === 'hot' ? 'Hot' : band === 'warm' ? 'Warm' : 'Cold'
}

/**
 * The lead score for one inquiry:
 *   null for closed inquiries (recovered / lost) and non-objects,
 *   otherwise { score, band, reasons } with score in 0–100 and one
 *   reason per point adjustment (the 50-point baseline is the
 *   neutral starting point every open inquiry gets, not a signal).
 */
export function leadScore(inquiry, options = {}) {
  if (!inquiry || typeof inquiry !== 'object') return null
  const status = inquiry.status || 'new'
  if (status === 'recovered' || status === 'lost') return null

  const nowMs =
    Number.isFinite(Number(options.nowMs)) && options.nowMs !== undefined
      ? Number(options.nowMs)
      : Date.now()

  let score = 50
  const reasons = []
  const adjust = (points, reason) => {
    if (points === 0) return
    score += points
    reasons.push(reason)
  }

  // 1 — Value size.
  const value = Number(inquiry.value) || 0
  if (value >= 20000) adjust(12, 'High-value inquiry')
  else if (value >= 5000) adjust(7, 'Good-sized inquiry')

  // 2 — Inquiry age.
  const ageDays = daysBetween(
    toMs(inquiry.createdAt ?? inquiry.date),
    nowMs
  )
  if (ageDays !== null) {
    if (ageDays <= 1) adjust(12, 'Inquired within the last day')
    else if (ageDays <= 3) adjust(8, 'Inquired within 3 days')
    else if (ageDays <= 7) adjust(4, 'Inquired this week')
    else if (ageDays > 30) {
      adjust(-12, `Inquired ${ageDays} days ago — gone cold`)
    } else if (ageDays > 14) {
      adjust(-6, `Inquired ${ageDays} days ago — cooling off`)
    }
  }

  // 3 — Contact state.
  if (status === 'replied') {
    adjust(14, 'Customer has replied — the conversation is live')
  }
  const contactDays = daysBetween(lastContactMs(inquiry), nowMs)
  if (contactDays !== null) {
    if (contactDays <= 1) adjust(8, 'Contacted within the last day')
    else if (contactDays <= 3) adjust(5, 'Contacted within 3 days')
    else if (contactDays <= 7) adjust(2, 'Contacted this week')
    else if (contactDays <= 14) {
      adjust(-5, `Last contact ${contactDays} days ago`)
    } else {
      adjust(-10, `Last contact ${contactDays} days ago — gone quiet`)
    }
  } else if (status === 'new') {
    adjust(-4, 'Not contacted yet')
  }

  // 4 — Follow-up state. A replied inquiry is already in
  // conversation, so a missing schedule is never held against it.
  const followupState = followupStateOf(inquiry, nowMs)
  if (followupState === 'overdue') {
    adjust(6, 'A follow-up is overdue — chase it today')
  } else if (followupState === 'today') {
    adjust(4, 'Follow-up due today')
  } else if (followupState === 'upcoming') {
    adjust(2, 'A follow-up is scheduled')
  } else if (status !== 'replied') {
    adjust(-4, 'No follow-up scheduled')
  }

  // 5 — Source.
  const source = String(inquiry.source || '').toLowerCase()
  if (source === 'booking' || source === 'backwon-link') {
    adjust(6, 'Came in through your booking link')
  } else if (source === 'manual') {
    adjust(3, 'Logged by your team')
  } else if (source === 'csv') {
    adjust(-6, 'Bulk-imported lead — usually colder than a live inquiry')
  }

  // 6 — SLA state (silent unless a target is configured; the SLA
  // model itself only judges 'new' inquiries — see utils/sla.js).
  const slaHours = Number(options.firstResponseHours)
  if (Number.isFinite(slaHours) && slaHours > 0) {
    const slaState = getSlaStatus(inquiry, slaHours, nowMs)
    if (slaState === 'breached') {
      adjust(10, 'Past the first-response target — answer now')
    } else if (slaState === 'at-risk') {
      adjust(5, 'Close to the first-response target')
    }
  }

  // 7 — Offer-ladder progress.
  const ladder = ladderProgress(inquiry.offerLadder)
  if (ladder.done === 1) {
    adjust(4, 'First win-back offer already made')
  } else if (ladder.done > 1) {
    adjust(4 * ladder.done, `${ladder.done} of 3 win-back offers already made`)
  }
  if (ladder.complete) {
    adjust(-4, 'All three offers made and still open — needs a new angle')
  }

  score = Math.max(0, Math.min(100, Math.round(score)))
  return { score, band: bandFor(score), reasons }
}

/**
 * Rank inquiries by lead score, highest first:
 * [{ inquiry, score, band, reasons }]. Closed inquiries have no
 * score — they are appended at the end, in their input order, with
 * score/band null, so sorting a list by lead score never makes a
 * row vanish (unlike a filter). Ties break toward the newer inquiry.
 */
export function rankByLeadScore(inquiries, options = {}) {
  const scored = []
  const unscored = []
  for (const inquiry of Array.isArray(inquiries) ? inquiries : []) {
    const result = leadScore(inquiry, options)
    if (result) {
      scored.push({
        inquiry,
        result,
        created: toMs(inquiry?.createdAt ?? inquiry?.date),
      })
    } else {
      unscored.push({ inquiry, score: null, band: null, reasons: [] })
    }
  }
  scored.sort((a, b) => {
    if (b.result.score !== a.result.score) {
      return b.result.score - a.result.score
    }
    const ac = Number.isFinite(a.created) ? a.created : 0
    const bc = Number.isFinite(b.created) ? b.created : 0
    return bc - ac
  })
  return [
    ...scored.map(({ inquiry, result }) => ({ inquiry, ...result })),
    ...unscored,
  ]
}
