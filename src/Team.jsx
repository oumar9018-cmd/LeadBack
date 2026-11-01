import React from 'react'
import { useNavigate } from 'react-router-dom'
import TeamMembers from './components/TeamMembers.jsx'
import BranchesCard from './components/BranchesCard.jsx'
import TerritoryCard from './components/TerritoryCard.jsx'
import RoutingCard from './components/RoutingCard.jsx'
import TeamInsightsCard from './components/TeamInsightsCard.jsx'
import { useWorkspace } from './components/WorkspaceContext.jsx'
import { canManageTeam } from './utils/workspace.js'

/**
 * Team — its own section (moved out of Settings 2026-10-31, same move
 * as API & Webhooks). Owner/admin only: anyone else gets the role
 * note, never the section. Branches live here too — they are team
 * structure, not business preferences.
 */
export default function Team() {
  const { workspace, loading } = useWorkspace()
  const navigate = useNavigate()

  if (!loading && workspace && !canManageTeam(workspace.role)) {
    return (
      <div className="settings-page">
        <div className="settings-inner">
          <header className="settings-header">
            <div>
              <span className="app-eyebrow">TEAM</span>
              <h1>Team</h1>
              <p>Team management is not available for your role. Your leads live on the Inquiries and Follow-ups pages.</p>
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
            <span className="app-eyebrow">TEAM</span>
            <h1>Team</h1>
            <p>Invite staff, manage branches and seats — unlimited and free.</p>
          </div>
          <button
            className="primary-button"
            onClick={() => navigate('/app/inquiries')}
          >
            Back to inquiries
          </button>
        </header>
        <TeamMembers />
        <BranchesCard />
        <TerritoryCard />
        <RoutingCard />
        <TeamInsightsCard />
      </div>
    </div>
  )
}
