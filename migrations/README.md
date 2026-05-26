# Historical migrations (pre-Supabase-CLI)

This directory holds **three early phase migrations** that pre-date the
move to the Supabase CLI workflow:

- `005_phase5_upgrades.sql` — Phase 5 schema upgrades
- `006_phase6_upgrades.sql` — Phase 6 schema upgrades
- `007_employee_onboarding.sql` — Employee onboarding wizard tables

All three are **already applied to production** and have been since
early-to-mid 2026. They are kept here for disaster-recovery
reconstruction; do **not** add new migrations to this folder.

## Where new migrations go

All new schema changes live under [`/supabase/migrations/`](../supabase/migrations/)
using the Supabase CLI's `YYYYMMDDHHMMSS_description.sql` naming scheme.
That folder is the canonical source of truth — `supabase db push`,
`supabase db reset`, and the production migration runner all read from
there.

## Why these aren't moved into `/supabase/migrations/`

Renaming them to fit the Supabase CLI timestamp scheme would cause
`supabase db reset` to attempt to re-apply them, which would error on
the already-existing tables. The cheapest safe state is to leave them
here, document them, and forbid adds.

If you are recovering a fresh local DB from zero, run these three
manually (in the order above) **before** `supabase db reset`, or use
the consolidated `combined-migrations.sql` if it is present locally.

Audit 2026-05-26.
