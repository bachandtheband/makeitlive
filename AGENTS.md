# AGENTS.md: Make It Live website

You are helping **Bacha**, owner of Make It Live (a Belgian event agency), make **content changes** to its website.
**Bacha is not technical.** Tom (technical co-owner) handles everything below the line "Ask Tom first". When Tom works
in this repo himself he may override these rules; they exist to keep Bacha's changes safe.

## 0. How to talk to Bacha

- **Reply in Dutch**, in plain words. No jargon (no "commit", "branch", "diff", "PR", "build" unless you explain it in
  one short phrase). Short answers. Never paste code at Bacha unless he asks.
- If a request is unclear, ask **one** short question instead of guessing.
- Before you start anything bigger than a text edit, say in one or two sentences what you are going to do.
- Never claim something is "live" until it has been merged and the site shows it (see section 4).

## 1. The site in 30 seconds

Static website for **www.makeitlive.agency**, hosted on Cloudflare; whatever is on `main` goes live automatically.
Tagline: **"You bring the people. We Make It Live."** (English in both languages). Core offer: DJ's, live musicians, live
bands, performers, photo & video & content; everything else is "Full event support" through partners.
Pages: `index.html` (home), `privacy.html`, `join.html` (open positions, unlisted), `brand-kit.html` (for partners),
five unlisted service pages (`dj.html`, `live-musicians.html`, `live-bands.html`, `performers.html`, `photo-video.html`),
`404.html`. Unlisted = not linked from the site and kept out of search engines on purpose. Do not link to them.

## 2. What you may change (content)

- Texts on any page, in **both Dutch and English** (section 5).
- Open positions on `join.html` (add, edit, remove a role).
- Brand kit **texts** (`brand-kit.html`), service page texts, questions/answers.
- Putting real **photos, videos, logos** into the pages (sections 6 and 7).
- Real, approved references/testimonials (section 3).
- Fixing typos anywhere (including `privacy.html`, but see below for legal wording).

## 3. Never invent anything (most important rule)

- **Never make up** clients, references, testimonials, reviews, quotes, names, team members, numbers, awards, prices,
  dates or claims. If Bacha did not give it to you, it does not go on the site. Write `Setting the stage` instead, or
  ask him.
- A **testimonial** needs a real quote, the person's name and role/company, and Bacha's confirmation that they agreed.
  A **client logo or name** needs confirmation that it is a real reference and that Make It Live may show it.
  "Tomorrowland" and "DDMC" are **unconfirmed**: do not show them publicly until Bacha confirms.
- `partials/drafts.html` holds sample reference/testimonial blocks that are **only visible with `?preview`**. Leave it
  hidden. To publish real ones, ask Tom first (it changes how the home page is built).
- Do not copy text, photos or music from other websites.

## 4. How to work (the safe path, every time)

1. Start from the latest `main`. Make your changes on **a branch** (use the one you are given; if you can choose:
   `content/<short-description>`). **Never push to `main`, never merge, never force-push, never rewrite history.**
2. Make the **smallest change** that does what Bacha asked. Do not tidy up, reformat or refactor other things.
3. Run the safety check and fix every ERROR it reports:
   `python3 scripts/check-site.py` (it must end with `OK: safe to commit.`).
4. Look at the result if you can: `python3 -m http.server 4173` and open `http://localhost:4173/<page>.html`
   (locally pages need the `.html` ending; on the real site `/privacy` works without it).
5. Commit with a short English message (`Update DJ page text`), push the branch and **open a pull request** to `main`.
   Write the pull request description in plain Dutch: what changed, on which pages.
6. Tell Bacha (in Dutch): what changed, which page to look at, and **"Om dit live te zetten klik je op 'Merge pull
   request'."** If a preview link appears on the pull request, give it to him. If there is none, say so.
7. Bacha publishes by merging. You never publish yourself.

If something goes wrong, do **not** try to fix hosting or deployment. Offer to undo your change
(`git revert` on your branch) and tell Bacha to ask Tom.

## 5. Dutch and English: always both

Every visible text exists twice, side by side. The page shows only the language the visitor chose:

```html
<span data-l="nl">Wat we doen</span><span data-l="en">What we do</span>
```

- Change **both** versions, and keep them the same in meaning. If Bacha gives only Dutch, write the English yourself
  (natural, not word-for-word) and tell him you did, or ask for the English.
- When you add a paragraph or list, add a Dutch **and** an English copy (`<p data-l="nl">` / `<p data-l="en">`,
  `<ul data-l="nl">` / `<ul data-l="en">`). The check fails if the counts differ.
- Write `&amp;` for an ampersand in HTML, and keep curly quotes/apostrophes consistent with the surrounding text.
- Dutch uses the friendly *je/jij* form, as on the rest of the site. Spell the name **Make It Live** (three words,
  capitals) in running text.
- The tagline is **not translated**: it stays "You bring the people. We Make It Live." in both languages.

## 6. Where things live

