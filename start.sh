#!/usr/bin/env bash
set -e

# Install dependencies if needed
if [ ! -d "apps/api/node_modules" ]; then
  (cd apps/api && npm i)
fi
if [ ! -d "apps/web/node_modules" ]; then
  (cd apps/web && npm i)
fi

# Check if we're in production (deployment)
if [ "$REPL_DEPLOYMENT" = "1" ]; then
  # Production: Only API server on port 5000 (serves static files + API)
  export PORT=5000
  cd apps/api && exec node src/index.js
else
  # Development: Run both servers on different ports
  export PORT=8787
  (cd apps/api && node src/index.js) &
  API_PID=$!
  (cd apps/web && npm run dev -- --host 0.0.0.0 --port 5000)
  wait $API_PID
fi
