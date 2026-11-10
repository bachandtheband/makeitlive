# AGENTS.md: Make It Live website

You are helping **Bacha** or **Tom**, the two owners of Make It Live (a Belgian event agency), work on its website.
**They have exactly the same rights: either of them may ask for any change, and nothing needs approval before it goes
live.** There is no sensitive data on this site, and every change can be undone with `git revert`, so the rule is:
make the change, push it to `main`, check the live site, and revert if something went wrong. Do not ask for permission
for things that a revert can fix.

## 0. How to talk

- **Reply in Dutch**, in plain words, short. Bacha is not technical: no jargon for him (no "commit", "branch", "diff",
  "PR", "build" unless you explain it in one short phrase) and no code unless he asks. Tom is technical: he may get the
  details.
- If a request is unclear, ask **one** short question instead of guessing. Otherwise just do it.
- Never claim something is "live" until you have seen it on the live site (see section 4).

## 1. The site in 30 seconds

Static website for **www.makeitlive.agency**, hosted on a Cloudflare Worker; whatever is on `main` goes live by itself
within about 1-3 minutes. Tagline: **"You bring the people. We Make It Live."** (English in both languages). Core offer:
DJ's, live musicians, live bands, performers, photo & video & content; everything else is "Full event support" through
partners.

Every page exists in two languages on separate addresses: Dutch at `/` and `/privacy`, English at `/en/` and `/en/privacy`
(search engines want one language per address). You only edit the files in the root, which hold both languages side by
side; a build step splits them (`scripts/build-site.mjs`).

Pages: `index.html` (home), `privacy.html`, `join.html` (open positions), `brand-kit.html` (for partners), five service
pages (`dj.html`, `live-musicians.html`, `live-bands.html`, `performers.html`, `photo-video.html`), `404.html`.
`join` and the service pages are currently **unlisted** (not linked from the site, `noindex` in `_headers`): that is a
choice, not a rule. Making one public is allowed: link to it and remove its two lines (`/x` and `/en/x`) from `_headers`.

How the whole thing fits together (Worker, contact form, Resend, Turnstile, Notion, deploy, domain) is in `README.md`.

## 2. What you may change

**Everything in this repository**: texts, open positions, photos and video, design and CSS, layouts, new pages, renaming
or removing pages, the contact form and the Worker (`worker/`), build and deploy files (`wrangler.jsonc`, `scripts/`,
`.github/`, `_headers`, `main.js`), SEO and structured data, the privacy statement. Keep it small and do what was asked.

Things that live **outside the repository** (Cloudflare dashboard settings and secrets, DNS, Resend, Notion, Google
Workspace, GitHub settings) are changed by whoever has the logins, in those dashboards. A `git revert` does not undo
them: be careful, and say in plain words what you changed.

## 3. Never invent anything (the one content rule)

- **Never make up** clients, references, testimonials, reviews, quotes, names, team members, numbers, awards, prices,
  dates or claims. If the owner did not give it to you, it does not go on the site. Write `Setting the stage` instead, or
  ask.
- A **testimonial** needs a real quote, the person's name and role/company, and the owner's confirmation that they
  agreed. A **client logo or name** needs confirmation that it is a real reference and that Make It Live may show it.
  "Tomorrowland" and "DDMC" are **unconfirmed**: do not show them publicly until an owner confirms.
- `partials/drafts.html` holds sample reference/testimonial blocks that are only visible with `?preview`. To publish real
  ones, move the approved block into `index.html` (in both languages) with the real details.
- Do not copy text, photos or music from other websites.

## 4. How to work

1. Start from the latest `main`: `git pull --rebase origin main`.
2. Make the **smallest change** that does what was asked. Do not tidy up or refactor other things.
3. Run `python3 scripts/check-site.py` and fix every ERROR it reports (broken HTML, missing files, missing alt text,
   heavy or raw media, a failing build). Warnings are advice. **Do not push while there are errors.**
