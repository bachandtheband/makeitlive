#!/usr/bin/env python3
"""Safety check for content changes. Run before every commit:  python3 scripts/check-site.py

Checks (python3 standard library only):
  1. every public page has as many Dutch (data-l="nl") as English (data-l="en") pieces
  2. HTML tags are properly opened and closed
  3. local links, images, scripts and stylesheets point to files that exist
  4. images have alt text; photos/videos are not too heavy for the website
  5. no third-party scripts, no iframes without a privacy review, no lorem ipsum
  6. nothing was changed in files that only Tom may change (compared to origin/main)

Exit code 0 = fine, 1 = something must be fixed first. Warnings never fail the check.
"""
import fnmatch, os, re, subprocess, sys
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

PAGES = [f for f in sorted(os.listdir('.')) if f.endswith('.html')] + ['partials/drafts.html']
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}
ALLOWED_MISSING = {'/assets/video/hero.mp4', '/assets/video/hero.webm'}  # optional hero video, added later
MAX_PHOTO_KB, MAX_VIDEO_MB, MAX_FILE_MB = 600, 10, 25

# Only Tom changes these (hard stop). Matching is on the path relative to the project root.
PROTECTED = ['wrangler.jsonc', 'worker/*', 'scripts/*', '.github/*', '_headers', '.gitignore', 'main.js',
             'assets/brand/*', 'assets/og-light.jpg', 'AGENTS.md', 'favicon.svg']
DESIGN = ['*.css']  # visual design: allowed only when explicitly asked, flagged as a warning

errors, warnings = [], []
err = lambda m: errors.append(m)
warn = lambda m: warnings.append(m)


class Page(HTMLParser):
    def __init__(self, name):
        super().__init__(convert_charrefs=True)
        self.name, self.stack, self.refs, self.nl, self.en = name, [], [], 0, 0
        self.imgs, self.iframes, self.ext_scripts = [], [], []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('data-l') == 'nl': self.nl += 1
        if a.get('data-l') == 'en': self.en += 1
        for key in ('href', 'src'):
            if a.get(key): self.refs.append((tag, a[key]))
        if tag == 'img': self.imgs.append(a)
        if tag == 'iframe': self.iframes.append(a.get('src', ''))
        if tag == 'script' and a.get('src', '').startswith(('http://', 'https://', '//')): self.ext_scripts.append(a['src'])
        if tag not in VOID: self.stack.append((tag, self.getpos()[0]))

    def handle_startendtag(self, tag, attrs):  # <path ... />
        a = dict(attrs)
        for key in ('href', 'src'):
            if a.get(key): self.refs.append((tag, a[key]))
        if tag == 'img': self.imgs.append(a)

    def handle_endtag(self, tag):
        if tag in VOID: return
        if self.stack and self.stack[-1][0] == tag:
            self.stack.pop()
        else:
            err(f'{self.name}:{self.getpos()[0]}  closing </{tag}> does not match an open tag'
                + (f' (open: <{self.stack[-1][0]}> from line {self.stack[-1][1]})' if self.stack else ''))
            if any(t == tag for t, _ in self.stack):
                while self.stack and self.stack[-1][0] != tag: self.stack.pop()
                self.stack.pop()


def exists(url):
    path = url.split('#')[0].split('?')[0]
    if path in ('', '/'): return True
    p = path.lstrip('/')
    return any(os.path.isfile(c) for c in (p, p + '.html', os.path.join(p, 'index.html')))


