#!/usr/bin/env bash
# Fare City build: stitch src parts into one self-contained index.html
set -e
cd "$(dirname "$0")"
{
  cat parts/00-head.html
  cat parts/01-body.html
  echo '<script>'
  cat parts/02-cities.js parts/02b-street.js parts/03-i18n.js parts/04-core.js parts/04b-net.js parts/05-audio.js parts/06-render.js parts/07-game.js parts/08-ui.js
  echo '</script></body></html>'
} > index.html
echo "built index.html ($(wc -c < index.html | tr -d ' ') bytes, $(wc -l < index.html | tr -d ' ') lines)"
