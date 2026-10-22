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
  title: 'Wynback — Win Back Every Customer You Almost Lost',
  description:
    'Wynback helps local businesses win back missed calls and cold inquiries with one-tap WhatsApp follow-ups, personal voice notes, and drip sequences. Start free.',
  keywords:
    'win back customers, missed call follow up, WhatsApp follow up tool, customer recovery software, voice note follow up, lead recovery, small business CRM',
  eyebrow: 'CUSTOMER WIN-BACK',
  heading: 'Win back every customer you almost lost.',
  intro:
    'Wynback gives local businesses one simple workspace to catch every missed inquiry, follow up in one tap on WhatsApp — or with a personal voice note — and measure the revenue that comes back.',
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
  faq: [],
}

/* ------------------------------------------------------------------ */
/* Features                                                            */
/* ------------------------------------------------------------------ */

const features = {
  type: 'features',
  path: '/features',
  navLabel: 'Features',
  title: 'Wynback Features — One-Tap WhatsApp Follow-ups & Voice Notes',
  description:
    'Explore Wynback features: one-tap WhatsApp follow-ups, personal voice-note win-backs, drip sequences, public booking links, and recovery analytics.',
  keywords:
    'WhatsApp follow up tool, voice note follow up, missed call recovery, drip sequence software, booking link generator, customer win back features',
  eyebrow: 'FEATURES',
  heading: 'Every feature has one job: getting the customer back.',
  intro:
    'Wynback is deliberately narrow. It does the four things that decide whether an interested customer becomes a paying one — and it leaves the rest alone.',
  stats: [
    { value: '4', label: 'Core workflows' },
    { value: '0', label: 'Spreadsheets required' },
    { value: 'Free', label: 'To start' },
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
      text: 'Every open inquiry gets a next action and an owner. Your team opens Wynback and knows exactly who to contact today.',
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
      text: 'Prebuilt views for inquiries, follow-ups and revenue — no report builder, no configuration project, no consultant.',
    },
    {
      icon: 'zap',
      title: 'Fast to set up',
      text: 'Sign in with Google and start logging inquiries in the same afternoon. There is no implementation phase.',
    },
  ],
  faq: [
    {
      q: 'Do I need to connect my phone system to Wynback?',
      a: 'No. Wynback is designed for businesses whose inquiries arrive across calls, WhatsApp, Instagram and walk-ins, so you can log an inquiry manually in seconds. Everything is in one place without any telephony integration.',
    },
    {
      q: 'Can more than one person use Wynback?',
      a: 'Yes. Wynback is built for small teams. Everyone sees the same inquiry list and follow-up queue, so a customer is never dropped because one person was away.',
    },
    {
      q: 'How is Wynback different from a CRM?',
      a: 'A general CRM tries to run your whole business. Wynback does one thing: making sure an interested customer who has already contacted you gets a reply and a follow-up. That narrower focus is why teams actually keep using it.',
    },
    {
      q: 'Is my data exported if I cancel?',
      a: 'Yes. Your inquiry, follow-up and revenue records remain yours and can be exported at any time from your workspace.',
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
  title: 'Wynback Use Cases — Recover Missed Inquiries & Lost Leads',
  description:
    'See how businesses use Wynback to recover missed calls, unanswered DMs, cold quote requests, no-shows and dormant leads — and turn them into revenue.',
  keywords:
    'lead recovery use cases, missed call follow up, quote follow up software, dormant lead reactivation, no-show follow up, lead follow up examples',
  eyebrow: 'USE CASES',
  heading: 'Where your revenue is leaking right now.',
  intro:
    'Most lost revenue is not lost to competitors — it leaks out of ordinary gaps. A call you could not answer, a DM you meant to reply to, a quote you never chased. These are the gaps Wynback closes.',
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
      a: 'No. Inquiry capture, follow-up management and revenue recovery are three views of the same workspace in Wynback, so a single workflow covers all of them.',
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Use case: missed inquiries                                          */
/* ------------------------------------------------------------------ */

const missedInquiries = {
  type: 'missed-inquiries',
  path: '/use-cases/missed-inquiries',
  title: 'Recover Missed Customer Inquiries | Wynback',
  description:
    'Stop losing customers who already contacted you. Track every missed call, DM and form enquiry, follow up on time, and see the revenue you recover.',
  keywords:
    'missed customer inquiries, missed call recovery, unanswered enquiry follow up, lost lead recovery software, inquiry tracking system',
  eyebrow: 'USE CASE · MISSED INQUIRIES',
  heading: 'The customer already contacted you. That is the expensive part.',
  intro:
    'Acquiring an inquiry costs marketing money, word of mouth and reputation. Losing one costs nothing to prevent. Wynback makes sure no inquiry disappears just because you were busy when it arrived.',
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
      text: 'Work the follow-up queue daily. Wynback shows you who is overdue so timing never depends on memory.',
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
      a: 'Fast. Intent decays quickly — a person who asked about your service an hour ago is far more likely to book than the same person next week. Wynback surfaces the newest open inquiries first so your first call of the day is to the warmest person on the list.',
    },
    {
      q: 'What if the inquiry came in on WhatsApp or Instagram?',
      a: 'You log it manually with its source. Wynback does not need access to your accounts, which keeps setup simple and works across every channel you use, including walk-ins and phone calls.',
    },
    {
      q: 'Can I track inquiries I lost months ago?',
      a: 'Yes — and it is often worth it. Importing old enquiries into Wynback gives your team a ready-made list of people who already expressed interest but never got a proper follow-up.',
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Use case: follow-up management                                      */
/* ------------------------------------------------------------------ */

const followUpManagement = {
  type: 'follow-up-management',
  path: '/use-cases/follow-up-management',
  title: 'Follow-Up Management Software for Local Business | Wynback',
  description:
    'Build a follow-up routine your team actually keeps. Wynback turns scattered reminders into one shared follow-up queue with owners, dates and outcomes.',
  keywords:
    'follow up management software, sales follow up process, follow up system for small business, lead follow up tool, follow up reminder app',
  eyebrow: 'USE CASE · FOLLOW-UP MANAGEMENT',
  heading: 'Most deals are not lost. They are just never followed up.',
  intro:
    'Following up is not hard — it is just easy to postpone. Wynback removes the two things that break every follow-up habit: not knowing who to contact, and relying on someone remembering to do it.',
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
      text: 'An action without a date is a wish. Every follow-up in Wynback has a due date attached.',
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
      title: 'Shared across the team',
      text: 'Anyone can pick up where someone else left off, because the history and the next step are both on the record.',
    },
    {
      icon: 'refresh',
      title: 'Handles long cycles',
      text: 'Some customers take months. Wynback keeps the thread alive across weeks without anyone holding it in their head.',
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
      a: 'Yes. Follow-ups live on the customer record rather than in an individual’s inbox or phone, so cover during holidays and staff changes is automatic.',
    },
    {
      q: 'Is Wynback an automation tool?',
      a: 'Wynback is deliberately a management tool, not an automation tool. It tells your team exactly who needs a human follow-up and when — the message itself still comes from a person, which is what converts in local service businesses.',
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Use case: revenue recovery                                          */
/* ------------------------------------------------------------------ */

const revenueRecovery = {
  type: 'revenue-recovery',
  path: '/use-cases/revenue-recovery',
  title: 'Revenue Recovery Software for Old Leads | Wynback',
  description:
    'Measure the revenue your follow-ups actually recover. Wynback tracks recovered opportunities, win-back value and the true ROI of following up.',
  keywords:
    'revenue recovery software, recover lost revenue, win back lost customers, lead recovery ROI, recovered revenue tracking',
  eyebrow: 'USE CASE · REVENUE RECOVERY',
  heading: 'You cannot improve revenue you never measured.',
  intro:
    'Most teams know how many new leads they got. Almost none know how much money they recovered from the ones they nearly lost. Wynback makes that number visible — and it is usually the most motivating figure in the business.',
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
      a: 'Any revenue from a customer whose inquiry had gone cold, been unanswered or been written off, and who converted after a deliberate follow-up. Wynback lets you record the value at the moment you win it back.',
    },
    {
      q: 'How long before I can see a recovery figure?',
      a: 'Most businesses have a meaningful number within 30 days. If you import old enquiries when you start, you can often produce recovered revenue in the first fortnight.',
    },
    {
      q: 'Do I need accounting data to use this?',
      a: 'No. You enter the value of the won-back job or booking yourself. Wynback is a recovery record, not an accounting system, so there is no integration work required.',
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
  title: 'How Wynback Works — Missed Inquiry to Paying Customer',
  description:
    'See how Wynback works in four steps: capture the inquiry, assign a follow-up, win the customer back, and report the revenue you recovered.',
  keywords:
    'how wynback works, lead recovery process, inquiry follow up workflow, lead management workflow, follow up process steps',
  eyebrow: 'HOW IT WORKS',
  heading: 'A four-step loop, not a software project.',
  intro:
    'Wynback turns a messy, everyday problem into a repeatable routine. Once the loop is running, recovering a missed customer stops being luck.',
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
      text: 'Work the daily follow-up queue. Wynback shows what is due today and what is already overdue.',
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
      text: 'Sign in with Google, add your team and start logging inquiries. There is no data migration and no configuration project.',
    },
    {
      icon: 'users',
      title: 'Adopted by whole teams',
      text: 'Because the daily action is one short list, Wynback survives staff changes — the kind of event that usually kills a CRM rollout.',
    },
    {
      icon: 'trending',
      title: 'Improves week over week',
      text: 'The more outcomes you log, the clearer the picture of which inquiries, sources and follow-ups actually convert.',
    },
    {
      icon: 'shield',
      title: 'Your data stays yours',
      text: 'Records are exportable at any time, and cancelling never means losing the history you built.',
    },
  ],
  faq: [
    {
      q: 'How long does it take to get started?',
      a: 'Most businesses are logging live inquiries the same day. The only setup is signing in with Google and inviting your team — there is no data import required to start, though importing old enquiries is a good idea.',
    },
    {
      q: 'Do I have to change how we take bookings?',
      a: 'No. Wynback sits alongside whatever you already use. You log the inquiry in Wynback so it gets followed up; your existing tools keep doing what they do.',
    },
    {
      q: 'What does my team have to do every day?',
      a: 'Open the follow-up queue, work through what is due, and record the outcome. For most teams that is 10 to 15 minutes a day.',
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
  title: 'Wynback for Local Service Businesses & Industries',
  description:
    'Wynback helps auto services, home services, salons, fitness studios, photographers and local businesses recover missed inquiries and book more jobs.',
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
      q: 'Is Wynback only for service businesses?',
      a: 'Wynback is designed for businesses where a customer inquiry usually needs a human response before it converts — which covers most local service businesses. If your sales cycle is long and multi-stakeholder, a full CRM will fit you better.',
    },
    {
      q: 'Can I use Wynback with a mobile or field team?',
      a: 'Yes. Wynback runs in the browser, so detailers, cleaners and technicians can log and work inquiries from a phone while on site.',
    },
    {
      q: 'Do you support businesses outside India?',
      a: 'Yes. Wynback works anywhere in the world. The workflow is language- and currency-agnostic — set it to whatever your business uses.',
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Industry: car detailing                                             */
/* ------------------------------------------------------------------ */

const carDetailing = {
  type: 'car-detailing',
  path: '/industries/car-detailing',
  title: 'Wynback for Car Detailing — Recover More Bookings',
  description:
    'Car detailing lead management software. Track missed detailing inquiries, follow up on quotes, and turn more enquiries into booked jobs.',
  keywords:
    'car detailing software, detailing lead management, auto detailing CRM, detailing booking follow up, mobile detailing software, car detailing customer follow up',
  eyebrow: 'INDUSTRY · CAR DETAILING',
  heading: 'Most detailing enquiries never get a second message.',
  intro:
    'Detailing customers message three or four shops and book whoever replies properly first. Wynback makes sure your studio is the one that follows through — every time.',
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
      a: 'No — and that is deliberate. Wynback does not replace your calendar. It makes sure every enquiry reaches your calendar by giving you a reliable follow-up process around the bookings you already take.',
    },
    {
      q: 'I am a one-person mobile detailing business. Is this useful for me?',
      a: 'Yes, arguably more than for a large shop. When you are the only person, every missed call is a job you personally lost, and there is no one else to pick up the follow-up. Wynback is the second pair of hands.',
    },
    {
      q: 'How quickly will I see recovered bookings?',
      a: 'Businesses that import their last few months of unanswered enquiries typically recover their first job within a fortnight. Starting from scratch, expect a meaningful figure within about 30 days.',
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
  title: 'About Wynback — Revenue Recovery for Growing Businesses',
  description:
    'Wynback builds simple revenue recovery software for local service businesses. Learn why we focus on one job: making sure no customer inquiry is missed.',
  keywords:
    'about wynback, wynback company, revenue recovery company, small business software India, wynback story',
  eyebrow: 'ABOUT',
  heading: 'We build one thing, and we build it narrowly.',
  intro:
    'Wynback exists because of a pattern we kept seeing in small businesses: the marketing worked, the phone rang, and the revenue still leaked — on the follow-up.',
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
      q: 'Is Wynback a CRM?',
      a: 'Not really. Wynback is a revenue recovery tool. A CRM tries to run your whole customer relationship; Wynback handles the specific stretch where most small businesses lose money — between an inquiry arriving and a follow-up happening.',
    },
    {
      q: 'Who is behind Wynback?',
      a: 'Wynback is built by a small team focused on practical software for local service businesses — and it is completely free, every feature included, because businesses that cannot absorb enterprise software costs still deserve enterprise-grade tools.',
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
  title: 'Wynback Resources — Inquiry & Follow-Up Guides',
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
  faq: [
    {
      q: 'Are these resources free?',
      a: 'Yes. Every guide is free to read, and none of them require a Wynback account.',
    },
    {
      q: 'Do I need Wynback to apply these guides?',
      a: 'No. The workflows work on paper or in a spreadsheet too. Wynback just removes the manual overhead of keeping them up to date.',
    },
    {
      q: 'Which guide should I start with?',
      a: 'Start with "Why inquiries get missed" if you are not sure where your leakage is, or "Building a follow-up workflow" if you already know you are not following up consistently.',
    },
  ],
}

/* ------------------------------------------------------------------ */
/* GLOBAL VERTICAL PAGES — worldwide positioning                       */
/* ------------------------------------------------------------------ */

/* ------------------------- Salons & Spas ------------------------- */
const salons = {
  type: 'salons',
  path: '/industries/salons',
  title: 'Wynback for Salons — Win Back Missed Appointments',
  description:
    'Salon client follow-up software. Recover missed calls, rebook no-shows, and bring lapsed clients back — without chasing them manually.',
  keywords:
    'salon follow up software, salon client retention, missed appointment recovery, rebook no-show clients, salon CRM, beauty salon lead follow up',
  eyebrow: 'INDUSTRY · SALONS & SPAS',
  heading: 'Your chair is empty because nobody followed up.',
  intro:
    'Salon clients message three or four places and book whoever replies first. Wynback makes sure your salon is the one that follows through — on every missed call, every unanswered DM, every client who never rebooked.',
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
      q: 'Is Wynback a salon booking system?',
      a: 'No — deliberately not. Wynback does not replace your calendar or booking app. It makes sure every enquiry reaches your calendar by giving you a reliable follow-up process around the bookings you already take.',
    },
    {
      q: 'I am a solo stylist. Is this useful for me?',
      a: 'Yes — arguably more than for a large salon. When you are the only person, every missed call is an appointment you personally lost. Wynback is the second pair of hands that follows up while you are with a client.',
    },
    {
      q: 'How do I win back clients who stopped coming?',
      a: 'Import your lapsed-client list into Wynback and work it like new enquiries: a personal message, a reason to return, a clear next step. Most salons are surprised how many "lost" clients just needed one nudge.',
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
  title: 'Wynback for Auto Repair — Recover Missed Service Jobs',
  description:
    'Auto repair shop follow-up software. Track missed calls, chase unsent quotes, and turn more enquiries into booked service jobs.',
  keywords:
    'auto repair shop CRM, garage lead follow up, missed call auto shop, quote follow up mechanic, auto service customer retention',
  eyebrow: 'INDUSTRY · AUTO REPAIR',
  heading: 'The job went to whoever called back first.',
  intro:
    'Drivers with a strange noise or a warning light call two or three shops and book whoever responds properly. Wynback makes sure your shop is the one that follows up — every time.',
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
      q: 'Is Wynback a garage management system?',
      a: 'No. Wynback does not do job cards, invoicing or parts. It handles the gap most garage software ignores: making sure every enquiry gets a follow-up until it becomes a booking.',
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
  title: 'Wynback for Clinics — Reduce No-Shows, Win Back Patients',
  description:
    'Clinic patient follow-up software. Recover missed appointment enquiries, rebook no-shows, and bring lapsed patients back with a simple workflow.',
  keywords:
    'clinic patient follow up, reduce patient no-shows, missed appointment recovery, patient reactivation software, dental clinic CRM, physiotherapy follow up',
  eyebrow: 'INDUSTRY · CLINICS',
  heading: 'Empty slots are patients who never got a follow-up.',
  intro:
    'Patients who enquire and hear nothing book elsewhere. Patients who miss an appointment and hear nothing stay missed. Wynback gives clinics a simple, respectful follow-up routine that keeps the diary full.',
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
      text: 'Clinic follow-ups need the right tone. Wynback keeps the human in the loop — reminders prompt your team, people send the message.',
    },
    {
      icon: 'shield',
      title: 'Your records stay yours',
      text: 'Enquiry and follow-up records are exportable at any time. No lock-in, no data hostage situations.',
    },
  ],
  faq: [
    {
      q: 'Is Wynback a practice management system?',
      a: 'No. Wynback does not handle clinical records, billing or scheduling. It covers the communication gap: making sure every patient enquiry and missed appointment gets a proper follow-up.',
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
      a: 'Yes. The shared queue means any team member can see what is due and pick it up, so cover during leave is automatic.',
    },
  ],
}

/* ------------------------- Coaches ------------------------- */
const coaches = {
  type: 'coaches',
  path: '/industries/coaches',
  title: 'Wynback for Coaches — Turn Enquiries Into Clients',
  description:
    'Coaching business follow-up software. Track discovery-call enquiries, follow up on proposals, and win back prospects who went quiet.',
  keywords:
    'coach lead follow up, coaching client acquisition, discovery call follow up, fitness coach CRM, business coach lead tracking',
  eyebrow: 'INDUSTRY · COACHES',
  heading: 'They were interested. Then life happened.',
  intro:
    'Coaching prospects enquire in a burst of motivation and go quiet when the week gets busy. Wynback keeps every conversation warm until they are ready — so the client comes to you, not to the coach who followed up.',
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
      q: 'I already have a CRM. Why Wynback?',
      a: 'Most coaches do not need a CRM — they need a follow-up habit. Wynback is narrower and simpler: one queue of people to contact, worked daily. If your CRM is where leads go to be forgotten, Wynback is the fix.',
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
      a: 'No. Wynback covers enquiry to signed client. Your existing tools keep handling payments, contracts and delivery.',
    },
  ],
}

/* ------------------------- Real Estate ------------------------- */
const realEstate = {
  type: 'real-estate',
  path: '/industries/real-estate',
  title: 'Wynback for Real Estate Agents — Never Lose a Buyer Again',
  description:
    'Real estate lead follow-up software. Track every viewing enquiry, chase cold listings, and win back buyers and sellers who went quiet.',
  keywords:
    'real estate lead follow up, estate agent CRM alternative, property enquiry tracking, win back property buyers, seller follow up software',
  eyebrow: 'INDUSTRY · REAL ESTATE',
  heading: 'Speed to lead wins listings. Follow-up wins deals.',
  intro:
    'Buyers enquire on five listings and view with whoever responds first. Sellers choose the agent who stays in touch. Wynback makes sure no enquiry, viewing or valuation ever goes quiet on your watch.',
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
      title: 'Works for small teams',
      text: 'One shared queue means cover is automatic when someone is on a viewing. Nothing depends on one person’s memory.',
    },
  ],
  faq: [
    {
      q: 'Is Wynback a replacement for my estate agency CRM?',
      a: 'For many small agencies, yes — because the CRM is where leads go to die. Wynback does the one thing that actually wins deals: making sure every enquiry gets followed up. If you love your CRM, Wynback can sit alongside it for the follow-up layer.',
    },
    {
      q: 'How fast should I respond to a portal enquiry?',
      a: 'Within minutes if possible. But the bigger leak is not the first response — it is the second, third and fourth follow-up that never happens. Wynback fixes that part.',
    },
    {
      q: 'Can I track both buyers and sellers?',
      a: 'Yes. Every enquiry carries its type, source and value, so buyers, sellers, landlords and tenants live in one workflow.',
    },
    {
      q: 'Does it do automated drip emails?',
      a: 'Wynback is deliberately human-first: it tells your team who to contact and when, and the message comes from a person. In property, the personal touch is what converts.',
    },
  ],
}

