/**
 * SEO page manifest — the single source of truth for every marketing route.
 *
 * Plain ESM data (no JSX, no CSS imports) so it can be consumed by:
 *   - src/SEOPage.jsx            (renders the page in the browser)
 *   - src/seo/useSEO.js          (applies <title> / meta / JSON-LD at runtime)
 *   - scripts/prerender-seo.mjs  (bakes real meta into static HTML at build time)
 *   - src/Home.jsx               (Header + Footer navigation)
 *
 * Adding a page here is enough: the route, the nav link, the sitemap entry and
 * the prerendered HTML are all derived from this array.
 *
 * Copy guidelines used below (these matter for ranking, not just for looks):
 *   - title       <= 60 chars, primary keyword first
 *   - description <= 155 chars, reads as a benefit, ends with a soft CTA
 *   - exactly one <h1> per page (`heading`), everything else <h2>/<h3>
 *   - every page answers "what is it / who is it for / what do I do next"
 */

/* ------------------------------------------------------------------ */
/* Home (also gets a full meta pass so it stops relying on index.html)  */
/* ------------------------------------------------------------------ */

const home = {
  type: 'home',
  path: '/',
  title: 'BackWon — Win Back Every Customer You Almost Lost',
  description:
    'BackWon helps businesses of every size win back missed calls and cold inquiries with one-tap WhatsApp follow-ups and personal voice notes. Start free.',
  keywords:
    'win back customers, missed call follow up, WhatsApp follow up tool, customer recovery software, voice note follow up, lead recovery, small business CRM',
  eyebrow: 'CUSTOMER WIN-BACK',
  heading: 'Win back every customer you almost lost.',
  intro:
    'BackWon gives businesses of every size one simple workspace to catch every missed inquiry, follow up in one tap on WhatsApp — or with a personal voice note — and measure the revenue that comes back.',
  sections: [
    {
      icon: 'inbox',
      title: 'Catch missed inquiries',
      text: 'Keep every customer inquiry visible instead of letting promising conversations disappear between calls, DMs and busy workdays.',
    },
    {
      icon: 'clock',
      title: 'Follow up at the right time',
      text: 'Turn follow-ups into a simple, organized workflow your team can actually maintain without a spreadsheet.',
    },
    {
      icon: 'trending',
      title: 'See recovered revenue',
      text: 'Measure which conversations came back and exactly how much revenue your follow-ups generated.',
    },
  ],
  faq: [
    {
      q: 'Is BackWon really free?',
      a: 'Yes. Every feature is free — no credit card, no trial, no paid plans, and unlimited team seats.',
    },
    {
      q: 'How fast can I start?',
      a: 'Sign in with Google and start logging inquiries the same day. There is no setup, no installation and no configuration project.',
    },
    {
      q: 'What is a missed inquiry?',
      a: 'A customer who contacted you — a missed call, a DM, a form enquiry or a walk-in — and did not get a reply. BackWon logs it so you can follow up before they go elsewhere.',
    },
    {
      q: 'Do I need to connect my phone or Instagram?',
      a: 'No. You log inquiries manually with their source, so it works across calls, WhatsApp, Instagram and walk-ins without any integration.',
    },
    {
      q: 'Can I compare branches and see how each team member is doing?',
      a: 'Yes. Reports shows per-branch totals, recovery rates and recovered revenue, plus per-person scorecards — and each role only sees its own scope: reps their own inquiries, branch managers their branch, owners and admins everything.',
    },
    {
      q: 'Can I export my data?',
      a: 'Yes. Owners and admins can download inquiries, customers and the audit log as CSV from the Export Center, with row counts shown before download.',
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Features                                                            */
/* ------------------------------------------------------------------ */

const features = {
  type: 'features',
  path: '/features',
  navLabel: 'Features',
  title: 'BackWon Features — One-Tap WhatsApp Follow-ups & Voice Notes',
  description:
    'Explore BackWon features: one-tap WhatsApp follow-ups, voice-note win-backs, follow-up sequences, booking links, recovery analytics, SLA breach tracking, workflow automations, custom fields, monthly sales targets, workspace backup and restore, Zapier and Make webhooks, email follow-up steps and unlimited seats.',
  keywords:
    'WhatsApp follow up tool, voice note follow up, missed call recovery, follow up sequence software, booking link generator, customer win back features, unlimited team seats free, role based access, round robin lead routing, webhooks api, bulk csv import, activity log, branch reports, team scorecards, data export, csv export, sla breach tracking, workflow automation rules, blitz follow up sequence, offer ladder, custom fields, sales targets, sales quotas, revenue forecast, workspace backup, data restore, zapier webhook, make webhook, email follow up sequence',
  eyebrow: 'FEATURES',
  heading: 'Every feature has one job: getting the customer back.',
  intro:
    'BackWon is deliberately narrow. It does the work that decides whether an interested customer becomes a paying one — and it leaves the rest alone.',
  stats: [
    { value: '25', label: 'Features included' },
    { value: '0', label: 'Spreadsheets required' },
    { value: 'Free', label: 'Forever' },
  ],
  sections: [
    {
      icon: 'inbox',
      title: 'Unified inquiry inbox',
      text: 'Log every enquiry — call, WhatsApp message, website form or walk-in — into one place, so nothing lives only in one person’s phone.',
    },
    {
      icon: 'clock',
      title: 'Follow-up queue',
      text: 'Every open inquiry gets a next action and an owner. Your team opens BackWon and knows exactly who to contact today.',
    },
    {
      icon: 'trending',
      title: 'Recovery analytics',
      text: 'See how many inquiries you captured, how many went cold, and how many you brought back — week by week.',
    },
    {
      icon: 'dollar',
      title: 'Revenue recovered tracking',
      text: 'Attach a value to every won-back conversation and get a running total of revenue that would otherwise have been lost.',
    },
    {
      icon: 'users',
      title: 'Customer history',
      text: 'Every interaction is stored against the customer, so whoever picks up the phone already knows the context.',
    },
    {
      icon: 'bell',
      title: 'Status & reminders',
      text: 'Move inquiries from new, to contacted, to won or lost, and let the status tell you what still needs attention.',
    },
    {
      icon: 'layers',
      title: 'Built-in reporting',
      text: 'Ready-made views of your inquiry pipeline, follow-up queue and recovered revenue, alongside the recovery analytics above — no report builder, no configuration project, no consultant.',
    },
    {
      icon: 'grid',
      title: 'Branch & team reports',
      text: 'Compare every branch side by side — totals, open, recovered and lost inquiries, recovery rate and recovered revenue — and see per-person scorecards with assigned, open, recovered and lost inquiries, recovery rate, recovered revenue and follow-ups due today. Each role sees only its scope: reps their own inquiries, branch managers their branch, owners and admins everything.',
    },
    {
      icon: 'zap',
      title: 'Fast to set up',
      text: 'Sign in with Google and start logging inquiries in the same afternoon. There is no implementation phase.',
    },
    {
      icon: 'users',
      title: 'Team seats, unlimited and free',
      text: 'Invite your whole staff at no extra cost. Everyone works from the same inquiry queue, and seats are free forever — no per-seat charges, ever.',
    },
    {
      icon: 'shield',
      title: 'Roles that protect your data',
      text: 'Owners, admins, branch managers and sales reps each see only what their role allows. Reps see only their assigned leads, and staff can never delete data.',
    },
    {
      icon: 'refresh',
      title: 'Round-robin lead routing',
      text: 'New inquiries are shared fairly across available reps, least-loaded first, so no lead waits on one person’s day off and no rep gets overloaded.',
    },
    {
      icon: 'grid',
      title: 'Webhooks & API',
      text: 'Connect Shopify, Meta leads, IndiaMART or any website form. New leads land in your inbox automatically, with one bearer token per website.',
    },
    {
      icon: 'file',
      title: 'Bulk CSV import',
      text: 'Bring thousands of dead leads back in one import — map columns, preview what is valid, and blitz the good ones in a single pass.',
    },
    {
      icon: 'file',
      title: 'Export Center',
      text: 'Owners and admins can download inquiries, customers and the audit log as CSV — newest first, up to 1,000 rows per export. Row counts are shown before you download, and every export is written to the audit log.',
    },
    {
      icon: 'check',
      title: 'Activity log',
      text: 'Every invite, role change, assignment and removal is time-stamped with who did it, so the business always has a clear record.',
    },
    {
      icon: 'clock',
      title: 'SLA centre',
      text: 'Set a first-response target in hours, then see — live, in Reports — every new inquiry that has passed it unanswered, the ones closing in on it, and the breach rate over the last 7 and 30 days, including which branch and which person has the most breaches. BackWon does not record a first-response time, so the rate counts inquiries still waiting past the target rather than guessing about late answers.',
    },
    {
      icon: 'refresh',
      title: 'Workflow automations',
      text: 'Time-based rules you switch on yourself (off by default): when a new inquiry waits too long, an inquiry goes stale, or the SLA is breached, a workflow can assign it to the branch manager or a team member, create a follow-up task for today, flag it as priority, or send a webhook to a URL you configure. Workflows run when an owner, admin or branch manager opens the app, act on an inquiry at most once until there is new activity on it, and are written to the activity log. Nothing is ever sent to customers automatically.',
    },
    {
      icon: 'zap',
      title: 'Blitz 3-touch sequences',
      text: 'On an inquiry that has gone quiet for 30 days or more, one click starts a rapid 3-touch sequence — today, in 2 days and in 5 days. Each touch lands in your follow-up queue on its day with the WhatsApp message ready, and you send it yourself, like every BackWon follow-up.',
    },
    {
      icon: 'layers',
      title: 'Offer ladder checklist',
      text: 'A 3-step win-back checklist on each inquiry: write the first small offer, the stronger second one and your best final offer, and tick each off as you make it — so the team can see what has already been tried on a customer before offering more.',
    },
    {
      icon: 'file',
      title: 'Custom fields',
      text: 'Define up to 10 fields of your own in Settings — text, number, date, or a dropdown with your options — for the details your business tracks, like budget range or preferred language. They appear on the add-inquiry form and on each inquiry’s details, can be filled from a mapped column during CSV import, and are included in CSV exports. Removing a field hides it; values already saved on inquiries are kept.',
    },
    {
      icon: 'trending',
      title: 'Monthly targets & pace forecast',
      text: 'Set a monthly recovered-revenue and recovery-count target for each person and each branch in Settings. The branch and team scorecards in Reports then show this month’s progress against each target, and a pace estimate scales this month’s daily recovery rate to the full month — labelled in the app as an estimate, not a promise.',
    },
    {
      icon: 'shield',
      title: 'Full workspace backup & restore',
      text: 'Owners and admins can download the whole workspace as one JSON file — every inquiry, the customer directory, the team list, branches, and the SLA, workflow, escalation, targets and custom-field settings. The owner can restore a backup into any workspace, and restore is a safe merge: inquiries come back as new copies marked as restored, branches are added only if missing, and settings only gain keys they do not have yet. Nothing is ever overwritten or deleted, and team members are not restored — their records are created when they accept an invite.',
    },
    {
      icon: 'zap',
      title: 'Outbound webhooks (Zapier & Make)',
      text: 'A workflow rule can POST an inquiry’s details — name, phone, email, service, status and value — to a webhook URL you configure, which is exactly what “Webhooks by Zapier” and Make’s “Custom webhook” consume, so BackWon events can drive the thousands of apps those platforms connect. Webhooks fire only while the app is open, like every BackWon automation; a failed send is counted in the activity log and is never retried quietly. The URL must be https.',
    },
    {
      icon: 'message',
      title: 'Email steps in follow-up sequences',
      text: 'Each step of a drip or blitz sequence can be WhatsApp or Email. An email step appears in your follow-up queue on its day as a pre-filled email — subject and message written from the same templates — that opens in your own mail app, where you press send; BackWon prepares the email but does not send it by itself yet. A step whose customer has no email address on their inquiry is shown as skipped, with the reason, instead of failing silently.',
    },
  ],
  faq: [
    {
      q: 'Do I need to connect my phone system to BackWon?',
      a: 'No. BackWon is designed for businesses whose inquiries arrive across calls, WhatsApp, Instagram and walk-ins, so you can log an inquiry manually in seconds. Everything is in one place without any telephony integration.',
    },
    {
      q: 'Can more than one person use BackWon?',
      a: 'Yes — BackWon includes unlimited team seats, free. Invite staff by email with a role: owner, admin, branch manager or sales rep. Branch managers see only their branch, sales reps see only their assigned leads, and staff can never delete data.',
    },
    {
      q: 'How is BackWon different from a CRM?',
      a: 'A general CRM tries to run your whole business. BackWon does one thing: making sure an interested customer who has already contacted you gets a reply and a follow-up. That narrower focus is why owners actually keep using it.',
    },
    {
      q: 'Is my data exported if I cancel?',
      a: 'Yes — you do not need to cancel to get your data out. Owners and admins can use the Export Center to download inquiries, customers and the audit log as CSV files, newest first, up to 1,000 rows per export, with row counts shown before download. Every export is also recorded in the audit log.',
    },
    {
      q: 'Can I compare how my branches are performing?',
      a: 'Yes. Reports has a Branches tab that shows each branch’s totals, open, recovered and lost inquiries, recovery rate and recovered revenue side by side. Branch managers see only their own branch; owners and admins see every branch.',
    },
    {
      q: 'Can I bring my existing leads over from a spreadsheet or another tool?',
      a: 'Yes. Bulk CSV import lets you map your columns to BackWon fields, preview what will come in before anything is saved, and flags duplicates so the same lead is not created twice. Imports are resume-safe, so an interrupted import can be picked up instead of started over.',
    },
    {
      q: 'How do roles and permissions work for managers and reps?',
      a: 'BackWon has four roles: owner, admin, branch manager and sales rep. Owners and admins see everything, branch managers see only their own branch, and sales reps see only inquiries assigned to them. Staff can never delete data.',
    },
    {
      q: 'Is there an audit trail of what my team changed?',
      a: 'Yes. The activity log records status changes, assignments, role changes and exports, time-stamped with who did them, so you can see what changed and when. Owners and admins can also download the audit log as CSV from the Export Center.',
    },
    {
      q: 'Can BackWon receive leads automatically from my website or other tools?',
      a: 'Yes. Webhooks and the API connect Shopify, Meta leads, IndiaMART or any website form — each website uses its own bearer token, and leads are deduplicated by source and external ID so a retried delivery does not create a second inquiry. See the Integrations page for how each source connects.',
    },
    {
      q: 'Can I track whether my team replies to new inquiries fast enough?',
      a: 'Yes. Set a first-response target in hours in Settings, and the SLA centre in Reports shows every new inquiry still unanswered past that target, the ones at risk of breaching, and the breach rate for the last 7 and 30 days — including the branch and the person with the most breaches. One honest limit: BackWon does not record a first-response time, so the rate counts inquiries still waiting past the target; an inquiry that was answered late counts as answered, not as a breach.',
    },
    {
      q: 'Can BackWon assign or chase inquiries automatically?',
      a: 'Yes, with workflow automations — and they are off until you switch them on. A workflow pairs a time-based trigger (a new inquiry waiting too long, an inquiry going stale, or an SLA breach) with one action: assign to the branch manager or a team member, create a follow-up task for today, flag the inquiry as priority, or send a webhook to a URL you configure (see the Zapier and Make question below). Workflows run when an owner, admin or branch manager opens the app, act at most once per inquiry until there is new activity on it, and every action is recorded in the activity log. They never send anything to customers. Separately, rules can act the moment an inquiry is created — for example assigning it by service or source.',
    },
    {
      q: 'What is a blitz sequence?',
      a: 'A blitz is a rapid 3-touch follow-up sequence for one stale inquiry — one that has had no activity for 30 days or more. One click schedules touches for today, in 2 days and in 5 days; each appears in your follow-up queue on its day with the WhatsApp message ready, and you send it yourself. Only one blitz can run on an inquiry at a time.',
    },
    {
      q: 'How does the offer ladder work?',
      a: 'Each open inquiry carries a 3-step offer ladder checklist: a first small offer, a stronger second offer and your best final offer. Your team writes each offer on the inquiry and ticks it off as it is made, so nobody repeats an offer that already failed or jumps straight to the biggest discount.',
    },
    {
      q: 'Can I add my own fields to inquiries?',
      a: 'Yes. Owners and admins can define up to 10 custom fields in Settings — text, number, date, or a dropdown with your own options. They appear on the add-inquiry form and on each inquiry’s details, a matching column can be mapped to them during CSV import, and they are included in CSV exports. Removing a field hides it from forms, but values already saved on inquiries are kept.',
    },
    {
      q: 'Can I set monthly targets for my team or branches?',
      a: 'Yes. Settings has monthly targets: a recovered-revenue target and a recovery-count target for each person and each branch, applying every month until you change them. Reports shows this month’s progress against each target on the branch comparison and team scorecards, counting inquiries by the date they were marked recovered. Reports also shows a pace estimate — this month’s recoveries scaled to the full month at the current daily rate — and labels it as an estimate, not a promise.',
    },
    {
      q: 'Can I back up my whole workspace and restore it later?',
      a: 'Yes. In the Export Center, owners and admins can download a full workspace backup as one JSON file: all inquiries, the customer directory, the team members list, branches, and the SLA, workflow, escalation, targets and custom-field settings. (The workspace profile — business name and currency — is not part of a backup.) Restoring is owner-only and always a safe merge: you preview the counts and the backup date first and confirm before anything happens; inquiries are added as new copies marked as restored, branches are added only if missing, and settings only gain keys they do not already have. Nothing is overwritten or deleted — which also means restoring the same file twice duplicates the inquiries. Team members are listed in the backup for reference but are not restored, because a member’s record is created when they accept their invite.',
    },
    {
      q: 'Can BackWon send data to Zapier or Make?',
      a: 'Yes. Give a workflow rule the “Send a webhook” action and paste the hook URL from Zapier (Webhooks by Zapier → Catch Hook) or Make (Webhooks → Custom webhook). When the rule’s trigger fires, BackWon POSTs the inquiry’s name, phone, email, service, status and value as JSON to that URL, and your Zap or scenario takes it from there. Two honest limits: webhooks fire only while BackWon is open in a browser, like every BackWon automation, and if a send fails it is counted in the activity log rather than retried quietly — the rule can fire again only when the inquiry has new activity. The URL must start with https://, which Zapier and Make hook URLs always do.',
    },
    {
      q: 'Can follow-up sequences use email instead of WhatsApp?',
      a: 'Yes — each step of a drip or blitz sequence can be set to WhatsApp or Email. On its day, an email step appears in your follow-up queue as a pre-filled email (subject and message from the step’s template) that opens in your own mail app; you review it and press send there. BackWon prepares the email — it does not send email by itself yet. Email steps use the customer’s email address on the inquiry (an optional field when you add one); if an inquiry has no email address, that step is shown as skipped with the reason, and you can still mark it sent to clear it or follow up on WhatsApp instead.',
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Integrations — the public face of API & Webhooks (previously only   */
/* visible inside the app at /app/api).                                */
/* ------------------------------------------------------------------ */

const integrations = {
  type: 'integrations',
  path: '/integrations',
  navLabel: 'Integrations',
  title: 'BackWon Integrations — Shopify, Meta & IndiaMART Leads',
  description:
    'Connect Shopify, Meta leads, IndiaMART or any website form to BackWon. New inquiries land in your inbox automatically — webhooks and API included free.',
  keywords:
    'Shopify webhook, Meta leads integration, IndiaMART leads, website form API, lead webhook software, bearer token api, automatic lead capture',
  eyebrow: 'INTEGRATIONS',
  heading: 'Every lead source, one inbox.',
  intro:
    'Connect the tools your business already uses. New inquiries land in BackWon automatically — no copy-paste, no missed leads, no extra software to learn.',
  stats: [
    { value: '4', label: 'Sources live' },
    { value: '0', label: 'Extra cost' },
    { value: 'Free', label: 'Forever' },
  ],
  stepsHeading: 'Three steps to connect.',
  steps: [
    {
      title: 'Pick a source',
      text: 'Shopify, Meta leads, IndiaMART — or any website form of your own.',
    },
    {
      title: 'Paste the URL or token',
      text: 'Platform webhooks verify by signature. Website forms use one bearer token per site, shown once and stored only as a hash.',
    },
    {
      title: 'Leads land in Inquiries',
      text: 'New inquiries appear automatically, deduplicated, and round-robin routed to the right rep.',
    },
  ],
  sections: [
    {
      icon: 'briefcase',
      title: 'Shopify',
      text: 'Orders and inquiries from your store flow straight into the follow-up queue, verified by HMAC signature.',
    },
    {
      icon: 'message',
      title: 'Meta leads',
      text: 'Facebook lead ads arrive with signatures verified and lead details fetched server-side — no manual entry.',
    },
    {
      icon: 'search',
      title: 'IndiaMART',
      text: 'Marketplace inquiries land in the same inbox as everything else, keyed by your IndiaMART key.',
    },
    {
      icon: 'file',
      title: 'Any website form',
      text: 'Mint one bearer token per website and post to it. The token is shown once and never stored in plain text.',
    },
  ],
  faq: [
    {
      q: 'Do I need a developer to connect?',
      a: 'No. Platform webhooks are pasted URLs with signatures; website forms need one token copied into the form. If you can paste a link, you can connect a source.',
    },
    {
      q: 'What happens if the same lead comes twice?',
      a: 'BackWon deduplicates by source and external ID, so a retried webhook never creates a second inquiry.',
    },
    {
      q: 'Is my data safe with webhooks?',
      a: 'Signatures are verified on every request, bad signatures are rejected before anything is written, and website tokens are stored only as hashes — never in plain text.',
    },
    {
      q: 'Does this cost extra?',
      a: 'No. Webhooks and API are included free, like everything else in BackWon.',
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Pricing — free forever, stated plainly (BackWon has no paid plans). */
/* ------------------------------------------------------------------ */

const pricing = {
  type: 'pricing',
  path: '/pricing',
  navLabel: 'Pricing',
  title: 'BackWon Pricing — Free Forever, Every Feature Included',
  description:
    'BackWon pricing: free forever. Every feature included, unlimited team seats, no credit card, no trial, no paid plans.',
  keywords:
    'free CRM, free lead follow up software, free customer recovery tool, no credit card software, unlimited team seats free',
  eyebrow: 'PRICING',
  heading: 'Free. Forever. No catch.',
  intro:
    'Every feature in BackWon is free — unlimited seats, API, audit log, all of it. No credit card, no trial clock, no plan to upgrade to.',
  stats: [
    { value: 'Free', label: 'To start' },
    { value: 'Free', label: 'Per seat' },
    { value: '0', label: 'Paid plans' },
  ],
  sections: [
    {
      icon: 'check',
      title: 'Every feature included',
      text: 'Inbox, follow-ups, Blitz mode, offers, revenue tracking, routing, CSV import, webhooks and API — all of it, free.',
    },
    {
      icon: 'users',
      title: 'Unlimited seats',
      text: 'Invite your whole team. No per-seat charges, ever.',
    },
    {
      icon: 'shield',
      title: 'No credit card',
      text: 'Sign in with Google and start. Nothing to pay, nothing to cancel.',
    },
    {
      icon: 'clock',
      title: 'No trial clock',
      text: 'Free does not expire after 14 days. It is free, full stop.',
    },
    {
      icon: 'file',
      title: 'Your data stays yours',
      text: 'Records live in your workspace. Cancelling never deletes your history.',
    },
    {
      icon: 'layers',
      title: 'Built for small and big',
      text: 'One owner or fifty reps — roles, branches and routing scale with you.',
    },
  ],
  faq: [
    {
      q: 'Is BackWon really free?',
      a: 'Yes. Every feature today is free — no card, no trial, no paid plans, no per-seat charges.',
    },
    {
      q: 'Will you charge later?',
      a: 'Any future paid option, if one ever appears, will be for something new — and will be decided only when traffic and users grow. The free core stays free.',
    },
    {
      q: 'What about big businesses?',
      a: 'Big teams use the same free core: roles, branches, round-robin routing, API and audit log. Nothing is gated by team size.',
    },
    {
      q: 'How do you make money if it is free?',
      a: 'Honest answer: right now, we do not. We would rather earn trust first — the same reason there are no ads, no resold data and no paywalls in the product.',
    },
    {
      q: 'Can I export my data if I leave?',
      a: 'Yes. Owners and admins can download inquiries, customers and the audit log as CSV from the Export Center — newest first, up to 1,000 rows per export, with row counts shown before you download. Every export is recorded in the audit log, so leaving never means losing your records.',
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Use cases hub                                                       */
/* ------------------------------------------------------------------ */

const useCases = {
  type: 'use-cases',
  path: '/use-cases',
  navLabel: 'Use Cases',
  title: 'BackWon Use Cases — Recover Missed Inquiries',
  description:
    'See how businesses use BackWon to recover missed calls, unanswered DMs, cold quote requests, no-shows and dormant leads — and turn them into revenue.',
  keywords:
    'lead recovery use cases, missed call follow up, quote follow up software, dormant lead reactivation, no-show follow up, lead follow up examples',
  eyebrow: 'USE CASES',
  heading: 'Where your revenue is leaking right now.',
  intro:
    'Most lost revenue is not lost to competitors — it leaks out of ordinary gaps. A call you could not answer, a DM you meant to reply to, a quote you never chased. These are the gaps BackWon closes.',
  sections: [
    {
      icon: 'phone',
      title: 'Missed calls',
      text: 'Every unanswered call is a customer who wanted something and did not get it. Log the number, call back with context, and stop paying twice for the same lead.',
    },
    {
      icon: 'message',
      title: 'Unanswered DMs',
      text: 'Instagram, WhatsApp and Facebook enquiries arrive when you are working. Capture them before they scroll past and the conversation goes cold.',
    },
    {
      icon: 'file',
      title: 'Cold quote requests',
      text: 'A quote you sent three weeks ago is not a lost deal — it is an un-followed-up deal. Track every quote to a decision.',
    },
    {
      icon: 'calendar',
      title: 'No-shows & cancellations',
      text: 'Customers who missed an appointment are the warmest leads you have. Rebook them instead of writing them off.',
    },
    {
      icon: 'refresh',
      title: 'Dormant lead reactivation',
      text: 'Last year’s enquiries are a free pipeline. Work the old list systematically instead of only chasing new demand.',
    },
    {
      icon: 'briefcase',
      title: 'Repeat business',
      text: 'Service businesses grow on the second and third job. Track when a customer is due and reach out first.',
    },
  ],
  showcase: {
    title: 'Go deeper on the biggest leaks',
    text: 'Each of these use cases has its own playbook, workflow and benchmarks.',
    items: [
      {
        to: '/use-cases/missed-inquiries',
        title: 'Missed customer inquiries',
        text: 'The full workflow for capturing and recovering every inquiry that reaches your business.',
      },
      {
        to: '/use-cases/follow-up-management',
        title: 'Follow-up management',
        text: 'How to build a follow-up routine your team keeps up with — without a spreadsheet.',
      },
      {
        to: '/use-cases/revenue-recovery',
        title: 'Revenue recovery',
        text: 'Measure the money that came back and prove the value of following up.',
      },
    ],
  },
  faq: [
    {
      q: 'What is the difference between a lead and a missed inquiry?',
      a: 'A lead is someone you hope will buy. A missed inquiry is someone who already raised their hand and did not get a response. Missed inquiries convert at a far higher rate than cold leads, which is why recovering them is usually the cheapest growth available to a small business.',
    },
    {
      q: 'Which use case gives the fastest return?',
      a: 'Usually missed calls and unanswered DMs, because those people contacted you within the last few days and the intent is still fresh. Most businesses see the quickest wins in their first two weeks by working the most recent inquiries first.',
    },
    {
      q: 'Do I need different tools for each use case?',
      a: 'No. Inquiry capture, follow-up management and revenue recovery are three views of the same workspace in BackWon, so a single workflow covers all of them.',
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Use case: missed inquiries                                          */
/* ------------------------------------------------------------------ */

const missedInquiries = {
  type: 'missed-inquiries',
  path: '/use-cases/missed-inquiries',
  title: 'Recover Missed Customer Inquiries | BackWon',
  description:
    'Stop losing customers who already contacted you. Track every missed call, DM and form enquiry, follow up on time, and see the revenue you recover.',
  keywords:
    'missed customer inquiries, missed call recovery, unanswered enquiry follow up, lost lead recovery software, inquiry tracking system',
  eyebrow: 'USE CASE · MISSED INQUIRIES',
  heading: 'The customer already contacted you. That is the expensive part.',
  intro:
    'Acquiring an inquiry costs marketing money, word of mouth and reputation. Losing one costs nothing to prevent. BackWon makes sure no inquiry disappears just because you were busy when it arrived.',
  stats: [
    { value: '100%', label: 'Of inquiries logged' },
    { value: '< 30s', label: 'To record an inquiry' },
    { value: '0', label: 'Leads stuck in inboxes' },
  ],
  steps: [
    {
      title: 'Capture',
      text: 'Log the inquiry the moment it arrives — name, contact, source and what they asked for. One screen, under thirty seconds.',
    },
    {
      title: 'Assign a next action',
      text: 'Every inquiry gets an owner and a next step. Nothing sits in a shared inbox waiting for someone to feel responsible.',
    },
    {
      title: 'Follow up on time',
      text: 'Work the follow-up queue daily. BackWon shows you who is overdue so timing never depends on memory.',
    },
    {
      title: 'Record the outcome',
      text: 'Mark it won, lost or still open, and attach the value. That is what turns activity into measurable revenue.',
    },
  ],
  sections: [
    {
      icon: 'inbox',
      title: 'One inbox for every channel',
      text: 'Calls, WhatsApp, Instagram, website forms and walk-ins all land in the same list, so the channel never determines whether a customer gets a reply.',
    },
    {
      icon: 'search',
      title: 'Find any inquiry instantly',
      text: 'Search by name, phone number, source or status instead of scrolling through three different apps to reconstruct a conversation.',
    },
    {
      icon: 'bell',
      title: 'Nothing goes quiet',
      text: 'Open inquiries stay visible until they are resolved. Silence becomes a decision you make, not something that happens by accident.',
    },
    {
      icon: 'trending',
      title: 'See where inquiries leak',
      text: 'Understand which sources produce inquiries you fail to answer, so you can fix the process rather than guess at it.',
    },
  ],
  faq: [
    {
      q: 'How fast should I follow up on a missed inquiry?',
      a: 'Fast. Intent decays quickly — a person who asked about your service an hour ago is far more likely to book than the same person next week. BackWon surfaces the newest open inquiries first so your first call of the day is to the warmest person on the list.',
    },
    {
      q: 'What if the inquiry came in on WhatsApp or Instagram?',
      a: 'You log it manually with its source. BackWon does not need access to your accounts, which keeps setup simple and works across every channel you use, including walk-ins and phone calls.',
    },
    {
      q: 'Can I track inquiries I lost months ago?',
      a: 'Yes — and it is often worth it. Logging your old enquiries in BackWon gives you a ready-made list of people who already expressed interest but never got a proper follow-up.',
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Use case: follow-up management                                      */
/* ------------------------------------------------------------------ */

const followUpManagement = {
  type: 'follow-up-management',
  path: '/use-cases/follow-up-management',
  title: 'Follow-Up Management Software for Local Business | BackWon',
  description:
    'Build a follow-up routine your team actually keeps. BackWon turns scattered reminders into one shared follow-up queue with owners, dates and outcomes.',
  keywords:
    'follow up management software, sales follow up process, follow up system for small business, lead follow up tool, follow up reminder app',
  eyebrow: 'USE CASE · FOLLOW-UP MANAGEMENT',
  heading: 'Most deals are not lost. They are just never followed up.',
  intro:
    'Following up is not hard — it is just easy to postpone. BackWon removes the two things that break every follow-up habit: not knowing who to contact, and relying on someone remembering to do it.',
  stats: [
    { value: '1', label: 'Shared follow-up queue' },
    { value: '0', label: 'Sticky notes needed' },
    { value: 'Daily', label: 'Ritual, not a project' },
  ],
  steps: [
    {
      title: 'Set the next action',
      text: 'Never close an interaction without deciding the next one. Call back Tuesday, send the quote, check availability — one concrete step.',
    },
    {
      title: 'Give it a date',
      text: 'An action without a date is a wish. Every follow-up in BackWon has a due date attached.',
    },
    {
      title: 'Work the queue',
      text: 'Open the follow-up view each morning. It lists what is due today and what is already overdue.',
    },
    {
      title: 'Close the loop',
      text: 'Record the result and set the next action, or mark the inquiry won or lost. The queue stays clean.',
    },
  ],
  sections: [
    {
      icon: 'clock',
      title: 'A queue, not a to-do list',
      text: 'Follow-ups are ordered by what is actually due, so your team stops re-deciding priorities every morning.',
    },
    {
      icon: 'users',
      title: 'One queue, nothing slips',
      text: 'Every enquiry keeps its history and next step on the record, so nothing depends on one person\'s memory.',
    },
    {
      icon: 'refresh',
      title: 'Handles long cycles',
      text: 'Some customers take months. BackWon keeps the thread alive across weeks without anyone holding it in their head.',
    },
    {
      icon: 'check',
      title: 'Proves the work happened',
      text: 'A complete timeline of every follow-up per customer, useful for coaching and for settling "I thought you called them".',
    },
  ],
  faq: [
    {
      q: 'How many times should I follow up with a customer?',
      a: 'Enough to get a clear yes or no — in most local service businesses that is three to five touches across a couple of weeks. The important part is that each follow-up has a reason and a next step, rather than a generic "just checking in".',
    },
    {
      q: 'Can my team share follow-ups?',
      a: 'Yes. Invite your team by email — seats are unlimited and free. Everyone shares the same inquiry queue, reps see only their assigned leads, and every follow-up still lives on the customer record, never in someone’s phone or inbox.',
    },
    {
      q: 'Is BackWon an automation tool?',
      a: 'BackWon is deliberately a management tool, not an automation tool. It tells your team exactly who needs a human follow-up and when — the message itself still comes from a person, which is what converts in local service businesses.',
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Use case: revenue recovery                                          */
/* ------------------------------------------------------------------ */

const revenueRecovery = {
  type: 'revenue-recovery',
  path: '/use-cases/revenue-recovery',
  title: 'Revenue Recovery Software for Old Leads | BackWon',
  description:
    'Measure the revenue your follow-ups actually recover. BackWon tracks recovered opportunities, win-back value and the true ROI of following up.',
  keywords:
    'revenue recovery software, recover lost revenue, win back lost customers, lead recovery ROI, recovered revenue tracking',
  eyebrow: 'USE CASE · REVENUE RECOVERY',
  heading: 'You cannot improve revenue you never measured.',
  intro:
    'Most teams know how many new leads they got. Almost none know how much money they recovered from the ones they nearly lost. BackWon makes that number visible — and it is usually the most motivating figure in the business.',
  stats: [
    { value: '$', label: 'Recovered, tracked live' },
    { value: '1', label: 'Number that matters' },
    { value: '30 days', label: 'To your first benchmark' },
  ],
  steps: [
    {
      title: 'Tag the opportunity',
      text: 'Mark inquiries that went cold as recovery opportunities instead of quietly deleting them.',
    },
    {
      title: 'Work the recovery list',
      text: 'Run follow-ups against old enquiries the same way you would against brand new ones.',
    },
    {
      title: 'Record the value',
      text: 'When a conversation converts, log what it was worth. This is the step most teams skip and the one that matters most.',
    },
    {
      title: 'Read the recovery report',
      text: 'See recovered revenue by week, by source and by team member, and compare it against your subscription cost.',
    },
  ],
  sections: [
    {
      icon: 'trending',
      title: 'Recovered revenue dashboard',
      text: 'One figure that answers "was following up worth it?" — updated as your team logs outcomes.',
    },
    {
      icon: 'dollar',
      title: 'Compare against cost',
      text: 'Put recovered revenue next to the ten minutes a day it takes. The ROI conversation stops being theoretical.',
    },
    {
      icon: 'layers',
      title: 'Break it down by source',
      text: 'Find out whether Instagram enquiries or phone calls produce more recoverable revenue, and reallocate effort accordingly.',
    },
    {
      icon: 'award',
      title: 'Coach with real numbers',
      text: 'See which follow-up habits convert and turn your best performer’s routine into the team standard.',
    },
  ],
  faq: [
    {
      q: 'What counts as recovered revenue?',
      a: 'Any revenue from a customer whose inquiry had gone cold, been unanswered or been written off, and who converted after a deliberate follow-up. BackWon lets you record the value at the moment you win it back.',
    },
    {
      q: 'How long before I can see a recovery figure?',
      a: 'Most businesses have a meaningful number within 30 days. If you log your old unanswered enquiries when you start, you can often produce recovered revenue in the first fortnight.',
    },
    {
      q: 'Do I need accounting data to use this?',
      a: 'No. You enter the value of the won-back job or booking yourself. BackWon is a recovery record, not an accounting system, so there is no integration work required.',
    },
  ],
}

/* ------------------------------------------------------------------ */
/* How it works                                                        */
/* ------------------------------------------------------------------ */

const howItWorks = {
  type: 'how-it-works',
  path: '/how-it-works',
  navLabel: 'How it works',
  title: 'How BackWon Works — Missed Inquiry to Paying Customer',
  description:
    'See how BackWon works in four steps: capture the inquiry, assign a follow-up, win the customer back, and report the revenue you recovered.',
  keywords:
    'how backwon works, lead recovery process, inquiry follow up workflow, lead management workflow, follow up process steps',
  eyebrow: 'HOW IT WORKS',
  heading: 'A four-step loop, not a software project.',
  intro:
    'BackWon turns a messy, everyday problem into a repeatable routine. Once the loop is running, recovering a missed customer stops being luck.',
  steps: [
    {
      title: '1. Capture the inquiry',
      text: 'Log every enquiry — call, message, form or walk-in — into one workspace so it exists outside someone’s phone.',
    },
    {
      title: '2. Set the next action',
      text: 'Give the inquiry an owner, a next step and a date. This single habit removes most of the leakage.',
    },
    {
      title: '3. Follow up',
      text: 'Work the daily follow-up queue. BackWon shows what is due today and what is already overdue.',
    },
    {
      title: '4. Track the outcome',
      text: 'Record the result and the value, then read the recovery report to see the revenue that came back.',
    },
  ],
  sections: [
    {
      icon: 'zap',
      title: 'Set up in an afternoon',
      text: 'Sign in with Google and start logging inquiries. There is no data migration and no configuration project.',
    },
    {
      icon: 'users',
      title: 'Survives a busy week',
      text: 'Because the daily action is one short list, BackWon survives the kind of week that usually kills a CRM rollout.',
    },
    {
      icon: 'trending',
      title: 'Improves week over week',
      text: 'The more outcomes you log, the clearer the picture of which inquiries, sources and follow-ups actually convert.',
    },
    {
      icon: 'shield',
      title: 'Your data stays yours',
      text: 'Your records stay in your workspace, and cancelling never means losing the history you built. Owners and admins can download inquiries, customers and the audit log as CSV from the Export Center.',
    },
  ],
  faq: [
    {
      q: 'How long does it take to get started?',
      a: 'Most businesses are logging live inquiries the same day. The only setup is signing in with Google — nothing to install, and logging your old unanswered enquiries first is a good idea.',
    },
    {
      q: 'Do I have to change how we take bookings?',
      a: 'No. BackWon sits alongside whatever you already use. You log the inquiry in BackWon so it gets followed up; your existing tools keep doing what they do.',
    },
    {
      q: 'What do I have to do every day?',
      a: 'Open the follow-up queue, work through what is due, and record the outcome. For most owners that is 10 to 15 minutes a day.',
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Industries                                                          */
/* ------------------------------------------------------------------ */

const industries = {
  type: 'industries',
  path: '/industries',
  navLabel: 'Industries',
  title: 'BackWon for Local Service Businesses & Industries',
  description:
    'BackWon helps auto services, home services, salons, fitness studios, photographers and local businesses recover missed inquiries and book more jobs.',
  keywords:
    'lead recovery for local business, service business CRM, salon follow up software, gym lead management, home services lead tracking, auto service CRM',
  eyebrow: 'INDUSTRIES',
  heading: 'Built around how local service businesses actually work.',
  intro:
    'The channels differ, but the failure mode is the same everywhere: a busy team, an inquiry they could not answer, and a customer who quietly went elsewhere.',
  sections: [
    {
      icon: 'briefcase',
      title: 'Auto services',
      text: 'Keep vehicle-service inquiries organized and follow up with customers who already asked about a job.',
    },
    {
      icon: 'layers',
      title: 'Home services',
      text: 'Create a clearer process for the quote requests, site visits and callbacks that pile up during peak season.',
    },
    {
      icon: 'sparkles',
      title: 'Salons & spas',
      text: 'Keep appointment enquiries visible and make rebooking a routine instead of an afterthought.',
    },
    {
      icon: 'users',
      title: 'Fitness & studios',
      text: 'Organize prospective-member inquiries so the people who asked about a membership actually hear back.',
    },
    {
      icon: 'file',
      title: 'Photography',
      text: 'Track the clients who asked about dates, packages and availability before they booked someone else.',
    },
    {
      icon: 'grid',
      title: 'Other local businesses',
      text: 'One simple workflow for any business where a single customer is worth following up on.',
    },
  ],
  showcase: {
    title: 'Industry playbooks',
    text: 'Detailed guides for the industries where missed inquiries cost the most.',
    items: [
      {
        to: '/industries/salons',
        title: 'Salons & spas',
        text: 'Win back missed calls, rebook no-shows, and bring lapsed clients back.',
      },
      {
        to: '/industries/auto-repair',
        title: 'Auto repair',
        text: 'Recover missed service calls and chase every quote to a decision.',
      },
      {
        to: '/industries/clinics',
        title: 'Clinics',
        text: 'Reduce no-shows and reactivate lapsed patients with a simple routine.',
      },
      {
        to: '/industries/coaches',
        title: 'Coaches',
        text: 'Turn discovery-call enquiries into signed clients.',
      },
      {
        to: '/industries/real-estate',
        title: 'Real estate',
        text: 'Never lose a buyer or seller to silence again.',
      },
      {
        to: '/industries/freelancers',
        title: 'Freelancers',
        text: 'Win back every project enquiry without CRM overhead.',
      },
      {
        to: '/industries/car-detailing',
        title: 'Car detailing',
        text: 'How detailing studios and mobile detailers recover missed booking enquiries.',
      },
    ],
  },
  faq: [
    {
      q: 'Is BackWon only for service businesses?',
      a: 'BackWon is designed for businesses where a customer inquiry usually needs a human response before it converts — which covers most local service businesses. If your sales cycle is long and multi-stakeholder, a full CRM will fit you better.',
    },
    {
      q: 'Can I use BackWon on site, from my phone?',
      a: 'Yes. BackWon runs in the browser, so you can log and work inquiries from a phone while on site.',
    },
    {
      q: 'Do you support businesses outside India?',
      a: 'Yes. BackWon works anywhere in the world. The workflow is language- and currency-agnostic — set it to whatever your business uses.',
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Industry: car detailing                                             */
/* ------------------------------------------------------------------ */

const carDetailing = {
  type: 'car-detailing',
  path: '/industries/car-detailing',
  title: 'BackWon for Car Detailing — Recover More Bookings',
  description:
    'Car detailing lead management software. Track missed detailing inquiries, follow up on quotes, and turn more enquiries into booked jobs.',
  keywords:
    'car detailing software, detailing lead management, auto detailing CRM, detailing booking follow up, mobile detailing software, car detailing customer follow up',
  eyebrow: 'INDUSTRY · CAR DETAILING',
  heading: 'Most detailing enquiries never get a second message.',
  intro:
    'Detailing customers message three or four shops and book whoever replies properly first. BackWon makes sure your studio is the one that follows through — every time.',
  stats: [
    { value: '3–4', label: 'Shops each customer messages' },
    { value: '1st', label: 'Proper reply usually wins' },
    { value: 'Free', label: 'To start' },
  ],
  sections: [
    {
      icon: 'phone',
      title: 'Missed calls while you are polishing',
      text: 'You cannot answer the phone with a buffer in your hand. Log the call and return it with the customer’s details already in front of you.',
    },
    {
      icon: 'message',
      title: 'DM enquiries that scroll away',
      text: 'Instagram is where detailing work is won. Capture the enquiry before it disappears under tomorrow’s posts.',
    },
    {
      icon: 'file',
      title: 'Quotes that never got chased',
      text: 'Ceramic coating and full-detail quotes need a nudge. Track every quote until it becomes a booking or a clear no.',
    },
    {
      icon: 'refresh',
      title: 'Customers who never rebooked',
      text: 'A full detail is due every few months. Work your past-customer list and fill the quiet weeks without ad spend.',
    },
    {
      icon: 'dollar',
      title: 'Know what a job is worth',
      text: 'Record the value of each recovered booking and see how much revenue your follow-ups brought in this month.',
    },
    {
      icon: 'users',
      title: 'Works for mobile detailers too',
      text: 'Log inquiries from the van between jobs. No desk, no laptop, no end-of-day admin backlog.',
    },
  ],
  faq: [
    {
      q: 'Is this a detailing booking or scheduling system?',
      a: 'No — and that is deliberate. BackWon does not replace your calendar. It makes sure every enquiry reaches your calendar by giving you a reliable follow-up process around the bookings you already take.',
    },
    {
      q: 'I am a one-person mobile detailing business. Is this useful for me?',
      a: 'Yes, arguably more than for a large shop. When you are the only person, every missed call is a job you personally lost, and there is no one else to pick up the follow-up. BackWon is the second pair of hands.',
    },
    {
      q: 'How quickly will I see recovered bookings?',
      a: 'Businesses that log their last few months of unanswered enquiries typically recover their first job within a fortnight. Starting from scratch, expect a meaningful figure within about 30 days.',
    },
    {
      q: 'Do I need to connect my Instagram or phone?',
      a: 'No integrations are required. You log enquiries manually with their source, which keeps setup instant and works for walk-ins and referrals too.',
    },
  ],
}

/* ------------------------------------------------------------------ */
/* About                                                               */
/* ------------------------------------------------------------------ */

const about = {
  type: 'about',
  path: '/about',
  navLabel: 'About',
  title: 'About BackWon — Revenue Recovery for Growing Businesses',
  description:
    'BackWon builds simple revenue recovery software for local service businesses. Learn why we focus on one job: making sure no customer inquiry is missed.',
  keywords:
    'about backwon, backwon company, revenue recovery company, small business software India, backwon story',
  eyebrow: 'ABOUT',
  heading: 'We build one thing, and we build it narrowly.',
  intro:
    'BackWon exists because of a pattern we kept seeing in small businesses: the marketing worked, the phone rang, and the revenue still leaked — on the follow-up.',
  stats: [
    { value: '1', label: 'Problem we solve' },
    { value: 'Free', label: 'To start' },
    { value: '0', label: 'Per-seat charges' },
  ],
  sections: [
    {
      icon: 'search',
      title: 'The problem we saw',
      text: 'Small businesses spend real money getting customers to make contact, then lose them in the gap between "we will call you back" and actually calling back.',
    },
    {
      icon: 'target',
      title: 'What we decided to build',
      text: 'Not another CRM. A narrow tool that does the four steps between an arriving inquiry and a paying customer, and does them well enough that teams keep using them.'
    },
    {
      icon: 'users',
      title: 'Who we build for',
      text: 'Detailing studios, salons, gyms, photographers, trades and local service teams — businesses where one customer is worth a phone call.',
    },
    {
      icon: 'shield',
      title: 'How we price',
      text: 'No per-seat charges, no setup fees, no feature gates — because the product should prove itself before it asks anything of you.',
    },
  ],
  faq: [
    {
      q: 'Is BackWon a CRM?',
      a: 'Not really. BackWon is a revenue recovery tool. A CRM tries to run your whole customer relationship; BackWon handles the specific stretch where most small businesses lose money — between an inquiry arriving and a follow-up happening.',
    },
    {
      q: 'Who is behind BackWon?',
      a: 'BackWon is built by a small team focused on practical software for local service businesses — and it is completely free, every feature included, because businesses that cannot absorb enterprise software costs still deserve enterprise-grade tools.',
    },
    {
      q: 'How do I get in touch?',
      a: 'Create your free account and reach support from inside your workspace.',
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Resources                                                           */
/* ------------------------------------------------------------------ */

const resources = {
  type: 'resources',
  path: '/resources',
  title: 'BackWon Resources — Inquiry & Follow-Up Guides',
  description:
    'Practical guides on missed customer inquiries, follow-up workflows, lead response times and measuring recovered revenue for local businesses.',
  keywords:
    'lead follow up guide, inquiry response time, follow up best practices, lead recovery tips, small business follow up templates',
  eyebrow: 'RESOURCES',
  heading: 'Practical ideas for recovering more of what you already have.',
  intro:
    'Most growth advice tells you to spend more to get more customers. These guides do the opposite: they help you keep the customers who already contacted you.',
  sections: [
    {
      icon: 'search',
      title: 'Why inquiries get missed',
      text: 'The common points where a customer opportunity disappears during an ordinary busy day — and how to spot yours.',
    },
    {
      icon: 'refresh',
      title: 'Building a follow-up workflow',
      text: 'A repeatable process that tells your team who to contact today, without a spreadsheet or a daily meeting.',
    },
    {
      icon: 'clock',
      title: 'How fast should you respond?',
      text: 'What lead response time actually does to conversion, and what is realistic for a small team.',
    },
    {
      icon: 'dollar',
      title: 'Measuring recovered revenue',
      text: 'Connect follow-up activity to business outcomes, instead of measuring activity for its own sake.',
    },
    {
      icon: 'message',
      title: 'Follow-up scripts that work',
      text: 'Word-for-word openers for calls, WhatsApp and DMs that move a conversation forward without sounding pushy.',
    },
    {
      icon: 'trending',
      title: 'Local-business growth systems',
      text: 'Turn existing customer interest into more completed jobs, without increasing your marketing spend.',
    },
  ],
  showcase: {
    title: 'Guides, templates and tools',
    text: 'Practical, bookmarkable guides — plus the calculator that puts a number on what missed calls cost you each month.',
    items: [
      {
        to: '/resources/missed-revenue-calculator',
        title: 'Missed revenue calculator',
        text: 'Estimate the monthly revenue lost to missed calls, from your own deal value and close rate.',
      },
      {
        to: '/resources/follow-up-messages-that-get-replies',
        title: 'Follow-up messages that get replies',
        text: 'The structure behind a reply-worthy follow-up, with word-for-word examples for WhatsApp, calls and DMs.',
      },
      {
        to: '/resources/lead-response-time',
        title: 'Lead response time',
        text: 'Why minutes matter, what target a small team can actually hit, and the routine that gets you there.',
      },
      {
        to: '/resources/follow-up-sequence-template',
        title: 'Follow-up sequence template',
        text: 'Five touches over two weeks — what to say at each step, when to stop, and how to run it manually.',
      },
      {
        to: '/resources/recover-no-show-bookings',
        title: 'How to recover no-show bookings',
        text: 'What to say, when to send it, and how to rebook a missed appointment without the guilt trip.',
      },
      {
        to: '/resources/whatsapp-follow-up-etiquette',
        title: 'WhatsApp follow-up etiquette',
        text: 'When to message, how often, and the habits that keep your business welcome instead of blocked.',
      },
    ],
  },
  faq: [
    {
      q: 'Are these resources free?',
      a: 'Yes. Every guide is free to read, and none of them require a BackWon account.',
    },
    {
      q: 'Do I need BackWon to apply these guides?',
      a: 'No. The workflows work on paper or in a spreadsheet too. BackWon just removes the manual overhead of keeping them up to date.',
    },
    {
      q: 'Which guide should I start with?',
      a: 'Start with "Why inquiries get missed" if you are not sure where your leakage is, or "Building a follow-up workflow" if you already know you are not following up consistently.',
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Missed revenue calculator                                           */
/* ------------------------------------------------------------------ */

const missedRevenueCalculator = {
  type: 'missed-revenue-calculator',
  path: '/resources/missed-revenue-calculator',
  title: 'Missed Revenue Calculator — BackWon',
  description:
    'Estimate how much revenue missed calls cost your business each month. Enter missed calls, deal value and close rate — free, no sign-up.',
  keywords:
    'missed call revenue calculator, lost revenue calculator, missed inquiry cost, lead recovery estimate, small business revenue loss',
  eyebrow: 'RESOURCES · CALCULATOR',
  heading: 'What are your missed calls costing you?',
  intro:
    'Every missed call is a customer who wanted something and did not get it. Enter your own numbers below for an honest estimate of what those missed calls could be worth each month.',
  sections: [
    {
      icon: 'dollar',
      title: 'How the estimate works',
      text: 'Missed calls per day × 30 days × your average deal value × your close rate. That is the revenue those missed calls could have been worth — if you had followed up.',
    },
    {
      icon: 'search',
      title: 'Why it is an estimate',
      text: 'This is a simple model, not a measurement. It assumes every missed call was a real opportunity and that your close rate applies evenly. Real results depend on how fast you follow up and how many callers you can still reach.',
    },
    {
      icon: 'trending',
      title: 'What to do with the number',
      text: 'If the number surprises you, start with the most recent missed inquiries — they are the warmest. Log them in BackWon, follow up in one tap, and record what comes back.',
    },
    {
      icon: 'clock',
      title: 'A small habit beats a big tool',
      text: 'Ten minutes a day on the follow-up queue recovers more revenue than a new ad campaign. The calculator shows the size of the prize; the habit collects it.',
    },
  ],
  faq: [
    {
      q: 'Is this calculator’s number real revenue?',
      a: 'No — it is an estimate, not a measured figure. It shows what missed calls could be worth under your own assumptions, so you can decide whether following up is worth your time.',
    },
    {
      q: 'Why 30 days?',
      a: 'The estimate assumes 30 days in a month, applied to the missed calls per day you enter. Change the inputs and the estimate updates.',
    },
    {
      q: 'What close rate should I use?',
      a: 'Use the rate at which your enquiries normally become paying customers. If you do not know it, start with 20% and adjust once you have tracked real outcomes.',
    },
    {
      q: 'Do I need an account to use it?',
      a: 'No. The calculator is free to use here, and nothing you enter is stored or sent anywhere.',
    },
  ],
  widget: 'calculator',
}

/* ------------------------------------------------------------------ */
/* GLOBAL VERTICAL PAGES — worldwide positioning                       */
/* ------------------------------------------------------------------ */

/* ------------------------- Salons & Spas ------------------------- */
const salons = {
  type: 'salons',
  path: '/industries/salons',
  title: 'BackWon for Salons — Win Back Missed Appointments',
  description:
    'Salon client follow-up software. Recover missed calls, rebook no-shows, and bring lapsed clients back — without chasing them manually.',
  keywords:
    'salon follow up software, salon client retention, missed appointment recovery, rebook no-show clients, salon CRM, beauty salon lead follow up',
  eyebrow: 'INDUSTRY · SALONS & SPAS',
  heading: 'Your chair is empty because nobody followed up.',
  intro:
    'Salon clients message three or four places and book whoever replies first. BackWon makes sure your salon is the one that follows through — on every missed call, every unanswered DM, every client who never rebooked.',
  stats: [
    { value: '3–4', label: 'Salons each client messages' },
    { value: '1st', label: 'Good reply usually wins' },
    { value: '0', label: 'Clients lost to silence' },
  ],
  sections: [
    {
      icon: 'phone',
      title: 'Missed calls during appointments',
      text: 'You cannot answer the phone with foils in a client’s hair. Log the call and return it with the client’s history already in front of you.',
    },
    {
      icon: 'message',
      title: 'DMs that scroll away',
      text: 'Instagram is where salon bookings are won. Capture the enquiry before it disappears under tomorrow’s posts.',
    },
    {
      icon: 'calendar',
      title: 'No-shows worth rebooking',
      text: 'A client who missed an appointment is the warmest lead you have. Rebook them instead of writing the slot off.',
    },
    {
      icon: 'refresh',
      title: 'Lapsed clients',
      text: 'A colour or cut is due every few weeks. Work your past-client list and fill quiet days without spending on ads.',
    },
    {
      icon: 'dollar',
      title: 'Know what a rebooking is worth',
      text: 'Record the value of every recovered appointment and see exactly how much revenue your follow-ups brought back this month.',
    },
    {
      icon: 'users',
      title: 'Works for solo stylists too',
      text: 'Log enquiries between clients from your phone. No desk, no laptop, no end-of-day admin.',
    },
  ],
  faq: [
    {
      q: 'Is BackWon a salon booking system?',
      a: 'No — deliberately not. BackWon does not replace your calendar or booking app. It makes sure every enquiry reaches your calendar by giving you a reliable follow-up process around the bookings you already take.',
    },
    {
      q: 'I am a solo stylist. Is this useful for me?',
      a: 'Yes — arguably more than for a large salon. When you are the only person, every missed call is an appointment you personally lost. BackWon is the second pair of hands that follows up while you are with a client.',
    },
    {
      q: 'How do I win back clients who stopped coming?',
      a: 'Add your lapsed clients to BackWon and work them like new enquiries: a personal message, a reason to return, a clear next step. Most salons are surprised how many "lost" clients just needed one nudge.',
    },
    {
      q: 'Do I need to connect my Instagram or phone?',
      a: 'No integrations required. You log enquiries manually with their source, which keeps setup instant and works for walk-ins and referrals too.',
    },
  ],
}

/* ------------------------- Auto Repair ------------------------- */
const autoRepair = {
  type: 'auto-repair',
  path: '/industries/auto-repair',
  title: 'BackWon for Auto Repair — Recover Missed Service Jobs',
  description:
    'Auto repair shop follow-up software. Track missed calls, chase unsent quotes, and turn more enquiries into booked service jobs.',
  keywords:
    'auto repair shop CRM, garage lead follow up, missed call auto shop, quote follow up mechanic, auto service customer retention',
  eyebrow: 'INDUSTRY · AUTO REPAIR',
  heading: 'The job went to whoever called back first.',
  intro:
    'Drivers with a strange noise or a warning light call two or three shops and book whoever responds properly. BackWon makes sure your shop is the one that follows up — every time.',
  stats: [
    { value: '2–3', label: 'Shops each driver calls' },
    { value: '1st', label: 'Proper callback usually wins' },
    { value: '0', label: 'Quotes left unchased' },
  ],
  sections: [
    {
      icon: 'phone',
      title: 'Missed calls under the car',
      text: 'You cannot answer the phone mid-job. Log the number and call back with the vehicle details already on screen.',
    },
    {
      icon: 'file',
      title: 'Quotes that never got chased',
      text: 'A brake-job or service quote sitting unanswered is not a lost job — it is an un-followed-up job. Track every quote to a decision.',
    },
    {
      icon: 'calendar',
      title: 'Service reminders',
      text: 'Oil changes, MOTs and seasonal checks are due on schedule. Reach out first and fill the diary before the quiet weeks.',
    },
    {
      icon: 'refresh',
      title: 'One-time customers',
      text: 'The driver who came in once for an emergency is a repeat customer waiting for a reason. Give them one.',
    },
    {
      icon: 'dollar',
      title: 'Know what a job is worth',
      text: 'Record the value of each recovered booking and see the revenue your follow-ups generated this month.',
    },
    {
      icon: 'users',
      title: 'Built for the workshop',
      text: 'Log enquiries from a phone between jobs. No office, no paperwork pile, no end-of-day backlog.',
    },
  ],
  faq: [
    {
      q: 'Is BackWon a garage management system?',
      a: 'No. BackWon does not do job cards, invoicing or parts. It handles the gap most garage software ignores: making sure every enquiry gets a follow-up until it becomes a booking.',
    },
    {
      q: 'How do I handle price shoppers?',
      a: 'Log the quote with its value and follow up once with a reason to choose you — availability, warranty, a courtesy check. Price shoppers who get a proper follow-up convert far more often than ones who hear nothing.',
    },
    {
      q: 'Can I track fleet or repeat customers?',
      a: 'Yes. Customer history keeps every interaction on record, so repeat work and fleet contacts are always one search away.',
    },
    {
      q: 'Do I need any integrations?',
      a: 'No. Manual logging keeps setup instant and works for every channel — phone, WhatsApp, walk-ins and referrals.',
    },
  ],
}

/* ------------------------- Clinics ------------------------- */
const clinics = {
  type: 'clinics',
  path: '/industries/clinics',
  title: 'BackWon for Clinics — Reduce No-Shows, Win Back Patients',
  description:
    'Clinic patient follow-up software. Recover missed appointment enquiries, rebook no-shows, and bring lapsed patients back with a simple workflow.',
  keywords:
    'clinic patient follow up, reduce patient no-shows, missed appointment recovery, patient reactivation software, dental clinic CRM, physiotherapy follow up',
  eyebrow: 'INDUSTRY · CLINICS',
  heading: 'Empty slots are patients who never got a follow-up.',
  intro:
    'Patients who enquire and hear nothing book elsewhere. Patients who miss an appointment and hear nothing stay missed. BackWon gives clinics a simple, respectful follow-up routine that keeps the diary full.',
  stats: [
    { value: '1', label: 'Shared follow-up queue' },
    { value: '0', label: 'Enquiries lost to voicemail' },
    { value: 'Daily', label: 'Routine, not a project' },
  ],
  sections: [
    {
      icon: 'phone',
      title: 'Missed calls at reception',
      text: 'Reception cannot always pick up. Log the caller and return the call with their enquiry details ready.',
    },
    {
      icon: 'calendar',
      title: 'No-show rebooking',
      text: 'A missed appointment is the warmest lead a clinic has. Rebook with one respectful message instead of writing the slot off.',
    },
    {
      icon: 'refresh',
      title: 'Lapsed patients',
      text: 'Check-ups, reviews and treatment plans have natural recall dates. Reach out first and patients come back.',
    },
    {
      icon: 'file',
      title: 'Treatment plans left undecided',
      text: 'Patients who heard a treatment plan and went quiet usually need one clear follow-up, not pressure. Track every plan to a decision.',
    },
    {
      icon: 'bell',
      title: 'Respectful, not pushy',
      text: 'Clinic follow-ups need the right tone. BackWon keeps the human in the loop — reminders prompt your team, people send the message.',
    },
    {
      icon: 'shield',
      title: 'Your records stay yours',
      text: 'Enquiry and follow-up records stay in your workspace. No data hostage situations — cancelling never deletes your history, and owners and admins can download inquiries, customers and the audit log as CSV from the Export Center.',
    },
  ],
  faq: [
    {
      q: 'Is BackWon a practice management system?',
      a: 'No. BackWon does not handle clinical records, billing or scheduling. It covers the communication gap: making sure every patient enquiry and missed appointment gets a proper follow-up.',
    },
    {
      q: 'How do we follow up without sounding pushy?',
      a: 'The follow-up queue prompts the contact; your team writes the message in your clinic’s voice. One respectful check-in converts far better than silence, and patients consistently prefer being remembered.',
    },
    {
      q: 'Can we track treatment-plan acceptance?',
      a: 'Yes. Log the plan as an enquiry with its value, follow up once or twice, and record the outcome. Over time you will see exactly where plans stall.',
    },
    {
      q: 'Does it work for multi-practitioner clinics?',
      a: 'Yes. Your queue is yours to work through in one place, so cover during leave is simple: everything due is visible, with the next step already written.',
    },
  ],
}

/* ------------------------- Coaches ------------------------- */
const coaches = {
  type: 'coaches',
  path: '/industries/coaches',
  title: 'BackWon for Coaches — Turn Enquiries Into Clients',
  description:
    'Coaching business follow-up software. Track discovery-call enquiries, follow up on proposals, and win back prospects who went quiet.',
  keywords:
    'coach lead follow up, coaching client acquisition, discovery call follow up, fitness coach CRM, business coach lead tracking',
  eyebrow: 'INDUSTRY · COACHES',
  heading: 'They were interested. Then life happened.',
  intro:
    'Coaching prospects enquire in a burst of motivation and go quiet when the week gets busy. BackWon keeps every conversation warm until they are ready — so the client comes to you, not to the coach who followed up.',
  stats: [
    { value: '3–5', label: 'Touches to get a yes' },
    { value: '0', label: 'Prospects forgotten' },
    { value: '1', label: 'Queue to work daily' },
  ],
  sections: [
    {
      icon: 'message',
      title: 'DMs and form enquiries',
      text: 'Prospects arrive from Instagram, your website and referrals at all hours. Capture every one before motivation fades.',
    },
    {
      icon: 'calendar',
      title: 'Discovery calls that never booked',
      text: 'Someone asked about working together and never picked a time. One follow-up with a booking link closes that gap.',
    },
    {
      icon: 'file',
      title: 'Proposals gone quiet',
      text: 'A proposal sitting unanswered is not a no. Track it, follow up with a reason, and get the clear answer.',
    },
    {
      icon: 'refresh',
      title: 'Past clients and past leads',
      text: 'Old enquiries and finished programmes are your warmest pipeline. Work the list instead of only chasing new followers.',
    },
    {
      icon: 'trending',
      title: 'See what converts',
      text: 'Learn which sources and follow-up rhythms actually produce clients, and double down on what works.',
    },
    {
      icon: 'zap',
      title: 'Fits a solo practice',
      text: 'No team, no problem. Ten minutes a day on the follow-up queue replaces the spreadsheet you never open.',
    },
  ],
  faq: [
    {
      q: 'I already have a CRM. Why BackWon?',
      a: 'Most coaches do not need a CRM — they need a follow-up habit. BackWon is narrower and simpler: one queue of people to contact, worked daily. If your CRM is where leads go to be forgotten, BackWon is the fix.',
    },
    {
      q: 'How often should I follow up with a prospect?',
      a: 'Until you get a clear yes or no — usually three to five touches across two to three weeks. Each follow-up should add value or make the next step easier, never just "checking in".',
    },
    {
      q: 'Can I use it for corporate or group programmes?',
      a: 'Yes. Longer cycles with multiple stakeholders are exactly where a shared follow-up record pays off — nobody has to remember where the conversation stands.',
    },
    {
      q: 'Does it handle payments or contracts?',
      a: 'No. BackWon covers enquiry to signed client. Your existing tools keep handling payments, contracts and delivery.',
    },
  ],
}

/* ------------------------- Real Estate ------------------------- */
const realEstate = {
  type: 'real-estate',
  path: '/industries/real-estate',
  title: 'BackWon for Real Estate Agents — Never Lose a Buyer Again',
  description:
    'Real estate lead follow-up software. Track every viewing enquiry, chase cold listings, and win back buyers and sellers who went quiet.',
  keywords:
    'real estate lead follow up, estate agent CRM alternative, property enquiry tracking, win back property buyers, seller follow up software',
  eyebrow: 'INDUSTRY · REAL ESTATE',
  heading: 'Speed to lead wins listings. Follow-up wins deals.',
  intro:
    'Buyers enquire on five listings and view with whoever responds first. Sellers choose the agent who stays in touch. BackWon makes sure no enquiry, viewing or valuation ever goes quiet on your watch.',
  stats: [
    { value: '5 min', label: 'Response window that matters' },
    { value: '3–5', label: 'Touches to stay top of mind' },
    { value: '0', label: 'Enquiries lost to inbox' },
  ],
  sections: [
    {
      icon: 'phone',
      title: 'Portal enquiries in one place',
      text: 'Rightmove, Zillow, website forms and board calls all land in one list — no more reconstructing conversations across four apps.',
    },
    {
      icon: 'calendar',
      title: 'Viewings that never booked',
      text: 'Someone asked about a viewing and went quiet. One follow-up with two time options brings them back.',
    },
    {
      icon: 'file',
      title: 'Valuations gone cold',
      text: 'A valuation from three months ago is a listing waiting for a reason. Work the old valuation list systematically.',
    },
    {
      icon: 'refresh',
      title: 'Buyers who paused',
      text: 'Paused buyers come back when circumstances change. Stay the agent they remember with light, useful check-ins.',
    },
    {
      icon: 'trending',
      title: 'Know your pipeline',
      text: 'See every live enquiry, what is overdue and what converted — without the enterprise CRM nobody on the team opens.',
    },
    {
      icon: 'users',
      title: 'One queue, nothing slips',
      text: 'Every enquiry and follow-up lives in one queue. Nothing depends on one person’s memory.',
    },
  ],
  faq: [
    {
      q: 'Is BackWon a replacement for my estate agency CRM?',
      a: 'For many small agencies, yes — because the CRM is where leads go to die. BackWon does the one thing that actually wins deals: making sure every enquiry gets followed up. If you love your CRM, BackWon can sit alongside it for the follow-up layer.',
    },
    {
      q: 'How fast should I respond to a portal enquiry?',
      a: 'Within minutes if possible. But the bigger leak is not the first response — it is the second, third and fourth follow-up that never happens. BackWon fixes that part.',
    },
    {
      q: 'Can I track both buyers and sellers?',
      a: 'Yes. Every enquiry carries its type, source and value, so buyers, sellers, landlords and tenants live in one workflow.',
    },
    {
      q: 'Does it do automated drip emails?',
      a: 'BackWon is deliberately human-first: it tells your team who to contact and when, and the message comes from a person. In property, the personal touch is what converts.',
    },
  ],
}

/* ------------------------- Freelancers ------------------------- */
const freelancers = {
  type: 'freelancers',
  path: '/industries/freelancers',
  title: 'BackWon for Freelancers — Win Back Every Project Enquiry',
  description:
    'Freelancer lead follow-up software. Track project enquiries, chase unsent proposals, and turn more conversations into paying clients.',
  keywords:
    'freelancer lead follow up, freelance client acquisition, proposal follow up freelancer, win back freelance clients, freelancer CRM',
  eyebrow: 'INDUSTRY · FREELANCERS',
  heading: 'The project went to whoever followed up.',
  intro:
    'Clients enquire with three freelancers and hire whoever stays engaged. Between delivering work, enquiries go quiet and projects slip away. BackWon is the follow-up system for people who do everything themselves.',
  stats: [
    { value: '10 min', label: 'A day on the queue' },
    { value: '3–5', label: 'Touches to close' },
    { value: '0', label: 'Enquiries forgotten' },
  ],
  sections: [
    {
      icon: 'inbox',
      title: 'Every enquiry in one place',
      text: 'Email, DMs, referrals and marketplace messages land in one list instead of living across six inboxes.',
    },
    {
      icon: 'file',
      title: 'Proposals that went quiet',
      text: 'A proposal sitting unanswered for a week is not a rejection. Track it, nudge once with a reason, and get the answer.',
    },
    {
      icon: 'refresh',
      title: 'Past clients, future work',
      text: 'Finished projects are your cheapest pipeline. A light check-in every few months keeps you first in mind for the next brief.',
    },
    {
      icon: 'dollar',
      title: 'Know your recovered revenue',
      text: 'See exactly how much work your follow-ups brought back. It is usually the highest-ROI ten minutes of your day.',
    },
    {
      icon: 'zap',
      title: 'No CRM overhead',
      text: 'You do not need pipelines, stages and automation rules. You need a list of people to message today. That is BackWon.',
    },
    {
      icon: 'shield',
      title: 'Your data, portable',
      text: 'Your client history stays yours, in your own workspace — no lock-in, whatever tools you use next.',
    },
  ],
  faq: [
    {
      q: 'I am a solo freelancer. Is this overkill?',
      a: 'It is the opposite of overkill — it replaces the mental load of remembering who to follow up with. Ten minutes a day on one queue, and no more "I meant to reply to them" guilt.',
    },
    {
      q: 'How do I follow up without being annoying?',
      a: 'Add something useful each time: a relevant example, a clearer timeline, a smaller first step. BackWon prompts the contact; you bring the value. Three to five touches across two weeks is normal, not pushy.',
    },
    {
      q: 'Can I track different service lines?',
      a: 'Yes. Tag enquiries by service so you can see which work actually converts and where to focus your limited outreach time.',
    },
    {
      q: 'Does it integrate with my invoicing tool?',
      a: 'No integrations needed. BackWon covers enquiry to won project; your existing tools keep handling the rest.',
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Manifesto — the "why" page                                          */
/* ------------------------------------------------------------------ */

const manifesto = {
  type: 'manifesto',
  path: '/manifesto',
  navLabel: 'Manifesto',
  title: 'The BackWon Manifesto — Why We Exist',
  description:
    'BackWon exists for one reason: the easiest customer to win is the one who already contacted you. Follow-up is the most underrated growth lever.',
  keywords:
    'customer win back philosophy, follow up importance, small business growth, why follow up matters, revenue recovery mindset',
  eyebrow: 'MANIFESTO',
  heading: 'The easiest sale you will ever make is the one you already earned.',
  intro:
    'Every business in the world loses customers the same way. Not to competitors. Not to price. To silence — the gap between "we will get back to you" and actually getting back. This is what we think about that.',
  sections: [
    {
      icon: 'search',
      title: 'You already paid for this customer',
      text: 'The ad, the signboard, the referral, the reputation — all of it was spent the moment they contacted you. Losing them now means paying twice for the same person. Nobody would do that on purpose, yet almost every business does it by accident, every day.',
    },
    {
      icon: 'heart',
      title: 'Following up is respect, not pressure',
      text: 'A customer who contacted you wants an answer. Giving them one — even days later — is not pushy. It is the bare minimum of respect. Silence is the only message that truly insults them, because it says they were not worth thirty seconds.',
    },
    {
      icon: 'trending',
      title: 'New customers are expensive. Old interest is free',
      text: 'Every growth playbook says "get more leads". Almost none say "stop dropping the ones you have". Recovering a missed inquiry costs nothing and converts at rates cold outreach will never touch. It is the cheapest growth in business, hiding in plain sight.',
    },
    {
      icon: 'users',
      title: 'Systems beat memory, every time',
      text: 'Nobody forgets to follow up because they do not care. They forget because they are busy, and memory is a terrible filing system. The businesses that win are not the ones with the best intentions — they are the ones with a list, worked daily.',
    },
    {
      icon: 'zap',
      title: 'Small beats big here',
      text: 'A two-person shop can out-follow-up any corporation, because the owner can send a personal message in ten seconds. Big companies need committees and automation. You need a queue and ten minutes. That is your unfair advantage — use it.',
    },
    {
      icon: 'target',
      title: 'We build for the follow-up',
      text: 'BackWon does not try to run your business. It does one thing: make sure no customer who reached out ever disappears into silence. Everything we build serves that single moment — the second chance.',
    },
  ],
  stats: [
    { value: '1', label: 'Belief: no inquiry left behind' },
    { value: '10 min', label: 'A day is all it takes' },
    { value: '∞', label: 'Second chances' },
  ],
  faq: [
    {
      q: 'Is this really a whole product, or just a to-do list?',
      a: 'It is a workflow built around a belief: that follow-up is a discipline, not a reminder. The queue, the history, the recovery numbers — they exist to make the discipline easy enough that a busy team actually keeps it up for years, not weeks.',
    },
    {
      q: 'Why not just use a CRM?',
      a: 'CRMs are built for companies with sales teams, pipelines and forecasts. Most businesses need something smaller and harder to abandon: one list of people who deserve a reply, worked every day. Narrow tools get used. Broad tools get admired and ignored.',
    },
    {
      q: 'Who is BackWon for, really?',
      a: 'Any business where one customer is worth a phone call — salons, garages, clinics, coaches, agents, freelancers, studios, trades. If a missed call costs you real money, BackWon is for you, wherever in the world you are.',
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Keyword landing pages — product-intent clusters not covered above   */
/* ------------------------------------------------------------------ */

/* ------------------- Missed call follow-up ------------------- */
const missedCallFollowUp = {
  type: 'missed-call-follow-up',
  path: '/missed-call-follow-up',
  title: 'Missed Call Follow-Up Software | BackWon',
  description:
    'Missed call follow-up software that turns every unanswered call into a tracked follow-up. One-tap WhatsApp replies, voice notes, daily queue. Free.',
  keywords:
    'missed call follow up software, missed call follow up, unanswered call follow up, call back software small business, missed call lead management, missed call recovery tool',
  eyebrow: 'MISSED CALL FOLLOW-UP',
  heading: 'Every missed call deserves a follow-up, not a shrug.',
  intro:
    'You miss calls because you are working — with a client, under a car, mid-appointment. The caller does not know that; they just know nobody answered, so they ring the next business. BackWon turns every missed call into a logged, owned follow-up, so the callback actually happens.',
  stats: [
    { value: '< 30s', label: 'To log a missed call' },
    { value: '1 tap', label: 'To follow up on WhatsApp' },
    { value: '0', label: 'Callers left unanswered' },
  ],
  steps: [
    {
      title: 'Log the call',
      text: 'After a busy spell, add each missed number to BackWon with a name if you have one and what they likely wanted. Under thirty seconds per call.',
    },
    {
      title: 'Give it an owner',
      text: 'Every missed call gets one person responsible for the callback — no more "I thought you rang them".',
    },
    {
      title: 'Follow up the same day',
      text: 'Work the follow-up queue: call back, or send a one-tap WhatsApp message or a personal voice note straight from the record.',
    },
    {
      title: 'Record what happened',
      text: 'Booked, quoted, not interested, unreachable — log the outcome and the value, and the next callback list writes itself.',
    },
  ],
  sections: [
    {
      icon: 'phone',
      title: 'Built for calls you cannot take',
      text: 'Missed calls cluster exactly when business is good — peak hours, jobs back to back. BackWon is designed for that reality: capture now, follow up in the first quiet ten minutes.',
    },
    {
      icon: 'message',
      title: 'One-tap WhatsApp follow-up',
      text: 'Many callers would rather get a message than a call back from an unknown number. Open the WhatsApp chat from the inquiry record in one tap and reply while they still remember ringing you.',
    },
    {
      icon: 'zap',
      title: 'Voice notes when text feels cold',
      text: 'A short personal voice note — your voice, their name, what they asked about — stands out from every automated text-back. It takes ten seconds and it sounds like a person, because it is one.',
    },
    {
      icon: 'clock',
      title: 'A callback queue, not a call log',
      text: 'Your phone already has a call log; what it lacks is ownership and due dates. BackWon shows what is due today and what is overdue, ordered so the freshest callers get called first.',
    },
    {
      icon: 'trending',
      title: 'See what callbacks recover',
      text: 'Attach a value when a callback becomes a booking. Over a month you will see exactly how much revenue your missed-call routine brings back — usually the most motivating number in the business.',
    },
  ],
  showcase: {
    title: 'Go deeper on missed inquiries',
    text: 'The workflow, the cost calculator and the full feature list.',
    items: [
      {
        to: '/use-cases/missed-inquiries',
        title: 'Missed customer inquiries',
        text: 'The full playbook for capturing and recovering every inquiry, not just calls.',
      },
      {
        to: '/resources/missed-revenue-calculator',
        title: 'Missed revenue calculator',
        text: 'Put a number on what your missed calls could be worth each month.',
      },
      {
        to: '/features',
        title: 'All features',
        text: 'Inbox, sequences, routing, webhooks and recovery analytics — all free.',
      },
    ],
  },
  faq: [
    {
      q: 'Does BackWon answer my calls or send automatic texts?',
      a: 'No. BackWon does not answer calls and does not blast automated messages. It makes sure a person follows up — by call, WhatsApp or voice note — because for local services the personal reply is what wins the job. What it automates is the remembering.',
    },
    {
      q: 'Do I need a new phone system or a virtual number?',
      a: 'No. Keep your number and your phone. You log missed calls into BackWon manually in seconds, which also means it works for walk-ins, DMs and form enquiries in the same queue.',
    },
    {
      q: 'How fast should I call back a missed call?',
      a: 'The same day, and the sooner the better — callers typically try the next business within the hour. BackWon surfaces the newest open inquiries first so your first callbacks go to the warmest callers. See the lead response time guide in Resources for a realistic routine.',
    },
    {
      q: 'What if the missed call was not a customer?',
      a: 'Mark it closed with one tap. The point of the queue is that every number gets a decision — customer or not — instead of sitting in your call history making you feel vaguely guilty.',
    },
    {
      q: 'Is missed call follow-up really free?',
      a: 'Yes. BackWon is free forever — every feature, unlimited team seats, no credit card and no trial clock.',
    },
  ],
}

/* ------------------- WhatsApp follow-up tool ------------------- */
const whatsappFollowUp = {
  type: 'whatsapp-follow-up',
  path: '/whatsapp-follow-up-tool',
  title: 'WhatsApp Follow-Up Tool for Business | BackWon',
  description:
    'WhatsApp follow-up tool for businesses: turn quiet chats into customers with one-tap follow-ups, sequences and voice notes. Free forever, no card.',
  keywords:
    'WhatsApp follow up tool, WhatsApp follow up software, WhatsApp lead follow up, WhatsApp enquiry follow up, business WhatsApp follow up, WhatsApp CRM alternative',
  eyebrow: 'WHATSAPP FOLLOW-UP',
  heading: 'The chat went quiet. Your follow-up should not.',
  intro:
    'Most business chats do not end with a no — they end with nothing. The customer got busy, the chat scrolled down, and the sale quietly died. BackWon keeps every WhatsApp enquiry in a follow-up queue, so quiet chats get a timely, personal nudge instead of being forgotten.',
  stats: [
    { value: '1 tap', label: 'From record to WhatsApp chat' },
    { value: '0', label: 'Quiet chats forgotten' },
    { value: 'Free', label: 'Forever, every feature' },
  ],
  sections: [
    {
      icon: 'message',
      title: 'One tap from record to chat',
      text: 'Open the customer’s WhatsApp conversation straight from their BackWon record — with what they asked for, what you quoted and when you last spoke in front of you, not buried in your chat list.',
    },
    {
      icon: 'refresh',
      title: 'Sequences for the long quiet spells',
      text: 'Some decisions take a week, not an hour. Put the enquiry on a follow-up sequence (a drip of timed reminders for your team) so touch two, three and four happen on schedule instead of by luck.',
    },
    {
      icon: 'zap',
      title: 'Voice notes that feel personal',
      text: 'Send a short voice note when a typed message would feel like a template. Customers hear a real person from a real business — the follow-up format generic automation cannot copy.',
    },
    {
      icon: 'users',
      title: 'Every rep sees the same picture',
      text: 'When three people share one business number, chats get answered twice or not at all. In BackWon every enquiry has one owner and a visible history, whoever picks it up.',
    },
    {
      icon: 'bell',
      title: 'Know who is still waiting',
      text: 'The queue shows every open enquiry by due date. A customer who has not heard back in two days is visible at a glance — before they message your competitor.',
    },
    {
      icon: 'trending',
      title: 'Measure what chats recover',
      text: 'Record the value when a followed-up chat becomes a booking, and see how much revenue your WhatsApp follow-ups bring back each month.',
    },
  ],
  showcase: {
    title: 'Related pages',
    text: 'Etiquette, message examples and the features behind the follow-up queue.',
    items: [
      {
        to: '/resources/whatsapp-follow-up-etiquette',
        title: 'WhatsApp follow-up etiquette',
        text: 'When to message, how often, and the habits that keep you welcome instead of blocked.',
      },
      {
        to: '/resources/follow-up-messages-that-get-replies',
        title: 'Follow-up messages that get replies',
        text: 'Word-for-word openers and nudges for WhatsApp, calls and DMs.',
      },
      {
        to: '/features',
        title: 'All features',
        text: 'Sequences, booking links, routing and recovery analytics — free.',
      },
    ],
  },
  faq: [
    {
      q: 'Does BackWon send WhatsApp messages automatically?',
      a: 'No — and that is deliberate. BackWon prompts the follow-up and opens the chat in one tap; a person writes or records the message. Automated blasts get businesses blocked and ignored; personal follow-ups get replies.',
    },
    {
      q: 'Do I need the WhatsApp Business API or a special setup?',
      a: 'No. BackWon works with the WhatsApp you already use. There is no API approval, no template pre-approval and no per-message fee — you log enquiries, and follow-ups open in your normal WhatsApp.',
    },
    {
      q: 'Can I follow up with enquiries that started elsewhere?',
      a: 'Yes. Log enquiries from calls, Instagram, your website form, IndiaMART or walk-ins, and still follow up on WhatsApp if that is the channel the customer prefers. The queue is channel-agnostic; the follow-up goes where the customer is.',
    },
    {
      q: 'How is this different from a WhatsApp CRM?',
      a: 'A WhatsApp CRM tries to manage every conversation you have. BackWon manages the ones that would otherwise go cold: enquiries with an owner, a next step and a due date, plus a record of what each recovered chat was worth.',
    },
    {
      q: 'What does it cost?',
      a: 'Nothing. BackWon is free forever — unlimited seats, sequences, webhooks and API included, with no credit card.',
    },
  ],
}

/* ------------------- Lead follow-up software ------------------- */
const leadFollowUpSoftware = {
  type: 'lead-follow-up-software',
  path: '/lead-follow-up-software',
  title: 'Lead Follow-Up Software for Every Business Size | BackWon',
  description:
    'Lead follow-up software that gives every lead an owner, a next step and a due date — so interested buyers stop going cold. Free forever.',
  keywords:
    'lead follow up software, lead follow-up tool, sales follow up software, lead follow up system, follow up leads app, lead follow up for small business',
  eyebrow: 'LEAD FOLLOW-UP SOFTWARE',
  heading: 'Leads do not go cold. Follow-ups just never happen.',
  intro:
    'Ask any owner why a lead was lost and the honest answer is rarely price or competition — it is that nobody followed up a second time. BackWon is lead follow-up software built around that single failure: every lead gets an owner, a next step and a due date, and the queue makes sure all three happen.',
  stats: [
    { value: '1', label: 'Queue for every lead' },
    { value: '10 min', label: 'A day to work it' },
    { value: 'Free', label: 'Forever, unlimited seats' },
  ],
  steps: [
    {
      title: 'Capture every lead',
      text: 'Log leads manually in seconds, import a list by CSV, or connect Shopify, Meta Ads, IndiaMART and website forms so new leads land in the inbox automatically.',
    },
    {
      title: 'Assign an owner',
      text: 'Round-robin routing shares new leads fairly across reps, least-loaded first — or assign them yourself. Nobody wonders whose lead it is.',
    },
    {
      title: 'Always set the next step',
      text: 'Call Thursday, send the quote, check stock — one concrete action with a date. A lead without a next step is a lead being lost slowly.',
    },
    {
      title: 'Work the queue daily',
      text: 'Open BackWon each morning: today’s follow-ups and everything overdue, in one list. Ten minutes replaces the spreadsheet, the notebook and the memory test.',
    },
  ],
  sections: [
    {
      icon: 'inbox',
      title: 'Every lead source, one inbox',
      text: 'Calls, WhatsApp, walk-ins, marketplace enquiries and web forms in a single list, each tagged with its source so you can see which channels actually produce buyers.',
    },
    {
      icon: 'clock',
      title: 'Next step and due date, always',
      text: 'The record will not let a lead just sit there. Every open lead carries its next action and the date it is due — the two fields most CRMs bury and most spreadsheets lose.',
    },
    {
      icon: 'refresh',
      title: 'Sequences for multi-touch follow-up',
      text: 'Most leads need more than one touch. Follow-up sequences schedule the series of nudges a decision usually takes, and stop being necessary the moment the lead replies or buys.',
    },
    {
      icon: 'grid',
      title: 'Webhooks & API included',
      text: 'Connect the tools that generate your leads and skip the copy-paste entirely. Webhooks and API are free, like everything else in BackWon.',
    },
    {
      icon: 'shield',
      title: 'Roles that match your team',
      text: 'Owner, admin, manager and rep roles mean reps see their own leads, managers see their branch, and staff can never delete the data the business runs on.',
    },
    {
      icon: 'trending',
      title: 'Follow-up you can measure',
      text: 'See follow-ups done, leads gone cold and revenue recovered, by week, source and team member — so you coach the habit with numbers, not hunches.',
    },
  ],
  showcase: {
    title: 'Keep exploring',
    text: 'The follow-up routine, the response-time guide and the full feature list.',
    items: [
      {
        to: '/use-cases/follow-up-management',
        title: 'Follow-up management',
        text: 'How to build a follow-up routine your team actually keeps.',
      },
      {
        to: '/resources/lead-response-time',
        title: 'Lead response time',
        text: 'Why the first follow-up’s timing matters, and a target a small team can hit.',
      },
      {
        to: '/pricing',
        title: 'Pricing',
        text: 'Free forever — every feature, unlimited seats, no card.',
      },
    ],
  },
  faq: [
    {
      q: 'How is lead follow-up software different from a CRM?',
      a: 'A CRM records everything about a customer relationship. Lead follow-up software concentrates on the narrow stretch where money is won or lost: the days between a lead arriving and a decision being made. BackWon does that stretch — owner, next step, due date, outcome — and leaves the rest alone.',
    },
    {
      q: 'How many follow-ups does a lead usually need?',
      a: 'Plan for several touches across a couple of weeks rather than one heroic attempt. Each follow-up should add something — an answer, a smaller first step, a reason to decide now — and the sequence ends with a polite close that makes a no easy to say. The follow-up sequence template in Resources walks through a five-touch version.',
    },
    {
      q: 'Can leads arrive automatically, or do I type them in?',
      a: 'Both. Manual logging takes under thirty seconds and covers calls and walk-ins. For digital sources, connect Shopify, Meta lead ads, IndiaMART or any website form via webhooks/API and leads arrive on their own, deduplicated and routed.',
    },
    {
      q: 'We are a team of two. Is this overkill?',
      a: 'Two people is exactly where leads start falling between stools — each assuming the other replied. One shared queue with named owners fixes that on day one.',
    },
    {
      q: 'Is it really free for a whole sales team?',
      a: 'Yes. Unlimited seats are free, and there are no per-seat charges, paid plans or trial clocks.',
    },
  ],
}

/* ------------------- Win back customers ------------------- */
const winBackCustomers = {
  type: 'win-back-customers',
  path: '/win-back-customers',
  title: 'Win Back Lost Customers Software | BackWon',
  description:
    'Win back customers software for lost leads and quiet buyers: find who went cold, follow up personally, track the revenue that returns. Free.',
  keywords:
    'win back customers software, lost lead recovery, win back lost customers, customer win back tool, re-engage lost customers, dead lead recovery',
  eyebrow: 'WIN-BACK SOFTWARE',
  heading: 'Your cheapest new customer is a lost one.',
  intro:
    'Somewhere in your old enquiries, sent quotes and lapsed buyers is a list of people who already know you, already wanted what you sell, and never got the follow-up that would have closed it. BackWon helps you find them, contact them personally, and track exactly how much revenue comes back.',
  stats: [
    { value: '0', label: 'Ad spend to reach them' },
    { value: '1 list', label: 'Every lost customer, ranked' },
    { value: 'Free', label: 'To run your first win-back' },
  ],
  steps: [
    {
      title: 'Gather the lost list',
      text: 'Import old enquiries by CSV or log them from your message history — quotes that went quiet, buyers who paused, customers who never reordered.',
    },
    {
      title: 'Rank by warmth',
      text: 'Start with the most recent and the highest value. A quote from last month beats a cold enquiry from two years ago, every time.',
    },
    {
      title: 'Send a personal reason to return',
      text: 'One message that references what they originally wanted, plus one new reason — new availability, a simpler option, a seasonal prompt. Sent by a person, in one tap.',
    },
    {
      title: 'Track what returns',
      text: 'Record every reply, booking and value. Win-back stops being a hope and becomes a number you can repeat monthly.',
    },
  ],
  sections: [
    {
      icon: 'search',
      title: 'Find the ones worth winning back',
      text: 'Search and filter your history by source, status and value. The win-back list builds itself from records you already have instead of a spreadsheet archaeology project.',
    },
    {
      icon: 'file',
      title: 'Bulk CSV import for old lists',
      text: 'Dead leads sitting in an old spreadsheet or a previous tool come across in one import — map the columns, preview what is valid, then work the list.',
    },
    {
      icon: 'message',
      title: 'A personal message, not a blast',
      text: 'Win-back works because it is specific: what they asked about, what has changed, one easy next step. BackWon opens the WhatsApp chat or call from the record so the message stays human.',
    },
    {
      icon: 'refresh',
      title: 'A routine, not a one-off campaign',
      text: 'New customers go quiet every month. A short monthly win-back pass over the newly-cold list keeps the pipeline topped up without a single ad.',
    },
    {
      icon: 'dollar',
      title: 'Revenue that came back, counted',
      text: 'Every recovered customer’s value lands in your recovery analytics, so you can see what the win-back routine earns and justify the hour it takes.',
    },
  ],
  showcase: {
    title: 'Related pages',
    text: 'Reactivation for older lists, revenue recovery reporting and message examples.',
    items: [
      {
        to: '/dormant-lead-reactivation',
        title: 'Dormant lead reactivation',
        text: 'For the older, colder end of the list — segmentation and a respectful cadence.',
      },
      {
        to: '/use-cases/revenue-recovery',
        title: 'Revenue recovery',
        text: 'Measure the money your follow-ups recover, week by week.',
      },
      {
        to: '/resources/follow-up-messages-that-get-replies',
        title: 'Messages that get replies',
        text: 'Word-for-word win-back openers that do not sound like a campaign.',
      },
    ],
  },
  faq: [
    {
      q: 'How old is too old for a win-back attempt?',
      a: 'There is no hard expiry, but warmth decays: last quarter’s quiet quote is a much better bet than a three-year-old enquiry. Work newest first, and for very old contacts keep the message light — a check-in, not a pitch — and accept silence as the answer.',
    },
    {
      q: 'What should the first win-back message say?',
      a: 'Name what they originally wanted, give one genuine reason to reconsider, and make the next step tiny. For example: "Hi Priya, you asked about a full detail in March — we have two Saturday slots opened up. Want me to hold one?" Specific beats clever, every time.',
    },
    {
      q: 'Is win-back just spamming people who said no?',
      a: 'No — win-back targets people who never actually said no: they went quiet, got busy or were never followed up. Anyone who clearly declined is marked lost and left alone. One or two personal messages to a past enquirer is service; endless blasts are spam, and BackWon’s human-sent model is built to stay on the right side of that line.',
    },
    {
      q: 'How is win-back different from lead reactivation?',
      a: 'Win-back focuses on people close to buying — sent quotes, paused buyers, lapsed customers. Reactivation works the older, colder database. BackWon handles both in the same queue; the reactivation page covers segmentation and cadence for old lists.',
    },
    {
      q: 'Does win-back cost anything to try?',
      a: 'No. BackWon is free forever, including CSV import and recovery analytics.',
    },
  ],
}

/* ------------------- No-show follow-up ------------------- */
const noShowFollowUp = {
  type: 'no-show-follow-up',
  path: '/no-show-follow-up',
  title: 'No-Show Follow-Up Software | BackWon',
  description:
    'No-show follow-up software: rebook missed appointments with one respectful message and a booking link, and track every recovered slot. Free.',
  keywords:
    'no-show follow up software, missed appointment follow up, no-show recovery, rebook no-show clients, appointment no-show management, no-show rebooking tool',
  eyebrow: 'NO-SHOW FOLLOW-UP',
  heading: 'A no-show is not a lost customer. It is an unmade follow-up.',
  intro:
    'Most no-shows are not rude — something came up, they forgot, and now they feel awkward about it. If nobody reaches out, the awkwardness wins and they book somewhere else next time. BackWon turns every missed appointment into a tracked follow-up with a booking link, so the slot — and the customer — come back.',
  stats: [
    { value: 'Same day', label: 'When the follow-up lands' },
    { value: '1 tap', label: 'To send the rebooking message' },
    { value: '0', label: 'Missed slots written off' },
  ],
  steps: [
    {
      title: 'Mark the no-show',
      text: 'When a customer does not arrive, log them in BackWon as a no-show follow-up instead of just an empty slot in the diary.',
    },
    {
      title: 'Message the same day',
      text: 'Send one short, blame-free message from the record: we missed you, here is the booking link, pick any time that suits.',
    },
    {
      title: 'Offer, do not interrogate',
      text: 'No "where were you?" — two concrete new times or the booking link does the work. Most people rebook themselves once the awkward first step is taken for them.',
    },
    {
      title: 'Track recovered slots',
      text: 'Record each rebooking and its value. Your no-show recovery rate becomes a number you can improve, not a feeling.',
    },
  ],
  sections: [
    {
      icon: 'calendar',
      title: 'Every no-show becomes a task',
      text: 'Missed appointments stop depending on whoever was on reception noticing. Each one sits in the follow-up queue with an owner and a due date until it is rebooked or closed.',
    },
    {
      icon: 'message',
      title: 'One message, one booking link',
      text: 'BackWon includes booking links, so the follow-up carries its own next step: tap, pick a time, done. No phone tag, no "let me check the diary" chain of messages.',
    },
    {
      icon: 'heart',
      title: 'No blame, no guilt trip',
      text: 'The message assumes a good reason. That tone is not just polite — it is what makes people rebook with you instead of quietly choosing a competitor they have not embarrassed themselves in front of.',
    },
    {
      icon: 'clock',
      title: 'Same day beats next week',
      text: 'A no-show followed up within hours is still thinking about the appointment. A week later it is ancient history. The queue puts today’s no-shows at the top of today’s list.',
    },
    {
      icon: 'refresh',
      title: 'Repeat no-shows get a human touch',
      text: 'A second or third miss is a pattern, not an accident. BackWon’s history shows it at a glance, so you can switch from a link to a personal call — or apply a fair deposit policy with evidence behind it.',
    },
    {
      icon: 'trending',
      title: 'Count what comes back',
      text: 'Recovered appointments and their value show up in your recovery analytics, alongside missed-call and quote recoveries, so you see the full picture of follow-up revenue.',
    },
  ],
  showcase: {
    title: 'Related pages',
    text: 'The step-by-step rebooking guide and the industries where no-shows bite hardest.',
    items: [
      {
        to: '/resources/recover-no-show-bookings',
        title: 'How to recover no-show bookings',
        text: 'The exact first message, timing, and how to handle repeat no-shows fairly.',
      },
      {
        to: '/industries/salons',
        title: 'Salons & spas',
        text: 'Rebook no-shows and bring lapsed clients back, chair by chair.',
      },
      {
        to: '/industries/clinics',
        title: 'Clinics',
        text: 'A respectful no-show routine that keeps the diary full.',
      },
    ],
  },
  faq: [
    {
      q: 'When should I follow up after a no-show?',
      a: 'The same day, ideally within a few hours of the missed slot, while the appointment is still on their mind and the reason is fresh. One message that day, one gentle nudge a few days later if there is no reply, then close the record.',
    },
    {
      q: 'What should the no-show message say?',
      a: 'Short, warm and blame-free, with the rebooking step built in. For example: "Hi Alex, we missed you at 11 today — no worries at all. Here is the link to grab another time that suits you better." The recover-no-show-bookings guide in Resources has more examples.',
    },
    {
      q: 'Does BackWon replace my booking or calendar app?',
      a: 'No. Your calendar keeps handling bookings. BackWon handles what calendars ignore: the follow-up after a booking fails, until the customer is rebooked or the record is closed.',
    },
    {
      q: 'Can I track no-shows across a team?',
      a: 'Yes. Every no-show has an owner, a status and a history, with role-based access — reps see their own, managers see their branch. Unlimited seats are free.',
    },
    {
      q: 'Will this stop no-shows happening?',
      a: 'Follow-up recovers no-shows after they happen; preventing them is reminders and deposits, which live in your booking tool. Used together, you prevent the preventable and recover the rest instead of writing the slot off.',
    },
  ],
}

/* ------------------- CRM alternative ------------------- */
const crmAlternative = {
  type: 'crm-alternative',
  path: '/crm-alternative',
  title: 'CRM Alternative — Simple Follow-Up Tool | BackWon',
  description:
    'A simple CRM alternative built only for follow-up: no pipelines to configure, no per-seat fees, no implementation project. Free forever.',
  keywords:
    'CRM alternative, simple CRM alternative, follow up CRM, lightweight CRM small business, CRM too complicated, free CRM alternative, small business CRM alternative',
  eyebrow: 'CRM ALTERNATIVE',
  heading: 'You do not need a CRM. You need to follow up.',
  intro:
    'Most small businesses that buy a CRM use a fraction of it for a month, then quietly go back to memory and notebooks — while paying per seat for pipelines nobody maintains. BackWon is the narrower alternative: it does the follow-up part, the part that actually recovers revenue, and nothing you have to configure, learn or feed.',
  stats: [
    { value: '1 day', label: 'To be fully running' },
    { value: '0', label: 'Settings to configure first' },
    { value: 'Free', label: 'Per seat, forever' },
  ],
  sections: [
    {
      icon: 'zap',
      title: 'Running this afternoon',
      text: 'Sign in with Google and log your first inquiry in the same sitting. There is no implementation phase, no data model to design and no consultant between you and your first follow-up.',
    },
    {
      icon: 'check',
      title: 'Only the features that recover revenue',
      text: 'Inquiry inbox, follow-up queue with owners and due dates, one-tap WhatsApp follow-ups, voice notes, sequences, booking links, CSV import, webhooks and recovery analytics. Each one exists because it closes the gap between an enquiry and a customer.',
    },
    {
      icon: 'users',
      title: 'Unlimited seats, no per-seat maths',
      text: 'CRM pricing punishes you for giving the whole team access — so owners ration seats and follow-ups fall between the people left out. BackWon seats are unlimited and free, so everyone who talks to customers is in the queue.',
    },
    {
      icon: 'shield',
      title: 'Structure without the admin burden',
      text: 'Roles (owner, admin, manager, rep), round-robin routing and a full activity log give you the control a growing team needs — without a CRM admin to maintain it.',
    },
    {
      icon: 'layers',
      title: 'What it deliberately leaves out',
      text: 'No marketing automation suite, no forecasting dashboards, no hundred-field contact records. If a feature does not help an interested customer get a follow-up, it is not here — which is exactly why teams keep using it.',
    },
    {
      icon: 'trending',
      title: 'Proof it is working',
      text: 'One number tells you whether the tool earns its place: revenue recovered from follow-ups. BackWon tracks it live, next to the inquiries and follow-ups that produced it.',
    },
  ],
  showcase: {
    title: 'Compare for yourself',
    text: 'The feature list, the pricing (there is none) and how the workflow runs.',
    items: [
      {
        to: '/features',
        title: 'All features',
        text: 'Everything BackWon includes — the whole list fits on one page.',
      },
      {
        to: '/pricing',
        title: 'Pricing',
        text: 'Free forever, every feature, unlimited seats. That is the whole page, too.',
      },
      {
        to: '/how-it-works',
        title: 'How it works',
        text: 'The four-step loop from missed inquiry to paying customer.',
      },
    ],
  },
  faq: [
    {
      q: 'Is BackWon a CRM?',
      a: 'It covers the slice of a CRM that small service businesses actually use — contacts, follow-ups, outcomes — and skips the rest. If you think of it as a follow-up system with a memory, you have the right picture.',
    },
    {
      q: 'When do I genuinely need a full CRM instead?',
      a: 'When you have a multi-stage sales pipeline with several stakeholders per deal, formal forecasting, or marketing automation across thousands of contacts. Most local and service businesses never hit that point; their leak is follow-up, not pipeline management.',
    },
    {
      q: 'Can I move my contacts from a spreadsheet or another tool?',
      a: 'Yes — bulk CSV import brings lists across with column mapping and a validity preview, so old leads and customer lists become a working follow-up queue in one pass.',
    },
    {
      q: 'What happens if we outgrow BackWon?',
      a: 'Your records stay in your workspace and your history is never deleted if you leave. A business that outgrows a follow-up tool because follow-up is now handled by a bigger team is a good problem — and the recovery numbers you built will justify the bigger tool.',
    },
    {
      q: 'Why is the alternative free?',
      a: 'BackWon is free forever, every feature included. The honest answer is on the pricing page: trust first, and any future paid option would be for something new — the free core stays free.',
    },
  ],
}

/* ------------------- Quote follow-up ------------------- */
const quoteFollowUp = {
  type: 'quote-follow-up',
  path: '/quote-follow-up',
  title: 'Quote Follow-Up Software — Chase Every Quote | BackWon',
  description:
    'Quote follow-up software that tracks every quote to a yes or a no — owners, due dates and one-tap nudges, so sent quotes stop going silent. Free.',
  keywords:
    'quote follow up software, quotation follow up system, chase quotes software, proposal follow up tool, quote tracking software, follow up on quotes',
  eyebrow: 'QUOTE FOLLOW-UP',
  heading: 'A sent quote is not a finished job. It is a pending decision.',
  intro:
    'You did the site visit, the measuring, the maths — then the quote went out and the conversation stopped. Most of those quotes were never rejected; they were just never decided, because life got busy on both sides. BackWon tracks every quote to a clear yes or no, with a nudge scheduled the moment it is sent.',
  stats: [
    { value: 'Every', label: 'Quote tracked to a decision' },
    { value: '1 tap', label: 'To send the nudge' },
    { value: '0', label: 'Quotes dying in silence' },
  ],
  steps: [
    {
      title: 'Log the quote when you send it',
      text: 'Customer, value, what was quoted and when. Ten seconds now saves the "did we ever hear back?" conversation later.',
    },
    {
      title: 'Set the nudge date immediately',
      text: 'Decide the follow-up date while the quote is fresh — two or three days for most jobs — instead of relying on remembering next week.',
    },
    {
      title: 'Nudge with a reason',
      text: 'Each follow-up adds something: an availability window, a smaller first phase, an answer to the objection they have not said out loud yet.',
    },
    {
      title: 'Close it honestly',
      text: 'Won, lost or parked for a future date — every quote ends with a recorded outcome, so your quote-to-job rate is a fact, not a vibe.',
    },
  ],
  sections: [
    {
      icon: 'file',
      title: 'Every open quote on one list',
      text: 'See all outstanding quotes, their values and their ages in one view. The total still waiting on a decision is usually the most surprising number in a service business.',
    },
    {
      icon: 'clock',
      title: 'A due date on every quote',
      text: 'Quotes enter the same follow-up queue as calls and enquiries, ordered by what is due. The three-week-old quote stops being invisible.',
    },
    {
      icon: 'message',
      title: 'One-tap WhatsApp nudges',
      text: 'Open the chat from the quote record and send a personal nudge or voice note with the quote’s context in front of you — no hunting through email threads to remember what you priced.',
    },
    {
      icon: 'dollar',
      title: 'Know your quote-to-job rate',
      text: 'With outcomes recorded, you can see conversion by source, value band or team member — and fix the real problem, whether that is pricing, timing or follow-up.',
    },
    {
      icon: 'users',
      title: 'Quotes survive staff changes',
      text: 'When the person who sent the quote is away, the record is not. Anyone can see what was quoted, what was said and what happens next, and pick the thread up cleanly.',
    },
  ],
  showcase: {
    title: 'Related pages',
    text: 'Win back the quotes that already went cold, and the messages that revive them.',
    items: [
      {
        to: '/win-back-customers',
        title: 'Win back customers',
        text: 'For quotes and buyers who went quiet weeks or months ago.',
      },
      {
        to: '/resources/follow-up-sequence-template',
        title: 'Follow-up sequence template',
        text: 'A five-touch cadence that works for quotes as well as enquiries.',
      },
      {
        to: '/industries/auto-repair',
        title: 'Auto repair',
        text: 'Chase every service quote to a decision, job by job.',
      },
    ],
  },
  faq: [
    {
      q: 'How soon should I follow up on a quote?',
      a: 'For most local services, a first nudge two to three days after sending works well — long enough for them to read it properly, soon enough that the job is still current. Larger or considered purchases can run longer; the sequence template in Resources gives a full cadence.',
    },
    {
      q: 'How many times should I chase a quote?',
      a: 'Until you get a clear answer — typically three to five touches over two to three weeks, each adding a reason rather than repeating "just checking in". End with a polite close that makes a no easy; a definite no is more valuable than endless silence because it frees the slot and the headspace.',
    },
    {
      q: 'What if they chose a competitor?',
      a: 'Record it as lost with the reason if you know it. Lost-quote data is how you learn whether you are losing on price, timing or follow-up itself — and those customers are prime candidates for a light win-back touch when the competitor’s work disappoints.',
    },
    {
      q: 'Does BackWon create or send the quotes themselves?',
      a: 'No. Your existing quoting or invoicing tool keeps that job. BackWon tracks the quote’s follow-up life — owner, nudges, outcome and value — which is the part that usually has no system at all.',
    },
    {
      q: 'Is quote follow-up free?',
      a: 'Yes — BackWon is free forever, with unlimited seats and every feature included.',
    },
  ],
}

/* ------------------- Dormant lead reactivation ------------------- */
const dormantReactivation = {
  type: 'dormant-lead-reactivation',
  path: '/dormant-lead-reactivation',
  title: 'Dormant Lead Reactivation Software | BackWon',
  description:
    'Dormant lead reactivation software: import old enquiries, segment who to contact, work a respectful sequence, track what comes back. Free.',
  keywords:
    'dormant lead reactivation, reactivate old leads, lead reactivation software, cold lead reactivation, old enquiry follow up, database reactivation',
  eyebrow: 'LEAD REACTIVATION',
  heading: 'Your old enquiries are a pipeline you already paid for.',
  intro:
    'Every business sits on the same hidden asset: months or years of enquiries that were never properly followed up. They cost real money to generate and nothing to contact again. BackWon turns that dormant list into a structured reactivation — segmented, personal and measured — instead of a desperate one-off blast.',
  stats: [
    { value: '0', label: 'New ad spend required' },
    { value: '1 import', label: 'To bring the old list in' },
    { value: 'Free', label: 'To run the whole campaign' },
  ],
  steps: [
    {
      title: 'Import the dormant list',
      text: 'Bring old enquiries in by bulk CSV import from spreadsheets, old tools or marketplace exports — mapped, previewed and deduplicated as they land.',
    },
    {
      title: 'Segment before you send anything',
      text: 'Group by what happened: never answered, quoted and went quiet, booked then no-showed, bought once and lapsed. Each group gets a different, relevant opener.',
    },
    {
      title: 'Work a short, respectful sequence',
      text: 'Two or three personal touches across about two weeks per segment, sent by a person from the record. Anyone who declines is closed and never contacted again.',
    },
    {
      title: 'Measure and repeat quarterly',
      text: 'Record replies, bookings and value per segment. Next quarter you start from evidence about which old lists are worth working, not guesses.',
    },
  ],
  sections: [
    {
      icon: 'file',
      title: 'Bulk import, cleaned as it lands',
      text: 'Thousands of old leads come across in one import. Column mapping and a validity preview mean the campaign starts from a clean list, not a data-cleaning weekend.',
    },
    {
      icon: 'search',
      title: 'Segmentation that changes the message',
      text: 'A person who never got a reply deserves an apology and an answer. A lapsed customer deserves a reason to return. BackWon’s source, status and history fields make those segments a filter, not a research project.',
    },
    {
      icon: 'message',
      title: 'Personal openers, sent by people',
      text: 'Reactivation fails when it looks like a blast. In BackWon each message is sent by a person from the customer’s record — referencing what they originally asked about — which is why it reads as service, not spam.',
    },
    {
      icon: 'refresh',
      title: 'Sequences keep the cadence honest',
      text: 'Follow-up sequences schedule the second and third touches with sensible gaps, so a big list gets worked evenly instead of the first fifty getting attention and the rest getting forgotten — again.',
    },
    {
      icon: 'shield',
      title: 'Respect is built into the process',
      text: 'Clear declines are recorded and honoured, quiet contacts get a polite close rather than endless nudges, and the activity log shows exactly who was contacted, when and by whom.',
    },
    {
      icon: 'trending',
      title: 'Reactivation revenue, proven',
      text: 'Every revived enquiry that converts lands in recovery analytics with its value, so the campaign’s return is a number — the number that decides whether next quarter’s list gets worked too.',
    },
  ],
  showcase: {
    title: 'Related pages',
    text: 'Win-back for warmer leads, plus the message and sequence guides behind a good campaign.',
    items: [
      {
        to: '/win-back-customers',
        title: 'Win back customers',
        text: 'For the warm end: quiet quotes, paused buyers and lapsed customers.',
      },
      {
        to: '/resources/follow-up-messages-that-get-replies',
        title: 'Messages that get replies',
        text: 'Openers and nudges that sound like a person, not a campaign.',
      },
      {
        to: '/resources/follow-up-sequence-template',
        title: 'Follow-up sequence template',
        text: 'The five-touch cadence, adaptable to any reactivation segment.',
      },
    ],
  },
  faq: [
    {
      q: 'What counts as a dormant lead?',
      a: 'Anyone who enquired, quoted, booked or bought and then went quiet without a clear no — typically for a month or more. The list most businesses underestimate is the simplest one: enquiries that were never answered properly in the first place.',
    },
    {
      q: 'How should I segment an old list before contacting it?',
      a: 'By what happened last, not by demographics. Never-answered enquiries, unclosed quotes, no-shows and lapsed buyers each need a different first message. Within each segment, work newest first — warmth decays with time.',
    },
    {
      q: 'Is reactivating old leads legal and fair?',
      a: 'These are people who contacted your business first, and a small number of personal, relevant follow-ups with a clear way to decline is normal business practice in most places. Keep it personal, keep it few, honour every no immediately, and check the rules that apply in your country for marketing messages.',
    },
    {
      q: 'What response should I honestly expect?',
      a: 'Expect a minority to reply and a smaller minority to buy — and expect it to still be worth it, because the list cost nothing to reach. Anyone promising a specific reactivation rate for your list is guessing; BackWon’s job is to measure your real one.',
    },
    {
      q: 'How often should I run a reactivation?',
      a: 'A quarterly pass works for most businesses: work the newly-dormant each time, plus one older segment on rotation. More often than that and you are contacting the same quiet people too frequently.',
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Resource articles — practical guides under /resources/              */
/* ------------------------------------------------------------------ */

/* ------------- Follow-up messages that get replies ------------- */
const followUpMessagesGuide = {
  type: 'follow-up-messages-guide',
  path: '/resources/follow-up-messages-that-get-replies',
  title: 'Follow-Up Messages That Get Replies | BackWon',
  description:
    'How to write follow-up messages that get replies: the structure, word-for-word examples for WhatsApp, calls and DMs, timing, and mistakes to avoid.',
  keywords:
    'follow up messages that get replies, follow up message templates, WhatsApp follow up message examples, how to write a follow up message, follow up text examples',
  eyebrow: 'RESOURCES · GUIDE',
  heading: 'Follow-up messages that get replies.',
  intro:
    'Most follow-ups fail for one boring reason: they ask the customer to do all the work. "Just checking in" gives them nothing to answer. A follow-up that gets a reply does the opposite — it reconnects to what they wanted, adds one new thing, and asks one question that takes five seconds to answer. Here is how to write that message, with examples you can copy.',
  sections: [
    {
      icon: 'target',
      title: 'Start from their last message, not your pitch',
      text: 'Open by referencing the specific thing they asked about — the service, the date they mentioned, the problem they described. "Hi Sam, you asked about getting the scratches on the bonnet sorted" instantly proves this is a conversation, not a campaign. Generic openers get generic treatment: ignored.',
    },
    {
      icon: 'message',
      title: 'The structure: context, reason, one easy question',
      text: 'Three short parts. Context: who you are and what they enquired about. Reason: one new piece of information — a slot that opened, a question answered, a smaller option. Question: a single, easy ask with a built-in answer path. Example: "Hi Sam, it’s Jo at Bright Shine — you asked about a full detail last week. Two Saturday slots have opened up. Want me to hold the 10am one for you?"',
    },
    {
      icon: 'clock',
      title: 'Timing beats wording',
      text: 'The best-crafted message sent nine days late loses to a plain message sent the same day. Send the first follow-up while they still remember enquiring — the same day for calls and chats, within a day or two for quotes. If you only fix one thing, fix the timing; the words matter less than the clock.',
    },
    {
      icon: 'zap',
      title: 'Give them something new every time',
      text: 'Each follow-up must earn its place with something the last one did not have: new availability, a photo of similar work, a shorter first step ("we can start with just the front seats"), or a straight answer to the objection they are probably holding — price, timing or trust. A follow-up with nothing new is just a reminder that you want their money.',
    },
    {
      icon: 'heart',
      title: 'Make saying no easy — replies go up',
      text: 'It feels backwards, but a graceful exit increases replies: "And if you’ve sorted it already, no problem at all — just let me know and I’ll close this off." People reply to release the pressure, and a clear no today is worth more than silence forever: it frees your list and occasionally turns into "not yet — try me next month".',
    },
    {
      icon: 'check',
      title: 'Three examples, ready to adapt',
      text: 'Missed call: "Hi, it’s Ana from City Cuts — sorry we missed your call earlier, we were with clients. Were you looking to book in this week?" Quiet quote: "Hi Rob, your bathroom quote from Tuesday is still open on my side. We’ve had a cancellation, so I could start a week earlier than I quoted — does that help?" Lapsed customer: "Hi Meera, it’s been a few months since your last service and the car’s probably due. Want me to check what it needs before the rush?" Each one names the person, the history and one easy next step.',
    },
  ],
  showcase: {
    title: 'Put the messages on a system',
    text: 'The tools and templates that make sure these messages actually get sent.',
    items: [
      {
        to: '/resources/follow-up-sequence-template',
        title: 'Follow-up sequence template',
        text: 'How these messages chain into a five-touch cadence over two weeks.',
      },
      {
        to: '/whatsapp-follow-up-tool',
        title: 'WhatsApp follow-up tool',
        text: 'One-tap follow-ups and voice notes from every enquiry record.',
      },
      {
        to: '/resources/whatsapp-follow-up-etiquette',
        title: 'WhatsApp follow-up etiquette',
        text: 'How often to message before welcome turns into blocked.',
      },
    ],
  },
  faq: [
    {
      q: 'How many follow-ups should I send before stopping?',
      a: 'For most enquiries, three to five touches across about two weeks, each adding something new, then a final polite close. After the close, stop — the record stays in BackWon for a future reactivation pass rather than an endless drip of nudges.',
    },
    {
      q: 'They read my message and did not reply. Now what?',
      a: 'Do not resend the same message louder. Change the angle: a voice note instead of text, a smaller offer, or a genuinely useful piece of information. If two different angles get silence, send the graceful-exit message — it converts a surprising share of silent readers into a reply, even if the reply is "not now".',
    },
    {
      q: 'Should I use templates or write every message fresh?',
      a: 'Use templates for structure, personalise for real. Keep the skeleton — context, reason, easy question — and always write the first line from the actual conversation. A template with a specific first line outperforms both a blank page and a copy-paste blast.',
    },
    {
      q: 'Which channel gets the best replies?',
      a: 'The channel the customer chose first. If they enquired on WhatsApp, follow up on WhatsApp; if they called, call or message the number they called from. Switching channels without permission feels like surveillance, not service.',
    },
  ],
}

/* ------------- Lead response time ------------- */
const leadResponseTimeGuide = {
  type: 'lead-response-time-guide',
  path: '/resources/lead-response-time',
  title: 'Lead Response Time: Why Speed Wins | BackWon',
  description:
    'Lead response time explained: why minutes matter, what a realistic target is for a small team, and the routine that gets you there without new hires.',
  keywords:
    'lead response time, speed to lead, how fast should you respond to a lead, lead response time best practices, inquiry response time, speed to lead guide',
  eyebrow: 'RESOURCES · GUIDE',
  heading: 'Lead response time: the clock starts when they contact you.',
  intro:
    'Lead response time is the gap between a customer contacting you and your first real reply. It is the least glamorous number in sales and one of the most consequential: the customer who hears back first usually frames the comparison every later reply is judged against. This guide covers why the gap matters, where it actually leaks, and a target a small, busy team can genuinely hold.',
  sections: [
    {
      icon: 'clock',
      title: 'Why minutes matter more than hours',
      text: 'An enquiry is made in a moment of intent — the car is making the noise now, the event is this month, the problem is on their mind today. Research on online leads has pointed the same way for years: the odds of reaching and qualifying a lead fall steeply as the first response stretches from minutes into hours, because the customer moves on to the next business or simply cools off. You do not need the exact multiplier to act on the direction.',
    },
    {
      icon: 'search',
      title: 'Where response time actually leaks',
      text: 'Rarely in the reply itself — writing one takes a minute. It leaks in noticing: the enquiry sits in an app nobody opened, a shared inbox everyone assumed someone else had, or a phone that was busy for three straight hours. Audit your last twenty enquiries honestly: when did each arrive, when did a human first reply, and where did the gap live? The fix is almost always a noticing system, not faster typing.',
    },
    {
      icon: 'target',
      title: 'Pick a target your team can hit',
      text: 'A five-minute target that collapses every busy day is worse than a one-hour target that holds. For most small teams a workable standard is: every enquiry gets a first human response within the hour during working hours, and first thing next morning outside them. Write the target down, assign who owns it at each time of day, and review it weekly until it is boring.',
    },
    {
      icon: 'users',
      title: 'Cover the gaps: rota and handover',
      text: 'Response time dies at shift changes, lunch and days off. Two habits fix most of it: a named person owns new enquiries for each block of the day, and every open enquiry carries its next step in a shared queue — so cover never starts from "what did we tell them?" BackWon’s round-robin routing and shared follow-up queue exist precisely for this handover problem.',
    },
    {
      icon: 'bell',
      title: 'Measure first response separately',
      text: 'Track two numbers, not one: time to first response, and time to resolution. Teams that only track "dealt with" hide slow first replies behind fast closes. A simple weekly glance at first-response times on new enquiries — BackWon keeps the timestamps on every record — tells you whether the routine is working or just feeling busy.',
    },
    {
      icon: 'refresh',
      title: 'The second response matters as much',
      text: 'Speed gets the glory, but persistence closes the deal: most enquiries that convert need more than one exchange. A fast first reply followed by silence is just a quicker way to lose. Pair the response-time target with a follow-up cadence — every open enquiry always has a next step and a date — and the two habits compound.',
    },
  ],
  showcase: {
    title: 'Build the routine',
    text: 'The software and the cadence that make fast first responses normal.',
    items: [
      {
        to: '/lead-follow-up-software',
        title: 'Lead follow-up software',
        text: 'Owners, due dates and routing — the noticing system this guide describes.',
      },
      {
        to: '/resources/follow-up-sequence-template',
        title: 'Follow-up sequence template',
        text: 'What happens after the first reply: five touches over two weeks.',
      },
      {
        to: '/missed-call-follow-up',
        title: 'Missed call follow-up',
        text: 'The response-time problem in its purest form — and its fix.',
      },
    ],
  },
  faq: [
    {
      q: 'What is a good lead response time for a small business?',
      a: 'Within the hour during working hours is a strong, achievable standard for most small teams; within a few minutes is better where someone can genuinely watch the inbox. The right target is the fastest one your team can hold on its busiest day, not its quietest.',
    },
    {
      q: 'Does an automatic acknowledgement count as a response?',
      a: 'It counts as a receipt, not a response. An instant "thanks, we’ll be in touch" buys goodwill and confirms the enquiry arrived, but customers judge you on the first substantive reply from a person. Use automation to acknowledge, then make sure the human reply follows inside your target.',
    },
    {
      q: 'We are too busy to reply within the hour. What then?',
      a: 'Shrink the reply, not the standard. A two-line holding reply from a phone — "Got your enquiry about the gearbox, I’m under a car until 3, will confirm times right after" — is a real response and takes twenty seconds. Busy is exactly when enquiries leak; the holding reply is the busy team’s version of speed.',
    },
    {
      q: 'Does response time matter for walk-ins and referrals too?',
      a: 'Yes, in a different form: the "we’ll call you back with a time" promise is a response-time commitment. Log it in the follow-up queue with a due date, and the same discipline applies — the customer experiences a kept promise instead of a forgotten one.',
    },
  ],
}

/* ------------- Follow-up sequence template ------------- */
const followUpSequenceGuide = {
  type: 'follow-up-sequence-guide',
  path: '/resources/follow-up-sequence-template',
  title: 'Follow-Up Sequence Template That Works | BackWon',
  description:
    'A follow-up sequence template walkthrough: five touches over two weeks, what to say at each step, when to stop, and how to run it without automation.',
  keywords:
    'follow up sequence template, follow up sequence examples, sales follow up sequence, follow up cadence, drip sequence template, follow up email sequence small business',
  eyebrow: 'RESOURCES · TEMPLATE',
  heading: 'A follow-up sequence you can run this week.',
  intro:
    'A follow-up sequence is simply a pre-decided series of touches, so no enquiry depends on you remembering — or feeling like — chasing it. This template runs five touches over roughly two weeks. It works for enquiries, quotes and bookings, it can be run entirely by hand, and every touch has a job. Adapt the wording to your trade; keep the rhythm and the rules.',
  sections: [
    {
      icon: 'message',
      title: 'Touch 1 — Same day: recap and reassure',
      text: 'Send within hours of the enquiry or quote. Job: prove a human received it and restate the next step. "Hi Dan, it’s Priya at Lane Motors — thanks for asking about the clutch. I’ve got your details and I’ll confirm the earliest slot by tomorrow morning." Short, specific, ends with a promise you then keep.',
    },
    {
      icon: 'zap',
      title: 'Touch 2 — Day 2–3: add something useful',
      text: 'Job: give them a reason to decide that they did not have before. New information beats repetition — a photo of a similar job, the answer to the question people usually ask at this point, or genuine availability news. "Quick update — a Thursday morning slot has opened up if the weekend is tricky."',
    },
    {
      icon: 'layers',
      title: 'Touch 3 — Day 5–6: make the step smaller',
      text: 'Job: lower the commitment. Many stalls are about size, not interest. Offer the first phase, the inspection, the trial session, the deposit-free hold. "If the full job feels like a lot to decide, we can start with the diagnostic — 30 minutes, and you’ll know exactly where you stand."',
    },
    {
      icon: 'phone',
      title: 'Touch 4 — Around day 9: change the channel',
      text: 'Job: break the pattern. If texts went unanswered, make one real call — or send a short voice note, which carries tone that text cannot. Keep it light: "Hi, it’s Priya again — just wanted to check the clutch is still on your list before I release the slot I’ve been holding in mind for you."',
    },
    {
      icon: 'heart',
      title: 'Touch 5 — Around day 14: the polite close',
      text: 'Job: end well and invite the honest answer. "I’ll close this off my end so I stop nudging you — if things change, you know where we are." The close is not a failure state: it produces replies ("not yet — try me in June"), keeps your name clean, and parks the record for a future reactivation pass instead of an awkward silence.',
    },
    {
      icon: 'check',
      title: 'The rules that keep it welcome',
      text: 'One touch per step, never two channels on the same day. Stop the sequence the moment they reply — it has done its job. Every message references the actual enquiry; the day it could be sent to anyone, it stops working. And record the outcome of each step, so next quarter’s sequence is tuned by your own results, not by a template — including this one.',
    },
  ],
  showcase: {
    title: 'Run the sequence without the memory work',
    text: 'BackWon sequences schedule these touches for your team automatically — the messages stay personal.',
    items: [
      {
        to: '/features',
        title: 'Follow-up sequences in BackWon',
        text: 'Drip reminders, owners and due dates on every enquiry — free.',
      },
      {
        to: '/resources/follow-up-messages-that-get-replies',
        title: 'Messages that get replies',
        text: 'The wording principles behind every touch in this template.',
      },
      {
        to: '/lead-follow-up-software',
        title: 'Lead follow-up software',
        text: 'The queue that keeps sequences running alongside new leads.',
      },
    ],
  },
  faq: [
    {
      q: 'Can I run this sequence without any software?',
      a: 'Yes — a notebook with dates works, and this template was written to be runnable by hand. Software earns its place when the list grows: BackWon’s follow-up sequences create the reminder for each touch automatically, so step four still happens in a week when you are too busy to remember step one.',
    },
    {
      q: 'Should the sequence differ for quotes versus new enquiries?',
      a: 'The rhythm holds; the content shifts. Quote sequences lean on decision help — smaller phases, availability, validity dates. Enquiry sequences lean on speed and information. Keep five touches over two weeks as the default and adjust the middle touches to the situation.',
    },
    {
      q: 'What if they reply in the middle of the sequence?',
      a: 'Stop the sequence immediately and continue as a normal conversation. A scheduled nudge landing after a reply is the fastest way to look automated and careless — the exact impression this template is designed to avoid.',
    },
    {
      q: 'Is five touches too pushy?',
      a: 'Not when each touch adds something and the last one closes politely. What people experience as pushy is repetition without value — the same "just checking in" five times. Five varied, useful, well-spaced touches read as professional persistence, which most customers quietly respect.',
    },
  ],
}

/* ------------- Recover no-show bookings ------------- */
const recoverNoShowGuide = {
  type: 'recover-no-show-bookings-guide',
  path: '/resources/recover-no-show-bookings',
  title: 'How to Recover No-Show Bookings | BackWon',
  description:
    'How to recover no-show bookings: what to say in the first message, when to send it, how to offer new times, and how to handle repeat no-shows fairly.',
  keywords:
    'how to recover no-show bookings, no-show rebooking message, missed appointment message template, no-show follow up guide, rebook missed appointment',
  eyebrow: 'RESOURCES · GUIDE',
  heading: 'How to recover a no-show booking (without the guilt trip).',
  intro:
    'A no-show feels like rejection, but it is usually just life: traffic, a sick child, a meeting that ran over, a calendar that lied. The customer often feels worse about it than you do — which is why a blame-free, same-day message recovers so many of them. This guide covers the exact approach: what to say, when to send it, and what to do when it keeps happening.',
  sections: [
    {
      icon: 'heart',
      title: 'Assume a good reason first',
      text: 'Your tone decides everything. A message that implies fault ("You missed your appointment") makes rebooking feel like an apology tour, and many customers quietly choose a competitor instead. A message that assumes life happened ("We missed you — hope everything’s okay") makes rebooking feel like what it is: a small, normal admin task.',
    },
    {
      icon: 'clock',
      title: 'Send it the same day',
      text: 'Message within a few hours of the missed slot, while they are still aware they missed it and the need is unresolved. Next-day is acceptable; next-week is archaeology. If your booking tool can flag the no-show, act on the flag the same day — or log it in a follow-up queue so the same-day message never depends on someone remembering.',
    },
    {
      icon: 'message',
      title: 'The first message, word for word',
      text: 'Keep it to three short parts: warmth, zero blame, one easy action. "Hi Jess, we missed you at 2pm today — no worries at all, these things happen. If you’d still like to come in, here’s the link to pick a new time: [booking link]. Any questions, just reply here." That is the whole message. No policy lecture, no fee mention in the recovery message — that conversation, if needed, comes later and separately.',
    },
    {
      icon: 'calendar',
      title: 'Offer two times, not an open question',
      text: '"When suits you?" puts the work on the person who already failed to organise once. If you are messaging personally rather than sending a link, name two concrete options: "I can do Thursday 10:30 or Friday 4 — either any good?" A choice between two is easy to answer; an open diary is homework.',
    },
    {
      icon: 'refresh',
      title: 'One nudge, then stop',
      text: 'If the first message gets no reply, send one shorter nudge two or three days later — "Still happy to rebook you, Jess — the link works whenever." Then close the record. Two messages say "we value you"; five say "we are desperate", and desperation is the one message that reliably loses the customer for good.',
    },
    {
      icon: 'shield',
      title: 'Handle repeat no-shows fairly',
      text: 'A pattern is different from an accident. After a second or third miss, a brief personal call beats another link: ask whether something is making the times unworkable, and if your business uses deposits or prepayment for repeat bookers, explain it kindly and once. Whatever policy you choose, apply it from a written record of the misses — BackWon keeps that history on the customer — not from a frustrated memory.',
    },
  ],
  showcase: {
    title: 'Make same-day recovery a system',
    text: 'The software that turns every no-show into a tracked follow-up.',
    items: [
      {
        to: '/no-show-follow-up',
        title: 'No-show follow-up software',
        text: 'Booking links, owners and due dates for every missed appointment.',
      },
      {
        to: '/industries/salons',
        title: 'Salons & spas',
        text: 'The no-show routine applied to chairs, clients and quiet days.',
      },
      {
        to: '/industries/clinics',
        title: 'Clinics',
        text: 'Respectful no-show recovery for patient diaries.',
      },
    ],
  },
  faq: [
    {
      q: 'Should I charge a no-show fee?',
      a: 'That is a business decision this guide will not make for you — fees deter some no-shows but add friction for everyone else. What is not optional is separating the two conversations: recover the booking with warmth first; discuss policy calmly later if a pattern forms. Mixing them into one message recovers neither the booking nor the goodwill.',
    },
    {
      q: 'What if the customer never replies to either message?',
      a: 'Close the follow-up and keep the record. Silence after two kind messages usually means the need passed or they booked elsewhere. The record earns its keep later: if they enquire again in six months, you will greet them with context instead of a blank slate.',
    },
    {
      q: 'How do I stop no-shows before they happen?',
      a: 'Recovery is the second line; reminders are the first. A confirmation at booking and a short reminder the day before — ideally with an easy reschedule option — prevent the forgetful majority. This guide covers the rest: the ones who miss anyway, who are far too valuable to write off.',
    },
    {
      q: 'Does this work for classes and group bookings?',
      a: 'Yes, with the group twist: a same-day message to a class no-show doubles as a waitlist trigger — recover the person for next week, and offer today’s freed spot onward. The tone rules are identical.',
    },
  ],
}

/* ------------- WhatsApp follow-up etiquette ------------- */
const whatsappEtiquetteGuide = {
  type: 'whatsapp-follow-up-etiquette',
  path: '/resources/whatsapp-follow-up-etiquette',
  title: 'WhatsApp Follow-Up Etiquette for Business | BackWon',
  description:
    'WhatsApp follow-up etiquette for businesses: when to message, how often, what a good first message looks like, and the habits that get you blocked.',
  keywords:
    'WhatsApp follow up etiquette, WhatsApp business messaging etiquette, how to follow up on WhatsApp professionally, WhatsApp business follow up rules, WhatsApp follow up mistakes',
  eyebrow: 'RESOURCES · GUIDE',
  heading: 'WhatsApp follow-up etiquette: welcome, not watched.',
  intro:
    'WhatsApp is not email. Your message lands between their family group and their best friend, on the device they check last at night. That intimacy is exactly why WhatsApp follow-ups get replies other channels never see — and why clumsy ones get you muted or blocked. These are the working rules businesses that live on WhatsApp follow.',
  sections: [
    {
      icon: 'message',
      title: 'You are in their personal inbox — act like it',
      text: 'Write like a person from a business they contacted, not like a campaign. One short message, in your own words, about their actual enquiry. If a message could be sent unchanged to five hundred people, it will feel that way to each of them — and WhatsApp punishes that feeling with blocks that quietly kill your number’s reach.',
    },
    {
      icon: 'check',
      title: 'Introduce yourself in every first message',
      text: 'Your number may not be saved in their phone, and an unidentified "Hi, following up" reads as a scam. First messages should carry your name and business in the opening line: "Hi Arun, it’s Deepak from Shine Studio — you asked about ceramic coating yesterday." It takes four seconds and changes the entire read of the message.',
    },
    {
      icon: 'clock',
      title: 'Timing: inside the day, inside the hours',
      text: 'Follow up the same day where you can — that is responsiveness, not pressure. Outside working hours, queue it for the morning; a 10pm sales nudge feels like surveillance even when it is innocent. The exception is a reply to their message: answering a customer who wrote to you at 9pm, at 9pm, is simply good service.',
    },
    {
      icon: 'target',
      title: 'One message, one question',
      text: 'Each follow-up should contain exactly one ask, phrased so it can be answered in a few words — ideally yes, no, or a choice between two options. Three questions in one message gets answered with none. If you need more information, earn it across the conversation, one easy reply at a time.',
    },
    {
      icon: 'zap',
      title: 'Voice notes: short, named, optional',
      text: 'A voice note can be the warmest follow-up on WhatsApp — a real voice resets a stalled chat — but keep it under thirty seconds, say their name early, and make sure the same information exists in text for people who cannot listen right now. Never send a long voice note as a first contact; it asks for effort before you have earned it.',
    },
    {
      icon: 'shield',
      title: 'Permission, persistence and the graceful exit',
      text: 'Follow up only with people who contacted you or clearly agreed to hear from you, keep the count low — a handful of touches across two weeks is the outer limit for an enquiry — and make stopping effortless. A customer who says no, or asks you to stop, is closed immediately and permanently on that topic. Handled well, even the exit leaves your name in good standing for the day their need returns.',
    },
  ],
  showcase: {
    title: 'Etiquette, on a system',
    text: 'The tool that keeps follow-ups personal, owned and on schedule.',
    items: [
      {
        to: '/whatsapp-follow-up-tool',
        title: 'WhatsApp follow-up tool',
        text: 'One-tap follow-ups, sequences and voice notes from every record.',
      },
      {
        to: '/resources/follow-up-messages-that-get-replies',
        title: 'Messages that get replies',
        text: 'The structure and examples behind a welcome follow-up.',
      },
      {
        to: '/resources/follow-up-sequence-template',
        title: 'Follow-up sequence template',
        text: 'How the touches space out over two weeks without crowding.',
      },
    ],
  },
  faq: [
    {
      q: 'How many WhatsApp follow-ups is too many?',
      a: 'For a single enquiry, three to five messages across about two weeks is a reasonable outer boundary — provided each adds something new and the last is a polite close. Beyond that, or daily at any count, you are no longer following up; you are crowding, and blocks follow.',
    },
    {
      q: 'Is it okay to follow up with someone who only called me?',
      a: 'Yes — they contacted your business and a message to that number about that enquiry is expected, especially a "sorry we missed your call" the same day. Introduce yourself clearly, keep it about their enquiry, and stop if they ask. Following up is expected; marketing blasts to callers are a different thing entirely.',
    },
    {
      q: 'Should I use WhatsApp broadcast lists for follow-ups?',
      a: 'Not for follow-ups. Broadcasts are one-to-many by design and read that way; follow-ups work because they are one-to-one and specific. Broadcasts have legitimate uses for opted-in announcements — a follow-up about someone’s own enquiry is not one of them.',
    },
    {
      q: 'What do I do if a customer blocks or reports us?',
      a: 'Treat it as data, not insult. Review what was sent, how many touches and how fast — the cause is almost always frequency or a message that felt generic. Tighten the cadence, personalise the first line, and make sure every sequence ends with a graceful close.',
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Exports                                                             */
/* ------------------------------------------------------------------ */

/**
 * Every SEO page. Order matters: it drives route registration, the sitemap
 * and the nav/footer link order.
 */
export const SEO_PAGES = [
  home,
  features,
  integrations,
  pricing,
  useCases,
  howItWorks,
  missedInquiries,
  followUpManagement,
  revenueRecovery,
  missedCallFollowUp,
  whatsappFollowUp,
  leadFollowUpSoftware,
  winBackCustomers,
  noShowFollowUp,
  crmAlternative,
  quoteFollowUp,
  dormantReactivation,
  industries,
  carDetailing,
  salons,
  autoRepair,
  clinics,
  coaches,
  realEstate,
  freelancers,
  about,
  manifesto,
  resources,
  missedRevenueCalculator,
  followUpMessagesGuide,
  leadResponseTimeGuide,
  followUpSequenceGuide,
  recoverNoShowGuide,
  whatsappEtiquetteGuide,
]

/** Look up a page by its `type` key. */
export function getSeoPage(type) {
  return SEO_PAGES.find((page) => page.type === type)
}

/** Pages that get their own route + prerendered HTML (excludes Home). */
export const ROUTED_SEO_PAGES = SEO_PAGES.filter((page) => page.path !== '/')

/** Primary Header navigation, in order. */
export const NAV_LINKS = [
  features,
  integrations,
  pricing,
  useCases,
  howItWorks,
  industries,
  manifesto,
  about,
].map((page) => ({ to: page.path, label: page.navLabel }))

/** Grouped Footer navigation — broader internal linking than the header. */
export const FOOTER_GROUPS = [
  {
    title: 'Product',
    links: [
      { to: features.path, label: 'Features' },
      { to: integrations.path, label: 'Integrations' },
      { to: pricing.path, label: 'Pricing' },
      { to: howItWorks.path, label: 'How it works' },
      { to: resources.path, label: 'Resources' },
    ],
  },
  {
    title: 'Use cases',
    links: [
      { to: useCases.path, label: 'All use cases' },
      { to: missedInquiries.path, label: 'Missed inquiries' },
      { to: followUpManagement.path, label: 'Follow-up management' },
      { to: revenueRecovery.path, label: 'Revenue recovery' },
      { to: missedCallFollowUp.path, label: 'Missed call follow-up' },
      { to: whatsappFollowUp.path, label: 'WhatsApp follow-up tool' },
      { to: leadFollowUpSoftware.path, label: 'Lead follow-up software' },
      { to: winBackCustomers.path, label: 'Win back customers' },
      { to: noShowFollowUp.path, label: 'No-show follow-up' },
      { to: quoteFollowUp.path, label: 'Quote follow-up' },
      { to: dormantReactivation.path, label: 'Lead reactivation' },
      { to: crmAlternative.path, label: 'CRM alternative' },
    ],
  },
  {
    title: 'Guides & articles',
    links: [
      { to: missedRevenueCalculator.path, label: 'Missed revenue calculator' },
      { to: followUpMessagesGuide.path, label: 'Messages that get replies' },
      { to: leadResponseTimeGuide.path, label: 'Lead response time' },
      { to: followUpSequenceGuide.path, label: 'Follow-up sequence template' },
      { to: recoverNoShowGuide.path, label: 'Recover no-show bookings' },
      { to: whatsappEtiquetteGuide.path, label: 'WhatsApp etiquette' },
    ],
  },
  {
    title: 'Industries',
    links: [
      { to: industries.path, label: 'All industries' },
      { to: salons.path, label: 'Salons & spas' },
      { to: autoRepair.path, label: 'Auto repair' },
      { to: clinics.path, label: 'Clinics' },
      { to: coaches.path, label: 'Coaches' },
      { to: realEstate.path, label: 'Real estate' },
      { to: freelancers.path, label: 'Freelancers' },
      { to: carDetailing.path, label: 'Car detailing' },
    ],
  },
  {
    title: 'Company',
    links: [
      { to: about.path, label: 'About BackWon' },
      { to: manifesto.path, label: 'Manifesto' },
      { to: '/', label: 'Home' },
    ],
  },
]