for name in PAGES:
    if not os.path.isfile(name): continue
    src = open(name, encoding='utf-8').read()
    pg = Page(name)
    pg.feed(src)
    pg.close()
    for tag, line in pg.stack:
        err(f'{name}:{line}  <{tag}> is never closed')
    if pg.nl != pg.en:
        err(f'{name}  has {pg.nl} Dutch and {pg.en} English pieces: every text needs both languages (data-l="nl" and data-l="en")')
    for tag, url in pg.refs:
        if url.startswith(('http://', 'https://', 'mailto:', 'tel:', 'data:', '#', '//')): continue
        if url.startswith('/api/'): continue
        if url.startswith('/') and not exists(url) and url not in ALLOWED_MISSING:
            err(f'{name}  <{tag}> points to {url}, but that file does not exist')
        elif not url.startswith('/') and not exists('/' + url):
            warn(f'{name}  relative link "{url}": use a path starting with / (like /assets/photos/dj/name.webp)')
    for img in pg.imgs:
        if 'alt' not in img: err(f'{name}  image {img.get("src", "?")} has no alt text (use alt="" for purely decorative images)')
    for s in pg.iframes:
        warn(f'{name}  contains an iframe ({s[:60]}): embeds can set cookies and need a privacy review by Tom first')
    for s in pg.ext_scripts:
        err(f'{name}  loads an external script ({s[:60]}): not allowed without Tom (privacy: the site promises no tracking)')
    if re.search(r'lorem ipsum', src, re.I): err(f'{name}  still contains "lorem ipsum" filler text')
    if name != 'privacy.html' and re.search(r'class="todo"', src): warn(f'{name}  has an unfinished (yellow) TODO marker')

# file sizes
for base, _, files in os.walk('assets'):
    for f in files:
        p = os.path.join(base, f)
        mb = os.path.getsize(p) / 1048576
        ext = f.lower().rsplit('.', 1)[-1]
        if mb > MAX_FILE_MB: err(f'{p}  is {mb:.0f} MB: files over {MAX_FILE_MB} MB cannot be hosted. Use YouTube/Vimeo for long films.')
        elif ext in ('mp4', 'webm', 'mov') and mb > MAX_VIDEO_MB: warn(f'{p}  is {mb:.1f} MB: keep self-hosted clips under {MAX_VIDEO_MB} MB (see README, ffmpeg commands)')
        elif ext in ('jpg', 'jpeg', 'png', 'webp', 'heic') and not p.startswith('assets/brand') and mb * 1024 > MAX_PHOTO_KB:
            warn(f'{p}  is {mb * 1024:.0f} KB: photos should be web-optimised (scripts/optimize-photos.sh, usually 100-400 KB)')
        if ext in ('mov', 'heic', 'tif', 'tiff', 'raw', 'cr2', 'nef', 'arw', 'psd', 'ai'):
            err(f'{p}  is an original/raw format and does not belong in the site. Put originals in media-inbox/ (not committed).')

# protected files changed? (compare with origin/main, plus uncommitted work)
def changed_files():
    out = set()
    try:
        base = subprocess.run(['git', 'rev-parse', '--verify', '-q', 'origin/main'], capture_output=True, text=True).stdout.strip()
        if base:
            out |= set(subprocess.run(['git', 'diff', '--name-only', f'{base}...HEAD'], capture_output=True, text=True).stdout.split())
        out |= {l[3:].strip().split(' -> ')[-1] for l in subprocess.run(['git', 'status', '--porcelain'], capture_output=True, text=True).stdout.splitlines()}
    except Exception:
        pass
    return {c for c in out if c}

for path in sorted(changed_files()):
    if any(fnmatch.fnmatch(path, pat) for pat in PROTECTED):
        err(f'{path}  was changed, but only Tom may change this file. Undo that change (git checkout origin/main -- {path}) and ask Tom.')
    elif any(fnmatch.fnmatch(path, pat) for pat in DESIGN):
        warn(f'{path}  (design/CSS) was changed: only do this when Bacha explicitly asked for a visual change.')

for w in warnings: print('WARNING', w)
for e in errors: print('ERROR  ', e)
print(f'\n{len(errors)} error(s), {len(warnings)} warning(s)')
print('OK: safe to commit.' if not errors else 'NOT OK: fix the errors above first.')
sys.exit(1 if errors else 0)
