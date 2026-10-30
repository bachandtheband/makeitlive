#!/usr/bin/env sh
# Collects only the public site files into ./dist (what the Worker serves).
# The HTML pages are split per language by scripts/build-site.mjs: / and /en/ (plus sitemap.xml, robots.txt).
# Keeps README, scripts, workflows and local media out of the published site.
# Cloudflare setting: build command `sh scripts/build-cloudflare.sh`.
set -eu
cd "$(dirname "$0")/.."

rm -rf dist
mkdir dist
cp ./*.css main.js favicon.svg _headers dist/
node scripts/build-site.mjs dist
cp -R assets partials dist/
find dist \( -name .gitkeep -o -name .DS_Store \) -delete
echo "dist/ ready: $(find dist -type f | wc -l | tr -d ' ') files"
