import { currencySymbol } from './money.js'
/**
 * Wynback Smart Composer engine.
 *
 * Generates a personalized follow-up message from real inquiry context:
 * customer name, service, value, days since inquiry, attempt count,
 * status, and the owner's chosen tone.
 *
 * This is a transparent rule-based composer — every variable it uses is
 * shown in the UI. No fake "AI" claims: it assembles proven follow-up
 * structures (hook → context → low-friction CTA) with the owner's data.
 *
 * Tones: 'professional' | 'friendly' | 'hinglish'
 */

export const TONES = {
  professional: {
    id: 'professional',
    label: 'Professional',
    hint: 'Polite, business-like',
  },
  friendly: {
    id: 'friendly',
    label: 'Friendly',
    hint: 'Warm, casual',
  },
  hinglish: {
    id: 'hinglish',
    label: 'Hinglish',
    hint: 'Hindi + English mix',
  },
}

function firstName(name) {
  return String(name || 'there').trim().split(/\s+/)[0]
}

function daysSince(dateValue) {
  if (!dateValue) return null
  const d = dateValue instanceof Date ? dateValue : new Date(dateValue)
  if (Number.isNaN(d.getTime())) return null
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)))
}

function attemptCount(inquiry) {
  const history = inquiry.followupHistory || []
  return history.filter(e =>
    /whatsapp|voice|call|message|sent|contact/i.test(String(e.type || '') + ' ' + String(e.note || ''))
  ).length
}

function moneyShort(value, currency) {
  const n = Number(value) || 0
  const symbol = currencySymbol(currency)
  if (n >= 100000) return `${symbol}${(n / 100000).toFixed(n % 100000 ? 1 : 0)}L`
  if (n >= 1000) return `${symbol}${(n / 1000).toFixed(n % 1000 ? 1 : 0)}k`
  return n > 0 ? `${symbol}${n}` : ''
}

/**
 * Compose a follow-up message.
 *
 * @param {object} inquiry - { name, service, value, status, createdAt/date, followupHistory }
 * @param {object} opts - { tone: 'professional'|'friendly'|'hinglish', businessName, bookingLink, occasion }
 * @returns {{ text, variables }} — text is the final message, variables lists what was used
 */
export function composeMessage(inquiry = {}, opts = {}) {
  const tone = TONES[opts.tone] ? opts.tone : 'friendly'
  const name = firstName(inquiry.name)
  const business = opts.businessName || 'us'
  const service = inquiry.service || 'our service'
  const age = daysSince(inquiry.createdAt || inquiry.date)
  const attempts = attemptCount(inquiry)
  const status = inquiry.status || 'new'
  const valueStr = moneyShort(inquiry.value, opts.currency)
  const link = opts.bookingLink || ''
  const occasion = opts.occasion || ''

  const variables = { name, service, business }
  if (age !== null) variables.daysAgo = age
  if (valueStr) variables.value = valueStr

  let text = ''

  // ---- occasion-aware opener (festival season win-back) ----
  const occasionLine = {
    professional: occasion ? `Ahead of ${occasion}, I wanted to reach out. ` : '',
    friendly: occasion ? `${occasion} is around the corner — perfect timing! ` : '',
    hinglish: occasion ? `${occasion} aa raha hai — sahi time hai! ` : '',
  }[tone]

  if (status === 'replied') {
    // They replied before — continue the conversation
    text = {
      professional: `Hi ${name}, following up on our conversation about ${service}. Shall I reserve your slot? ${link}`.trim(),
      friendly: `Hey ${name}! Just circling back on ${service} — want me to lock in your slot? ${link}`.trim(),
      hinglish: `Hi ${name}! ${service} ke baare me baat hui thi — slot book kar dun aapka? ${link}`.trim(),
    }[tone]
  } else if (attempts >= 3) {
    // Many attempts — change the angle, make it easy to say yes
    text = {
      professional: `Hi ${name}, I don't want to be a bother — just a final check on ${service}. If the timing isn't right, reply STOP and I'll close the loop. Otherwise I'm one message away. — ${business}`.trim(),
      friendly: `Hey ${name}, last nudge from me on ${service} — totally fine if the timing's off, just say the word! But if you're still interested, I've got you. — ${business}`.trim(),
      hinglish: `Hi ${name}, aakhri message ${service} ke liye — agar time sahi nahi hai to koi baat nahi, bas bata dijiye! Lekin interested hain to me hazir hun. — ${business}`.trim(),
    }[tone]
  } else if (attempts >= 1) {
    // Follow-up #2+ — reference the earlier contact
    const ago = age !== null && age > 0 ? (tone === 'hinglish' ? `${age} din pehle` : `${age} day${age === 1 ? '' : 's'} ago`) : (tone === 'hinglish' ? 'kuch din pehle' : 'a few days ago')
    text = {
      professional: `${occasionLine}Hi ${name}, we connected ${ago} regarding ${service}. Checking if you'd like to move forward — I can hold a slot for you this week. ${link}`.trim(),
      friendly: `${occasionLine}Hey ${name}! We chatted ${ago} about ${service}. Still interested? I can save you a slot this week. ${link}`.trim(),
      hinglish: `${occasionLine}Hi ${name}! ${ago} ${service} ke liye baat hui thi. Abhi bhi interested hain? Is hafte aapke liye slot rakh dun? ${link}`.trim(),
    }[tone]
  } else {
    // First touch — warm, specific, low friction
    text = {
      professional: `${occasionLine}Hi ${name}, this is ${business}. You had enquired about ${service}${valueStr ? ` (${valueStr})` : ''} — I'd be glad to help you get started. When suits you for a quick chat?`.trim(),
      friendly: `${occasionLine}Hey ${name}! This is ${business} — you asked about ${service}${valueStr ? ` (${valueStr})` : ''}. Happy to help whenever you're ready. What time works for a quick chat?`.trim(),
      hinglish: `${occasionLine}Namaste ${name}! ${business} se bol raha hun — aapne ${service}${valueStr ? ` (${valueStr})` : ''} ke baare me pucha tha. Kab baat karein? 2 minute me sab clear kar dunga.`.trim(),
    }[tone]
  }

  return { text, variables }
}

/**
 * Festivals / occasions in the next ~60 days (India). Used for the
 * occasion-aware opener. Month/day based, year-agnostic.
 */
const OCCASIONS = [
  { month: 9, day: 20, days: 21, name: 'Diwali' },
  { month: 2, day: 14, days: 14, name: 'Holi' },
  { month: 11, day: 25, days: 21, name: 'New Year' },
  { month: 7, day: 15, days: 14, name: 'Raksha Bandhan' },
  { month: 9, day: 1, days: 14, name: 'Navratri' },
]

export function upcomingOccasion(now = new Date()) {
  for (const o of OCCASIONS) {
    const thisYear = new Date(now.getFullYear(), o.month, o.day)
    const diffDays = Math.ceil((thisYear - now) / (1000 * 60 * 60 * 24))
    if (diffDays >= 0 && diffDays <= o.days) return o.name
    // also check next year for Dec→Jan wrap
    const nextYear = new Date(now.getFullYear() + 1, o.month, o.day)
    const diffNext = Math.ceil((nextYear - now) / (1000 * 60 * 60 * 24))
    if (diffNext >= 0 && diffNext <= o.days) return o.name
  }
  return ''
}
