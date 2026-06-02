#!/usr/bin/env bash
#
# Provision a fresh local Supabase database from the prod-schema baseline.
#
# Why this exists: `supabase db reset` cannot rebuild the database from the
# committed migration chain — several early migrations reference columns/tables
# added later, so a from-scratch replay fails (see
# docs/operations/db-baseline-and-provisioning.md). This script rebuilds the
# public schema from a captured prod-schema baseline + a reference/catalog seed,
# giving a clean, reproducible DB for local dev, E2E, CI, and DR drills.
#
# Prereqs: `npx supabase start` must be running (Docker).
# Usage:   bash scripts/provision-local-db.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DBC="${SUPABASE_DB_CONTAINER:-supabase_db_FormaOS}"
SCHEMA="$ROOT/supabase/baseline/prod_schema_baseline.sql"
SEED="$ROOT/supabase/baseline/reference_seed.sql"

if ! docker ps --format '{{.Names}}' | grep -q "^${DBC}$"; then
  echo "ERROR: Supabase DB container '${DBC}' not running. Run 'npx supabase start' first." >&2
  echo "       (override the name with SUPABASE_DB_CONTAINER=...)" >&2
  exit 1
fi
[ -f "$SCHEMA" ] || { echo "ERROR: missing $SCHEMA" >&2; exit 1; }
[ -f "$SEED" ]   || { echo "ERROR: missing $SEED" >&2; exit 1; }

echo "==> Resetting public schema in ${DBC}"
docker exec -i "$DBC" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c \
  "drop schema if exists public cascade; create schema public; \
   grant usage on schema public to anon, authenticated, service_role; \
   grant all on schema public to postgres, service_role;"

echo "==> Ensuring required extensions (prod uses these in the 'extensions' schema)"
docker exec -i "$DBC" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c \
  "create schema if not exists extensions; \
   create extension if not exists vector with schema extensions; \
   create extension if not exists pg_trgm with schema extensions; \
   create extension if not exists pgcrypto with schema extensions; \
   create extension if not exists \"uuid-ossp\" with schema extensions; \
   create extension if not exists pg_stat_statements with schema extensions;"

echo "==> Loading schema baseline ($(basename "$SCHEMA"))"
docker exec -i "$DBC" psql -U postgres -d postgres -v ON_ERROR_STOP=1 < "$SCHEMA"

echo "==> Loading reference seed ($(basename "$SEED"))"
docker exec -i "$DBC" psql -U postgres -d postgres -v ON_ERROR_STOP=1 < "$SEED"

echo "==> Ensuring storage buckets (prod set; evidence/export flows need them)"
docker exec -i "$DBC" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c \
  "insert into storage.buckets (id, name, public) values \
     ('audit-bundles','audit-bundles',false), \
     ('compliance-exports','compliance-exports',false), \
     ('evidence','evidence',false), \
     ('org-files','org-files',false), \
     ('report-exports','report-exports',false), \
     ('user-avatars','user-avatars',false) \
   on conflict (id) do nothing;"

TABLES=$(docker exec "$DBC" psql -U postgres -d postgres -tAc \
  "select count(*) from information_schema.tables where table_schema='public'")
PLANS=$(docker exec "$DBC" psql -U postgres -d postgres -tAc "select count(*) from billing_plans")
echo "==> Done. public tables=${TABLES}, billing_plans=${PLANS}"
