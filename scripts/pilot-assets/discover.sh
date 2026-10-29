#!/usr/bin/env bash
# Review-only asset discovery for the isolated Three.js pilots: reads the public pages of free character / animation
# packs, lists their downloadable files and licence lines, downloads each archive once and prints its file list and
# sha256 so a pinned manifest (scripts/pilot-assets/manifest.json) can be written from evidence. Nothing is committed.
#   bash scripts/pilot-assets/discover.sh <page-url>...
set -uo pipefail
work=$(mktemp -d)
for page in "$@"; do
  echo "## $page"
  html="$work/page.html"
  if ! curl -fsSL -A 'Mozilla/5.0 (pilot asset discovery)' -o "$html" "$page"; then echo "- page not readable"; continue; fi
  echo "### licence lines"
  grep -oiE '[^<>]{0,120}(CC0|CC-BY[^<>]{0,10}|public domain|licen[cs]e)[^<>]{0,120}' "$html" | sed 's/^/- /' | sort -u | head -15
  echo "### files"
  grep -oE 'href="[^"]+\.(zip|glb|gltf|fbx|7z)"' "$html" | sed -E 's/^href="//; s/"$//' | sort -u | while read -r url; do
    case "$url" in http*) ;; /*) url="$(echo "$page" | grep -oE '^https?://[^/]+')$url" ;; esac
    f="$work/$(basename "$url")"
    if curl -fsSL --max-filesize 300000000 -o "$f" "$url"; then
      echo "- $url ($(stat -c %s "$f") bytes, sha256 $(sha256sum "$f" | cut -c1-64))"
      case "$f" in *.zip) unzip -l "$f" | awk 'NR>3 {print "    " $4}' | grep -E '\.(glb|gltf|fbx|bin|png|txt|md)$|LICEN|icense' | head -80 ;; esac
    else echo "- $url (download failed)"; fi
  done
done
