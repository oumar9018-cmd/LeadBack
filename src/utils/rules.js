/**
 * #2 — If/Then/Else Rule Engine (pure functions, no Firestore, no DOM).
 *
 * A rule: { id, name, enabled, trigger, conditions[], actions[],
 *   elseActions[] }. If every condition matches, the actions run;
 * otherwise the else-actions run. Rules run top to bottom and each one
 * sees the previous rules' results, so ordering matters.
 *
 * v1 scope (honest): only the `inquiry_created` trigger is wired into
 * the app (both add paths). The engine itself is trigger-agnostic, but
 * the Settings card offers ONLY wired triggers — an unwired trigger in
 * the UI would be a visual-only fake.
 *
 * Safety rules, matching routing: rules NEVER block creation (callers
 * wrap applyRules in try/catch), and rule actions never send messages —
 * they assign, branch, restatus, or schedule reminders. Sending stays
 * human (auto-reply HOLD, broadcast approval).
 */

export const RULE_TRIGGERS = [
  { id: 'inquiry_created', label: 'When an inquiry is created' },
]

export const RULE_FIELDS = [
  { id: 'status', label: 'Status', kind: 'string' },
  { id: 'service', label: 'Service', kind: 'string' },
  { id: 'source', label: 'Source', kind: 'string' },
  { id: 'value', label: 'Value', kind: 'number' },
  { id: 'assignedTo', label: 'Assigned to', kind: 'string' },
  { id: 'branchId', label: 'Branch', kind: 'string' },
]

export const RULE_OPERATORS = [
  { id: 'equals', label: 'is', kinds: ['string', 'number'], needsValue: true },
  { id: 'not_equals', label: 'is not', kinds: ['string', 'number'], needsValue: true },
  { id: 'contains', label: 'contains', kinds: ['string'], needsValue: true },
  { id: 'not_contains', label: 'does not contain', kinds: ['string'], needsValue: true },
  { id: 'greater_than', label: 'greater than', kinds: ['number'], needsValue: true },
  { id: 'less_than', label: 'less than', kinds: ['number'], needsValue: true },
  { id: 'is_empty', label: 'is empty', kinds: ['string'], needsValue: false },
  { id: 'is_not_empty', label: 'is not empty', kinds: ['string'], needsValue: false },
]

export const RULE_ACTIONS = [
  { id: 'assign_to', label: 'Assign to member', valueKind: 'member' },
  { id: 'set_branch', label: 'Set branch', valueKind: 'branch' },
  { id: 'set_status', label: 'Set status', valueKind: 'status' },
  {
    id: 'schedule_followup',
    label: 'Schedule follow-up in N days (moves to Follow up)',
    valueKind: 'days',
  },
]

export const RULE_STATUSES = ['new', 'followup', 'replied', 'recovered', 'lost']

function fieldDef(fieldId) {
  return RULE_FIELDS.find(f => f.id === fieldId) || null
}

function operatorDef(operatorId) {
  return RULE_OPERATORS.find(o => o.id === operatorId) || null
}

function toComparable(field, raw) {
  if (field.kind === 'number') {
    const n = Number(raw)
    return Number.isNaN(n) ? 0 : n
  }
  return String(raw ?? '')
}

/** One condition against one inquiry. Unknown field/operator = no match (never a crash). */
export function matchCondition(condition, inquiry) {
  const field = fieldDef(condition.field)
  const operator = operatorDef(condition.operator)
  if (!field || !operator) return false
  const actual = toComparable(field, inquiry[field.id])
  if (!operator.needsValue) {
    return operator.id === 'is_empty' ? actual === '' : actual !== ''
  }
  const wanted = toComparable(field, condition.value)
  switch (operator.id) {
    case 'equals':
      return actual === wanted
    case 'not_equals':
      return actual !== wanted
    case 'contains':
      return String(actual).toLowerCase().includes(String(wanted).toLowerCase())
    case 'not_contains':
      return !String(actual).toLowerCase().includes(String(wanted).toLowerCase())
    case 'greater_than':
      return actual > wanted
    case 'less_than':
      return actual < wanted
    default:
      return false
  }
}

