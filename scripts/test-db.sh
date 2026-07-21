#!/usr/bin/env bash
# Creates a scratch database, applies the auth shim (local only), runs every
# migration in order, loads synthetic seed data, then runs the RLS test suite.
set -euo pipefail
DB="${1:-swpwa_test}"
dropdb --if-exists "$DB" >/dev/null 2>&1 || true
createdb "$DB"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -c "create schema test;"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -c "create extension pgcrypto;"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f supabase/tests/local_auth_shim_pre.sql
for f in supabase/migrations/*.sql; do
  echo "== applying $f"
  psql -q -v ON_ERROR_STOP=1 -d "$DB" -f "$f"
done
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f supabase/tests/local_auth_shim.sql
echo "== seeding synthetic data"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f supabase/seed/seed_synthetic.sql
echo "== running RLS tests"
psql -v ON_ERROR_STOP=1 -d "$DB" -f supabase/tests/rls_test.sql
