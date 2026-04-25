# Deep Workflow Integrity Audit — 2026-04-25

This audit goes beyond link- and click-level checks and walks every long
end-to-end user path that mutates persistent state. For each path we
verified that:

1. The user can start from the real UI (not just an API),
2. Every required step actually completes,
3. Data is written to the database / storage,
4. Linked / parent records update,
5. The UI reflects the new state without a fake success,
6. Reload preserves the state.

## Workflows audited

| # | Workflow                                                                                          | Steps | Status before | Status after |
| - | ------------------------------------------------------------------------------------------------- | ----- | ------------- | ------------ |
| 1 | Obligation → attach evidence → DB row + storage object → parent count                             | 6     | **CRITICAL — broken** | **PASS** |
| 2 | Evidence Vault upload → metadata + bucket + revalidate                                            | 4     | PASS          | PASS         |
| 3 | Incident → resolve (root cause + preventive measures) → status closed → reload persists           | 4     | PASS          | PASS         |
| 4 | Incident → start investigation → record persisted → incident status moves to `investigating`      | 5     | PASS          | PASS         |
| 5 | Care plan → add goal → mark achieved → progress 100% → reload persists                            | 6     | PASS          | PASS         |
| 6 | Care plan → add support under goal → status update                                                | 4     | PASS          | PASS         |
| 7 | Staff credential → verify → status verified + verifier recorded                                   | 3     | PASS          | PASS         |
| 8 | Obligations register → real evidence count from DB                                                | 1     | **CRITICAL — hard-coded 0** | **PASS** |

The two CRITICAL items are the visible bug the prompt called out:
the obligation evidence drawer "looked" like it worked but the upload
neither hit storage nor counted in the obligations register.

## Critical breaks fixed

### 1. Obligation → evidence attachment

The longest broken path in the app. From `/app/compliance` the user opens
an obligation row, tries to attach evidence and sees no error — but
nothing persists. Root causes (every layer was contributing):

| Layer                                  | Bug                                                                                          |
| -------------------------------------- | -------------------------------------------------------------------------------------------- |
| `EvidenceDrawer` "browse" UI           | The `<label>` had no associated `<input type="file">`, so clicking it did nothing            |
| `EvidenceDrawer` GET                   | Sent `?obligationId=` but `/api/v1/evidence` only accepted `taskId`                          |
| `EvidenceDrawer` GET response shape    | API returned `{ evidence }`, drawer expected `{ items }` with `submittedBy/submittedAt/title` |
| `EvidenceDrawer` upload error handling | `.catch(() => {})` swallowed every error — failures looked like silent successes             |
| `/api/v1/evidence/upload` POST         | Did not upload to Supabase storage at all; wrote a fake `local/{id}/{name}` file_path        |
| `/api/v1/evidence/upload` response     | Returned `{ id, type, name, uploadedAt, path }`; drawer expected `submittedBy`/`submittedAt` |
| `/api/v1/compliance/obligations` GET   | Hard-coded `evidenceCount: 0` for every row, regardless of attached evidence                 |
| `ObligationsTable`                     | Never refetched after the drawer closed — count stayed stale                                  |
| `/api/v1/audit-trail` GET              | Drawer fetched the endpoint; the route did not exist (404 → empty activity log)              |
| Schema / storage                       | `org_evidence` columns (`title`, `file_type`, `file_size`, `verification_status`) and the `evidence` storage bucket were not provisioned by any migration in the repo |

### 2. Obligations register: real evidence counts

`evidenceCount` was hard-coded `0`. Replaced with a real aggregate query
against `org_evidence` keyed on `(organization_id, task_id)`.

## Fixes shipped (this branch)

| File                                              | Change                                                                                                                                |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `supabase/migrations/20260425_evidence_workflow_integrity.sql` | New migration: makes `org_evidence` columns idempotent, creates the `evidence` storage bucket and adds tenancy-scoped RLS policies; index on `(organization_id, task_id)` |
| `app/api/v1/evidence/upload/route.ts`             | Real upload to the `evidence` bucket, validates the obligation belongs to the caller's org, rolls back storage on DB-insert failure, surfaces specific errors, emits `EVIDENCE_UPLOADED` audit log |
| `app/api/v1/evidence/route.ts`                    | Accepts `obligationId` (alias for `taskId`), returns both `{ items }` (drawer-friendly) and the legacy `{ evidence }` shape, resolves uploader display name |
| `app/api/v1/compliance/obligations/route.ts`      | Counts `org_evidence` rows per obligation in a single query; no more hard-coded `0`                                                   |
| `app/api/v1/audit-trail/route.ts` (new)           | `entityId`/`entityType`-filtered audit trail, mapped to humanised actions; backs the drawer "Activity" tab + `AuditTrailPanel`         |
| `components/compliance/EvidenceDrawer.tsx`        | Real file input wired to "click to browse" + drag/drop, surfaces upload errors via `[data-testid=evidence-upload-error]`, emits `onEvidenceChanged` so the parent register can refresh |
| `components/compliance/ObligationsTable.tsx`      | Reloads obligations from the API on drawer close + applies optimistic count updates from the drawer                                     |
| `e2e/deep-workflow-integrity.spec.ts` (new)       | Multi-step E2E suite (see below) covering the obligation evidence path end-to-end and adjacent deep workflows                          |

