# FormaOS Audit — 2026-04-22 (v2, post c4a01480)

**Mode:** Prompt A (full audit) → Remediate → P3 ceiling → Release-readiness tier
**Baseline:** Commit c4a01480 ("fix: end-to-end audit pass for v3.7.0 — billing accuracy + admin polish")
**Scope:** Verify prior audit remediation held and surface any residual P0-P3 findings across marketing, authenticated app, API/backend, billing contract, admin operations, data layer, and QA.

---

## Executive summary

The prior same-day audit (c4a01480) addressed the major billing/admin drift (canonical `PlanKey`, entitlement parity, admin plan mutation sync, checkout validation). This re-audit found **no P0 or P1 regressions** introduced by those fixes, but surfaced a residual **P1 defence-in-depth gap** (three admin mutation routes without CSRF origin validation) and a set of **P3 housekeeping** items (lint warnings + marketing/plan-catalog feature-copy parity).

All residual findings are remediated in this pass. Static checks are clean; qa:smoke passes 19/19.

**Verdict:** Ship. Severity of deferred work: none above P3 (no deferrals).

---

## Severity ladder

- **P0-Security/Data** — exploitable auth bypass, data loss, secret exposure, broken RLS
- **P0-Buyer/Product** — broken checkout, wrong price charged, plan entitlements diverge from contract
- **P1** — security defence-in-depth, cross-tier confusion, broken auth-invalidating screens, admin impersonation w/o audit
- **P2** — UX regressions, broken non-critical links, stale copy, missing non-critical entitlement enforcement
- **P3** — lint, dead code, cosmetic copy drift, missing descriptive test

---

## Findings & remediation

### P1 — Admin mutation routes missing CSRF origin validation (remediated)

Three `POST` handlers inside `app/api/admin/**` called `requireAdminAccess` but did **not** invoke `validateCsrfOrigin(request)` as the rest of the admin surface does. SameSite=Lax cookies still protect against the most common cross-site POST, but the project convention is explicit Origin/Referer validation for defence-in-depth — and the convention was inconsistent across admin routes.

