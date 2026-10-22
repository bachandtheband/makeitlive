#!/usr/bin/env sh
# Collects only the public site files into ./dist (what Cloudflare Pages serves).
# Keeps README, scripts, workflows, functions/ and local media out of the published site.
# Cloudflare setting: build command `sh scripts/build-cloudflare.sh`, output directory `dist`.
set -eu
cd "$(dirname "$0")/.."

rm -rf dist
mkdir dist
cp ./*.html ./*.css main.js favicon.svg _headers dist/
cp -R assets partials dist/
find dist \( -name .gitkeep -o -name .DS_Store \) -delete
echo "dist/ ready: $(find dist -type f | wc -l | tr -d ' ') files"