## Storage / RLS audit

| Bucket             | Provisioned in repo? | Tenancy-safe path | RLS                                    |
| ------------------ | -------------------- | ----------------- | -------------------------------------- |
| `user-avatars`     | Yes                  | `{userId}/...`    | per-user                               |
| `audit-bundles`    | Yes                  | `{orgId}/...`     | per-org via `org_members`              |
| `compliance-exports` | Yes                | `{orgId}/...`     | per-org via `org_members`              |
| `report-exports`   | Yes                  | `{orgId}/...`     | per-org via `org_members`              |
| `evidence`         | **Was missing → now added** | `{orgId}/obligations/{taskId}/{uuid}.{ext}` for obligation uploads, `{orgId}/vault/{name}` for vault uploads | per-org `select/insert/update/delete` policies that gate on the first path segment matching an `org_members.organization_id` for `auth.uid()` |

`service_role` is *not* used by either the obligation upload path or the
vault path — both run under the caller's session so RLS is enforced.

## Parent ↔ child propagation now wired

| Child action                            | Parent fact that updates                                              |
| --------------------------------------- | --------------------------------------------------------------------- |
| Evidence attached to an obligation      | `org_evidence` row → counted by `/api/v1/compliance/obligations` and reflected in the register row's evidence cell |
| Goal status changes on a care plan      | `computePlanProgress(goals)` derived in render; `syncCarePlanProgress` flips the plan to `active` if any goal is non-pending |
| Investigation started                   | `org_incidents.status` flips from `open` → `investigating`            |
| Incident resolved                       | `org_incidents.status` → `resolved`, `resolved_at` set, root cause + preventive measures stored; `CareOperationsScorecard.incidents.openCount` decreases on next render |
| Staff credential verified               | `org_staff_credentials.status` → `verified`, `verified_by` + `verified_at` recorded |

## E2E coverage added

`e2e/deep-workflow-integrity.spec.ts` (chromium-only, signed in via the
real workspace bootstrap) covers:

| # | Test                                                                       | What it actually proves                                                                       |
| - | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| A | Obligation → attach evidence → count + persistence                         | UI upload writes a row to `org_evidence`, **the bytes land in the `evidence` storage bucket** (we re-download and assert content), and the obligations register reflects the new count after reload |
| B | Obligation evidence upload API rejects unauthorised + invalid input        | The upload route does not silently succeed for missing `obligationId` or for bogus IDs        |
| C | Incident → resolve flow persists root cause + status                       | UI submission flips status to `resolved` and persists `root_cause`/`preventive_measures` across reload |
| D | Care plan → add goal → mark achieved → 100% progress persists              | Progress survives reload at 100% with the goal achieved                                       |
| E | Obligations register surfaces evidence count from real data                | Pre-seeded evidence rows are reflected in the register's evidence cell                        |

## Hidden / deferred work

Nothing was hidden in this pass: every CTA the user can hit on
`/app/compliance` and adjacent surfaces now leads to a working
end-to-end path. The dead `components/evidence/evidence-uploader.tsx`
component is unused (no imports anywhere outside its own coverage
report) — it was left untouched but should be deleted in a follow-up.

## Remaining known gaps

1. **Activity tab** — populated from `org_audit_logs` filtered by
   `target = "evidence:{id}"` or trailing `:{id}`. Older obligations
   that never received an audit event will still show "No activity
   recorded." Not a regression; just an absence of historical data.
2. **Vault upload modal** — already worked end-to-end (uses
   `registerVaultArtifact` + the `evidence` bucket). It is *now* covered
   by the new RLS policies in
   `20260425_evidence_workflow_integrity.sql`; in a fresh project the
   bucket creation here is the only thing that lets vault uploads
   succeed at all.
3. **EvidenceUploader (`components/evidence/evidence-uploader.tsx`)** —
   dead code. Has a control-suggestion flow but never persists files.
   Recommend deleting in a follow-up commit.

## Final verdict

> **Yes — the obligation → evidence flow is genuinely end-to-end.**

Files reach storage, rows reach Postgres, parent counts update without a
manual reload, and the registered E2E suite exercises the full path
including a content-equality check on the bytes after they've been
written and read back. The dashboard scorecard counters that depend on
the same primitives (incidents resolved, evidence verified, plan
progress) were already wired correctly — the missing piece was the
obligation register's evidence pipeline, and it is now intact at every
layer.
