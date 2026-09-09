#!/usr/bin/env bash
# Rebuilds exports/ghost-standalone: the cursor-following ghost on its own,
# bundled so it opens with no server and no build step.
set -euo pipefail
cd "$(dirname "$0")/.."
D=exports/ghost-standalone

# Only the demo bundle is generated; the sources in $D/src are the shareable
# copies and are edited there, so this rebuilds the bundle in place.
./node_modules/.bin/esbuild "$D/src/demo.tsx" \
  --bundle --minify --format=iife --target=es2020 --jsx=automatic \
  --define:process.env.NODE_ENV='"production"' \
  --outfile="$D/ghost.js"

( cd exports && rm -f plugabyte-ghost.zip && zip -rq plugabyte-ghost.zip ghost-standalone -x '*.DS_Store' )
echo "exports/plugabyte-ghost.zip"
