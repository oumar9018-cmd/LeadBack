import React, { useCallback, useEffect, useState } from 'react'
import { useWorkspace } from './WorkspaceContext.jsx'

/**
 * API & Webhooks (Settings card, owner/admin only — rendered under the
 * same canManageTeam gate as TeamMembers).
 *
 * The ingestion service itself lives OUTSIDE the SPA (Render) and
 * holds every secret server-side. This card only shows the public
 * endpoint URLs and lets the owner mint/revoke WEBSITE bearer tokens
 * through the service's ID-token-authenticated /api routes. The raw
 * token is shown exactly once at mint time; only its sha256 is stored.
 *
 * Honest split, stated in the UI copy: Shopify, Meta and IndiaMART
 * secrets are operator-provisioned (env-mapped per shop/page/key), so
 * those rows show the endpoint + setup note only. Website tokens are
 * self-serve from this card.
 */
const SERVICE_URL = 'https://leadback-payment.onrender.com'

const ENDPOINTS = [
  {
    name: 'Shopify',
    url: `${SERVICE_URL}/ingest/shopify`,
    note: 'Shopify admin → Settings → Notifications → Webhooks: paste this URL (JSON, order creation). The shop secret is operator-set — tell the operator your shop domain for a new shop.',
  },
  {
    name: 'Meta (Facebook leads)',
    url: `${SERVICE_URL}/ingest/meta`,
    note: 'Meta app dashboard webhook URL + verify token are operator-set. Lead-gen leads are fetched from the Graph API server-side.',
  },
  {
    name: 'IndiaMART',
    url: `${SERVICE_URL}/ingest/indiamart`,
    note: 'IndiaMART BL webhook: paste this URL and send header X-IM-Key. The key is operator-set.',
  },
  {
    name: 'Website form',
    url: `${SERVICE_URL}/ingest/website`,
    note: 'POST your website form to this URL with header Authorization: Bearer <a token below>. Website tokens are self-serve from this card.',
  },
]

async function copyText(text, onDone) {
  try {
    await navigator.clipboard.writeText(text)
    onDone(true)
    return
  } catch {
    // Clipboard API needs a secure context; fall back to a textarea.
    try {
      const area = document.createElement('textarea')
      area.value = text
      document.body.appendChild(area)
      area.select()
      document.execCommand('copy')
      document.body.removeChild(area)
      onDone(true)
    } catch {
      onDone(false)
    }
  }
}

