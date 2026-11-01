/**
 * #3 — Automated Task Generator (pure helpers + loader).
 *
 * The app's task unit is the follow-up on an inquiry (the Follow-ups
 * queue lists status === 'followup' rows). Two automatic generators
 * exist: rule actions (schedule_followup, #2) and this default —
 * when a new inquiry arrives and NO rule scheduled a follow-up, the
 * workspace default (settings/automation doc, 0 = off) schedules one
 * after N days. The default never overrides a rule: rules run first.
 *
 * Like branches/custom fields/rules, the automation doc lives under
 * users/{ownerUid}/settings/, so the existing settings rules cover it
 * (owner/admin write, managers read).
 */

/** Pure: add a default follow-up unless one already exists. */
export function applyAutoFollowup(doc, autoDays, nowMs = Date.now()) {
  const days = Number(autoDays)
  if (!Number.isInteger(days) || days < 1 || days > 30) return doc
  if (doc.followup && doc.followup.date) return doc
  const date = new Date(nowMs + days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
  return {
    ...doc,
    status: 'followup',
    followup: { date, time: '10:00', note: 'Auto follow-up' },
  }
}

/** Load the workspace automation defaults. 0 days = feature off. */
export async function loadAutomationDefaults(db, ownerUid) {
  if (!db || !ownerUid) return { autoFollowupDays: 0 }
  try {
    const snap = await db
      .collection('users')
      .doc(ownerUid)
      .collection('settings')
      .doc('automation')
      .get()
    if (!snap.exists) return { autoFollowupDays: 0 }
    const days = Number(snap.data()?.autoFollowupDays)
    return {
      autoFollowupDays:
        Number.isInteger(days) && days >= 0 && days <= 30 ? days : 0,
    }
  } catch (error) {
    console.error('Automation defaults load failed:', error)
    return { autoFollowupDays: 0 }
  }
}
