#!/usr/bin/env bash
# Renders each page of test-letters/letters.html as a clean 1224×1584 JPEG (letter size at 144 dpi), the "clean digital
# images" that scripts/measure.mjs scores before real photos exist. macOS only (Chrome + sips).
#   bash scripts/render-letters.sh        → test-letters/renders/L01.jpg … L18.jpg
set -euo pipefail
cd "$(dirname "$0")/.."
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
OUT=test-letters/renders
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$OUT"
pages=$(grep -c '<section class="page' test-letters/letters.html)

for n in $(seq 1 "$pages"); do
  id=$(printf "L%02d" "$n")
  sed -e "s|</style>|body{margin:0;background:#fff}.noprint{display:none}section.page{display:none}section.page:nth-of-type($n){display:block;margin:0;box-shadow:none}</style>|" \
      test-letters/letters.html > "$TMP/$id.html"
  "$CHROME" --headless=new --disable-gpu --user-data-dir="$TMP/profile" --hide-scrollbars --force-device-scale-factor=1.5 \
    --window-size=816,1056 --screenshot="$TMP/$id.png" "file://$TMP/$id.html" 2>/dev/null
  sips -s format jpeg -s formatOptions 85 "$TMP/$id.png" --out "$OUT/$id.jpg" >/dev/null
done
ls "$OUT"
