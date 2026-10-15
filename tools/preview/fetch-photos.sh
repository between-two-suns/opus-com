#!/bin/sh
# Fetch web-sized copies of the store's photos (Shopify Files, public CDN) for the local preview.
# They stay out of git (see .gitignore); re-run after new photos are added to Shopify.
cd "$(dirname "$0")/../.."
mkdir -p _source/photos
BASE="https://cdn.shopify.com/s/files/1/0842/8122/9570/files"
for f in \
  bts-daily-reset-cleanser-front.png \
  bts-daily-reset-cleanser-application.jpg \
  bts-daily-reset-cleanser-texture.jpg \
  bts-daily-reset-cleanser-angle.png \
  bts-daily-reset-cleanser-back.png \
  bts-daily-reset-cleanser-in-hand.jpg \
  bts-daily-reset-cleanser-routine.jpg \
  bts-clarity-serum-front.png \
  bts-clarity-serum-application.jpg \
  bts-clarity-serum-texture.jpg \
  bts-clarity-serum-angle.png \
  bts-clarity-serum-back.png \
  bts-clarity-serum-in-hand.jpg \
  bts-clarity-serum-routine.jpg \
  bts-daily-barrier-moisturizing-cream-front.png \
  bts-daily-barrier-moisturizing-cream-application.jpg \
  bts-daily-barrier-moisturizing-cream-texture.jpg \
  bts-daily-barrier-moisturizing-cream-angle.png \
  bts-daily-barrier-moisturizing-cream-back.png \
  bts-daily-barrier-moisturizing-cream-in-hand.jpg \
  bts-daily-barrier-moisturizing-cream-routine.jpg \
  bts-daily-defense-sunscreen-spf-50-front.png \
  bts-daily-defense-sunscreen-spf-50-application.jpg \
  bts-daily-defense-sunscreen-spf-50-texture.jpg \
  bts-daily-defense-sunscreen-spf-50-angle.png \
  bts-daily-defense-sunscreen-spf-50-back.png \
  bts-daily-defense-sunscreen-spf-50-routine.jpg \
  bts-the-full-ritual.jpg \
  bts-the-night-ritual.jpg \
  bts-the-core-duo.jpg \
  bts-climate-heat-wide.jpg \
  bts-climate-heat-tall.jpg \
  bts-climate-city-wide.jpg \
  bts-climate-city-tall.jpg \
  bts-climate-ac-wide.jpg \
  bts-climate-ac-tall.jpg \
  bts-climate-humidity-wide.jpg \
  bts-climate-humidity-tall.jpg \
  bts-climate-sun-wide.jpg \
  bts-climate-sun-tall.jpg \
  bts-portrait-window-wide.jpg \
  bts-portrait-window-tall.jpg \
  bts-portrait-terrace-wide.jpg \
  bts-lineup-sky.jpg \
; do
  [ -s "_source/photos/$f" ] || curl -sSf -o "_source/photos/$f" "$BASE/$f?width=1400" || echo "missing $f"
done
echo "photos: $(ls _source/photos | wc -l)"
