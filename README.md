# Make It Live

Landing page for Make It Live — Belgian event agency. Static HTML/CSS/JS, no build step, deployed on Vercel.

- `index.html` — all content, in both NL and EN (`data-l="nl"` / `data-l="en"`)
- `styles.css` — styling
- `main.js` — language switch, scroll reveals, copy-email

## Working with Codex (Bacha)

Bacha makes content changes through ChatGPT/Codex. The rules Codex follows are in [`AGENTS.md`](AGENTS.md) (read
automatically from the repo root) and Bacha's plain-Dutch cheat sheet is [`BACHA.md`](BACHA.md). In short: content
only, always Dutch **and** English, nothing invented, changes go through a pull request that Bacha merges; mail, DNS,
Cloudflare/GitHub settings, design and anything touching privacy are for Tom.

`python3 scripts/check-site.py` is the safety net (matching NL/EN texts, closed tags, existing links/images, alt
text, heavy or raw media, no third-party scripts, and **no changes to Tom-only files** compared with `origin/main`).
Tom's own changes to those files will show up there as errors: that is expected, the check is for Bacha's branches.

**Previews:** every branch/pull request gets its own preview of the full site at
`https://<branch-with-dashes>-makeitlive.habrakenteun.workers.dev` (Cloudflare → Workers & Pages → makeitlive →
Settings → Builds: "Builds for Preview branches" on; preview command `npx wrangler preview`). This needs the (empty)
`"previews": {}` block in `wrangler.jsonc`: without it the preview build fails with "missing a `previews` block".
Previews are public-by-link and carry `X-Robots-Tag: noindex`.

## Editing content

Every translatable piece of text exists twice, side by side:

```html
<span data-l="nl">Wat we doen</span><span data-l="en">What we do</span>
```

Change both. The inactive language is hidden with CSS based on `<html lang>`.

Anything not ready yet says **Setting the stage**.

## Run locally

```bash
python3 -m http.server 4173        # quick look at the pages (no /api, no clean URLs)
sh scripts/build-cloudflare.sh && npx wrangler dev   # the real thing: clean URLs, headers, 404 page, contact API
```

## Deploy (Cloudflare Workers + static assets)

The site is static files plus one small function, hosted as a **Cloudflare Worker** named `makeitlive` (config in
`wrangler.jsonc`). `scripts/build-cloudflare.sh` copies only the public files into `dist/`, which is what gets served
(README, scripts, workflows and the Worker code stay out). Requests under `/api/*` run `worker/index.js`.

**Cloudflare settings** (Workers & Pages → makeitlive → Settings → Builds):
production branch `main` · **build command** `sh scripts/build-cloudflare.sh` · **deploy command** `npx wrangler deploy`
· root directory `/`. Do not add `--assets` flags to the deploy command: the folder comes from `wrangler.jsonc`.

Every push to `main` goes live. Pushes to other branches get a preview version when "non-production branch builds"
are enabled in the same settings page.