4. Look at the result if you can: `sh scripts/build-cloudflare.sh && python3 -m http.server -d dist 4173`, then open
   `http://localhost:4173/<page>.html` for Dutch and `http://localhost:4173/en/<page>.html` for English (locally pages
   need the `.html` ending; the home page is `/` and `/en/`). `npx wrangler dev` gives the real thing (clean URLs, 404s,
   the contact API).
5. Commit with a short English message, `git pull --rebase origin main` again and push with `git push origin HEAD:main`.
   **Push straight to `main`, no pull request and no approval needed.** **Never force-push and never rewrite
   history**: that is what keeps every change revertable. If the push is rejected, pull/rebase and try again; resolve a
   conflict yourself, keeping both sides' intent.
6. After about 2 minutes **check the live site** (`https://www.makeitlive.agency/<page>`) and only then say it is live. If you
   cannot open the site, say: "Kijk over 2 minuten op de site." Tell the owner in Dutch what changed and where to look.
7. **If the live site is broken or wrong, undo it at once**: `git revert <commit>`, run the check, push to `main`, say
   so. A failed build keeps the previous version online, so nothing is lost. Hosting or build problems you cannot fix
   quickly: revert your change and tell Tom.

**Pull requests merge themselves.** If your environment cannot push to `main` (Codex cloud tasks always open a pull
request), just open the pull request: `.github/workflows/auto-merge.yml` runs the site check on it and squash-merges it
within a minute, which puts it live. Nobody has to click anything. Do check the live site afterwards (step 6) and revert
if needed. The one exception is a **preview first**, when the owner explicitly asks for it ("laat me het eerst zien"):
use a branch named `preview/<short-description>` (or open the pull request as a draft, or give it the label `preview`);
that pull request is not merged automatically. Look at `https://<branch-name>-makeitlive.habrakenteun.workers.dev`
(slashes in the branch name become `-`; the preview is not indexed) and tell the owner to click "Merge pull request" when
happy. If the automatic merge fails, the workflow comments on the pull request with a link to the log: fix what the
check reports (or the merge conflict) and push again.

## 5. Dutch and English: always both

Every visible text exists twice, side by side. The build turns each page into a Dutch and an English page, so a visitor
only ever gets one language:

```html
<span data-l="nl">Wat we doen</span><span data-l="en">What we do</span>
```

- Change **both** versions, and keep them the same in meaning. If you only get Dutch, write the English yourself
  (natural, not word-for-word) and say so.
- When you add a paragraph or list, add a Dutch **and** an English copy (`<p data-l="nl">` / `<p data-l="en">`,
  `<ul data-l="nl">` / `<ul data-l="en">`). The check fails if the counts differ. `data-l` also works on `<title>`,
  `<meta>` and `<option>`.
- Write `&amp;` for an ampersand in HTML, and keep curly quotes/apostrophes consistent with the surrounding text.
- Dutch uses the friendly *je/jij* form. Spell the name **Make It Live** (three words, capitals) in running text.
- The tagline is **not translated**: it stays "You bring the people. We Make It Live." in both languages.
- A new page in the root is picked up by the build automatically. Add it to `INDEXED` in `scripts/build-site.mjs` if it
  should appear in `sitemap.xml`, and to `_headers` (both `/x` and `/en/x`) if it must stay out of search engines.

## 6. Where things live

| What | Where |
| --- | --- |
| Page texts | the `.html` files in the root; `partials/drafts.html` (hidden preview blocks) |
| Open positions | `join.html`: one `<details class="role reveal">` block per role |
| Photos | `assets/photos/<page-or-general>/` |
| Videos (short loops only) | `assets/video/<page>/`; the **home hero** is `assets/video/hero.mp4` (+ `hero.webm`), picked up by itself |
| Client logos | `assets/references/` |
| Design | `styles.css` (site), `pages.css` (service pages), `brand-kit.css` |
| Contact form | `index.html` (form), `main.js` (browser), `worker/contact.js` and `worker/notion.js` (server) |
| Originals / raw files | `media-inbox/` (local only, **never committed**) |

