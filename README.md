# LeadBack

LeadBack helps growing businesses recover missed customer inquiries, organize
follow-ups, and turn more conversations into paying customers.

React 19 + Vite SPA, deployed to GitHub Pages.

## Getting started

```bash
npm install
npm run dev      # local dev server
npm run build    # production build + SEO prerender
npm run preview  # serve the built site (includes the prerendered pages)
npm run lint     # oxlint (this is a plain-JS project, not TypeScript)
```

## Razorpay test checkout

The browser uses the public Razorpay Key ID from `.env.local`:

```bash
cp .env.example .env.local
# Set VITE_RAZORPAY_KEY_ID to your Razorpay test Key ID in .env.local
```

Orders and payment verification run in the Firebase Cloud Functions under
`functions/`. The browser never receives the Razorpay Key Secret. Set that
secret through Firebase Secret Manager (do not put it in a Vite `VITE_*`
variable or commit it):

```bash
npm ci --prefix functions
npx firebase-tools login
npx firebase-tools functions:secrets:set RAZORPAY_KEY_SECRET
npx firebase-tools deploy --only firestore:rules,functions
```

The function parameter `RAZORPAY_KEY_ID` is read from
`functions/.env.<firebase-project-id>`; copy `functions/.env.example` to that
file and set the same public Key ID. The functions are deployed to
`asia-south1`. In test-key mode, the existing trial button uses a ₹499 test
order and starts the existing one-month trial only after server verification.
With a live key (or no test key), the trial button activates the free trial
without a charge. The Billing page creates server-priced monthly/yearly orders
and only updates `users/{uid}` after checking Razorpay's signature and captured
payment. A successful billing checkout grants one month or one year of access;
it does not set up automatic renewal. Firestore rules keep subscription fields
and Razorpay order records server-only. This repository previously had no
rules file, so review `firestore.rules` against any console-only rules or
collections before deploying it; deploying replaces the project's current
Firestore rules.

For GitHub Pages builds, add the public Key ID as the repository Actions
variable `VITE_RAZORPAY_KEY_ID`. The Razorpay Secret remains in Firebase Secret
Manager and is never needed by the static-site build. Firebase Cloud Functions
require a Blaze (pay-as-you-go) Firebase project and must be deployed separately
from the GitHub Pages site.

## SEO architecture

This is a single-page app, which is normally a bad starting point for search
ranking: without extra work every URL serves the *same* `index.html`, so
crawlers see the homepage's `<title>` and description on every page.

LeadBack solves that with a manifest-driven setup:

| File | Role |
| --- | --- |
| `src/seo/pages.js` | **Single source of truth.** Content + meta for every marketing page. |
| `src/seo/site.js` | Site-wide constants (origin, default title, OG image). |
| `src/seo/schema.js` | JSON-LD builders (Organization, WebSite, SoftwareApplication, WebPage, BreadcrumbList, FAQPage). |
| `src/seo/useSEO.js` | Applies `<title>`/meta/canonical/JSON-LD at runtime on client-side navigation. |
| `src/SEOPage.jsx` | Renders a page from the manifest (hero, steps, plans, cards, FAQ, CTA). |
| `scripts/prerender-seo.mjs` | Bakes per-route meta + server-rendered HTML into `dist/<route>/index.html` at build time. |
| `scripts/entry-server.jsx` | Server-render entry used only by the prerenderer. |
| `scripts/generate-og-image.py` | Optional one-off generator for `public/og-image.png` (needs Pillow; not part of `npm run build`). |

### Adding a page

Append an entry to `SEO_PAGES` in `src/seo/pages.js`. That is the only step —
the route, the prerendered HTML, the sitemap entry and (if you set `navLabel`)
the header link are all derived from the array.

To also surface it in the footer, add it to `FOOTER_GROUPS` in the same file.

### What each page ships

Every route gets, both in the prerendered HTML and on client-side navigation:

- unique `<title>` (≤ 60 chars) and `<meta name="description">` (≤ 155 chars)
- `<link rel="canonical">` pointing at its own URL
- Open Graph + Twitter card tags, with `public/og-image.png` as the share image
- JSON-LD `@graph`: Organization, WebSite, SoftwareApplication (with pricing
  offers), WebPage, BreadcrumbList and — where the page defines an `faq` array —
  `FAQPage` for rich results
- server-rendered body content, so the page is indexable without JavaScript

### Pages

`/` · `/features` · `/use-cases` · `/pricing` · `/how-it-works` ·
`/use-cases/missed-inquiries` · `/use-cases/follow-up-management` ·
`/use-cases/revenue-recovery` · `/industries` · `/industries/car-detailing` ·
`/about` · `/resources`

## Deployment

Pushes to `main` run `.github/workflows/deploy.yml`, which builds and publishes
to GitHub Pages. `vite.config.js` sets `base: '/LeadBack/'` for the project site
(`oumar9018-cmd.github.io/LeadBack/`); if the `leadback.app` custom domain is
ever enabled in Pages settings, that must go back to `/`.

`public/404.html` is the SPA fallback for authenticated deep links (`/app/*`).
The marketing pages no longer rely on it — they are real directories.

## Product surfaces

- **Marketing/SEO pages** — `src/Home.jsx`, `src/SEOPage.jsx`
- **Authenticated workspace** — `src/AppLayout.jsx` + the `/app/*` routes in `src/App.jsx`
- **Auth** — `src/Login.jsx`, `src/Trial.jsx` (Firebase Google sign-in, 1-month free trial)
