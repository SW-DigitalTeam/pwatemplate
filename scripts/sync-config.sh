#!/usr/bin/env bash
# Syncs programme configs from TypeScript to the database.
# Usage: bash scripts/sync-config.sh [supabase-project-ref]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$SCRIPT_DIR")"

echo "Syncing programme configs to database..."
npx tsx "$ROOT/scripts/sync-config.ts"
echo "Done."
