/**
 * The shared 1-blast/week guardrail (batch 5, CSV spec §5).
 *
 * One store, two callers: the bulk-CSV "Blitz these now" run and the
 * future broadcast blast (FEATURES.md item 2). Single-lead follow-ups
 * are NOT blasts and are never checked against this guardrail.
 *
 * Store: users/{ownerUid}/settings/workspace.lastBlastAt (ISO string),
 * written when a bulk blast STARTS, not when it ends — a started
 * blast counts. Enforcement: a bulk run starting within 7 days of
 * the last one is refused, with the date the next blast unlocks.
 */

export const BLAST_COOLDOWN_DAYS = 7

const DAY_MS = 24 * 60 * 60 * 1000

/** @returns {{blocked: boolean, unlockDate: Date|null}} */
export function blastStatus(lastBlastAt) {
  if (!lastBlastAt) return { blocked: false, unlockDate: null }
  const last = new Date(lastBlastAt).getTime()
  if (Number.isNaN(last)) return { blocked: false, unlockDate: null }
  const unlock = last + BLAST_COOLDOWN_DAYS * DAY_MS
  if (Date.now() < unlock) return { blocked: true, unlockDate: new Date(unlock) }
  return { blocked: false, unlockDate: null }
}

/** Record that a bulk blast started now. Never throws. */
export async function markBlastStarted(db, ownerUid) {
  try {
    if (!db || !ownerUid) return
    await db
      .collection('users')
      .doc(ownerUid)
      .collection('settings')
      .doc('workspace')
      .set({ lastBlastAt: new Date().toISOString() }, { merge: true })
  } catch (error) {
    console.error('Recording blast start failed:', error)
  }
}
