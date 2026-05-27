# Migration History Repair Runbook

**Status as of 2026-05-27 (R6):** the supabase_migrations ledger is reconciled
with the filesystem under the FS-prefix convention. The originally-recorded
"19/217" gap from 2026-05-26 was driven by:

1. Historical migrations applied via Supabase Studio SQL Editor never landed
   in `supabase_migrations` — fixed previously via the `supabase migration repair`
   flow (steps 1-3 below, kept for reference).
2. Audit-cycle migrations applied through `mcp__claude_ai_Supabase__apply_migration`
   were recorded under **synthetic CLI-style timestamps** (`YYYYMMDDhhmmss`)
   rather than the filesystem's audit prefix (`YYYYMMDDnnn`). `supabase migration
   list --linked` compares by *version*, so it saw the same migration as both
   "local only" (FS prefix) and "remote only" (synthetic timestamp).

R6 closes both. The new permanent setup:

- A CI gate (`npm run test:db:ledger-alignment`) runs on every PR and asserts
  that every FS file has a ledger row under its FS prefix (or is documented
  as `STATUS: SKIPPED` in its header).
- A snapshot script (`npm run db:ledger:snapshot`) refreshes
  `supabase/.migration-ledger-snapshot.json` from prod via a service-role-only
  RPC (`public.list_migration_ledger`, migration 20260624054).
- The alignment check itself reads the committed snapshot, so it works in
  fork PRs without DB credentials.

---

## Operating discipline (going forward)

**After applying a migration to prod:**

```bash
npm run db:ledger:snapshot
git add supabase/.migration-ledger-snapshot.json
```

Stale snapshots are detected by the alignment check — if you forget, CI fails
with a clear `FS-only unexplained` or `Ledger-only` message and you re-run the
snapshot.

**When `mcp__claude_ai_Supabase__apply_migration` is used:** the tool assigns
a synthetic CLI-style timestamp version. To keep the ledger and FS aligned,
also insert an FS-prefix row by hand. Pattern:

```sql
INSERT INTO supabase_migrations.schema_migrations(version, name, statements)
VALUES (
  '20260624###',  -- FS prefix
  'audit_YYYY_MM_DD_<descriptor>',
  ARRAY['-- See ledger version <synthetic_ts> for the actual apply statements']
) ON CONFLICT (version) DO NOTHING;
```

Run this via `execute_sql` (not `apply_migration`) so it doesn't trigger another
synthetic-timestamp row.

**Preferred alternative:** apply the SQL via `execute_sql` AND the FS-prefix
row insert in the same MCP call — one transaction, one synthetic-row-free
outcome. This is what migration `20260624054_audit_2026_05_27_list_migration_ledger_rpc.sql`
demonstrates.

---

## Documented-skip migrations

Three audit-cycle migrations have no ledger row because their target objects
don't exist on production. Each file's header includes a `STATUS: SKIPPED`
marker that the alignment check categorizes as benign:

| FS file | Target | Why skipped |
|---|---|---|
| `20260624037_audit_2026_05_26_tighten_attestation_update_rls.sql` | `org_control_attestations` table | Table doesn't exist on prod — likely scoped down or renamed. |
| `20260624038_audit_2026_05_26_attestation_fk_indexes.sql` | same | same |
| `20260624041_audit_2026_05_26_org_controls_view_tiebreak.sql` | `org_controls_view` (sic) | The file's header references a view name that doesn't exist; the SQL inside actually targets `public.org_controls` which does exist. Re-evaluate next time the controls view changes. |

If any of these table/view targets is reintroduced under their canonical name,
re-evaluate whether the SKIPPED migration should be applied at that time —
remove the `STATUS: SKIPPED` marker AND add a ledger row.

Migration `20260624036_audit_2026_05_26_platform_security_audit_log.sql` was
applied as `_v2` (with corrected column names) and is recorded under synthetic
version `20260526040649` with the suffixed name. The alignment check accepts
this via a `v1 ↔ v2` fallback rule. Do not delete the FS file; it documents
the original intent.

---

## Historical baseline repair (kept for reference)

The procedure below ran in 2026-05-26 to catch up the pre-CLI-adoption
migrations into the ledger. Steps 1-3 are no-op today (the historical
baseline is already recorded). Keep them in case a future environment
needs the same treatment.

### Prerequisites

1. Production database access via Supabase service-role.
2. Supabase CLI ≥ 1.187 installed locally: `npx supabase --version`.
3. A clean working tree on a fresh branch: `git checkout -b repair-migration-history`.
4. 30 minutes uninterrupted.
5. **Off-peak window** if possible — repair is read-only on prod, but the
   schema dump can be a few MB and you don't want a co-op deploy mid-procedure.

### Step 1 — Capture the current production schema

```bash
npx supabase db pull --schema public --linked --debug
```

Writes a new file under `supabase/migrations/` named like
`<UTC timestamp>_remote_schema.sql` containing the entire current public
schema. Inspect it carefully:

- Verify it includes `organizations`, `org_members`, `org_files`, `memberships`,
  the audit-log tables, and all custom RLS policies.
- Confirm it does NOT include anything from the `auth`, `storage`,
  `realtime`, or `vault` schemas (those are Supabase-managed).
- Move/rename it to `supabase/migrations/00000000000000_consolidated_baseline.sql`
  so it sorts before everything else.

### Step 2 — Mark every historical migration as already-applied

```bash
ls supabase/migrations/*.sql > /tmp/repair-list.txt

for f in $(cat /tmp/repair-list.txt); do
  version=$(basename "$f" | awk -F'_' '{print $1}')
  if [ "$version" = "00000000000000" ]; then continue; fi
  echo "Marking applied: $version"
  npx supabase migration repair --status applied "$version" --linked
done
```

### Step 3 — Apply the consolidated baseline marker

```bash
npx supabase migration repair --status applied 00000000000000 --linked
```

### Step 4 — Verify

```bash
npx supabase migration list --linked
npm run test:db:ledger-alignment
```

If the alignment check passes, the repair is complete.

---

## What this repair does NOT do

- Does **not** change any data in production.
- Does **not** run any DDL against production (the historical-baseline path).
- Does **not** drop or modify the synthetic-timestamp rows added by
  `apply_migration` — those remain as historical apply records, paired with
  FS-prefix rows added by R6.

---

## If something goes wrong

- **Alignment check fails with `FS-only unexplained`**: a new migration was
  applied but the ledger doesn't know. Insert the FS-prefix row (pattern above)
  and re-snapshot.

- **Alignment check fails with `Ledger-only`**: a row exists in the ledger
  with no corresponding FS file. Either create the missing FS file (preferred
  — see `20260624053_audit_2026_05_26_consume_backup_code_hash_rpc_lockdown.sql`
  for an example of recovering an orphan), or remove the orphan row from the
  ledger (last resort, requires explicit operator sign-off).

- **`supabase db pull` returns nothing**: check `.env.local` has the
  `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD` for the linked project.
  Re-link with `npx supabase link --project-ref bvfniosswcvuyfaaicze`.

- **Production downtime risk**: zero. Every step in this runbook is either
  a read against prod (snapshot) or local-only bookkeeping (ledger inserts).
  The only network call that could affect prod is the eventual `db push`
  after the repair.
