/**
 * Shared money helpers. Every money rendering in the app must go through
 * these (or the identical local `money()` in App.jsx) so the workspace
 * currency — not a hardcoded ₹ — is what the user sees.
 *
 * Currency rule (owner order 2026-10-30): the rupee symbol is for India
 * only. Wynback is a global business, so each workspace shows its own
 * country's currency symbol.
 *
 * HONEST CONSTRAINT: Gmail / Firebase Auth does NOT expose the account's
 * country to the app, so there is no Gmail-country detection anywhere.
 * The achievable equivalent: a new workspace defaults to the currency of
 * the browser's timezone (below), and the owner can change it any time
 * in Settings → Workspace preferences → Currency. A saved currency
 * always wins over the timezone default.
 */

export const CURRENCIES = [
  { code: 'INR', label: 'INR — Indian Rupee' },
  { code: 'USD', label: 'USD — US Dollar' },
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'GBP', label: 'GBP — British Pound' },
  { code: 'AED', label: 'AED — UAE Dirham' },
  { code: 'AUD', label: 'AUD — Australian Dollar' },
  { code: 'CAD', label: 'CAD — Canadian Dollar' },
  { code: 'SGD', label: 'SGD — Singapore Dollar' },
  { code: 'JPY', label: 'JPY — Japanese Yen' },
  { code: 'MXN', label: 'MXN — Mexican Peso' },
  { code: 'NZD', label: 'NZD — New Zealand Dollar' },
]

export const CURRENCY_CODES = CURRENCIES.map(c => c.code)

const LOCALES = {
  INR: 'en-IN',
  USD: 'en-US',
  GBP: 'en-GB',
  EUR: 'de-DE',
  AED: 'en-AE',
  AUD: 'en-AU',
  CAD: 'en-CA',
  SGD: 'en-SG',
  JPY: 'ja-JP',
  MXN: 'es-MX',
  NZD: 'en-NZ',
}

const SYMBOLS = {
  INR: '₹',
  USD: '$',
  GBP: '£',
  EUR: '€',
  AED: 'د.إ',
  AUD: '$',
  CAD: '$',
  SGD: '$',
  JPY: '¥',
  MXN: '$',
  NZD: '$',
}

export function currencySymbol(currency) {
  return SYMBOLS[currency] || '$'
}

export function isSupportedCurrency(currency) {
  return CURRENCY_CODES.includes(currency)
}

/**
 * Timezone → currency. Exact zones first, then region prefixes.
 * Anything unmapped falls back to USD — the least surprising default
 * for a global product, never INR.
 */
export function currencyFromTimezone(timezone) {
  const tz = typeof timezone === 'string' ? timezone : ''
  if (!tz) return 'USD'

  const exact = {
    'Asia/Kolkata': 'INR',
    'Asia/Calcutta': 'INR',
    'Asia/Dubai': 'AED',
    'Asia/Singapore': 'SGD',
    'Asia/Tokyo': 'JPY',
    'Europe/London': 'GBP',
    'America/Toronto': 'CAD',
    'America/Vancouver': 'CAD',
    'America/Montreal': 'CAD',
    'America/Edmonton': 'CAD',
    'America/Winnipeg': 'CAD',
    'America/Halifax': 'CAD',
    'America/Mexico_City': 'MXN',
    'Australia/Sydney': 'AUD',
    'Australia/Melbourne': 'AUD',
    'Australia/Brisbane': 'AUD',
    'Australia/Perth': 'AUD',
    'Pacific/Auckland': 'NZD',
  }
  if (exact[tz]) return exact[tz]

  if (tz.startsWith('America/')) return 'USD'
  if (tz.startsWith('Europe/')) return 'EUR'
  if (tz.startsWith('Australia/') || tz.startsWith('Pacific/')) return 'AUD'
  return 'USD'
}

/** Browser timezone → default currency for a brand-new workspace. */
export function defaultCurrencyForBrowser() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    return currencyFromTimezone(tz)
  } catch {
    return 'USD'
  }
}

export function formatMoney(value, currency = 'INR') {
  const code = isSupportedCurrency(currency) ? currency : 'USD'
  return new Intl.NumberFormat(LOCALES[code] || 'en-US', {
    style: 'currency',
    currency: code,
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

/** Compact form: ₹48.2K / $1.2K style for tight spaces. */
export function formatMoneyCompact(value, currency = 'INR') {
  const n = Number(value) || 0
  const symbol = currencySymbol(currency)
  if (n >= 10000000) return `${symbol}${(n / 10000000).toFixed(1)}Cr`
  if (n >= 100000) return `${symbol}${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `${symbol}${(n / 1000).toFixed(1)}K`
  return `${symbol}${Math.round(n)}`
}
