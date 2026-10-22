#!/usr/bin/env bash
# Turns originals from media-inbox/photos/<folder>/ into web-ready photos in assets/photos/<folder>/
#   - longest side max 2000 px (smaller photos are never enlarged)
#   - WebP, quality 80, with ALL metadata (EXIF, GPS location, camera info) stripped
#   - lowercase file names; spaces/underscores become hyphens
# Needs macOS `sips` (built in) and `cwebp`:  brew install webp
set -euo pipefail
cd "$(dirname "$0")/.."

SRC=media-inbox/photos
DST=assets/photos
MAX=2000
shopt -s nullglob nocaseglob
n=0

command -v sips  >/dev/null || { echo "This script needs macOS 'sips'."; exit 1; }
command -v cwebp >/dev/null || { echo "Please install cwebp first:  brew install webp"; exit 1; }
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT

for dir in "$SRC"/*/; do
  cat="$(basename "$dir")"
  mkdir -p "$DST/$cat"
  for f in "$dir"*.{jpg,jpeg,png,heic,tif,tiff}; do
    base="$(basename "${f%.*}" | tr '[:upper:] _' '[:lower:]--')"
    out="$DST/$cat/$base.webp"
    w="$(sips -g pixelWidth  "$f" | awk '/pixelWidth/  {print $2}')"
    h="$(sips -g pixelHeight "$f" | awk '/pixelHeight/ {print $2}')"
    if [ "$w" -gt "$MAX" ] || [ "$h" -gt "$MAX" ]; then
      sips -Z "$MAX" -s format png "$f" --out "$tmp/p.png" >/dev/null
    else
      sips -s format png "$f" --out "$tmp/p.png" >/dev/null
    fi
    cwebp -quiet -q 80 -metadata none "$tmp/p.png" -o "$out"
    printf '%-58s → %s  (%s KB)\n' "$f" "$out" "$(( $(stat -f%z "$out") / 1024 ))"
    n=$((n+1))
  done
done
echo "Done: $n photo(s)."
[ "$n" -gt 0 ] || echo "Nothing found. Put photos in media-inbox/photos/<folder>/ first."
