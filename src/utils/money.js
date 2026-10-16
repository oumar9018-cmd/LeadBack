/**
 * Shared money formatter. Mirrors the `money()` helper in App.jsx so new
 * components format values identically.
 */
export function formatMoney(value, currency = 'INR') {
  const locales = {
    INR: 'en-IN',
    USD: 'en-US',
    GBP: 'en-GB',
    EUR: 'de-DE',
  }

  return new Intl.NumberFormat(locales[currency] || 'en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

/** Compact form: ₹48.2K / ₹1.2L style for tight spaces. */
export function formatMoneyCompact(value, currency = 'INR') {
  const n = Number(value) || 0
  const symbol = { INR: '₹', USD: '$', GBP: '£', EUR: '€' }[currency] || '₹'
  if (n >= 10000000) return `${symbol}${(n / 10000000).toFixed(1)}Cr`
  if (n >= 100000) return `${symbol}${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `${symbol}${(n / 1000).toFixed(1)}K`
  return `${symbol}${Math.round(n)}`
}
