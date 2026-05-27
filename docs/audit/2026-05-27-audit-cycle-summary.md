# Audit cycle 2026-05-27 — final summary

**Status:** Complete + extended.
- Initial 23 commits: shipped to `origin/main` at `9199f5d1`.
- Follow-up: 2 regression fixes on local `main` (not pushed) + 13 commits on
  feature branch `feat/audit-2026-05-27-ndis-ui-surface` (not pushed).

## Follow-up cycle (2026-05-27 evening) — additions on top of the original 23

### Regression fixes (on local `main`, ahead of `origin/main` by 2 commits)

| Commit | Item |
|---|---|
| `ddaa37bc` | NDIS-1.1 jest test alignment to Phase 3 ≥95% pass threshold (commit `9199f5d1` tightened the predicate but didn't update the Phase 2 test). |
| `7931fcfb` | `dormant_user_candidates` view lockdown — closed 2 Supabase advisor ERRORs (`auth_users_exposed` + `security_definer_view`) introduced by commit `0f8dc7bb`. Migration `20260624068`: `security_invoker=true` + REVOKE ALL anon/auth + GRANT service_role. |

### Feature branch `feat/audit-2026-05-27-ndis-ui-surface` (not pushed)

Tier 1 — NDIS Phase 3 admin UI surface (5 commits):
| Commit | Item |
|---|---|
| `284fec90` | NDIS-category dropdown on policy editor (new + edit) backed by `lib/compliance/ndis/categories.ts` (18 enum values matching the CHECK constraint). |
| `f9655a7b` | Behaviour Support Plan CRUD pages (`/app/behaviour-support-plans` list/new/[id]/edit) + actions + NDIS sidebar entry. |
| `80592fab` | Typed register-entry sheet on `/app/registers` covering the 10 NDIS-aware `org_registers.type` values + "Other" escape hatch. |
| `4b547f0b` | Per-control pass/partial/fail/manual tally on each framework card, derived from `org_control_evaluations`. |
| `3d7282aa` | Chromium-only Playwright smoke spec covering the policy dropdown + the BSP create flow. |

Tier 2.C — Unified compliance health dashboard (3 commits):
| Commit | Item |
|---|---|
| `1bc6d1c0` | `lib/compliance/health/aggregate.ts` — pure-function rollup (overall weighted score / per-framework breakdown / top-10 outstanding by urgency_score). 13 jest tests. |
| `b73b7a1f` | `/app/compliance/health` page wiring the aggregate to a UI (band pill / status tiles / per-framework cards / outstanding list). |
| `738ce628` | Weekly snapshot table `org_compliance_health_snapshots` (migration `20260624069`) + `/api/cron/compliance-health-snapshot` (Mon 07:00 UTC) + SVG sparkline. |

Tier 3 hygiene (2 commits):
| Commit | Item |
|---|---|
| `a240c144` | NDIS-3.4 per-participant cadence refinement — pass requires every active participant to have ≥1 note/30d AND org-wide ≥30/90d. Fail at >50% silent. Graceful fallback for non-care orgs. 6 jest cases. |
| `d6678a08` | SECDEF allowlist trim batch — migration `20260624070` revokes anon+auth on 4 cron-only fns and anon on 2 session-required fns. Allowlist 14 → 10 with `_cleanup_notes` on every remaining entry. |

Tier 2.A — CAPA auto-creation (1 commit):
| Commit | Item |
|---|---|
| `821381e7` | When the registry evaluator returns `status='fail'`, auto-INSERT an `org_capa_items` row with severity from the first gap, deduped by `(source_type='compliance_evaluator', source_id=framework_control.id)`. Hooked into `evaluate-framework-controls.ts` after the upsert. 11 jest tests on the pure dedupe+payload logic. |

Tier 2.B — Public /verify page (1 commit):
| Commit | Item |
|---|---|
| `fb6adc42` | Customer-facing `/verify` page — paste an audit-export bundle to recompute Merkle root + per-entry proofs, or paste a Rekor entry UUID + hash to verify the Sigstore signature. All client-side via SubtleCrypto; only network call is the public Rekor lookup. 14 jest tests including a real ECDSA P-256 round-trip via the DER → raw signature converter. |

### Verification at close of follow-up cycle

| Check | Result |
|---|---|
| `npm run type-check` | exit 0 |
| `npx jest __tests__/ --testPathIgnorePatterns='integration/rls'` | 357 suites / 5238 tests / 0 failures |
| `npm run test:db:ledger-alignment` | ✓ aligned (240/244 + 1 benign drift + 3 documented-skip + 1 new from this cycle = 244) |
| `npm run test:db:secdef-grants` | ✓ no drift |
| `npm run test:security:leaked-secrets` | ✓ no findings (3343+ files) |
| Supabase security advisor | 0 ERROR; WARN count reduced further by Tier 3.3 batch (4 cron-only fns no longer surface) + Tier 0.1 (2 new ERRORs introduced + immediately closed by regression-fix #2). |

### Original cycle summary follows

---

This document is the bridge for the next reviewer (human or agent).
Read this first if you're auditing the FormaOS codebase after
2026-05-27 — it indexes every artefact produced and quotes the
verification numbers a senior SaaS auditor will want to see.

---

## What landed across the full cycle

23 audit-cycle commits, grouped by theme:

### Verification + corrections (cycle entry)

| Commit | Item |
|---|---|
| (prior batch verified, see [`2026-05-27-handover.md`] context) | All 22 items from the original audit brief were independently re-verified at session start. Verdict table in chat history. |

### P1 / P0 corrections from independent audit

| Commit | Item |
|---|---|
| `cb6dc398` | Closed approval-gate bypass on `/api/admin/bulk-operations` (P1 — mass-suspend without 4-eye review). |
| `7fd40ffa` | Unblocked the hash-chained `audit_log_append` RPC (P0 — silently broken since migration `20260624035` due to `search_path` + missing `event_type` column). Cleaned 128 orphan `org_evidence` rows. Hardened `org_evidence.file_hash` to NOT NULL. |
| `75d9c38f` | Locked down 3 audit-cycle SECURITY DEFINER RPCs (`audit_log_append`, `audit_log_append_v3`, `_audit_org_control_evaluation_change`) flagged by Supabase advisor as anon-callable. Added CI gate. |

### Hash-chain hardening

| Commit | Item |
|---|---|
| `dee56691` | **R6** — migration-ledger alignment toolchain + reconciliation. Closed the historical "19/217 ledger gap". |
| `c277fe32` | **R5** — locked down `org_control_evaluations` (compliance-score gameability) + added transition-audit trigger. |
| `993486a3` | **R3** — keyed HMAC audit chain (`v3-hmac`). Per-org HMAC keys encrypted at rest. Feature-flagged. |
| `a092dd07` | **R4** — Merkle inclusion proofs on audit-export bundles (RFC 6962 domain separation). Stand-alone verifier script. |
| `aa86458f` | **External anchor** — Sigstore Rekor daily anchor cron + verifier. Feature-flagged. |

### NDIS framework depth

| Commit | Item |
|---|---|
| `bdcb69ef` | **R10 Phase 1** — NDIS framework + 8 manual-attestation Core Module controls. |
| `58f7c232` | **R10 Phase 2** — 25-control coverage with 11 real predicates against the FormaOS schema. 14 remain manual pending Phase 3 schema work. |

### Operational hardening

| Commit | Item |
|---|---|
| `3d20aaa3` | Secret-rotation runbook + ledger (`secret_rotations` + CLI). |
| `0f8dc7bb` | Dormant-user review surface + monthly cron (non-destructive). |
| `54fc61d3` | Public `/status` page + audit-chain anchor stats endpoint. |
| `f9ade77d` | PITR restore-test ledger + verifier + runbook + CI gate. |
| `c5a695e8` | OpenTelemetry domain spans (`withSpan` helper) applied to audit hot paths. |
| `92db59a4` | PostHog server-side capture (dependency-free + PII-guarded). |
| `18492340` | Leaked-secrets CI scanner + PagerDuty verification script. |
| `df44a643` | Updated `ENGINEERING_CHANGE_MATRIX.md` + `SECURITY.md`. |

### Final clean-up batch

| Commit | Item |
|---|---|
| `369e58f9` | Backfilled drifted `audit_chain_anchors` table (caught during operator-handover smoke). |
| `9af0fc96` | Supabase advisor hygiene — 5 trigger handlers locked + open `api_key_usage_log` INSERT policy dropped + 11 functions get fixed `search_path`. WARN count drops ~17. |
| `1ef17eeb` | Wrapping-key rotation scripts (AUDIT_CHAIN_HMAC_KEY + TOTP_ENCRYPTION_KEY + INTEGRATION_CONFIG_KEY). |
| `848fde0a` | `jest.setup.js` `global.fetch` stomp now conditional on `RUN_INTEGRATION_TESTS` — integration RLS suites are runnable locally again. |

### Deliberately NOT shipped

- **`lib/` console-pollution sweep** — audited; the 48 console calls in `lib/` are all defensible (logger implementations themselves, edge/bootstrap layers where pino isn't bundled, client-side `.tsx` where pino is server-only, observability fallback paths, intentional fail-open warnings). No fixable items without a separate "structured client logger" workstream.
- **NDIS Phase 3** — requires NDIS-audit practitioner sign-off. Phase 2 ships 25 controls with 11 real predicates; Phase 3 backlog documented in `docs/compliance/ndis-framework-status.md`.
- **R4 Option B (persistent per-org Merkle tree)** — ADR'd as "ship when continuity matters". Current per-export tree (Option A) is the active shipment.
- **Moving `vector` + `pg_trgm` out of `public` schema** — Supabase advisor WARN, but risky given the number of call sites that may reference these by qualified name. Deferred pending an audit of every search/embedding call site.

---

## Verification numbers (as of close of cycle)

| Check | Result |
|---|---|
| `npm run type-check` | exit 0 |
| `npx jest __tests__/ --testPathIgnorePatterns='integration/rls'` | 353 suites / 5169 tests / 0 failures |
| `npm run test:db:ledger-alignment` | ✓ aligned (3 documented-skip files; 1 v1/v2 drift entry — all benign) |
| `npm run test:db:secdef-grants` | ✓ no drift (14 entries in allowlist down from 19 — 5 trigger handlers cleaned up by `9af0fc96`) |
| `npm run test:security:leaked-secrets` | ✓ no Stripe-live/AWS/Google/Supabase-service-role keys in tracked files |
| `npm run test:db:restore-recency` | ⚠ first-run state (warn-only until first DR drill recorded) |
| Supabase security advisor | 0 ERROR; WARN count dropped from ~59 to ~42 by `9af0fc96` + `cedf18aa`. Remaining are: pre-existing leakedpassword-protection (Supabase Auth dashboard toggle — your action), `vector`/`pg_trgm` in public schema (deferred), and the 14 intentionally-anon-callable RPCs in the SECDEF allowlist. |

---

## Feature flags (all default off — flip individually when ready)

| Flag | Effect when `true` | Provisioning |
|---|---|---|
| `AUDIT_CHAIN_V3_ENABLED` | New `writeAuditLog` calls go through the keyed `audit_log_append_v3`. v1/v2 rows remain verifiable. | Provision `AUDIT_CHAIN_HMAC_KEY` first. |
| `AUDIT_CHAIN_ANCHOR_ENABLED` | Daily cron submits per-org top-of-chain hashes to Sigstore Rekor. | No additional secret — uses ephemeral keys per submission. |
| `ORG_PURGE_ENABLED` | Daily cron hard-deletes retired orgs after the 90-day grace. | Set only when a specific retired org is queued; operation is irreversible. |
| `STRIPE_REQUIRE_LIVEMODE_IN_PROD` | Stripe webhook rejects test-mode events. | Should be `true` in prod. |

Plus PostHog (`POSTHOG_API_KEY`), dormant-user threshold (`DORMANT_USER_DAYS`), and the anchor URL overrides. See `.env.example`.

---

## Outstanding operator actions

(These are work the user must do; agents can't.)

1. **Provision `AUDIT_CHAIN_HMAC_KEY`** in Vercel prod (32-byte random hex,
   distinct from `SUPABASE_SERVICE_ROLE_KEY` + `INTEGRATION_CONFIG_KEY`).
   Then flip `AUDIT_CHAIN_V3_ENABLED=true`.
2. **Provision `PAGERDUTY_ROUTING_KEY`** in Vercel prod. Then run
   `npm run ops:verify-pagerduty` once to confirm routing.
3. **Provision `POSTHOG_API_KEY`** in Vercel prod (server-side key,
   NOT the `NEXT_PUBLIC_POSTHOG_KEY`).
4. **Flip `AUDIT_CHAIN_ANCHOR_ENABLED=true`** in Vercel prod after
   item 1 is verified.
5. **Run the first DR drill** —
   [`docs/operations/pitr-restore-runbook.md`](../operations/pitr-restore-runbook.md).
   The recency CI gate stays warn-only until the first row lands.
6. **Push commits to `origin/main`** when ready. 23 commits queued.

---

## What I would NOT mark "done" without expert sign-off

- **NDIS Phase 2 predicates** — 11 predicates were written against the
  publicly-published Quality Indicators but were NOT validated by a
  registered NDIS-audit practitioner. Every real-predicate evaluator
  file carries a "⚠️ EXPERT REVIEW REQUIRED" comment.
  [`docs/compliance/ndis-framework-status.md`](../compliance/ndis-framework-status.md)
  has the per-control signal map + Phase 3 schema backlog.
- **First PITR drill** — the runbook is authoritative but until a
  human performs one, recovery isn't actually proven.
- **First PagerDuty routing test** — same shape.

---

## How a senior agent should verify this cycle

```bash
# 1. Type-check + tests
npm run type-check
npx jest __tests__/ --testPathIgnorePatterns='integration/rls'

# 2. Database-side gates
npm run db:ledger:snapshot         # refresh snapshot from prod
npm run test:db:ledger-alignment   # should be clean
npm run test:db:secdef-grants      # should be clean
npm run test:db:rls                # existing R7 gate
npm run test:db:orgs-sync          # existing R2 gate

# 3. Security gates
npm run test:security:leaked-secrets   # should be clean

# 4. Re-pull Supabase advisors and diff against the cycle baseline
#    (mcp tool: mcp__claude_ai_Supabase__get_advisors security)

# 5. Confirm the feature flags are still off in prod
#    (Vercel env inspector)
```

If all of the above pass, the cycle is in a clean state.

---

## File index — where each artefact lives

```
docs/
  audit/2026-05-27-audit-cycle-summary.md   ← this file
  audit/2026-05-26-gdpr-purge-user-decision-matrix.md
  audit/2026-05-12-deep-audit.md
  audit/2026-05-13-marketing-audit.md
  adr/2026-05-27-audit-chain-keyed-hmac-and-merkle-proofs.md
  compliance/ndis-framework-status.md
  operations/migration-history-repair.md
  operations/secret-rotation-runbook.md
  operations/pitr-restore-runbook.md

lib/audit/
  audit-engine.ts            writeAuditLog (v2/v3 routing)
  hash-utils.ts              v1/v2/v3 hash + MAC + verifier
  chain-secret-manager.ts    per-org HMAC key bootstrap
  external-anchor.ts         Sigstore Rekor anchor
  merkle.ts                  R4 Merkle tree + verifier
  redact-purged-subjects.ts  R1 export-time PII redaction

lib/observability/
  with-span.ts               domain-level OTel helper

lib/analytics/
  posthog-server.ts          server-side capture (PII-guarded)

lib/compliance/evaluators/ndis/
  _predicates.ts             R10 Phase 2 schema-aware predicates
  _shared.ts                 manual-evaluator factory
  NDIS-1.1.ts … NDIS-W.1.ts  25 control evaluators

scripts/                      (all CI-runnable)
  check-migration-ledger-alignment.mjs    R6 gate
  check-security-definer-grants.mjs       SECDEF-drift gate
  check-leaked-secrets.mjs                leaked-secret gate
  check-restore-test-recency.mjs          DR-drill cadence gate
  snapshot-migration-ledger.mjs           refresh the ledger snapshot
  backfill-evidence-file-hash.mjs         R9 backfill
  record-secret-rotation.mjs              secret rotation CLI
  verify-export-merkle.mjs                R4 auditor verifier
  verify-rekor-anchor.mjs                 external-anchor verifier
  verify-restore.mjs                      DR-drill verifier
  verify-pagerduty-routing.mjs            operator-run PD verify

supabase/migrations/
  20260624053  consume_backup_code_hash_rpc_lockdown
  20260624054  list_migration_ledger_rpc
  20260624055  org_control_evaluations_lockdown_and_audit (R5)
  20260624056  ndis_framework_phase_1 (R10 P1)
  20260624057  audit_log_append_schema_fixup
  20260624058  r3_keyed_hmac_audit_chain (R3 + anchor table)
  20260624059  r10_phase_2_ndis_controls (R10 P2)
  20260624060  lockdown_secdef_rpc_grants
  20260624061  list_security_definer_anon_grants_rpc
  20260624062  secret_rotations_ledger
  20260624063  dormant_user_review
  20260624064  restore_test_runs
```

---

End of cycle.
