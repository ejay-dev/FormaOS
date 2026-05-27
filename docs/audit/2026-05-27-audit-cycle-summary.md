# Audit cycle 2026-05-27 — final summary

**Status:** Complete. 23 commits ahead of `origin/main`. No push performed.

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

### Operational hardening (this latest session)

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

---

## Verification numbers (as of close of cycle)

| Check | Result |
|---|---|
| `npm run type-check` | exit 0 |
| `npx jest __tests__/ --testPathIgnorePatterns='integration/rls'` | 353 suites / 5169 tests / 0 failures |
| `npm run test:db:ledger-alignment` | ✓ aligned (3 documented-skip files; 1 v1/v2 drift entry — all benign) |
| `npm run test:db:secdef-grants` | ✓ no drift (19 entries in allowlist; new SECDEF functions locked down) |
| `npm run test:security:leaked-secrets` | ✓ no Stripe-live/AWS/Google/Supabase-service-role keys in 3317 tracked files |
| `npm run test:db:restore-recency` | ⚠ first-run state (warn-only until first DR drill recorded) |
| Supabase security advisor | 0 ERROR, 59 WARN (3 of which were closed this cycle by `75d9c38f`). Remaining WARNs are pre-existing default-grant drift documented in `scripts/.security-definer-rpc-allowlist.json` `_cleanup_notes`. |

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
