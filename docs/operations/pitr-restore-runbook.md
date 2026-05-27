# PITR Restore Runbook

**Status:** authoritative as of 2026-05-27.
**Cadence:** monthly drill (1st Monday of each month, 09:00 AEST).
**Owner:** founder / on-call platform owner.
**RPO target:** 60 minutes.
**RTO target:** 240 minutes (4 hours).

Supabase PITR retains **7 days** of point-in-time backups. Recovery is
a Supabase API / dashboard action; cannot be fully automated from a
Vercel function. The monthly drill validates the procedure works and
that the documented invariants survive the restore.

A successful drill MUST result in a row in `public.restore_test_runs`
with `outcome IN ('passed', 'partial')`. The CI gate
`scripts/check-restore-test-recency.mjs` fails the build if no
successful row in the last 35 days — i.e. one missed monthly drill is
the maximum drift the project tolerates before blocking deploys.

---

## SOC 2 / ISO mapping

This runbook + the `restore_test_runs` ledger together are the artefact
for:

- SOC 2 A1.2 (availability commitments + restoration testing) — monthly
  drill + documented RPO/RTO.
- ISO/IEC 27001:2022 A.8.13 (information backup) — restoration tested
  and recorded.
- NIST CSF RC.RP-1 (recovery plan executed) — exercise cadence + ledger.

Quote this file directly in audit responses.

---

## Pre-flight

1. Confirm you have:
   - Supabase admin access to the FormaOS project (`bvfniosswcvuyfaaicze`).
   - `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in your
     local `.env.local`.
   - The Supabase CLI ≥ 1.187 (`npx supabase --version`).
2. Pick a PITR target — typically "yesterday 12:00 UTC". The target
   timestamp must be within the 7-day PITR window.
3. Open a Linear/Notion ticket so the drill has a paper trail outside
   the DB.

---

## Procedure

### Step 1 — Create a restored branch

In the Supabase dashboard:

1. Navigate to **Database → Branching**.
2. Click **Create branch** → name it `dr-drill-YYYY-MM-DD`.
3. Set **Restore from PITR** to your target timestamp.
4. Wait for the branch to reach **READY** (typically 5-10 minutes).
5. Copy the branch's REST URL + service-role key from the branch's
   API settings.

### Step 2 — Run the verifier against the restored branch

```bash
# Set the target (the restored branch) — these are SEPARATE from prod env vars.
export TARGET_SUPABASE_URL="https://<branch-ref>.supabase.co"
export TARGET_SUPABASE_SERVICE_ROLE_KEY="<branch-service-role-key>"

# Prod env stays in .env.local — that's where the ledger row gets written.

# Trigger the verifier:
node scripts/verify-restore.mjs \
  --performed-by "$(git config user.email)" \
  --pitr-target "2026-05-26T12:00:00Z" \
  --branch-id "dr-drill-2026-05-27"
```

The verifier runs five invariants:

1. `organizations_non_empty` — at least one org survives the restore.
2. `audit_log_chain_present` — top entry has a non-NULL `entry_hash`
   + `sequence_number`.
3. `evidence_file_hash_not_null` — R9 NOT NULL invariant holds.
4. `admin_audit_log_present` — table exists + reachable.
5. `frameworks_integrity` — all 9 expected framework slugs present
   (soc2, soc2-tsc, iso27001-2022, gdpr, hipaa, pci-dss, nist-csf,
   cis-controls, ndis).

Outcomes:

- All passed → `outcome='passed'`, exit 0.
- Some passed, some failed → `outcome='partial'`, exit 1.
- All failed → `outcome='failed'`, exit 1.

Each run writes a row to `restore_test_runs` on PROD (not the branch)
so the ledger survives the branch being deleted in Step 4.

### Step 3 — Triage failures

If `outcome='partial'` or `'failed'`:

1. Capture the specific invariant in the Linear ticket.
2. Investigate — is this restore data drift, or a real recovery bug?
3. Re-run the drill against a different PITR target to isolate.
4. If a real recovery bug, file a Supabase support ticket; do NOT
   close the Linear ticket.

### Step 4 — Cleanup

```bash
# In Supabase dashboard → Database → Branching → delete dr-drill-YYYY-MM-DD.
# OR via CLI:
npx supabase branches delete dr-drill-YYYY-MM-DD --linked
```

Branches cost ~$0.013/hr. Don't leave them running.

### Step 5 — Close out

1. Update the Linear ticket with outcome + duration.
2. If quarterly review is overdue, append a paragraph to
   `docs/operations/dr-quarterly-review.md` (create it on first use)
   summarising the last 3 drills' outcomes + durations.

---

## What this runbook does NOT do

- Does **not** restore prod itself. The drill exercises a sibling
  branch; restoring prod is a separate (and unlikely) event handled
  via the same Supabase Branching flow with the live project.
- Does **not** verify *every* table. The 5 invariants are a sentinel
  set covering the highest-value tables. A real prod restore would
  also need a full smoke test of the application against the
  restored DB.

---

## What happens if a drill is skipped

`scripts/check-restore-test-recency.mjs` fails the next CI run after
35 days from the latest passing drill. Deploys are blocked until a
new drill is recorded.

To unblock without a drill (emergency only):
1. Document the reason in the Linear ticket.
2. Run a manual `record_restore_test_run` insert with
   `outcome='partial'` + `notes='UNVERIFIED — emergency unblock; full
   drill scheduled for <date>'`.
3. Audit log captures the override; senior auditor will flag it.
