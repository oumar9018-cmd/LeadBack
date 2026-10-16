/**
 * Recovery Streaks — gamified owner loop over real recovery data.
 *
 * Relies on `recoveredAt` ('YYYY-MM-DD') set when an inquiry is marked
 * recovered. Inquiries recovered before this field existed are ignored —
 * streaks only ever count verified recoveries.
 */

export const STREAK_MILESTONES = [7, 30]

function dayKey(d) {
  return d.toISOString().slice(0, 10)
}

function startOfWeek(date) {
  const d = new Date(date)
  const day = (d.getDay() + 6) % 7 // Monday = 0
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

/** ISO week key like '2026-W42' for best-week grouping. */
function weekKey(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`)
  const monday = startOfWeek(d)
  const year = monday.getFullYear()
  const jan4 = new Date(year, 0, 4)
  const week = Math.ceil(((monday - startOfWeek(jan4)) / 86400000 + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}

export function computeStreaks(items, now = new Date()) {
  const recovered = (items || []).filter(
    i => i.status === 'recovered' && typeof i.recoveredAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(i.recoveredAt)
  )

  const byDay = new Map()
  for (const item of recovered) {
    const entry = byDay.get(item.recoveredAt) || { count: 0, value: 0 }
    entry.count += 1
    entry.value += Number(item.value) || 0
    byDay.set(item.recoveredAt, entry)
  }

  const days = [...byDay.keys()].sort().reverse() // newest first
  const daySet = new Set(days)

  // Current streak: consecutive days ending today (or yesterday — streak alive).
  let currentStreak = 0
  const cursor = new Date(now)
  cursor.setHours(0, 0, 0, 0)
  if (!daySet.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  while (daySet.has(dayKey(cursor))) {
    currentStreak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  // This week's recovered value.
  const weekStart = startOfWeek(now)
  let weekValue = 0
  let weekCount = 0
  for (const item of recovered) {
    const d = new Date(`${item.recoveredAt}T00:00:00`)
    if (d >= weekStart) {
      weekValue += Number(item.value) || 0
      weekCount += 1
    }
  }

  // Best week ever (by recovered value).
  const byWeek = new Map()
  for (const item of recovered) {
    const key = weekKey(item.recoveredAt)
    byWeek.set(key, (byWeek.get(key) || 0) + (Number(item.value) || 0))
  }
  const bestWeekValue = byWeek.size ? Math.max(...byWeek.values()) : 0

  // Longest streak ever (for "personal best" on streaks too).
  let longestStreak = 0
  let run = 0
  let prev = null
  for (const key of [...days].sort()) {
    const d = new Date(`${key}T00:00:00`)
    if (prev && d - prev === 86400000) run += 1
    else run = 1
    longestStreak = Math.max(longestStreak, run)
    prev = d
  }

  const hitMilestone = STREAK_MILESTONES.find(m => m === currentStreak) || null

  return {
    currentStreak,
    longestStreak,
    weekValue,
    weekCount,
    bestWeekValue,
    totalRecovered: recovered.length,
    hitMilestone,
    hasData: recovered.length > 0,
  }
}
