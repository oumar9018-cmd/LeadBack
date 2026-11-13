/**
 * Outbound webhooks — Round 5 (pure helpers).
 *
 * A workflow rule (utils/workflows.js) can carry the action
 * `send_webhook`: when the rule fires in the app-open sweep, the
 * sweep POSTs the JSON payload built here to the rule's configured
 * URL. That is exactly the shape "Webhooks by Zapier" (Catch Hook
 * trigger) and Make ("Custom webhook" / "Webhooks > Custom webhook"
 * scenario entry) consume, so no BackWon-side integration code is
 * needed beyond this POST.
 *
 * Honest limits (stated in the Settings + Integrations copy too):
 *   - Sends happen only while the app is open — the same moment
 *     every BackWon automation runs today. There is no server-side
 *     scheduler behind this.
 *   - A failed send is final for that firing: it is counted in the
 *     sweep's audit summary and NEVER retried silently. The rule
 *     can fire again only when the inquiry has new activity (the
 *     workflows episode dedupe), exactly like every other action.
 *   - The URL must be https — webhook endpoints carry customer
 *     data, and Zapier/Make hook URLs are always https.
 *
 * The payload is a fixed, documented field set — never the whole
 * inquiry doc — so a hook never leaks internal fields (history,
 * dedupe markers, flags) to a third party.
 */

export const WEBHOOK_EVENT = 'workflow_fired'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Validate a webhook URL. Returns { ok, url, error } — `url` is
 * the trimmed string when ok. https only, must parse, must have a
 * host. */
export function validateWebhookUrl(raw) {
  const url = typeof raw === 'string' ? raw.trim() : ''
  if (!url) return { ok: false, url: '', error: 'Enter the webhook URL.' }
  let parsed
  try {
    parsed = new URL(url)
  } catch {
    return { ok: false, url: '', error: 'That does not look like a valid URL.' }
  }
  if (parsed.protocol !== 'https:') {
    return {
      ok: false,
      url: '',
      error: 'The webhook URL must start with https:// — hook URLs from Zapier and Make always do.',
    }
  }
  if (!parsed.hostname) {
    return { ok: false, url: '', error: 'The webhook URL is missing its host.' }
  }
  return { ok: true, url, error: '' }
}

/** The host a URL points at — for compact UI/audit display that
 * never echoes query strings (hook URLs carry secret path tokens,
 * and the full URL must stay out of the audit log). */
export function webhookHost(raw) {
  try {
    return new URL(String(raw || '')).hostname || ''
  } catch {
    return ''
  }
}

/**
 * Build the JSON payload POSTed when a workflow webhook fires.
 * @param {object} input { rule: {id, name, trigger}, inquiry,
 *   workspaceId, nowMs }
 * Inquiry fields are the documented set only; createdAt is passed
 * through as stored (epoch ms or ISO string in this codebase).
 */
export function buildWebhookPayload(input = {}) {
  const { rule, inquiry, workspaceId, nowMs } = input || {}
  const item = inquiry && typeof inquiry === 'object' ? inquiry : {}
  const firedAt = new Date(Number(nowMs) || Date.now()).toISOString()
  return {
    event: WEBHOOK_EVENT,
    workspaceId: typeof workspaceId === 'string' ? workspaceId : '',
    timestamp: firedAt,
    rule: {
      id: typeof rule?.id === 'string' ? rule.id : '',
      name: typeof rule?.name === 'string' ? rule.name : '',
      trigger: typeof rule?.trigger === 'string' ? rule.trigger : '',
      action: 'send_webhook',
    },
    inquiry: {
      id: item.id ? String(item.id) : '',
      name: item.name || '',
      phone: item.phone || '',
      email:
        typeof item.email === 'string' && EMAIL_RE.test(item.email.trim())
          ? item.email.trim()
          : '',
      service: item.service || '',
      status: item.status || '',
      value: Number(item.value) || 0,
      source: item.source || '',
      branchId: item.branchId || '',
      assignedTo: item.assignedTo || '',
      createdAt: item.createdAt ?? null,
    },
  }
}