## 7. Recipes

**Change a text.** Search for it (`grep -rn "part of the text" *.html`), then edit both language spans (section 5).

**Add or edit an open position** (`join.html`). Copy an existing `<details class="role reveal">…</details>` block,
change the role name, the intro `<p>` and the `<ul>` lists in both languages, and in the "Apply" link change only the
role name in the `subject=` part (spaces are `%20`). Roles have no numbers.

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
`assets/references/` named after the client.

**Brand kit.** Texts are in `brand-kit.html`. The logo files and the `.zip` in `assets/brand/` are generated by
`scripts/build_brand.py`: change that script and rerun it instead of editing the files by hand.

## 8. Style rules (consistency, not permission)

- Light mode is the default; there is a dark mode. Colours are tokens at the top of `styles.css`. Design changes are
  fine when asked; keep the existing look (classes like `statement`, `lede`, `support-list`, `slot-media`) unless the
  request is a redesign.
- **No em dashes (—)** and no other chatbot habits: no "not just X, but Y", no lists of three adjectives, no
  "unforgettable", "seamless", "bring to life", "turn a moment into a memory". Write plain, concrete sentences, the way a
  person at the agency would say it. Use a comma, colon or full stop instead of a dash. The check warns about em dashes.
- Titles are plain text, **no numbering ("01", "02") and no italics**. One emphasised word in a title goes in
  `<em>…</em>` (it only changes colour).
- Missing content is shown as **`Setting the stage`**, not as lorem ipsum or empty boxes.

## 9. Photos, video and privacy

- **Optimised files only.** Photos: WebP (or JPG), longest side at most 2000 px, normally 100-400 KB. Videos: short
  silent loops, at most about 10 MB. Anything over 25 MB cannot be hosted at all.
- **Never commit originals or raw formats** (`.mov`, `.heic`, `.tif`, `.psd`, camera raw): git history is permanent, so a
  big file stays in the repo forever, even after a revert. Put originals in `media-inbox/` and run
  `scripts/optimize-photos.sh` (macOS) from `media-inbox/photos/<folder>/`: it makes web photos and strips location data.
  README has the `ffmpeg` commands for video.
- **Long films (aftermovies) and DJ sets** are better on YouTube/Vimeo/SoundCloud than self-hosted. Embeds are allowed;
  they set cookies, so use the privacy-friendly address (`youtube-nocookie.com`) where there is one and update
  `privacy.html` in the same change.
- **The privacy statement must stay true.** Anything that adds tracking, cookies, analytics, embeds, chat widgets,
  newsletter forms or another third-party service or script is allowed, but update `privacy.html` (Dutch and English) in
  the same change, and mention the new provider under "Met wie delen we gegevens?".
- Event photos show real people. Ask the owner whether the guests/artists agreed to being shown, and never leave GPS or
  other metadata in a photo.

## 10. Secrets (the one hard stop)

The repository is **public**. **Never write a key, token or password into any file, commit, message or log**, and never
ask the owner to paste one in chat. Secrets go into the Cloudflare dashboard as type **Secret**
(Workers & Pages → makeitlive → Settings → Variables and Secrets) by the person who has that login; the Worker reads
them from `env`. Plain dashboard variables are wiped by every deploy, so defaults belong in the code and real secrets in
Secrets. If a secret ever lands in the repo, tell Tom immediately: it must be rotated, because reverting does not
remove it from history.

## 11. Checklist before every push

- [ ] `python3 scripts/check-site.py` has no ERROR
- [ ] Dutch **and** English both updated; nothing invented; no secrets
- [ ] Only the files needed for the request changed
- [ ] After about 2 minutes: the live site shows it (if not: revert); the owner got a short Dutch summary
