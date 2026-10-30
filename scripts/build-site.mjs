#!/usr/bin/env node
// Builds the public HTML pages into <out> (default ./dist), one Dutch and one English version of each page.
//
// The source pages in the project root hold both languages side by side (data-l="nl" / data-l="en"), which keeps
// editing simple. Search engines want one language per URL though, so this script splits them:
//
//   index.html    ->  /          (Dutch)      and  /en/          (English)
//   privacy.html  ->  /privacy   (Dutch)      and  /en/privacy   (English)   ... same for every page
//
// It also adds <link rel="canonical">, hreflang alternates and og:url/og:locale, turns the NL/EN buttons into links
// to the same page in the other language, prefixes internal links on the English pages with /en, and writes
// sitemap.xml and robots.txt. Node only, no dependencies:   node scripts/build-site.mjs [outDir]
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, process.argv[2] || 'dist');
const SITE = 'https://www.makeitlive.agency';
const LANGS = ['nl', 'en'];
const LOCALE = { nl: 'nl_BE', en: 'en_GB' };

const pages = readdirSync(ROOT).filter((f) => f.endsWith('.html')).map((f) => f.slice(0, -5)).sort();
const slugs = new Set(pages.filter((p) => p !== 'index' && p !== '404'));
// Listed in sitemap.xml: the pages meant to be found in search engines (the rest is unlisted or noindex)
const INDEXED = ['index', 'privacy'];

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const ATTRS = '(?:[^<>"\']|"[^"]*"|\'[^\']*\')*';
const OPEN_RE = new RegExp(`<([a-zA-Z][\\w-]*)(${ATTRS}?)\\sdata-l="(nl|en)"(${ATTRS}?)(/?)>`, 'g');

// Path of a page in one language: '/', '/privacy', '/en/', '/en/privacy'
const urlFor = (slug, lang) => (lang === 'en' ? '/en' : '') + (slug === 'index' ? '/' : `/${slug}`);

// Keeps the elements marked for `lang`, drops the other ones. A <span data-l> without other attributes is unwrapped.
function localize(html, lang) {
  let out = '';
  let pos = 0;
  for (;;) {
    OPEN_RE.lastIndex = pos;
    const m = OPEN_RE.exec(html);
    if (!m) break;
    const [open, tag, before, l, after, selfClose] = m;
    const start = m.index;
    let end = start + open.length; // end of the whole element
    let inner = '';
    let closeLen = 0;
    if (!VOID.has(tag.toLowerCase()) && !selfClose) {
      const re = new RegExp(`<(/?)${tag}(?=[\\s>/])${ATTRS}>`, 'gi');
      re.lastIndex = end;
      let depth = 1;
      let c;
      while ((c = re.exec(html))) {
        if (c[1]) depth--; else if (!c[0].endsWith('/>')) depth++;
        if (depth === 0) break;
      }
      if (!c) throw new Error(`Unclosed <${tag} data-l="${l}"> near: ${html.slice(start, start + 80)}`);
      inner = html.slice(end, c.index);
      closeLen = c[0].length;
      end = c.index + closeLen;
    }
    out += html.slice(pos, start);
    if (l === lang) {
      const attrs = (before + after).trim();
      const body = localize(inner, lang);
      if (tag.toLowerCase() === 'span' && !attrs) out += body;
      else if (closeLen || VOID.has(tag.toLowerCase())) out += `<${tag}${attrs ? ' ' + attrs : ''}${selfClose}>${body}${closeLen ? `</${tag}>` : ''}`;
    }
    pos = end;
  }
  return out + html.slice(pos);
}

// Internal page links on the English pages get the /en prefix (files like /styles.css and /assets/... stay as they are)
function prefixLinks(html) {
  return html.replace(/\shref="(\/[^"]*)"/g, (all, href) => {
    const path = href.split(/[?#]/)[0];
    if (path === '/' || slugs.has(path.slice(1))) return ` href="/en${href}"`;
    return all;
  });
}

// <button data-set-lang="nl">NL</button>  ->  <a href="<same page in that language>" hreflang="nl" ...>NL</a>
function languageLinks(html, slug) {
  return html.replace(/<button type="button" data-set-lang="(nl|en)">([^<]*)<\/button>/g, (all, l, label) => {
    const href = slug === '404' ? urlFor('index', l) : urlFor(slug, l);
    return `<a href="${href}" hreflang="${l}" lang="${l}" data-set-lang="${l}">${label}</a>`;
  });
}

function headLinks(slug, lang) {
  const url = (l) => SITE + urlFor(slug, l);
  const lines = [
    `<link rel="canonical" href="${url(lang)}">`,
    `<link rel="alternate" hreflang="nl" href="${url('nl')}">`,
    `<link rel="alternate" hreflang="en" href="${url('en')}">`,
    `<link rel="alternate" hreflang="x-default" href="${url('nl')}">`
  ];
  const other = lang === 'nl' ? 'en' : 'nl';
  if (slug === 'index' || INDEXED.includes(slug)) {
    lines.push(
      `<meta property="og:url" content="${url(lang)}">`,
      `<meta property="og:locale" content="${LOCALE[lang]}">`,
      `<meta property="og:locale:alternate" content="${LOCALE[other]}">`
    );
  }
  return lines.map((l) => `  ${l}\n`).join('');
}

function build(slug, lang) {
  let html = readFileSync(join(ROOT, slug + '.html'), 'utf8');
  html = localize(html, lang);
  html = html.replace(/<html lang="[a-z]{2}"/, `<html lang="${lang}"`);
  if (lang === 'en') html = prefixLinks(html);
  html = languageLinks(html, slug); // after prefixLinks, which would add /en to the Dutch link
  if (slug !== '404') html = html.replace('</head>', headLinks(slug, lang) + '</head>');
  if (/data-l=/.test(html)) throw new Error(`${slug} (${lang}): data-l left over after splitting`);
  const file = join(OUT, lang === 'en' ? 'en' : '', slug + '.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

for (const slug of pages) for (const lang of LANGS) build(slug, lang);

const alt = (slug) => LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE}${urlFor(slug, l)}"/>`).join('\n');
const entries = INDEXED.flatMap((slug) => LANGS.map((l) => `  <url>\n    <loc>${SITE}${urlFor(slug, l)}</loc>\n${alt(slug)}\n  </url>`));
writeFileSync(join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('\n')}\n</urlset>\n`);
writeFileSync(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`${pages.length * LANGS.length} pages (${pages.length} x ${LANGS.join('/')}) + sitemap.xml + robots.txt -> ${OUT}`);
