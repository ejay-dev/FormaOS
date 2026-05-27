# Audit cycle 2026-05-27 — Tier 4 strategic decisions

Recorded during the follow-up cycle on 2026-05-27. Each decision references
the question the user answered + what shipped in response (or what is
deliberately deferred).

## 4.1 — Default NDIS framework visibility for new orgs

**Decision:** Hide unless `industry=ndis`.

**Why this choice over alternatives:**

- "Default-on for new orgs" requires marketing review before NDIS appears
  on every new org's framework picker (including SaaS / financial services
  orgs that have no reason to see it).
- "Opt-in (current behaviour)" keeps the picker cluttered with an
  industry-specific pack for every org, which is the friction the
  decision is meant to remove.

**Shipped:** commit `30a03801`.
- [`lib/validators/organization.ts`](../../lib/validators/organization.ts):
  FRAMEWORK_OPTIONS entries can now carry an `industries` array.
  `frameworkOptionsForIndustry()` helper filters the universal list.
  `validateFrameworks()` accepts an optional industry parameter for
  server-side enforcement.
- [`app/onboarding/page.tsx`](../../app/onboarding/page.tsx): step 5 picker
  filters to the industry-appropriate subset.
- Applied symmetrically: aged_care framework is also gated to
  industry=aged_care for the same UX reason.
- 10 jest cases in
  [`__tests__/lib/validators/organization-framework-gating.test.ts`](../../__tests__/lib/validators/organization-framework-gating.test.ts).

## 4.2 — Pricing tier for NDIS Phase 3 + BSP

**Decision:** Bundle into existing Enterprise tier. No SKU change.

**Why this choice over alternatives:**

- A new "NDIS Compliance Pro" SKU would need marketing/billing work
  (Stripe products, plan-tier feature flags, sales collateral) before
  customers can buy it. Faster customer expansion to bundle for now.
- "No pricing change for now" is functionally identical to "Bundle into
  Enterprise" since Enterprise is the only tier that currently includes
  per-framework provisioning. Recording the decision explicitly so future
  reviewers know it was considered + chosen, not skipped by default.

**Shipped:** no code change required. The Phase 3 features (NDIS-V.2, V.M2,
BSP CRUD, register taxonomy) are already gated behind the
`framework_evaluations` entitlement, which is bundled into Enterprise via
[`lib/billing/entitlements.ts`](../../lib/billing/entitlements.ts).

**Deferred:** when usage data shows ≥3 customers are running Phase 3
workflows in anger, revisit the SKU question with revenue data.

## 4.3 — Audit-cycle cadence going forward

**Decision:** Run the deep-audit cycle on every major release.

**Why this choice over alternatives:**

- "Quarterly" creates predictable cadence but decouples audits from
  product change — a quiet quarter still runs the audit overhead, a busy
  quarter could ship multiple major releases without one.
- "Ad-hoc only" invites drift; the value of these cycles is partly that
  they're scheduled.

**Process change:**

- Every major release tag (`v*.0.0` and `v*.X.0`) requires a completed
  audit cycle merged before the tag lands.
- The cycle output is a `docs/audit/YYYY-MM-DD-audit-cycle-summary.md`
  file using the same shape as this cycle's summary.
- Verification gates (`type-check`, `jest`, `ledger-alignment`,
  `secdef-grants`, `leaked-secrets`, advisor) must be green at cycle close.

**Operationalisation:** added a release-checklist item — to be added to
the release runbook when the next major release ships. Not implemented as
a CI gate yet because the gate would block legitimate emergency patch
releases.

## 4.4 — Hard-delete cron for dormant users

**Decision:** Hybrid policy — flag at 24 months dormant, hard-delete at
36 months unless an operator hold is in place.

**Why this choice over alternatives:**

- "AU Privacy Act minimal (12mo)" risks accidentally purging customers
  in long-cycle industries (annual auditors, slow-roll enterprise tenants).
- "Opt-out only (never auto-delete)" accumulates dormant accounts
  indefinitely + creates compliance pressure.

**Shipped:**

- 24-month flag layer: **already live** since migration
  `20260624063` shipped the `dormant_user_candidates` view + the
  `/api/cron/dormant-users-report` monthly snapshot. No change.
- 36-month hard-delete layer: new — migration `20260624072` adds
  `dormant_user_purge_holds` (per-user escape hatch), and
  [`/api/cron/process-dormant-user-purges`](../../app/api/cron/process-dormant-user-purges/route.ts)
  enqueues purge jobs via the existing `enqueueUserPurge()` path.
- Three escape hatches stack:
  1. Global kill switch: `DORMANT_USER_PURGE_ENABLED` env flag (default
     `false`). Operator flips when ready.
  2. Per-user hold: row in `dormant_user_purge_holds` with optional
     `expires_at`.
  3. Sole-owner check: `enqueueUserPurge` throws `PurgeRefusedError` and
     skips the user.
- Cron schedule: Mondays 08:00 UTC (one hour after the
  compliance-health snapshot, so logs don't bunch up).

**Operator actions to enable hard-delete:**

1. Wait 90 days from migration `20260624072` (gives operators time to
   place holds on known long-cycle customers).
2. Spot-check `dormant_user_candidates` view + the
   `/api/cron/dormant-users-report` snapshots to confirm the 24-month
   flag layer is producing sane output.
3. Provision `DORMANT_USER_PURGE_ENABLED=true` in Vercel prod.
4. Watch the first weekly cron tick. Each `enqueued > 0` run is a
   24-hour grace window via the existing `user_purge_jobs` 'pending'
   state before the actual delete runs.
5. Record the rollout via `scripts/record-secret-rotation.mjs` style
   ledger so the decision is audit-traceable.