function addDaysIso(nowMs, days) {
  return new Date(nowMs + days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
}

/**
 * Apply one action to a draft inquiry. Returns a short human-readable
 * note for the audit log, or '' when the action was skipped (unknown
 * type, bad value). Never throws.
 */
export function applyAction(action, draft, rule, nowMs = Date.now()) {
  try {
    switch (action.type) {
      case 'assign_to': {
        if (!action.value) return ''
        draft.assignedTo = action.value
        draft.assignedAt = nowMs
        draft.assignedBy = 'rule'
        return `assigned to ${action.value} by rule "${rule.name}"`
      }
      case 'set_branch': {
        if (!action.value) return ''
        draft.branchId = action.value
        return `branched to ${action.value} by rule "${rule.name}"`
      }
      case 'set_status': {
        if (!RULE_STATUSES.includes(action.value)) return ''
        draft.status = action.value
        return `status set to ${action.value} by rule "${rule.name}"`
      }
      case 'schedule_followup': {
        const days = Number(action.value)
        if (!Number.isInteger(days) || days < 1 || days > 90) return ''
        draft.followup = {
          date: addDaysIso(nowMs, days),
          time: '10:00',
          note: `Scheduled by rule "${rule.name}"`,
        }
        // The Follow-ups queue lists status === 'followup' rows, so a
        // scheduled follow-up must also move the inquiry there, or the
        // reminder would be invisible.
        draft.status = 'followup'
        return `follow-up scheduled in ${days} days by rule "${rule.name}"`
      }
      default:
        return ''
    }
  } catch {
    return ''
  }
}

/**
 * Evaluate one rule. Returns { matched, taken } where taken is the
 * list of audit notes. Disabled rules never run. A rule with no
 * conditions matches everything (e.g. "assign all new inquiries").
 */
export function evaluateRule(rule, inquiry, nowMs = Date.now()) {
  if (!rule || rule.enabled === false) return { matched: false, taken: [] }
  const conditions = Array.isArray(rule.conditions) ? rule.conditions : []
  const matched = conditions.every(c => matchCondition(c, inquiry))
  const actions = matched
    ? Array.isArray(rule.actions)
      ? rule.actions
      : []
    : Array.isArray(rule.elseActions)
      ? rule.elseActions
      : []
  const taken = []
  for (const action of actions) {
    const note = applyAction(action, inquiry, rule, nowMs)
    if (note) taken.push(note)
  }
  return { matched, taken }
}

/**
 * Run all rules for a trigger, top to bottom, against a COPY of the
 * inquiry (the caller's object is never mutated). Returns
 * { inquiry, taken } with every audit note in run order.
 */
export function applyRules(rules, inquiry, trigger, nowMs = Date.now()) {
  const draft = { ...(inquiry || {}) }
  const taken = []
  for (const rule of Array.isArray(rules) ? rules : []) {
    if (rule.trigger !== trigger) continue
    const result = evaluateRule(rule, draft, nowMs)
    taken.push(...result.taken)
  }
  return { inquiry: draft, taken }
}

/** Validate a rule draft. Returns '' when valid, else the error to show. */
export function validateRule(rule, existing = []) {
  if (!rule.name || !rule.name.trim()) return 'Rule name is required.'
  if (!RULE_TRIGGERS.some(t => t.id === rule.trigger)) {
    return 'Unknown trigger.'
  }
  const actions = [
    ...(rule.actions || []),
    ...(rule.elseActions || []),
  ]
  if (actions.length === 0) return 'A rule needs at least one action.'
  for (const condition of rule.conditions || []) {
    const field = fieldDef(condition.field)
    const operator = operatorDef(condition.operator)
    if (!field || !operator) return 'Unknown condition.'
    if (!operator.kinds.includes(field.kind)) {
      return `Operator "${operator.label}" does not apply to ${field.label}.`
    }
    if (
      operator.needsValue &&
      (condition.value === '' ||
        condition.value === null ||
        condition.value === undefined)
    ) {
      return 'Every condition needs a value.'
    }
  }
  for (const action of actions) {
    if (!RULE_ACTIONS.some(a => a.id === action.type)) {
      return 'Unknown action.'
    }
    if (action.type === 'set_status' && !RULE_STATUSES.includes(action.value)) {
      return 'Invalid status in action.'
    }
    if (action.type === 'schedule_followup') {
      const days = Number(action.value)
      if (!Number.isInteger(days) || days < 1 || days > 90) {
        return 'Follow-up days must be a whole number from 1 to 90.'
      }
    }
    if (
      (action.type === 'assign_to' || action.type === 'set_branch') &&
      !action.value
    ) {
      return 'Every action needs a value.'
    }
  }
  if (
    existing.some(
      r => r.id !== rule.id && r.name.toLowerCase() === rule.name.trim().toLowerCase()
    )
  ) {
    return 'A rule with this name already exists.'
  }
  return ''
}

/**
 * Load rules for a workspace (settings/rules doc, same pattern as
 * branches/custom fields). Malformed entries are dropped, never fatal.
 */
export async function loadRules(db, ownerUid) {
  if (!db || !ownerUid) return []
  try {
    const snap = await db
      .collection('users')
      .doc(ownerUid)
      .collection('settings')
      .doc('rules')
      .get()
    if (!snap.exists) return []
    const raw = snap.data()?.rules
    if (!Array.isArray(raw)) return []
    return raw.filter(
      rule =>
        rule &&
        typeof rule.id === 'string' &&
        typeof rule.name === 'string' &&
        RULE_TRIGGERS.some(t => t.id === rule.trigger)
    )
  } catch (error) {
    console.error('Rules load failed:', error)
    return []
  }
}
