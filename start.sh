#!/usr/bin/env bash
set -e
if [ ! -d node_modules ]; then
  (cd apps/api && npm i)
  (cd apps/web && npm i)
fi

# Check if we're in production (deployment) or development
if [ "$REPL_DEPLOYMENT" = "1" ] || [ ! -d "apps/web/node_modules" ]; then
  # Production: Only run API server (which serves static files)
  cd apps/api && exec node src/index.js
else
  # Development: Run both servers
  (cd apps/api && node src/index.js) &
  (cd apps/web && npm run dev -- --host 0.0.0.0 --port 5000)
  wait
fi
