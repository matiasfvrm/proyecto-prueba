#!/usr/bin/env bash
# Applies the migration and seed to a throwaway PostgreSQL database and runs the
# RLS/workflow assertions. Usage: DATABASE_URL=postgres://... scripts/test-db.sh
set -euo pipefail
: "${DATABASE_URL:?Set DATABASE_URL to an empty scratch database}"
cd "$(dirname "$0")/.."
run() { psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q "$@"; }
run -c "drop schema if exists public cascade; create schema public; drop schema if exists auth cascade;"
run -f tests/db/auth-stub.sql
for f in supabase/migrations/*.sql; do run -f "$f"; done
run -f tests/db/grants.sql
run -f supabase/seed.sql
run -o /dev/null -f tests/db/workflow-test.sql