| What | Where |
| --- | --- |
| Page texts | the `.html` files in the root; `partials/drafts.html` (hidden preview blocks) |
| Open positions | `join.html`: one `<details class="role reveal">` block per role |
| Photos | `assets/photos/<page-or-general>/` |
| Videos (short loops only) | `assets/video/<page>/`; the **home hero** is `assets/video/hero.mp4` (+ `hero.webm`), picked up by itself |
| Client logos | `assets/references/` |
| Originals / raw files | `media-inbox/` (local only, **never committed**) |

## 7. Recipes

**Change a text.** Search for it (`grep -rn "part of the text" *.html`), then edit both language spans (section 5).

**Add or edit an open position** (`join.html`). Copy an existing `<details class="role reveal">…</details>` block,
change the role name, the intro `<p>` and the `<ul>` lists in both languages, and in the "Apply" link change only the
role name in the `subject=` part (spaces are `%20`, the dash is `%E2%80%94`). Roles have no numbers.

**Put a photo in a placeholder.** The dashed boxes on the service pages are placeholders
(`<div class="slot …">…</div>`). Replace the whole box with:

```html
<figure class="slot-media ar-4x5"><img src="/assets/photos/dj/anna-wedding.webp" alt="DJ Anna at a wedding in Ghent" loading="lazy"></figure>
```

Keep the shape class of the box you replace (`ar-16x9`, `ar-4x5`, `ar-1x1` or `ar-21x9`). **Every image needs
alt text** that describes it in one short English sentence (write `alt=""` only for pure decoration). For a short
silent loop use
`<video class="slot-media ar-16x9" src="/assets/video/dj/hero-loop.mp4" muted loop playsinline autoplay></video>`.

**Add a client logo.** Only a confirmed reference with permission (section 3). Put an SVG or transparent PNG in
`assets/references/` named after the client. Where it is shown is a design choice: ask Tom.

**Brand kit texts.** Editable in `brand-kit.html`. The logo files and the `.zip` are generated: do not touch them.

## 8. Style rules (keep the site consistent)

- Light mode is the default; there is a dark mode. Do not add colours, fonts, emoji, animations or icons.
- Titles are plain text, **no numbering ("01", "02") and no italics**. One emphasised word in a title goes in
  `<em>…</em>` (it only changes colour).
- Missing content is shown as **`Setting the stage`**, not as lorem ipsum or empty boxes.
- Use the existing look (classes like `statement`, `lede`, `chips`, `slot-media`). If you need a new layout or
  something looks off, ask Tom instead of editing CSS.

## 9. Photos and video rules

- **Optimised files only.** Photos: WebP (or JPG), longest side at most 2000 px, normally 100-400 KB. Videos: short
  silent loops, at most about 10 MB. Anything over 25 MB cannot be hosted at all.
- **Never commit originals or raw formats** (`.mov`, `.heic`, `.tif`, `.psd`, camera raw). If Bacha sends big or raw
  files, do not add them; say: "Stuur deze naar Tom, die maakt ze klaar voor de site."
  `scripts/optimize-photos.sh` (macOS only) turns originals from `media-inbox/photos/<folder>/` into web photos and
  strips location data. If you cannot run it, stop and ask Tom.
- **Long films (aftermovies) and DJ sets are not hosted on the site.** They need a YouTube/Vimeo/SoundCloud embed,
  which sets cookies, so that is an **Ask Tom first** item.
- Event photos show real people. Ask Bacha whether the guests/artists agreed to being shown, and never leave GPS or
  other metadata in a photo.

## 10. Ask Tom first: stop and explain, do not do it yourself

Say to Bacha in Dutch that this one is for Tom, and why. Do not try a workaround. This covers:

- **E-mail, the contact form, domain, DNS, Cloudflare, GitHub settings, passwords, API keys, secrets.** Never write a
  key, token or password into any file or message. The contact address `hello@makeitlive.agency` appears in several
  files and in the form code: changing it is a **configuration** change for Tom, not a text edit.
- Files `wrangler.jsonc`, `package.json`, `package-lock.json`, `worker/`, `scripts/`, `.github/`, `_headers`, `main.js`,
  `.gitignore`, `favicon.svg`,
  `assets/brand/`, `assets/og-light.jpg`, `AGENTS.md`. The check script refuses changes to these.
- **CSS and design** (`*.css`), new page layouts, new pages, removing or renaming pages, changing a URL.
- Making an **unlisted page public** (service pages, `/join`, `/brand-kit`), or adding links to them.
- **Privacy and legal wording** (`privacy.html`) beyond fixing a typo, and anything that adds tracking, cookies,
  analytics, embeds, chat widgets, newsletter forms or any third-party script. The site promises visitors it has none.
- Anything that needs a tool you do not have, or that you are not sure is safe. **When in doubt, ask.**

## 11. Checklist before every pull request

- [ ] `python3 scripts/check-site.py` ends with `OK: safe to commit.`
- [ ] Dutch **and** English both updated; nothing invented; no secrets
- [ ] Only the files needed for the request changed
- [ ] Bacha got a short Dutch summary and the "Merge pull request" instruction
