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

- **`netlify/functions/featured-refresh.mts`** runs **daily** (scheduled function). It calls the
  IDX Broker API for Aimee's featured listings, keeps only **Active** ones (this is the automatic
  "is that home still on the market?" check), keeps homes **$800k+** (site policy) and all land,
  and caches the result in Netlify Blobs.
- **`/api/featured`** (`netlify/functions/featured.mts`) serves that cache to the browser.
  If the cache is empty it refreshes on the spot; if there's no API key yet it serves
  [data/featured-fallback.json](data/featured-fallback.json) so the site always looks complete.
- **`public/featured.js`** renders the cards on the home page (shuffled per visit → "rotating")
  and the land grid. Every card links to the listing's full IDX detail page.
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