/* ------------------------- Freelancers ------------------------- */
const freelancers = {
  type: 'freelancers',
  path: '/industries/freelancers',
  title: 'Wynback for Freelancers — Win Back Every Project Enquiry',
  description:
    'Freelancer lead follow-up software. Track project enquiries, chase unsent proposals, and turn more conversations into paying clients.',
  keywords:
    'freelancer lead follow up, freelance client acquisition, proposal follow up freelancer, win back freelance clients, freelancer CRM',
  eyebrow: 'INDUSTRY · FREELANCERS',
  heading: 'The project went to whoever followed up.',
  intro:
    'Clients enquire with three freelancers and hire whoever stays engaged. Between delivering work, enquiries go quiet and projects slip away. Wynback is the follow-up system for people who do everything themselves.',
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
      text: 'You do not need pipelines, stages and automation rules. You need a list of people to message today. That is Wynback.',
    },
    {
      icon: 'shield',
      title: 'Your data, portable',
      text: 'Export everything any time. Your client history is yours, whatever tools you use next.',
    },
  ],
  faq: [
    {
      q: 'I am a solo freelancer. Is this overkill?',
      a: 'It is the opposite of overkill — it replaces the mental load of remembering who to follow up with. Ten minutes a day on one queue, and no more "I meant to reply to them" guilt.',
    },
    {
      q: 'How do I follow up without being annoying?',
      a: 'Add something useful each time: a relevant example, a clearer timeline, a smaller first step. Wynback prompts the contact; you bring the value. Three to five touches across two weeks is normal, not pushy.',
    },
    {
      q: 'Can I track different service lines?',
      a: 'Yes. Tag enquiries by service so you can see which work actually converts and where to focus your limited outreach time.',
    },
    {
      q: 'Does it integrate with my invoicing tool?',
      a: 'No integrations needed. Wynback covers enquiry to won project; your existing tools keep handling the rest.',
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
  title: 'The Wynback Manifesto — Why We Exist',
  description:
    'Wynback exists for one reason: the easiest customer to win is the one who already contacted you. Read why follow-up is the most underrated growth lever in business.',
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
      text: 'Wynback does not try to run your business. It does one thing: make sure no customer who reached out ever disappears into silence. Everything we build serves that single moment — the second chance.',
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
      q: 'Who is Wynback for, really?',
      a: 'Any business where one customer is worth a phone call — salons, garages, clinics, coaches, agents, freelancers, studios, trades. If a missed call costs you real money, Wynback is for you, wherever in the world you are.',
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
  useCases,
  howItWorks,
  missedInquiries,
  followUpManagement,
  revenueRecovery,
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
      { to: about.path, label: 'About Wynback' },
      { to: manifesto.path, label: 'Manifesto' },
      { to: '/', label: 'Home' },
    ],
  },
]
