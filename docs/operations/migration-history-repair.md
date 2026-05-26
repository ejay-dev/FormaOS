# Migration History Repair Runbook

**Status:** Required before any new Supabase environment (dev branch, staging, fresh
seed) can be provisioned cleanly. As of 2026-05-26, production has **19 of 217**
local migration files recorded in `supabase_migrations`. The other 198 — including
the entire pre-2026-05-22 baseline — were applied via Supabase Studio SQL Editor
or earlier CLI runs and never got recorded.

**Symptom:** `supabase create-branch` returns `MIGRATIONS_FAILED`. The first
recorded migration (`fix_rls_drift_restore_restrictive_policies`) assumes 30+
tables that don't yet exist on a fresh database.

**Risk if left unrepaired:**

- Fresh dev branches / `supabase db reset` will not work.
- New staging environments can only be cloned from a production point-in-time
  backup, not provisioned from migrations.
- Onboarding contributors cannot stand up a local Supabase from the repo.
- The two new migrations from the 2026-05-26 audit (20260624042, 20260624043)
  cannot be applied via the dev-branch flow until this is fixed.

---

## Repair Procedure

### Prerequisites

1. Production database access via Supabase service-role.
2. Supabase CLI ≥ 1.187 installed locally: `npx supabase --version`.
3. A clean working tree on a fresh branch: `git checkout -b repair-migration-history`.
4. 30 minutes uninterrupted.
5. **Off-peak window** if possible — repair is read-only on prod, but the schema
   dump can be a few MB and you don't want a co-op deploy mid-procedure.

### Step 1 — Capture the current production schema

```bash
# From repo root, with .env.local pointing at prod
npx supabase db pull --schema public --linked --debug
```

This writes a new file under `supabase/migrations/` named like
`<UTC timestamp>_remote_schema.sql` containing **the entire current public
schema**. Inspect it carefully:

- Verify it includes `organizations`, `orgs`, `org_members`, `org_files`,
  `memberships`, the audit-log tables, and all custom RLS policies.
- Confirm it does NOT include anything from the `auth`, `storage`,
  `realtime`, or `vault` schemas (those are Supabase-managed).
- Move/rename it to `supabase/migrations/00000000000000_consolidated_baseline.sql`
  so it sorts before everything else.

### Step 2 — Mark every historical migration as already-applied

```bash
# List every local migration file that is older than today and was
# already applied to prod (i.e., everything except the 2 new audit
# migrations 20260624042 and 20260624043).
ls supabase/migrations/*.sql | grep -vE '_(042|043)_' > /tmp/repair-list.txt

# Mark each as applied without actually re-running. Supabase CLI:
#   supabase migration repair --status applied <version>
# Where <version> is the timestamp prefix (digits before the first `_`).

for f in $(cat /tmp/repair-list.txt); do
  version=$(basename "$f" | awk -F'_' '{print $1}')
  # Skip the consolidated baseline — that one IS new and IS recorded by step 3.
  if [ "$version" = "00000000000000" ]; then continue; fi
  echo "Marking applied: $version"
  npx supabase migration repair --status applied "$version" --linked
done
```

This populates `supabase_migrations` with rows for the 198 historical files
**without re-running them**. Production state is unchanged; only the bookkeeping
catches up.

### Step 3 — Apply the consolidated baseline marker

```bash
# Tell Supabase that the consolidated baseline is also already-applied — it
# IS, because it was generated from the live production schema dump.
npx supabase migration repair --status applied 00000000000000 --linked
```

### Step 4 — Verify

```bash
# List should now show ~218 entries (217 historical + your consolidated
# baseline), all marked applied.
npx supabase migration list --linked

# Try creating a dev branch — if it succeeds, the repair worked.
# (Costs ~$0.013/hr; delete immediately after verifying.)
```

If branch creation now reaches `FUNCTIONS_DEPLOYED`, the repair is complete.

### Step 5 — Commit

```bash
git add supabase/migrations/00000000000000_consolidated_baseline.sql
git commit -m "ops(migrations): add consolidated baseline from prod schema

After this commit, fresh Supabase environments can be provisioned from the
repo migrations. See docs/operations/migration-history-repair.md for the
full procedure."
git push
```

---

## What This Repair Does NOT Do

- Does **not** change any data in production.
- Does **not** run any DDL against production.
- Does **not** alter the existing 19 recorded migrations.
- Does **not** address the two new audit migrations (20260624042, 20260624043)
  — those still need to be applied separately, via the dev-branch flow that
  this repair unblocks.

---

## After This Lands

The dev-branch + apply-+ merge flow becomes available:

```bash
# 1. Create a dev branch.
npx supabase branch create audit-2026-05-26 --linked

# 2. Apply the two pending audit migrations to the branch.
npx supabase db push --linked --branch audit-2026-05-26

# 3. Run get_advisors against the branch — confirm no new RLS/security
#    warnings before merging.

# 4. Merge to main once verified.
npx supabase branch merge audit-2026-05-26
```

---

## If Something Goes Wrong

- **`supabase db pull` returns nothing**: check `.env.local` has the
  `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD` for the linked project.
  Re-link with `npx supabase link --project-ref bvfniosswcvuyfaaicze`.

- **`migration repair` fails on a specific version**: the CLI sometimes
  rejects versions whose timestamp format doesn't match its parser. Inspect
  the file's name carefully. If the format is non-standard (e.g.,
  `20260624009_consolidate_orgs_organizations.sql` has 9-digit prefix),
  rename to a 14-digit timestamp before retrying.

- **Branch still fails after repair**: there's another out-of-band schema
  artifact (custom types, extensions, functions) that didn't come through
  `db pull --schema public`. Re-run with `--schema public,extensions` and
  inspect the diff.

- **Production downtime risk**: zero. Every step in this runbook is either
  a read against prod (Step 1) or local-only bookkeeping (Steps 2-3). The
  only network call that could affect prod is the eventual `db push` after
  the repair, which is gated behind the dev-branch flow.

---

## Why The History Got This Way (For Posterity)

Most of the pre-2026-05-22 migrations were applied via the Supabase Studio
SQL Editor during early product development. The CLI-based migration
workflow was only adopted around the time of the 2026-05-22 audit cycle,
so anything older lives in the repo but not in `supabase_migrations`. This
is a known pattern with Supabase projects that bootstrap via dashboard and
adopt the CLI later — the fix is exactly the `db pull → consolidated
baseline → migration repair` sequence above.