export default function ApiWebhooks() {
  const { workspace } = useWorkspace()
  const [tokens, setTokens] = useState([])
  const [loading, setLoading] = useState(true)
  const [serviceNote, setServiceNote] = useState('')
  const [label, setLabel] = useState('')
  const [minting, setMinting] = useState(false)
  const [minted, setMinted] = useState(null)
  const [copied, setCopied] = useState('')
  const [confirmingId, setConfirmingId] = useState('')
  const [error, setError] = useState('')

  const getIdToken = useCallback(async () => {
    const user = window.firebase?.auth?.().currentUser
    if (!user) return ''
    try {
      return await user.getIdToken()
    } catch {
      return ''
    }
  }, [])

  const loadTokens = useCallback(async () => {
    setLoading(true)
    setServiceNote('')
    try {
      const idToken = await getIdToken()
      if (!idToken) {
        setServiceNote('Sign in again to load your API tokens.')
        setTokens([])
        return
      }
      const res = await fetch(`${SERVICE_URL}/api/website-tokens`, {
        headers: { Authorization: `Bearer ${idToken}` },
      })
      if (res.status === 404) {
        // Old service build (pre-token-API) or service down: endpoints
        // above still work; token minting appears after redeploy.
        setServiceNote('Token minting appears here once the latest API service build is live.')
        setTokens([])
        return
      }
      if (!res.ok) throw new Error(`token list failed: ${res.status}`)
      const data = await res.json()
      setTokens(Array.isArray(data.tokens) ? data.tokens : [])
    } catch (e) {
      console.error('API tokens load failed:', e)
      // Surface the reason: a network/CORS failure and an HTTP status
      // look identical on screen otherwise, and the first live mint
      // check could not tell them apart.
      setServiceNote(`Could not reach the API service (${e.message || 'network error'}) — endpoints above still work; try again in a bit.`)
      setTokens([])
    } finally {
      setLoading(false)
    }
  }, [getIdToken])

  useEffect(() => {
    if (workspace?.ownerUid) loadTokens()
  }, [workspace, loadTokens])

  async function mintToken(event) {
    event.preventDefault()
    setError('')
    setMinted(null)
    const idToken = await getIdToken()
    if (!idToken) {
      setError('Sign in again to mint a token.')
      return
    }
    setMinting(true)
    try {
      const res = await fetch(`${SERVICE_URL}/api/website-tokens`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ label: label.trim() || 'Website' }),
      })
      if (res.status === 404) {
        setServiceNote('Token minting appears here once the latest API service build is live.')
        return
      }
      if (!res.ok) throw new Error(`mint failed: ${res.status}`)
      const data = await res.json()
      setMinted(data)
      setLabel('')
      await loadTokens()
    } catch (e) {
      console.error('Token mint failed:', e)
      setError(`Could not mint a token — ${e.message || 'network error'}.`)
    } finally {
      setMinting(false)
    }
  }

  async function revokeToken(id) {
    if (confirmingId !== id) {
      setConfirmingId(id)
      return
    }
    setConfirmingId('')
    setError('')
    const idToken = await getIdToken()
    if (!idToken) {
      setError('Sign in again to revoke a token.')
      return
    }
    try {
      const res = await fetch(`${SERVICE_URL}/api/website-tokens/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      })
      if (!res.ok) throw new Error(`revoke failed: ${res.status}`)
      await loadTokens()
    } catch (e) {
      console.error('Token revoke failed:', e)
      setError('Could not revoke the token — try again in a bit.')
    }
  }

  if (!workspace) return null

  return (
    <section className="settings-card">
      <div className="settings-card-header">
        <div>
          <span className="settings-label">API &amp; WEBHOOKS</span>
          <h2>Connect Shopify, Meta, IndiaMART or your website</h2>
          <p>Leads from these sources land in your Inquiries automatically. Secrets stay on the API service — nothing secret is stored in this app.</p>
        </div>
      </div>

      <div className="settings-grid">
        {ENDPOINTS.map(endpoint => (
          <div key={endpoint.name} className="settings-full">
            <p>
              <strong>{endpoint.name}:</strong>{' '}
              <code>{endpoint.url}</code>{' '}
              <button
                type="button"
                className="primary-button"
                onClick={() => copyText(endpoint.url, ok => setCopied(ok ? endpoint.name : ''))}
              >
                {copied === endpoint.name ? 'Copied' : 'Copy URL'}
              </button>
            </p>
            <p>{endpoint.note}</p>
          </div>
        ))}
      </div>

      <div className="settings-card-header" style={{ marginTop: 16 }}>
        <div>
          <span className="settings-label">WEBSITE TOKENS</span>
          <h2>Website bearer tokens</h2>
          <p>Mint one token per website. A token is shown once — copy it into your form, it is never shown again.</p>
        </div>
      </div>

      {serviceNote && <p>{serviceNote}</p>}
      {error && <p>{error}</p>}

      <form onSubmit={mintToken}>
        <div className="settings-grid">
          <label>
            <span>Token label</span>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Main website form"
              maxLength={80}
            />
          </label>
          <div>
            <button type="submit" className="primary-button" disabled={minting}>
              {minting ? 'Minting…' : 'Mint token'}
            </button>
          </div>
        </div>
      </form>

      {minted && (
        <div className="settings-full">
          <p>
            <strong>New token for “{minted.label}” — copy it now, it will never be shown again:</strong>
          </p>
          <p>
            <code>{minted.token}</code>{' '}
            <button
              type="button"
              className="primary-button"
              onClick={() => copyText(minted.token, ok => setCopied(ok ? 'minted' : ''))}
            >
              {copied === 'minted' ? 'Copied' : 'Copy token'}
            </button>{' '}
            <button type="button" onClick={() => setMinted(null)}>Dismiss</button>
          </p>
        </div>
      )}

      {loading ? (
        <p>Loading tokens…</p>
      ) : tokens.length === 0 ? (
        <p>No website tokens yet.</p>
      ) : (
        <ul>
          {tokens.map(token => (
            <li key={token.id}>
              <strong>{token.label}</strong>
              {token.createdAt ? ` — created ${new Date(token.createdAt).toLocaleString()}` : ''}
              {token.revoked ? ' — revoked' : ''}{' '}
              {!token.revoked && (
                <button type="button" onClick={() => revokeToken(token.id)}>
                  {confirmingId === token.id ? 'Confirm revoke?' : 'Revoke'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
