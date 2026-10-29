#!/usr/bin/env bash
# Downloads every manifest asset, refuses any file whose sha256 differs from the pinned one, unpacks it into
# pilots/assets/vendor/<id>/ (not committed) and prints its file list. Repeatable: same URL + hash -> same files.
#   bash scripts/pilot-assets/fetch.sh [dest=pilots/assets/vendor]
set -euo pipefail
dest=${1:-pilots/assets/vendor}; man=scripts/pilot-assets/manifest.json
mkdir -p "$dest"
node -e 'for (const a of require("./'"$man"'").assets) console.log([a.id, a.url, a.sha256].join(" "))' | while read -r id url sha; do
  zip="$dest/$id.zip"
  [ -s "$zip" ] || curl -fsSL -o "$zip" "$url"
  got=$(sha256sum "$zip" | cut -c1-64)
  if [ "$got" != "$sha" ]; then echo "SHA256 MISMATCH for $id: $got (pinned $sha)"; exit 1; fi
  rm -rf "${dest:?}/$id"; mkdir -p "$dest/$id"; unzip -q "$zip" -d "$dest/$id"
  echo "## $id (sha256 ok)"; (cd "$dest/$id" && find . -type f | sort | sed 's/^/- /' | head -200)
done
