import React from 'react'
import { useNavigate } from 'react-router-dom'
import AuditLog from './components/AuditLog.jsx'
import { useWorkspace } from './components/WorkspaceContext.jsx'
import { canManageTeam } from './utils/workspace.js'

/**
 * Activity log — its own section (moved out of Settings 2026-10-31,
 * same move as API & Webhooks and Team). Owner/admin only: anyone
 * else gets the role note, never the log.
 */
export default function Activity() {
  const { workspace, loading } = useWorkspace()
  const navigate = useNavigate()

  if (!loading && workspace && !canManageTeam(workspace.role)) {
    return (
      <div className="settings-page">
        <div className="settings-inner">
          <header className="settings-header">
            <div>
              <span className="app-eyebrow">ACTIVITY</span>
              <h1>Activity log</h1>
              <p>The activity log is not available for your role. Your leads live on the Inquiries and Follow-ups pages.</p>
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
            <span className="app-eyebrow">ACTIVITY</span>
            <h1>Activity log</h1>
            <p>Every invite, role change, assignment and removal, time-stamped.</p>
          </div>
          <button
            className="primary-button"
            onClick={() => navigate('/app/inquiries')}
          >
            Back to inquiries
          </button>
        </header>
        <AuditLog />
      </div>
    </div>
  )
}
