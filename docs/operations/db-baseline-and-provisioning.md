# Database Baseline & Fresh-Environment Provisioning

_Added 2026-06-02._

## The problem

`supabase db reset` **cannot rebuild the database from the committed migration
chain.** A from-scratch replay (timestamp order) fails because several early
migrations reference schema added later, e.g.:

- `20260206000_automation_enhancements.sql` indexed `org_evidence.verification_status`
  and `org_policies.last_updated_at` before those columns were created
  (partially fixed in that file).
- `org_policies.last_updated_at` is created by **no** migration at all — it
  exists on prod out-of-band.
- `20260315006_workflow_engine_v2.sql` declares `workflow_executions.workflow_id`
  referencing `workflow_definitions(id)`, which has no unique constraint on
  `id` alone (invalid FK).
- Reference/catalog data (billing_plans, app_modules, plans, frameworks,
  controls, care templates, …) lives only on prod — it is inserted by **no**
  migration/seed.

Net effect: **prod exists only because it was built incrementally with
out-of-band changes the migrations don't reproduce.** You cannot reliably stand
up a fresh environment, a staging copy, or disaster-recover from migrations
alone — and CI's authed E2E can't build a clean DB either.

## The baseline (current fix)

Two committed artifacts reproduce prod faithfully on a fresh DB:

- `supabase/baseline/prod_schema_baseline.sql` — schema-only dump of prod's
  `public` schema (`supabase db dump --linked --schema public`), no data, no PII.
- `supabase/baseline/reference_seed.sql` — global catalog data (plans,
  billing_plans, app_modules), no tenant rows, idempotent.

### Provision a fresh local DB

```bash
npx supabase start                 # starts local Postgres/Auth/Storage (Docker)
bash scripts/provision-fresh-db.sh # rebuilds public schema from the baseline + seed
```

The script drops/recreates `public`, enables the required extensions
(`vector`, `pg_trgm`, `pgcrypto`, `uuid-ossp`, `pg_stat_statements` in the
`extensions` schema), loads the baseline, then the seed. Verified: 206 tables,
zero errors. Use this for local dev, E2E, CI, and DR drills instead of
`supabase db reset`.

### Refresh the baseline when prod schema changes

```bash
npx supabase link --project-ref <ref>   # one-time
npx supabase db dump --linked --schema public -f supabase/baseline/prod_schema_baseline.sql
```

### Extend the reference seed safely

Add catalogs (compliance_frameworks, framework_controls, care_*_templates,
rbac_*) by dumping **explicit** tables — never a blanket `--exclude`, which
risks pulling tenant/PII rows. Prefer per-table `INSERT … ON CONFLICT DO
NOTHING` captured from prod for the specific global catalog you need.

## Full migration-squash cutover (deliberate, not yet done)

To make the **standard** `supabase db reset` work (and retire the broken
chain), perform a squash. This touches the migration history and the prod
ledger, so do it deliberately:

1. Confirm the baseline reproduces prod (diff a fresh-provisioned DB against a
   prod schema dump).
2. Move `supabase/migrations/*.sql` (the historical chain) into
   `supabase/migrations/archive/` (the CLI only replays top-level `*.sql`).
3. Add the baseline as the first top-level migration, e.g.
   `supabase/migrations/00000000000000_baseline.sql` (idempotent-ified).
4. **Prod ledger reconciliation** — mark the baseline as already-applied on
   prod so it is never re-run there:
   `supabase migration repair --status applied 00000000000000` (verify against
   `supabase migration list --linked` first). Prod's schema is unchanged.
5. Update `supabase/.migration-ledger-snapshot.json` and
   `scripts/check-migration-ledger-alignment.mjs` to the baseline era so the CI
   alignment gate stays meaningful.

Until the cutover is done, `supabase db reset` will continue to fail — use
`scripts/provision-fresh-db.sh`.

## Running the authed E2E suite locally

With a baseline-provisioned DB the full authed suite runs end-to-end:

```bash
npx supabase start
bash scripts/provision-fresh-db.sh

# Build + serve pointed at local Supabase (legacy local JWT keys),
# with the E2E MFA bypass enabled:
export NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
export NEXT_PUBLIC_SUPABASE_ANON_KEY=<local anon key from `supabase status -o env`>
export SUPABASE_SERVICE_ROLE_KEY=<local service_role key>
export E2E_BYPASS_MFA=1
npx next build && npx next start &

PLAYWRIGHT_REUSE_SERVER=true npx playwright test e2e/security-invariants.spec.ts --project=chromium
```

`E2E_BYPASS_MFA` is implemented in `lib/auth/mfa-gate.ts` (`isE2eMfaBypassEnabled`)
and consulted by `evaluateMfaGate` + the auth callback. It is **triple-gated**
(`E2E_BYPASS_MFA=1` AND not running on Vercel AND `VERCEL_ENV !== 'production'`)
so it can never take effect on any deployment — test users have
`two_factor_enabled=true`, and a fresh UI login mints a session whose id doesn't
match the bootstrap's MFA-passed session, so without the bypass every `/app`
request bounces to `/auth/mfa-challenge`.

Verified runtime results (local baseline DB): security-invariants 9/11,
enterprise-invariants + qa-enterprise-smoke 22/22. The two security-invariants
failures are (1) a test that assumes a non-owner user (the bootstrapped user is
the org owner, which the executive API correctly admits) and (2) `/app/team`
redirecting unauthenticated users to `/unauthorized` instead of `/signin` —
a minor redirect inconsistency (access is still denied).
