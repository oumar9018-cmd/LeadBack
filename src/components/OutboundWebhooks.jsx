import React from 'react'
import './ApiWebhooks.css'

/**
 * Outbound webhooks help — Round 5 (API & Webhooks page).
 *
 * Explains, in plain words, how a workflow's "Send webhook" action
 * bridges BackWon to the thousands of apps Zapier and Make connect,
 * and states the honest limits in the same place: sends happen only
 * while the app is open, failed sends are counted in the activity
 * log and never retried silently, and the URL must be https. This
 * card is help copy only — the URL itself lives on the workflow
 * rule (Settings → Workflow automations).
 */
export default function OutboundWebhooks() {
  return (
    <section className="api-card">
      <div className="api-card-header">
        <span className="api-eyebrow">OUTBOUND · ZAPIER &amp; MAKE</span>
        <h2>Send BackWon events to other apps</h2>
        <p>
          A workflow can POST an inquiry&rsquo;s details to a webhook URL
          when its trigger fires — for example, when a new inquiry has
          waited 4 hours. Zapier and Make both start from a webhook, so
          this one action connects BackWon to the apps they support.
        </p>
      </div>

      <div className="api-endpoint">
        <div className="api-endpoint-top">
          <span className="api-endpoint-name">Zapier</span>
        </div>
        <p className="api-note">
          1. In Zapier, create a Zap and choose the trigger
          &ldquo;Webhooks by Zapier&rdquo; → &ldquo;Catch Hook&rdquo;. Zapier
          shows you a URL that starts with https://hooks.zapier.com/.
          2. In BackWon, go to Settings → Workflow automations, add a
          rule, pick the action &ldquo;Send a webhook&rdquo;, and paste that
          URL. 3. Open BackWon so the rule fires once — Zapier receives
          a test event with the inquiry&rsquo;s name, phone, email,
          service, status and value — then finish the Zap by choosing
          what happens next (add a row, send a message, create a task).
        </p>
      </div>

      <div className="api-endpoint">
        <div className="api-endpoint-top">
          <span className="api-endpoint-name">Make</span>
        </div>
        <p className="api-note">
          1. In Make, create a scenario and add the
          &ldquo;Webhooks&rdquo; module → &ldquo;Custom webhook&rdquo; as the
          first step. Make shows you a URL that starts with
          https://hook. 2. Paste that URL into a BackWon workflow rule
          with the &ldquo;Send a webhook&rdquo; action, exactly as above.
          3. Run the scenario once while BackWon is open so Make learns
          the event shape, then add the modules you want after it.
        </p>
      </div>

      <p className="api-note">
        Honest limits: webhooks fire only while BackWon is open in a
        browser — the same moment every BackWon automation runs; there
        is no background server sending them later. If a send fails,
        it is counted in the activity log (&ldquo;Workflow webhooks this
        app open: X sent, Y failed&rdquo;) and is not retried quietly; the
        rule can fire again only when the inquiry has new activity.
        The URL must start with https:// — hook URLs from Zapier and
        Make always do.
      </p>
    </section>
  )
}