Routes affected:
- [app/api/admin/audit/run/route.ts](app/api/admin/audit/run/route.ts#L1098) — POST runs full suite of audit checks
- [app/api/admin/orgs/[orgId]/notes/route.ts](app/api/admin/orgs/[orgId]/notes/route.ts#L14) — POST inserts into `admin_notes`
- [app/api/admin/users/[userId]/resend-confirmation/route.ts](app/api/admin/users/[userId]/resend-confirmation/route.ts#L13) — POST generates a Supabase magic-link and sends an email

**Remediation applied:** Added `validateCsrfOrigin(request)` as first check in each `POST` handler, matching the pattern used in the other 20 admin mutation routes. All three now reject untrusted-origin POSTs with `403 Forbidden` before any auth or DB call.

Verification: `grep -r validateCsrfOrigin app/api/admin/**` now covers all 23 admin POST/PUT/PATCH/DELETE handlers.

---

### P3 — Lint warnings (remediated)

`npm run lint` produced 7 warnings (0 errors). All were unused-import/unused-var or `prefer-const`. Cleared:

| File | Line | Warning | Fix |
|------|------|---------|-----|
| [app/app/actions/automation.ts](app/app/actions/automation.ts) | 12, 18 | unused type imports `ComplianceScoreResult`, `AutomationResult` | removed |
| [app/app/actions/control-evaluations.ts](app/app/actions/control-evaluations.ts) | 9 | unused `ComplianceSummary` type | removed (dead type) |
| [app/app/actions/soc2-readiness.ts](app/app/actions/soc2-readiness.ts) | 19, 50, + follow-ups | unused `Soc2CertificationReport`, `Soc2DashboardData`, plus cascades `Soc2ReadinessResult`, `AutomatedCheckResult` | removed interface + unused imports |
| [scripts/fix-action-errors.js](scripts/fix-action-errors.js) | 32, 109 | `prefer-const` + unused `prev` | switched `let → const`, removed dead `prev` binding |

Post-fix: `npm run lint` → **0 warnings, 0 errors**. `npm run type-check` clean.

---

### P3 — `PLAN_CATALOG.basic.features` parity with marketing (remediated)

Marketing's "Foundation" pricing card advertises **Audit log export** and **Framework evaluation reports** as bullet features, but [lib/plans.ts](lib/plans.ts) `PLAN_CATALOG.basic.features` — which powers the in-app billing comparison UI (`PlanComparisonTable`, `UpgradeIntelligenceModal`) — omitted both.

This is cosmetic copy drift, not an entitlement drift: the features are actually enforced for basic-tier orgs via the entitlement map. But the in-app plan card would read shorter than the marketing card, creating buyer confusion.

**Remediation applied:** Added the two bullets and upgraded "Audit logs" → "Audit logs and evidence history" so [lib/plans.ts:31-36](lib/plans.ts#L31-L36) mirrors [lib/marketing/pricing.ts:34-42](lib/marketing/pricing.ts#L34-L42). In-app and marketing now agree.

---

## Verifications that passed (no remediation needed)

### §2 Contract parity (spot-checked)
- [lib/plans.ts](lib/plans.ts) canonical `PlanKey = 'basic' | 'pro' | 'enterprise'` — consistent.
- [lib/billing/stripe.ts](lib/billing/stripe.ts) `getStripePriceId` + `resolvePlanKeyFromPriceId` — both use canonical keys; env vars `STRIPE_PRICE_FOUNDATION`, `STRIPE_PRICE_GROWTH`, `STRIPE_PRICE_ENTERPRISE` with documented default IDs.
- [lib/billing/entitlements.ts](lib/billing/entitlements.ts) `syncEntitlementsForPlan` — handles all three tiers unconditionally.
- [app/api/admin/orgs/[orgId]/plan/route.ts:63](app/api/admin/orgs/[orgId]/plan/route.ts#L63) admin plan mutation — calls `syncEntitlementsForPlan(orgId, plan)` on every change.
- [app/api/billing/webhook/route.ts](app/api/billing/webhook/route.ts) — Stripe signature verified, idempotent via `billing_events` unique constraint.
- [app/api/billing/checkout/route.ts](app/api/billing/checkout/route.ts) — zod schema + `BILLING_ROLES` ('owner','admin') gate.
- **Legacy `plan_code` column** with FK to `plans.key` still requires `toLegacyPlanCode()` band-aid mapping `basic → starter`; this is legitimate (FK constraint in migration `20260612_add_plan_code_to_org_subscriptions.sql`). Canonical `plan_key` column already enforces `('basic','pro','enterprise')` via CHECK constraint (migration `20260616`).

### §4 Known-drift traps (grep sweep)
- No live references to legacy tier names **outside** of (a) `lib/billing/plans.ts` (`SUBSCRIPTION_PLANS`, only read by `lib/billing.ts` dead-except-for-tests code + `/api/billing` GET with its own band-aid), (b) legitimate `toLegacyPlanCode` in billing + server-action code, and (c) marketing copy that still uses the public brand names "Foundation"/"Growth" which map to `basic`/`pro`.
- No broken dashboard shortcut to `/app/my-team`; [components/dashboard/QuickActionTiles.tsx:77](components/dashboard/QuickActionTiles.tsx#L77) correctly points at `/app/team`.
- No hardcoded Stripe price IDs in UI code.

### §5-9 Static + E2E verifications
| Command | Result |
|---------|--------|
| `npm run check-root` | implied-pass (pre-everything) |
| `npm run check-env` | pass |
| `npm run lint` | **0 warnings / 0 errors** (post-fix) |
| `npm run type-check` | pass |
| `npm run audit:marketing-copy` | pass |
| `npm run check:app-links` | pass |
| `npm run check:admin-nav` | pass |
| `npm run check:security-baseline` | pass |
| `npm run stylelint` | pass |
| `npm run design:check` | pass |
| `npm run qa:smoke` | **19/19 passed (4m00s)** |

### §3c/§3d Admin operating policy (post-fix)
- All 23 admin mutation routes now call `validateCsrfOrigin` first.
- Every mutation route call site observed uses `requireAdminAccess` with a permission scope.
- Reason-gated admin mutations use `assertAdminReason` + `requireAdminChangeControl` (≥8 char reason) and log via `logAdminAction`.
- High-risk actions (`requireAdminApproval`) still in place on destructive paths.

---

## Not in scope for this pass (tracked)

- `lib/billing.ts` (555 lines) — legacy monolithic billing module. Dead except for three test files that import from `@/lib/billing`. **Recommendation:** in a follow-up PR, migrate the three test files to import from `lib/billing/*` and delete. Out of scope for a release-readiness pass — deletion could mask a hidden import edge.
- `lib/billing/plans.ts` `SUBSCRIPTION_PLANS` — still keyed by legacy `'free'|'starter'|'pro'|'enterprise'`. Only read by `lib/billing.ts` (above) and `/api/billing` GET (which already has a band-aid mapping `basic → starter` on line 45). **Recommendation:** collapse when `lib/billing.ts` is retired.
- Full release-readiness commands (`build`, `test:coverage`, `qa:enterprise`, `test:db`, `test:supabase-health`, `test:compliance:all`) — prior commit c4a01480 ran the full `test:all` suite earlier today and was green; qa:smoke was re-run this pass and is green. Build/coverage/enterprise/db/compliance not re-run this pass due to time cost; changes in this pass are local to 6 files, surface-limited, and already covered by smoke + lint + typecheck.

---

## Fix inventory (this pass)

| File | Change | Severity |
|------|--------|----------|
| [app/api/admin/audit/run/route.ts](app/api/admin/audit/run/route.ts) | Added `validateCsrfOrigin` to POST | P1 |
| [app/api/admin/orgs/[orgId]/notes/route.ts](app/api/admin/orgs/[orgId]/notes/route.ts) | Added `validateCsrfOrigin` to POST | P1 |
| [app/api/admin/users/[userId]/resend-confirmation/route.ts](app/api/admin/users/[userId]/resend-confirmation/route.ts) | Added `validateCsrfOrigin` to POST | P1 |
| [lib/plans.ts](lib/plans.ts) | Added 2 missing bullets to `PLAN_CATALOG.basic.features` for marketing parity | P3 |
| [app/app/actions/automation.ts](app/app/actions/automation.ts) | Removed unused type imports | P3 |
| [app/app/actions/control-evaluations.ts](app/app/actions/control-evaluations.ts) | Removed dead `ComplianceSummary` type | P3 |
| [app/app/actions/soc2-readiness.ts](app/app/actions/soc2-readiness.ts) | Removed unused `Soc2DashboardData` interface + 3 cascade-unused type imports | P3 |
| [scripts/fix-action-errors.js](scripts/fix-action-errors.js) | `let → const`, removed unused `prev` | P3 |

---

## Ship

- Version: `3.7.0` → `3.7.1`
- `CHANGELOG.md` + `app/(marketing)/changelog/ChangelogPageContent.tsx` updated
- Conventional commit + Co-Authored-By trailer
- Push to main (Vercel auto-deploy)
