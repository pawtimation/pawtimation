#!/usr/bin/env bash
set -e
if [ ! -d node_modules ]; then
  (cd apps/api && npm i)
  (cd apps/web && npm i)
fi
(cd apps/api && node src/index.js) &
(cd apps/web && npm run dev -- --host 0.0.0.0 --port 5000)
wait
