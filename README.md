# Greenfield Acres Realty — greenfieldacresrealty.com

The website of **Aimee Greenfield's Greenfield Acres Realty** (Sparta, NC — Luxury Home
Specialists of the High Country). Built with [Astro](https://astro.build) and deployed on
**Netlify**, with live MLS data from Aimee's **IDX Broker** account
(`greenfieldacresrealty.idxbroker.com`, fed by HCAR MLS).

---

## What's on the site

| Page | What it does |
|---|---|
| `/` | Landing page: hero, featured MLS listings (live, rotating), MLS search panel, communities, Home-Finder wizard, about, reviews, team, book-a-call, contact form |
| `/search` | Full property search — deep-links into the live IDX MLS results |
| `/communities` + `/communities/<town>` | All 13 High Country towns, each with story, facts, and live listing links |
| `/land` | Land & acreage: featured parcels from the MLS feed + land searches by town |
| `/blog` + `/blog/<post>` | 26 migrated posts; new posts are just markdown files (see "Writing blog posts") |
| `/area-info` | Interactive map (13 towns + parks, ski resorts, Parkway) + trusted local links |
| `/faq` | Buyer/seller FAQ with Google rich-result markup |

All old `.htm` URLs from the previous site 301-redirect to their new homes
([public/_redirects](public/_redirects)) so Google rankings and backlinks are preserved.

## How the MLS integration works

### Featured properties widget (homepage)

The homepage "Featured Properties" section embeds an **IDX Broker `listingsCarousel` widget**
(id **165577**), configured to show **Active, $800k+ listings in Sparta, Blowing Rock, Boone,
Banner Elk, and West Jefferson**, newest first. IDX serves this data directly — it's their
sanctioned, MLS-compliant way to show live, cross-agent listings on a client's own site (a
custom-built card feed would require a separate paid MLS data license — see "Why not custom
cards?" below). Because it's a live IDX view, sold/pending homes disappear automatically —
there's nothing to keep in sync.

- **Embed**: a single script tag in [src/pages/index.astro](src/pages/index.astro), `<script src="https://greenfieldacresrealty.idxbroker.com/idx/widgets/165577">`. IDX injects an `<idx-listings-carousel>` element in its place.
- **Domain-locked**: IDX validates the request's domain against the site registered on Aimee's account (currently `www.greenfieldacresrealty.com`). **The widget will not render on `localhost` or the Netlify preview domain** — this is expected, not a bug (it's the MLS data-security rule that restricts listing data to approved domains). Verify it visually only after the real domain is live, or temporarily add the Netlify domain as an approved/secondary domain in IDX Middleware if you need to test sooner.
- **To change criteria (towns/price) or reapply colors**: the widget's `PUT /clients/widgets` (create) endpoint works reliably; **`POST /clients/widgets/{id}` (update) currently 500s on IDX's side** regardless of payload — a bug on their end, reported to their support. Until they fix it, the only reliable way to change settings is: `DELETE /clients/widgets/{id}` the old one, then `PUT /clients/widgets` a new one with updated options, then update the script's widget ID in `index.astro`. The exact request used to create widget 165577 (all options, brand colors, `editByHandQuery` city list) is in this session's history — ask Claude to reconstruct it if needed.
- **Rotation**: `sortOrder: newest` plus the carousel's own auto-scroll (`enableAutoScroll`, 6s) gives continuous movement within a visit; day-to-day reordering (e.g. alternating newest/price-desc) was intended to run from the daily scheduled function once IDX's update endpoint works — currently blocked on their bug above.

### Why not custom-designed cards?

IDX Broker's Client API deliberately does **not** return raw MLS search results for developers to
render themselves (`/clients/searchquery` needs a Developer Partner "ancillary" key, gated behind
IDX's partner program; even then, IDX's own docs say cross-account MLS search data currently isn't
offered via API at all — see `developers.idxbroker.com/getting-mls-data/`). The widget above is the
fully-compliant, $0 way to get live cross-agent listings on the page. If pixel-perfect custom cards
matter more than the IDX-styled widget later, the upgrade path is a licensed MLS data feed via a
vendor like SimplyRETS or Repliers (~$50–100/mo) — ask Claude, the plumbing (`netlify/functions/lib/idx.mts`,
`/api/featured`, `public/featured.js`, the `/land` page grid) is already built for it; only the
fetch source would need to change.

### Land page + future custom-cards groundwork

- **`netlify/functions/featured-refresh.mts`** runs **daily** (scheduled function). It calls the
  IDX Broker API for Aimee's own featured listings, keeps only **Active** ones, keeps homes
  **$800k+** and all land, and caches the result in Netlify Blobs.
- **`/api/featured`** (`netlify/functions/featured.mts`) serves that cache to the browser.
  If the cache is empty it refreshes on the spot; if there's no API key yet it serves
  [data/featured-fallback.json](data/featured-fallback.json).
- **`public/featured.js`** renders cards on the `/land` page grid from that feed. (It no longer
  drives the homepage — that's the widget above.)
- The search panel and wizard build IDX results URLs directly (city IDs live in
  [src/data/communities.json](src/data/communities.json)) — those results are always live MLS data.

### One-time setup: the IDX API key

In Netlify → **Site settings → Environment variables**, add `IDX_API_KEY`
(from IDX Broker Middleware → **Developers → API Key Control**). With 1Password CLI:

```sh
netlify env:set IDX_API_KEY "$(op read 'op://<vault>/<item>/<field>')"
```

The key lives only in Netlify — never in this repo. The first visit to `/api/featured`
after the key is set populates the cache immediately (no need to wait for the nightly run).

## Deploying (one-time setup)

1. Create a free account at [netlify.com](https://netlify.com) → **Add new site → Import an
   existing project → GitHub** → pick this repo. Build settings are auto-detected from
   [netlify.toml](netlify.toml). Every push to the production branch auto-deploys.
2. Set `IDX_API_KEY` (above).
3. **Forms**: in Netlify → Forms, enable notifications → **Email notification** to
   `greenfieldacresrealty@gmail.com` for both forms: `contact` and `home-finder`
   (wizard leads). Later, switch the address to `aimee@greenfieldacresrealty.com`.
4. **Launch**: Netlify → Domain management → add `greenfieldacresrealty.com`, then at
   **GoDaddy** point the domain per Netlify's instructions (either change nameservers to
   Netlify DNS — easiest — or set the A/CNAME records it shows). HTTPS is automatic.

## The professional email address (aimee@greenfieldacresrealty.com)

1. Sign up at [workspace.google.com](https://workspace.google.com) (Business Starter, ~$7/user/mo)
   with domain `greenfieldacresrealty.com`.
2. Google will ask you to verify the domain — it hands you a TXT record to add at GoDaddy
   (Google can often do this automatically since it integrates with GoDaddy).
3. Add the Gmail **MX records** at GoDaddy (again, mostly automatic).
4. Create the mailbox `aimee@greenfieldacresrealty.com`.
5. Update the site: change `"email"` in [src/data/site.json](src/data/site.json) and the Netlify
   Forms notification address. Done — one line, one setting.

> ⚠️ If you move DNS nameservers to Netlify at launch, add the Google MX/TXT records in
> Netlify DNS instead of GoDaddy.

## Online booking (phone / Google Meet / Teams)

The "Book a call with Aimee" section is Calendly-ready:

1. Create a free account at [calendly.com](https://calendly.com) (sign in with the Google
   Workspace account so Meet links generate automatically).
2. Create three event types with these exact URL slugs: **`phone-call`**, **`google-meet`**,
   **`microsoft-teams`** (Teams requires connecting a Microsoft account in Calendly settings).
3. Paste the Calendly base link (e.g. `https://calendly.com/aimee-greenfield`) into
   `"calendly"` in [src/data/site.json](src/data/site.json) and push. The placeholder swaps
   itself for the live booking calendar.

## WhatsApp

Aimee's direct number (336-466-7727) is wired as `wa.me/13364667727` throughout the site.
For this to work she just needs the **WhatsApp Business** app on the phone with that number.

## Writing blog posts (the AI way)

A Claude Code skill lives in [.claude/skills/new-blog-post](.claude/skills/new-blog-post/SKILL.md).
Open this project in Claude Code and type:

```
/new-blog-post fall foliage outlook for 2026
```

Claude drafts the post in Aimee's voice as a markdown file in `src/content/blog/`, you read it,
ask for changes ("make it shorter", "mention the Parkway"), and approve. On approval it commits
and pushes — Netlify publishes it automatically a minute later. No CMS, no login, no HTML.

A post is just a file like this, so it can also be written by hand:

```markdown
---
title: "My Post Title"
date: 2026-07-03
description: "One-sentence summary shown on the blog page and Google."
---

The post body, in plain markdown.
```

## AI concierge (Home-Finder wizard)

The wizard works fully without AI. To turn on the Claude-written personal note on the results
step, add env var `ANTHROPIC_API_KEY` in Netlify (get one at console.anthropic.com — expect a
few dollars/month at this traffic). No code changes needed.

## Local development

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # production build to dist/
```

`netlify dev` (with the Netlify CLI, after `netlify link`) also runs the functions +
forms locally.

## Branding the IDX pages to match (recommended polish)

Search results and listing detail pages live on `greenfieldacresrealty.idxbroker.com`.
IDX Broker supports a **wrapper page** so those pages wear this site's header/footer:
IDX Broker Middleware → Designs → Wrappers → point it at a wrapper page from this site,
and set the subdomain to `search.greenfieldacresrealty.com` (CNAME at the DNS host) for a
seamless domain. Optional, but makes the click-through feel like one site.
