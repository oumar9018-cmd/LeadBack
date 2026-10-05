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
  title: 'LeadBack — Turn Missed Inquiries Into Customers',
  description:
    'LeadBack helps growing businesses recover missed customer inquiries, organize follow-ups, and turn more conversations into paying customers. Start free.',
  keywords:
    'lead recovery software, customer inquiry tracking, follow-up management, missed lead software, revenue recovery, small business CRM',
  eyebrow: 'REVENUE RECOVERY',
  heading: 'Turn missed inquiries into customers.',
  intro:
    'LeadBack gives growing businesses one simple workspace to capture every customer inquiry, follow up at the right time, and measure the revenue that comes back.',
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
  title: 'LeadBack Features — Never Lose Another Customer Inquiry',
  description:
    'Explore LeadBack features: inquiry tracking, follow-up workflows, recovery analytics and revenue reporting built for growing service businesses.',
  keywords:
    'lead management features, customer inquiry tracking software, follow-up automation, lead recovery analytics, sales follow-up tool, small business CRM features',
  eyebrow: 'FEATURES',
  heading: 'Every feature has one job: getting the customer back.',
  intro:
    'LeadBack is deliberately narrow. It does the four things that decide whether an interested customer becomes a paying one — and it leaves the rest alone.',
  stats: [
    { value: '4', label: 'Core workflows' },
    { value: '0', label: 'Spreadsheets required' },
    { value: '₹499', label: 'Per month, all-in' },
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
      text: 'Every open inquiry gets a next action and an owner. Your team opens LeadBack and knows exactly who to contact today.',
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
      q: 'Do I need to connect my phone system to LeadBack?',
      a: 'No. LeadBack is designed for businesses whose inquiries arrive across calls, WhatsApp, Instagram and walk-ins, so you can log an inquiry manually in seconds. Everything is in one place without any telephony integration.',
    },
    {
      q: 'Can more than one person use LeadBack?',
      a: 'Yes. LeadBack is built for small teams. Everyone sees the same inquiry list and follow-up queue, so a customer is never dropped because one person was away.',
    },
    {
      q: 'How is LeadBack different from a CRM?',
      a: 'A general CRM tries to run your whole business. LeadBack does one thing: making sure an interested customer who has already contacted you gets a reply and a follow-up. That narrower focus is why teams actually keep using it.',
    },
    {
      q: 'Is my data exported if I cancel?',
      a: 'Yes. Your inquiry, follow-up and revenue records remain yours and can be exported at any time from your workspace.',
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Pricing                                                             */
/* ------------------------------------------------------------------ */

const pricing = {
  type: 'pricing',
  path: '/pricing',
  navLabel: 'Pricing',
  title: 'LeadBack Pricing — Free 1-Month Trial, Then ₹499/Month',
  description:
    'Simple LeadBack pricing: a 1-month free trial, then ₹499/month or ₹4,990/year. No setup fees, no per-seat charges, cancel anytime.',
  keywords:
    'leadback pricing, lead recovery software price, follow-up software cost India, ₹499 CRM, affordable lead management software, free trial lead software',
  eyebrow: 'PRICING',
  heading: 'One plan. One price. No sales call required.',
  intro:
    'Recovered revenue should cost a fraction of the revenue it recovers. LeadBack is priced so a single won-back customer a month pays for the year.',
  plans: [
    {
      name: 'Free trial',
      price: '₹0',
      period: 'first month',
      tagline: 'Prove it on your own inquiries.',
      featured: false,
      features: [
        'Full access to every feature',
        'Unlimited inquiries & follow-ups',
        'Revenue recovered tracking',
        'No credit card required',
      ],
      cta: 'Start free 1-month trial',
    },
    {
      name: 'Monthly',
      price: '₹499',
      period: 'per month',
      tagline: 'Stay flexible, cancel whenever.',
      featured: true,
      badge: 'Most flexible',
      features: [
        'Everything in the free trial',
        'Unlimited team members',
        'Recovery & revenue analytics',
        'Email support',
        'Cancel anytime',
      ],
      cta: 'Choose monthly',
    },
    {
      name: 'Yearly',
      price: '₹4,990',
      period: 'per year',
      tagline: 'Two months free versus monthly.',
      featured: false,
      badge: 'Save 17%',
      features: [
        'Everything in Monthly',
        '2 months free (₹5,988 → ₹4,990)',
        'Priority support',
        'Onboarding checklist for your team',
      ],
      cta: 'Choose yearly',
    },
  ],
  sections: [
    {
      icon: 'check',
      title: 'No setup or onboarding fees',
      text: 'You pay for the software, nothing else. There is no implementation charge, no training package and no mandatory annual contract.',
    },
    {
      icon: 'users',
      title: 'No per-seat pricing',
      text: 'Add your whole team at no extra cost. Charging per user would punish exactly the behaviour LeadBack needs: everyone logging inquiries.',
    },
    {
      icon: 'shield',
      title: 'Cancel anytime',
      text: 'Monthly plans can be stopped at any point. Your records stay exportable, so leaving never means losing your history.',
    },
    {
      icon: 'dollar',
      title: 'Priced against recovered revenue',
      text: 'One recovered customer a month usually covers the subscription several times over. That is the entire pricing philosophy.',
    },
  ],
  faq: [
    {
      q: 'How much does LeadBack cost?',
      a: 'LeadBack starts with a 1-month free trial. After the trial it is ₹499 per month, or ₹4,990 per year if you choose annual billing — which works out about 17% cheaper than paying monthly.',
    },
    {
      q: 'Do I need a credit card to start the free trial?',
      a: 'No. The 1-month free trial does not require a card. You only enter billing details if you decide to continue after the trial.',
    },
    {
      q: 'Is there a limit on inquiries or contacts?',
      a: 'No. Every plan includes unlimited inquiries, unlimited follow-ups and unlimited customers. We do not meter the activity we want you to do more of.',
    },
    {
      q: 'What happens when the free trial ends?',
      a: 'You will be prompted to pick the monthly or yearly plan. If you decide not to continue, your workspace pauses and your data remains exportable.',
    },
    {
      q: 'Do you charge per user?',
      a: 'No. Pricing is per business, not per seat, so your receptionist, sales team and owner can all use LeadBack at no additional cost.',
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
  title: 'LeadBack Use Cases — Recover Missed Inquiries & Lost Leads',
  description:
    'See how businesses use LeadBack to recover missed calls, unanswered DMs, cold quote requests, no-shows and dormant leads — and turn them into revenue.',
  keywords:
    'lead recovery use cases, missed call follow up, quote follow up software, dormant lead reactivation, no-show follow up, lead follow up examples',
  eyebrow: 'USE CASES',
  heading: 'Where your revenue is leaking right now.',
  intro:
    'Most lost revenue is not lost to competitors — it leaks out of ordinary gaps. A call you could not answer, a DM you meant to reply to, a quote you never chased. These are the gaps LeadBack closes.',
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
      a: 'No. Inquiry capture, follow-up management and revenue recovery are three views of the same workspace in LeadBack, so a single workflow covers all of them.',
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Use case: missed inquiries                                          */
/* ------------------------------------------------------------------ */

const missedInquiries = {
  type: 'missed-inquiries',
  path: '/use-cases/missed-inquiries',
  title: 'Recover Missed Customer Inquiries | LeadBack',
  description:
    'Stop losing customers who already contacted you. Track every missed call, DM and form enquiry, follow up on time, and see the revenue you recover.',
  keywords:
    'missed customer inquiries, missed call recovery, unanswered enquiry follow up, lost lead recovery software, inquiry tracking system',
  eyebrow: 'USE CASE · MISSED INQUIRIES',
  heading: 'The customer already contacted you. That is the expensive part.',
  intro:
    'Acquiring an inquiry costs marketing money, word of mouth and reputation. Losing one costs nothing to prevent. LeadBack makes sure no inquiry disappears just because you were busy when it arrived.',
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
      text: 'Work the follow-up queue daily. LeadBack shows you who is overdue so timing never depends on memory.',
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
      a: 'Fast. Intent decays quickly — a person who asked about your service an hour ago is far more likely to book than the same person next week. LeadBack surfaces the newest open inquiries first so your first call of the day is to the warmest person on the list.',
    },
    {
      q: 'What if the inquiry came in on WhatsApp or Instagram?',
      a: 'You log it manually with its source. LeadBack does not need access to your accounts, which keeps setup simple and works across every channel you use, including walk-ins and phone calls.',
    },
    {
      q: 'Can I track inquiries I lost months ago?',
      a: 'Yes — and it is often worth it. Importing old enquiries into LeadBack gives your team a ready-made list of people who already expressed interest but never got a proper follow-up.',
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Use case: follow-up management                                      */
/* ------------------------------------------------------------------ */

const followUpManagement = {
  type: 'follow-up-management',
  path: '/use-cases/follow-up-management',
  title: 'Follow-Up Management Software for Local Business | LeadBack',
  description:
    'Build a follow-up routine your team actually keeps. LeadBack turns scattered reminders into one shared follow-up queue with owners, dates and outcomes.',
  keywords:
    'follow up management software, sales follow up process, follow up system for small business, lead follow up tool, follow up reminder app',
  eyebrow: 'USE CASE · FOLLOW-UP MANAGEMENT',
  heading: 'Most deals are not lost. They are just never followed up.',
  intro:
    'Following up is not hard — it is just easy to postpone. LeadBack removes the two things that break every follow-up habit: not knowing who to contact, and relying on someone remembering to do it.',
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
      text: 'An action without a date is a wish. Every follow-up in LeadBack has a due date attached.',
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
      text: 'Some customers take months. LeadBack keeps the thread alive across weeks without anyone holding it in their head.',
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
      q: 'Is LeadBack an automation tool?',
      a: 'LeadBack is deliberately a management tool, not an automation tool. It tells your team exactly who needs a human follow-up and when — the message itself still comes from a person, which is what converts in local service businesses.',
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Use case: revenue recovery                                          */
/* ------------------------------------------------------------------ */

const revenueRecovery = {
  type: 'revenue-recovery',
  path: '/use-cases/revenue-recovery',
  title: 'Revenue Recovery Software for Old Leads | LeadBack',
  description:
    'Measure the revenue your follow-ups actually recover. LeadBack tracks recovered opportunities, win-back value and the true ROI of following up.',
  keywords:
    'revenue recovery software, recover lost revenue, win back lost customers, lead recovery ROI, recovered revenue tracking',
  eyebrow: 'USE CASE · REVENUE RECOVERY',
  heading: 'You cannot improve revenue you never measured.',
  intro:
    'Most teams know how many new leads they got. Almost none know how much money they recovered from the ones they nearly lost. LeadBack makes that number visible — and it is usually the most motivating figure in the business.',
  stats: [
    { value: '₹', label: 'Recovered, tracked live' },
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
      text: 'Put recovered revenue next to what LeadBack costs. The ROI conversation stops being theoretical.',
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
      a: 'Any revenue from a customer whose inquiry had gone cold, been unanswered or been written off, and who converted after a deliberate follow-up. LeadBack lets you record the value at the moment you win it back.',
    },
    {
      q: 'How long before I can see a recovery figure?',
      a: 'Most businesses have a meaningful number within 30 days. If you import old enquiries when you start, you can often produce recovered revenue in the first fortnight.',
    },
    {
      q: 'Do I need accounting data to use this?',
      a: 'No. You enter the value of the won-back job or booking yourself. LeadBack is a recovery record, not an accounting system, so there is no integration work required.',
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
  title: 'How LeadBack Works — Missed Inquiry to Paying Customer',
  description:
    'See how LeadBack works in four steps: capture the inquiry, assign a follow-up, win the customer back, and report the revenue you recovered.',
  keywords:
    'how leadback works, lead recovery process, inquiry follow up workflow, lead management workflow, follow up process steps',
  eyebrow: 'HOW IT WORKS',
  heading: 'A four-step loop, not a software project.',
  intro:
    'LeadBack turns a messy, everyday problem into a repeatable routine. Once the loop is running, recovering a missed customer stops being luck.',
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
      text: 'Work the daily follow-up queue. LeadBack shows what is due today and what is already overdue.',
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
      text: 'Because the daily action is one short list, LeadBack survives staff changes — the kind of event that usually kills a CRM rollout.',
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
      a: 'No. LeadBack sits alongside whatever you already use. You log the inquiry in LeadBack so it gets followed up; your existing tools keep doing what they do.',
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
  title: 'LeadBack for Local Service Businesses & Industries',
  description:
    'LeadBack helps auto services, home services, salons, fitness studios, photographers and local businesses recover missed inquiries and book more jobs.',
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
        to: '/industries/car-detailing',
        title: 'Car detailing',
        text: 'How detailing studios and mobile detailers recover missed booking enquiries.',
      },
      {
        to: '/use-cases/missed-inquiries',
        title: 'Missed inquiries',
        text: 'The cross-industry workflow for capturing and recovering every enquiry.',
      },
      {
        to: '/use-cases/revenue-recovery',
        title: 'Revenue recovery',
        text: 'Measure what following up is actually worth in your industry.',
      },
    ],
  },
  faq: [
    {
      q: 'Is LeadBack only for service businesses?',
      a: 'LeadBack is designed for businesses where a customer inquiry usually needs a human response before it converts — which covers most local service businesses. If your sales cycle is long and multi-stakeholder, a full CRM will fit you better.',
    },
    {
      q: 'Can I use LeadBack with a mobile or field team?',
      a: 'Yes. LeadBack runs in the browser, so detailers, cleaners and technicians can log and work inquiries from a phone while on site.',
    },
    {
      q: 'Do you support businesses outside India?',
      a: 'Yes. LeadBack works anywhere and is priced in INR for convenience. The workflow is language- and currency-agnostic.',
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Industry: car detailing                                             */
/* ------------------------------------------------------------------ */

const carDetailing = {
  type: 'car-detailing',
  path: '/industries/car-detailing',
  title: 'LeadBack for Car Detailing — Recover More Bookings',
  description:
    'Car detailing lead management software. Track missed detailing inquiries, follow up on quotes, and turn more enquiries into booked jobs.',
  keywords:
    'car detailing software, detailing lead management, auto detailing CRM, detailing booking follow up, mobile detailing software, car detailing customer follow up',
  eyebrow: 'INDUSTRY · CAR DETAILING',
  heading: 'Most detailing enquiries never get a second message.',
  intro:
    'Detailing customers message three or four shops and book whoever replies properly first. LeadBack makes sure your studio is the one that follows through — every time.',
  stats: [
    { value: '3–4', label: 'Shops each customer messages' },
    { value: '1st', label: 'Proper reply usually wins' },
    { value: '₹499', label: 'Per month, all-in' },
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
      a: 'No — and that is deliberate. LeadBack does not replace your calendar. It makes sure every enquiry reaches your calendar by giving you a reliable follow-up process around the bookings you already take.',
    },
    {
      q: 'I am a one-person mobile detailing business. Is this useful for me?',
      a: 'Yes, arguably more than for a large shop. When you are the only person, every missed call is a job you personally lost, and there is no one else to pick up the follow-up. LeadBack is the second pair of hands.',
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
  title: 'About LeadBack — Revenue Recovery for Growing Businesses',
  description:
    'LeadBack builds simple revenue recovery software for local service businesses. Learn why we focus on one job: making sure no customer inquiry is missed.',
  keywords:
    'about leadback, leadback company, revenue recovery company, small business software India, leadback story',
  eyebrow: 'ABOUT',
  heading: 'We build one thing, and we build it narrowly.',
  intro:
    'LeadBack exists because of a pattern we kept seeing in small businesses: the marketing worked, the phone rang, and the revenue still leaked — on the follow-up.',
  stats: [
    { value: '1', label: 'Problem we solve' },
    { value: '₹499', label: 'Flat monthly price' },
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
      text: 'Not another CRM. A narrow tool that does the four steps between an arriving inquiry and a paying customer, and does them well enough that teams keep using them.',
    },
    {
      icon: 'users',
      title: 'Who we build for',
      text: 'Detailing studios, salons, gyms, photographers, trades and local service teams — businesses where one customer is worth a phone call.',
    },
    {
      icon: 'shield',
      title: 'How we price',
      text: 'One flat price per business, no per-seat charges, no setup fees and a 1-month free trial, because the product should pay for itself before you pay for it.',
    },
  ],
  faq: [
    {
      q: 'Is LeadBack a CRM?',
      a: 'Not really. LeadBack is a revenue recovery tool. A CRM tries to run your whole customer relationship; LeadBack handles the specific stretch where most small businesses lose money — between an inquiry arriving and a follow-up happening.',
    },
    {
      q: 'Who is behind LeadBack?',
      a: 'LeadBack is built by a small team focused on practical software for local service businesses, with pricing designed for businesses that cannot absorb enterprise software costs.',
    },
    {
      q: 'How do I get in touch?',
      a: 'Start a free trial and reach support from inside your workspace, or email the team from the address listed in your billing settings.',
    },
  ],
}

/* ------------------------------------------------------------------ */
/* Resources                                                           */
/* ------------------------------------------------------------------ */

const resources = {
  type: 'resources',
  path: '/resources',
  title: 'LeadBack Resources — Inquiry & Follow-Up Guides',
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
      a: 'Yes. Every guide is free to read, and none of them require a LeadBack account.',
    },
    {
      q: 'Do I need LeadBack to apply these guides?',
      a: 'No. The workflows work on paper or in a spreadsheet too. LeadBack just removes the manual overhead of keeping them up to date.',
    },
    {
      q: 'Which guide should I start with?',
      a: 'Start with "Why inquiries get missed" if you are not sure where your leakage is, or "Building a follow-up workflow" if you already know you are not following up consistently.',
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
  pricing,
  howItWorks,
  missedInquiries,
  followUpManagement,
  revenueRecovery,
  industries,
  carDetailing,
  about,
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
  pricing,
  howItWorks,
  industries,
  about,
].map((page) => ({ to: page.path, label: page.navLabel }))

/** Grouped Footer navigation — broader internal linking than the header. */
export const FOOTER_GROUPS = [
  {
    title: 'Product',
    links: [
      { to: features.path, label: 'Features' },
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
    ],
  },
  {
    title: 'Industries',
    links: [
      { to: industries.path, label: 'All industries' },
      { to: carDetailing.path, label: 'Car detailing' },
    ],
  },
  {
    title: 'Company',
    links: [
      { to: about.path, label: 'About LeadBack' },
      { to: '/', label: 'Home' },
    ],
  },
]
