import React from 'react'
import { useNavigate } from 'react-router-dom'
import ApiWebhooks from './components/ApiWebhooks.jsx'
import { useWorkspace } from './components/WorkspaceContext.jsx'
import { canManageTeam } from './utils/workspace.js'

/**
 * API & Webhooks — its own section (moved out of Settings 2026-10-31).
 * Owner/admin only: anyone else gets the role note, never the section.
 * The section itself also returns null without a workspace, so the
 * loading state shows the page shell, not a broken card.
 */
export default function Api() {
  const { workspace, loading } = useWorkspace()
  const navigate = useNavigate()

  if (!loading && workspace && !canManageTeam(workspace.role)) {
    return (
      <div className="settings-page">
        <div className="settings-inner">
          <header className="settings-header">
            <div>
              <span className="app-eyebrow">INTEGRATIONS</span>
              <h1>API &amp; Webhooks</h1>
              <p>API &amp; Webhooks are not available for your role. Your leads live on the Inquiries and Follow-ups pages.</p>
            </div>
            <button
              className="primary-button"
              onClick={() => navigate('/app/inquiries')}
            >
              Back to inquiries
            </button>
          </header>
        </div>
      </div>
    )
  }

  return (
    <div className="settings-page">
      <div className="settings-inner">
        <header className="settings-header">
          <div>
            <span className="app-eyebrow">INTEGRATIONS</span>
            <h1>API &amp; Webhooks</h1>
            <p>Connect Shopify, Meta, IndiaMART or your website — leads land in Inquiries automatically.</p>
          </div>
          <button
            className="primary-button"
            onClick={() => navigate('/app/inquiries')}
          >
            Back to inquiries
          </button>
        </header>
        <ApiWebhooks />
      </div>
    </div>
  )
}
