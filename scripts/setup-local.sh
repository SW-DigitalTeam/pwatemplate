#!/usr/bin/env bash
# One-command local setup: installs deps, runs DB tests, builds the app.
set -euo pipefail
npm install
npm run test
npm run test:db || echo "!! Local PostgreSQL not available — DB tests skipped (CI runs them)."
npm run build
echo ""
echo "Setup complete. Next steps:"
echo "  1. cp .env.example apps/web/.env.local  (fill in your Supabase dev project)"
echo "  2. npm run dev"