An alternative to Cloudflare's own Git connection is `.github/workflows/cloudflare-deploy.yml` (GitHub Actions; needs
the secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`; inert without them). Use one route, never both.

**Domain** (Worker → Settings → Domains & Routes → Add → Custom domain): `www.makeitlive.agency` and
`makeitlive.agency`. If the domain still points at Vercel, first remove the old DNS records (`A 216.198.79.1` and the
`CNAME … vercel-dns…` on `www`) so Cloudflare can create its own, add a Redirect Rule
`makeitlive.agency/*` → `https://www.makeitlive.agency/$1` (301), and remove the domain from the Vercel project.

Unknown addresses return the real `404.html` with status 404 (`not_found_handling` in `wrangler.jsonc`).

## Theme

Light is **always** the default: the sun/moon button switches to dark for the current visit only, and every new
visit starts light (the OS dark-mode setting is ignored). Colours are tokens at the top of `styles.css`
(`:root` = light, `html[data-theme="dark"]` = dark). `/brand-kit` follows the same theme.

## Hero video

Drop footage in `assets/video/hero.mp4` (and ideally `hero.webm`) and it fades in behind the hero by itself —
text, logo and nav switch to white automatically. No file → the pastel (light) / club-beam (dark) background stays.

- Landscape 16:9, 1920×1080, 10–20 s seamless loop, no audio
- Keep it under ~8 MB (H.264 `.mp4`, ~2–3 Mbit/s; the `.webm` can be smaller)
- Skipped automatically for visitors with reduced-motion or data-saver on
- Videos under `/assets/video/*` are served through `worker/index.js` with byte-range support (206). Static assets only
  answer with the full file (200), and Safari/iOS then refuse to play the video. Keep videos in that folder.

## Photos & video

Where things go (the folders already exist):

```
assets/
  video/          hero.mp4 + hero.webm (homepage background, picked up automatically)
    dj/  live-musicians/  live-bands/  performers/  photo-video/     short clips for those pages
  photos/
    general/      homepage + "who for" imagery
    dj/  live-musicians/  live-bands/  performers/  photo-video/     one folder per service page
    team/         portraits of the team
  references/     client / partner logos (SVG, or PNG with transparent background)
media-inbox/      LOCAL ONLY, ignored by git: drop your untouched originals here
  photos/<same folders as above>/     video/
```

**Workflow for photos**

1. Put the originals in `media-inbox/photos/<folder>/` (e.g. `media-inbox/photos/dj/`).
2. Run `./scripts/optimize-photos.sh`. It writes web-ready WebP files into `assets/photos/<folder>/`: max 2000 px,
   quality 80, **location/EXIF data stripped** (important for guest photos). Needs `brew install webp` once.
3. Tell Claude which file goes in which slot (or replace the dashed `.slot` block yourself with
   `<img src="/assets/photos/dj/dj-anna.webp" alt="DJ Anna at a wedding" loading="lazy" width="2000" height="1333">`).

> Dropping files in the folders does **not** show them by itself. Only `assets/video/hero.mp4`/`hero.webm` is picked
> up automatically; everything else has to be placed in a page.

**Videos**

Install once: `brew install ffmpeg`. Then, from the project folder:

```bash
# homepage hero: 1080p, no audio, ~8 MB max  → assets/video/hero.mp4 (+ hero.webm)
ffmpeg -i media-inbox/video/hero-original.mov -an -vf "scale=1920:-2,fps=30" \
  -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -movflags +faststart assets/video/hero.mp4
ffmpeg -i media-inbox/video/hero-original.mov -an -vf "scale=1920:-2,fps=30" \
  -c:v libvpx-vp9 -crf 34 -b:v 0 assets/video/hero.webm

# short page clips (5-15 s loops), 720p  → assets/video/<page>/clip-name.mp4
ffmpeg -i media-inbox/video/clip.mov -an -vf "scale=1280:-2,fps=30" \
  -c:v libx264 -crf 28 -preset slow -pix_fmt yuv420p -movflags +faststart assets/video/dj/hero-loop.mp4
```

- **Never commit originals.** GitHub rejects files over 100 MB and the repo slows down for everyone. Originals stay
  in `media-inbox/` (git-ignored) or on a drive.
- **Full aftermovies / long films (more than ~15 s with sound): upload to YouTube or Vimeo and embed them.** Hosting
  them on the site is slow and expensive. Same for full DJ sets: use SoundCloud/Mixcloud embeds.
- Self-hosted clips are for short, silent loops (about 8 MB or less each).

**Suggested names per page slot** (lowercase, hyphens, no spaces)

| Page | Slot | File |
| --- | --- | --- |
| Home | Hero background | `assets/video/hero.mp4` + `hero.webm` |
| `/dj` | Hero loop | `assets/video/dj/hero-loop.mp4` |
| `/dj` | Roster portraits | `assets/photos/dj/<dj-name>.webp` (portrait 4:5) |
| `/live-musicians` | Hero photo | `assets/photos/live-musicians/hero.webp` (portrait 4:5) |
| `/live-musicians` | Format photos / moments | `assets/photos/live-musicians/solo.webp`, `duo.webp`, … |
| `/live-bands` | Per band | `assets/photos/live-bands/<band-name>.webp` + `assets/video/live-bands/<band-name>.mp4` |
| `/performers` | Act loops | `assets/video/performers/<act-name>.mp4` (5-10 s) |
| `/photo-video` | Portfolio | `assets/photos/photo-video/portfolio-01.webp`, `portfolio-02.webp`, … |
| Anywhere | Client logos | `assets/references/<client>.svg` |
| Brand kit | Logos | generated, see *Brand kit* below |

## Contact form

The form posts to `/api/contact`, handled by `worker/contact.js` (run by `worker/index.js`), which emails `hello@makeitlive.agency`
through [Resend](https://resend.com). Until it is configured the function answers 503 and the page falls back to a
prefilled `mailto:` link, so no enquiry is lost. To switch it on, add in Cloudflare → Workers & Pages → makeitlive →
Settings → Variables and Secrets:

| Variable | Required | Value |
| --- | --- | --- |
| `RESEND_API_KEY` | yes | API key from Resend, added as a **secret** (and verify `makeitlive.agency` there) |
| `CONTACT_TO` | no | inbox that receives enquiries (default `hello@makeitlive.agency`) |
| `CONTACT_FROM` | no | verified sender (default `Make It Live <noreply@makeitlive.agency>`) |

Free plan limit: 100,000 Worker requests per day. Plain page views are served as static assets and do not count.

## Draft sections (references + testimonials)

The rolling reference banner and testimonials exist but are **not on the public page**: they live in
`partials/drafts.html` and are only loaded with `?preview` (e.g. `https://www.makeitlive.agency/?preview`).
The quotes are sample copy and the reference names are unconfirmed. When you have real, approved ones, paste the
two blocks into `index.html` between *WHO FOR* and *CONTACT* and delete the partial.

## Unlisted pages

`/join` (`join.html`) holds the open positions. Nothing on the site links to it: it is not in the navigation,
footer or sitemap, and it is `noindex, nofollow` (meta tag + `X-Robots-Tag` header in `_headers`) so search
engines skip it. Share the URL directly with candidates. `/brand-kit` and `/partials/*` are treated the same way.
Unlisted is not private: anyone with the link can open it.

## Service pages (wireframes)

Each of the five service cards has an unlisted placeholder page built from dashed *content slots*:
`/dj`, `/live-musicians`, `/live-bands`, `/performers`, `/photo-video` (`dj.html`, … , `pages.css`).
They are `noindex` and not linked from the public site. Opening `/?preview` adds a link layer to the five cards
so the team can click through.

- Every slot says what content goes there and which question to answer; the box at the top of each page lists
  *what matters on this page*. The yellow bar toggles **Team notes** ⇄ **Visitor view** (the latter shows only a
  calm "Setting the stage").
- Fill a slot by replacing the whole `<div class="slot …">…</div>` with the real image/video/text.
- To publish a page: replace its slots, remove the yellow `.pg-bar`, then (1) delete `.core-link` generation in
  `main.js` (preview block) and instead wrap the card in `<a href="/dj">`, and (2) drop its path from
  `_headers`.
- The contact CTA on each page opens the form with that service pre-selected (`/?service=DJ#contact`).

## Brand kit

`/brand-kit` is a partner-facing page (`brand-kit.html`, `brand-kit.css`). The downloadable logo files in
`assets/brand/` — including the `.zip` — are generated, so don't edit them by hand. To change the logo
artwork, edit the paths in `scripts/build_brand.py` (and the hero SVG in `index.html`) and rebuild:

```bash
python3 scripts/build_brand.py   # needs Inkscape (brew install inkscape)
```
