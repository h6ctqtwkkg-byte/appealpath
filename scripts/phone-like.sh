#!/usr/bin/env bash
# Makes "phone-like" test images from the 12 letters: tilted, a little blurred, shadowed, on a dark table, and heavily
# compressed, so accuracy can be measured before real phone photos exist. macOS only (Chrome + sips).
#   bash scripts/phone-like.sh            → test-letters/phone-like/L01.jpg … L12.jpg, L02-blurry.jpg, L08-angled.jpg
set -euo pipefail
cd "$(dirname "$0")/.."
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
OUT=test-letters/phone-like
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$OUT"

render() { # name, page number, tilt X (deg), turn Z (deg), blur (px), shade opacity
  local name=$1 n=$2 rx=$3 rz=$4 blur=$5 shade=$6
  sed -e "s|</style>|body{margin:0;background:#4a463f;width:900px;height:1200px;overflow:hidden;display:flex;align-items:center;justify-content:center}.noprint{display:none}section.page{display:none}section.page:nth-of-type($n){display:block;margin:0;box-shadow:0 12px 30px rgba(0,0,0,.55)}.stage{transform:perspective(1400px) rotateX(${rx}deg) rotateZ(${rz}deg) scale(.92);filter:blur(${blur}px) contrast(.9) brightness(.95) sepia(.08)}.shade{position:fixed;inset:0;z-index:5;background:linear-gradient(115deg,rgba(0,0,0,0) 40%,rgba(0,0,0,${shade}) 78%)}</style>|" \
      -e 's#<body>#<body><div class="shade"></div><div class="stage">#' -e 's#</body>#</div></body>#' \
      test-letters/letters.html > "$TMP/$name.html"
  "$CHROME" --headless=new --disable-gpu --user-data-dir="$TMP/profile" --hide-scrollbars --force-device-scale-factor=1.25 \
    --window-size=900,1200 --screenshot="$TMP/$name.png" "file://$TMP/$name.html" 2>/dev/null
  sips -s format jpeg -s formatOptions 55 "$TMP/$name.png" --out "$OUT/$name.jpg" >/dev/null
}

for n in $(seq 1 12); do
  id=$(printf "L%02d" "$n")
  sign=$(( n % 2 == 0 ? 1 : -1 ))
  render "$id" "$n" $(( 5 + n % 4 )) "$(( sign * (1 + n % 3) )).5" "0.$(( 5 + n % 4 ))" 0.22
done
render L02-blurry 2 7 -2 1.8 0.2
render L08-angled 8 18 -7 0.7 0.45
ls "$OUT"
