"""Generate Make It Live logo variants (SVG + PNG) into assets/brand/."""
import os, subprocess, shutil, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "brand")
os.makedirs(OUT, exist_ok=True)

INK = "#F2F1EE"
BLACK = "#050507"
BLUE = "#0074FF"

# viewBox is tight to the artwork: x 193→1418, y 221→546
VIEWBOX = "193 221 1225 325"

def logo(word, bar, title):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{VIEWBOX}" role="img" aria-label="{title}">
  <title>{title}</title>
  <defs><clipPath id="c"><rect x="180" y="221" width="800" height="79"/></clipPath></defs>
  <g clip-path="url(#c)" fill="none" stroke="{word}" stroke-width="8">
    <path d="M197.5 300V221M197.5 215L241 285L286 215M286 221V306"/>
    <path d="M357.7 306L402.5 212L446.8 306M370 280.5H435"/>
    <path d="M518.5 215V306M589 215L520 265.5M537.5 252.3L589 306"/>
    <path d="M650 215V306M646 225H710M646 260H706M646 296H710"/>
    <path d="M829 215V306"/>
    <path d="M892 225H961M926 215V306"/>
  </g>
  <rect x="1004" y="288" width="414" height="12" fill="{bar}"/>
  <g fill="{word}">
    <path d="M196 349H251V507H442V546H196Z"/>
    <rect x="546" y="349" width="55" height="197"/>
    <path d="M673 349H742L914 546H845Z"/>
    <path d="M1012 349H1075L937 514L902 475Z"/>
    <path d="M1140 349H1415V384H1195V427H1373V462H1195V506H1415V546H1140Z"/>
  </g>
</svg>
'''

variants = {
    "makeitlive-logo-on-dark":        (INK,   BLUE,  "Make It Live — for dark backgrounds"),
    "makeitlive-logo-on-light":       (BLACK, BLUE,  "Make It Live — for light backgrounds"),
    "makeitlive-logo-on-light-gold":  (BLACK, "#C9A24B", "Make It Live — for light backgrounds, champagne bar"),
    "makeitlive-logo-white":          ("#FFFFFF", "#FFFFFF", "Make It Live — white"),
    "makeitlive-logo-black":          ("#000000", "#000000", "Make It Live — black"),
}

for name, (w, b, t) in variants.items():
    svg = os.path.join(OUT, name + ".svg")
    with open(svg, "w") as f:
        f.write(logo(w, b, t))
    subprocess.run(["inkscape", svg, "--export-type=png", "--export-width=2400",
                    f"--export-filename={os.path.join(OUT, name + '.png')}"],
                   check=True, capture_output=True)

# Icon: the favicon, exported as SVG + 512 PNG
icon = os.path.join(OUT, "makeitlive-icon.svg")
shutil.copy(os.path.join(ROOT, "favicon.svg"), icon)
subprocess.run(["inkscape", icon, "--export-type=png", "--export-width=512",
                f"--export-filename={os.path.join(OUT, 'makeitlive-icon.png')}"],
               check=True, capture_output=True)

BRAND_TXT = """MAKE IT LIVE — BRAND KIT
========================
Belgian event agency for live entertainment: DJs, live artists, bands, performers, photo & video.
Tagline: You bring the people. We Make It Live.
Online version: https://makeitlive.agency/brand-kit   |   Questions or other formats: bookings@makeitlive.agency

LOGO FILES
  makeitlive-logo-on-dark      white + blue  — use on dark / black backgrounds (primary)
  makeitlive-logo-on-light     black + blue  — use on light backgrounds
  makeitlive-logo-on-light-gold black + champagne gold — warm version for light backgrounds (used on the website's light mode)
  makeitlive-logo-white        all white     — one-colour print, photos, video overlays
  makeitlive-logo-black        all black     — one-colour print, stamps, fax-era requirements
  makeitlive-icon              square icon   — avatars, favicons, social profile pictures
  SVG = scalable vector (use for print). PNG = 2400 px wide, transparent background.

COLOUR
  Live Blue   #0074FF   rgb(0, 116, 255)
  Night       #050507   rgb(5, 5, 7)
  Smoke       #F2F1EE   rgb(242, 241, 238)
  Violet      #5A3CFF   rgb(90, 60, 255)   (accent, light effects only)

  Light mode
  Linen       #F6F2EC   rgb(246, 242, 236) (background in light mode)
  Champagne   #C9A24B   rgb(201, 162, 75)  (gold for lines/ornaments only — too light for text, 2.2:1)
  Bronze      #7D5A1F   rgb(125, 90, 31)   (accent for small text and numbers on Linen, 5.6:1)
  Cocoa       #3B2A1E   rgb(59, 42, 30)    (deep brown for warm text or dark surfaces, 12.3:1 on Linen)
  Pastels     Blush #F1D9D1 · Sky #D3E2F8 · Lilac #E0DAF6 · Sage #DBE6D6 · Sand #EFE2C9
  In light mode buttons and accents use Bronze, lines and the logo bar use Champagne.
  Blue stays the accent in dark mode.

TYPE
  Archivo (expanded width, light to bold) — headlines, UI, labels   fonts.google.com/specimen/Archivo
  Emphasise one word in a headline with the accent colour (Bronze on light), not with italics.
  Instrument Serif Italic — sparingly, short supporting lines (quote, price note). Not in headlines.   fonts.google.com/specimen/Instrument+Serif

RULES OF THUMB
  Keep clear space around the logo equal to the height of the letters in "MAKE IT".
  Minimum width: 120 px on screen, 30 mm in print.
  Do not stretch, rotate, recolour, outline, add shadows, or place on busy backgrounds.
  Write the name as "Make It Live" (three words, capitalised) in running text.
"""
with open(os.path.join(OUT, "README.txt"), "w") as f:
    f.write(BRAND_TXT)

# Zip
zpath = os.path.join(OUT, "makeitlive-brand-kit.zip")
if os.path.exists(zpath):
    os.remove(zpath)
with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
    for fn in sorted(os.listdir(OUT)):
        if fn.endswith((".svg", ".png", ".txt")):
            z.write(os.path.join(OUT, fn), "makeitlive-brand-kit/" + fn)

for fn in sorted(os.listdir(OUT)):
    print(fn, os.path.getsize(os.path.join(OUT, fn)))
