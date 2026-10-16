/**
 * Wynback Win-Back Score engine.
 *
 * Every open inquiry gets a 0–100 score estimating how likely it is to
 * convert if followed up NOW. The score is computed transparently from
 * signals the owner already has — no black box, no fake AI claims.
 *
 * Signals:
 *  - Status weight: replied (hot) > followup > new > lost (cold)
 *  - Recency: inquiries decay — fresh interest converts far better
 *  - Contact attempts: 1–3 attempts is the sweet spot; 0 = untouched,
 *    5+ = likely exhausted
 *  - Value: higher value = worth prioritizing
 *  - Engagement: any reply in history boosts the score
 *
 * Returns { score, band, reasons[] } where band is 'hot' | 'warm' | 'cold'.
 */

function daysSince(dateValue) {
  if (!dateValue) return null
  const d = dateValue instanceof Date ? dateValue : new Date(dateValue)
  if (Number.isNaN(d.getTime())) return null
  const ms = Date.now() - d.getTime()
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
}

function attemptCount(inquiry) {
  const history = inquiry.followupHistory || []
  return history.filter(e =>
    /whatsapp|voice|call|message|sent|contact/i.test(String(e.type || '') + ' ' + String(e.note || ''))
  ).length
}

function hasEngagement(inquiry) {
  if (inquiry.status === 'replied') return true
  const history = inquiry.followupHistory || []
  return history.some(e =>
    /replied|responded|answered|callback/i.test(String(e.type || '') + ' ' + String(e.note || ''))
  )
}

export function winbackScore(inquiry) {
  const reasons = []
  let score = 40 // baseline: every open inquiry deserves attention

  // 1. Status weight
  const status = inquiry.status || 'new'
  if (status === 'replied') {
    score += 22
    reasons.push('Customer already replied — strike now')
  } else if (status === 'followup') {
    score += 12
    reasons.push('Active follow-up in progress')
  } else if (status === 'new') {
    score += 6
    reasons.push('Fresh inquiry, not yet contacted')
  } else if (status === 'lost') {
    score -= 18
    reasons.push('Marked lost — needs a win-back offer')
  } else {
    score += 2
  }

  // 2. Recency — interest decays fast
  const age = daysSince(inquiry.createdAt || inquiry.date)
  if (age !== null) {
    if (age <= 1) {
      score += 14
      reasons.push('Inquired within the last day')
    } else if (age <= 3) {
      score += 9
      reasons.push('Inquired within 3 days')
    } else if (age <= 7) {
      score += 4
      reasons.push('Inquired this week')
    } else if (age <= 30) {
      score -= 4
      reasons.push(`Inquired ${age} days ago — cooling`)
    } else {
      score -= 12
      reasons.push(`Inquired ${age} days ago — cold`)
    }
  }

  // 3. Contact attempts — sweet spot is 1–3
  const attempts = attemptCount(inquiry)
  if (attempts === 0) {
    score += 6
    reasons.push('Never contacted — first touch converts best')
  } else if (attempts <= 3) {
    score += 4
    reasons.push(`${attempts} follow-up${attempts === 1 ? '' : 's'} so far`)
  } else if (attempts <= 5) {
    score -= 4
    reasons.push(`${attempts} attempts — try a new angle`)
  } else {
    score -= 10
    reasons.push(`${attempts} attempts — likely exhausted`)
  }

  // 4. Value — prioritize bigger tickets
  const value = Number(inquiry.value) || 0
  if (value >= 20000) {
    score += 8
    reasons.push('High-value opportunity')
  } else if (value >= 5000) {
    score += 5
    reasons.push('Good ticket size')
  } else if (value > 0) {
    score += 2
  }

  // 5. Engagement boost
  if (hasEngagement(inquiry) && status !== 'replied') {
    score += 8
    reasons.push('Customer engaged before')
  }

  // Clamp
  score = Math.max(0, Math.min(100, Math.round(score)))

  const band = score >= 70 ? 'hot' : score >= 40 ? 'warm' : 'cold'

  return { score, band, reasons: reasons.slice(0, 3) }
}

/**
 * Rank a list of inquiries by win-back score (highest first).
 * Closed (recovered) inquiries are excluded — nothing left to win.
 */
export function rankByWinback(inquiries) {
  return (inquiries || [])
    .filter(i => i.status !== 'recovered')
    .map(i => ({ inquiry: i, ...winbackScore(i) }))
    .sort((a, b) => b.score - a.score)
}

export function bandLabel(band) {
  return band === 'hot' ? 'Hot' : band === 'warm' ? 'Warm' : 'Cold'
}
