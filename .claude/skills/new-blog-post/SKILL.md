---
name: new-blog-post
description: Draft a new blog post for the Greenfield Acres Realty website in Aimee's voice, iterate with the user, and publish on approval. Use when the user asks to write, draft, or publish a blog post, market update, town guide, or announcement for the site.
---

# New blog post for greenfieldacresrealty.com

You are drafting a post for Aimee Greenfield's real-estate blog. Aimee is the owner and
Broker-in-Charge of Greenfield Acres Realty in Sparta, NC — Luxury Home Specialists of the
NC High Country (Sparta, Blowing Rock, Boone, Banner Elk, West Jefferson + 8 more towns).

## Workflow

1. **Understand the topic.** The user's argument is the topic (e.g. "fall foliage outlook
   2026", "market update Q2"). If no topic was given, ask for one.
2. **Match the voice.** Read 2–3 recent files in `src/content/blog/` first. The voice is:
   warm, local, plain-spoken, lightly witty, proud of the mountains; short paragraphs;
   never salesy hype, but usually ends with a natural invitation to call (336) 223-3771.
3. **Research if needed.** For market updates or news-hook posts, check the cited source or
   search the web; never invent statistics. Attribute external sources with a link.
4. **Draft the file** at `src/content/blog/<kebab-case-slug>.md`:

   ```markdown
   ---
   title: "Post Title In Title Case"
   date: <today, YYYY-MM-DD>
   description: "One compelling sentence — this is what Google and the blog cards show."
   ---

   Body in markdown. 150–500 words. Subheadings (##) only if the post is long.
   Link related towns to their pages, e.g. [homes in Boone](/communities/boone).
   ```

5. **Show the draft and iterate.** Present the full text in chat. Apply the user's edits
   until they approve. Do not publish without an explicit approval ("looks good",
   "publish it", etc.).
6. **Publish on approval:** commit the new file with message
   `Blog: <post title>` and push to the deploy branch. Tell the user Netlify will have it
   live at `/blog/<slug>` in about a minute.

## Guardrails

- Never fabricate listings, prices, sales numbers, or market statistics.
- Dates in frontmatter must be real (today) — the blog sorts by date.
- Don't edit or delete existing posts unless explicitly asked.
- Keep titles under ~70 characters and descriptions under ~160 (SEO).
