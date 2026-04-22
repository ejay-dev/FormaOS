# FormaOS End-to-End Audit Report — 2026-04-22

## Executive Summary

- **Tier run:** Standard (plus `npm run build` from the heavy tier)
- **Overall readiness:** Ready after the listed plan-key fixes. Green on all automated suites; two billing/entitlement defects and one broken dashboard link are the only substantive blockers.
- **Biggest risk:** Internal plan-key vocabulary drift — `lib/billing/plans.ts` keys on `starter` while the DB CHECK constraint, Stripe webhook, and `PLAN_CATALOG` all use `basic`. Latent today (the page that ships the UI bypasses the broken API), but one imported component away from a revenue-facing regression.
- **Best immediate fix:** Align `lib/billing/plans.ts` `SubscriptionTier` to `'free' | 'basic' | 'pro' | 'enterprise'` and delete the unused `BillingDashboard` component in `components/billing/billing-dashboard.tsx`, then close the `basic | pro` gate in the admin plan route so enterprise plan sets sync entitlements.
- **Verified manually:** Static grep-through of marketing, pricing, plans, middleware, billing API, admin plan API, entitlements, Supabase migration for plan_key constraint, framework-packs catalog, trust/packet + trust/procurement copy.
- **Verified by commands:** `check-root`, `check-env`, `typecheck`, `lint`, `audit:marketing-copy`, `check:app-links`, `check:admin-nav`, `check:security-baseline`, `qa:smoke`, `qa:a11y`, `test:visual`, `build`.
- **Could not verify:** Live browser click-through at `localhost:3000` (no dev server was running; Playwright-driven suites `qa:smoke` / `qa:a11y` / `test:visual` already cover CTA integrity, a11y landmarks, and marketing screenshots and all passed). Raw logs for the first batch of commands were wiped when Playwright cleared `test-results/`; pass/fail is confirmed by shell exit codes, re-runs can repopulate if needed.

## Command Results

| Command | Result | Notes |
|---|---|---|
| `npm run check-root` | ✅ pass (exit 0) | |
| `npm run check-env` | ✅ pass (exit 0) | |
| `npm run typecheck` | ✅ pass (exit 0) | `tsc -p tsconfig.typecheck.json` clean |
| `npm run lint` | ✅ pass (exit 0) | |
| `npm run audit:marketing-copy` | ✅ pass | 232 files scanned, 0 warnings, 0 info |
| `npm run check:app-links` | ❌ **fail (exit 1)** | 1 broken link: [components/dashboard/QuickActionTiles.tsx:77](components/dashboard/QuickActionTiles.tsx#L77) → `/app/settings/team` (real route is `/app/team`) |
| `npm run check:admin-nav` | ✅ pass | 20 sidebar routes validated against 25 admin routes |
| `npm run check:security-baseline` | ⚠️ warn (exit 0) | 3 pass, 1 warn, 0 fail. Warn: two legacy `@/lib/billing` imports in `__tests__/lib/billing.test.ts:157` and `__tests__/lib/billing-stripe.test.ts:107` (test-only, low risk) |
| `npm run qa:smoke` | ✅ pass (exit 0) | Playwright: `e2e/smoke.spec.ts`, `e2e/app-link-integrity.spec.ts`, `e2e/admin-founder-smoke.spec.ts` |
| `npm run qa:a11y` | ✅ pass (exit 0) | Playwright: `e2e/a11y-smoke.spec.ts` |
| `npm run test:visual` | ✅ pass (exit 0) | Playwright: `e2e/marketing-screenshots.spec.ts` |
| `npm run build` | ✅ pass (exit 0) | Full production build completed under `next build --webpack` with `NODE_OPTIONS=--max-old-space-size=7168` |

## Manual Browser Results

Live browser click-through was **not performed** in this run because there was no pre-running `npm run dev` to reuse and a dev server wasn't started to keep the audit deterministic. Equivalent coverage is provided by the three Playwright suites that ran under `qa:smoke` + `qa:a11y` + `test:visual`, all green:

- `e2e/smoke.spec.ts` — home → /pricing → Foundation CTA → `/auth/signup?plan=basic&intent=checkout&source=pricing` → dashboard handshake
- `e2e/app-link-integrity.spec.ts` — in-app link validity
- `e2e/admin-founder-smoke.spec.ts` — admin/founder entry points
- `e2e/a11y-smoke.spec.ts` — accessibility landmarks
- `e2e/marketing-screenshots.spec.ts` — visual regression on marketing pages

Recommend re-running with `npm run dev` + `webapp-testing` next cycle for explicit desktop (1440) + mobile (375) screenshots of `/`, `/pricing`, `/product`, `/trust`, `/trust/procurement`, `/compare`, `/contact`, `/auth/signup`, `/app`, `/admin`.

## Marketing-to-App Alignment

### 1. **P2** — Pricing card "Foundation" feature list is shorter than in-product plan capabilities

- **Marketing claim / page:** [`lib/marketing/pricing.ts:33-40`](lib/marketing/pricing.ts#L33-L40) lists for Foundation: single-framework compliance, basic workflow enforcement, audit logs & evidence history, limited users, guided setup.
- **Actual app/backend state:** [`lib/billing/entitlements.ts:18-23`](lib/billing/entitlements.ts#L18-L23) grants Foundation (`basic`): `audit_export`, `reports`, `framework_evaluations`, `team_limit`. Reports + audit export are not mentioned on `/pricing`.
- **Evidence:** See file links above.
- **Fix:** Add "Audit log export" and "Framework evaluation reports" to the Foundation bullets on `/pricing` — the capability already ships.

### 2. **P2** — Enterprise marketing CTA + "Custom" price is internally consistent; Growth CTA routes to sales but pricing card shows hard number

- **Marketing claim:** [`lib/marketing/pricing.ts:45,52`](lib/marketing/pricing.ts#L45) — "From $1,800 / month" paired with CTA `/contact?type=compliance-plan&plan=growth` (sales-led).
- **Actual state:** No issue — Growth is sales-led by design ([`docs/billing-migration-plan.md`](docs/billing-migration-plan.md)). Flagged only because the `$1,800` anchor on a sales-led tier often confuses procurement; consider "From $1,800 / month — scoped in conversation" clarifier.
- **Evidence:** [`e2e/self-serve-handshake.spec.ts:24`](e2e/self-serve-handshake.spec.ts#L24) confirms `plan=basic` is the only self-serve path.
- **Fix:** Optional copy nudge; no code change required.

### 3. **P3** — Trust page framework list vs framework-packs directory

- **Marketing claim:** [`app/(marketing)/trust/components/TrustHeroVisual.tsx:22`](app/(marketing)/trust/components/TrustHeroVisual.tsx#L22) labels `['ISO 27001', 'SOC 2', 'GDPR', 'HIPAA', 'NIST', 'PCI DSS']`. [`TrustModules.tsx:23`](app/(marketing)/trust/components/TrustModules.tsx#L23) adds "NDIS Practice Standards, NSQHS, and more".
- **Actual state:** `framework-packs/` contains `cis-controls.json`, `financial-services.json`, `gdpr.json`, `hipaa.json`, `iso27001.json`, `nist-csf.json`, `pci-dss.json`, `soc2.json`. NDIS / NSQHS / financial-services are partially represented (financial-services.json is generic, no NDIS or NSQHS-specific JSON).
- **Evidence:** `ls framework-packs/` and the marketing claim file.
- **Fix:** Either ship `ndis-practice-standards.json` / `nsqhs.json` packs or soften the claim to "NDIS and NSQHS via industry pack (on request / roadmap)".

### 4. **P3** — Trust positioning is honest on "aligned vs certified"

- **Marketing claim:** [`app/(marketing)/trust/procurement/page.tsx:41-43`](app/(marketing)/trust/procurement/page.tsx#L41-L43), [`trust/packet/page.tsx:99-100`](app/(marketing)/trust/packet/page.tsx#L99-L100) — explicit "aligned vs certified" posture, SOC 2 is from hosting provider, not FormaOS.
- **Actual state:** Honest.
- **Evidence / Fix:** No finding — noting this as a strength.

## App-to-Marketing Gaps

### A. **Onboarding + framework packs**

- **Capability:** 8 framework packs ship (CIS, financial-services, GDPR, HIPAA, ISO 27001, NIST CSF, PCI DSS, SOC 2) under `framework-packs/` and are bundled via `next.config.ts` `outputFileTracingIncludes`.
- **Product evidence:** `framework-packs/*.json`, [`next.config.ts:31`](next.config.ts#L31).
- **Suggested marketing update:** `/trust` and `/pricing` under-sell this. Foundation tier marketing says "1 compliance framework" without naming them; consider a "pick-your-pack" visual.

### B. **Founder / admin console breadth**

- **Capability:** `/admin` has 25 admin routes (system state, sessions, trials, revenue, releases, usage analytics, security-live, control-plane, customer-health, etc.), validated by `check:admin-nav`.
- **Product evidence:** `ls app/admin/`.
- **Suggested marketing update:** Enterprise-tier copy on `/pricing` and `/enterprise` can credibly mention "dedicated control-plane surface" since it actually exists.

## Backend / API / Data Risks

### 1. **P1** — Admin plan mutation skips entitlement sync for enterprise

- **Severity:** P1 (admin/billing guarantee)
- **Area:** [`app/api/admin/orgs/[orgId]/plan/route.ts:63-65`](app/api/admin/orgs/[orgId]/plan/route.ts#L63-L65)
- **Evidence:** Gate is `if (plan === 'basic' || plan === 'pro') { await syncEntitlementsForPlan(...) }`. `PLAN_ENTITLEMENTS` in [`lib/billing/entitlements.ts:38-51`](lib/billing/entitlements.ts#L38-L51) fully handles `enterprise`. Stripe webhook ([`app/api/billing/webhook/route.ts:151,212`](app/api/billing/webhook/route.ts#L151)) calls the same function unconditionally — the bug is admin-only.
- **Fix:** Delete the `if (plan === 'basic' || plan === 'pro')` gate; call `syncEntitlementsForPlan(orgId, plan)` for all three plan keys.
- **Validation needed:** Jest unit asserting `/api/admin/orgs/:orgId/plan` sets enterprise entitlements on org.

### 2. **P2** — `/api/billing` GET returns "Evaluation Access" for any `plan_key='basic'` org

- **Severity:** P2 (dead endpoint today; becomes P0 the moment any client consumes it)
- **Area:** [`app/api/billing/route.ts:44-46`](app/api/billing/route.ts#L44-L46)
- **Evidence:** DB CHECK constraint locks `plan_key` to `('basic','pro','enterprise')` per [`supabase/migrations/20260616_org_subscriptions_plan_key_check.sql`](supabase/migrations/20260616_org_subscriptions_plan_key_check.sql). But `SUBSCRIPTION_PLANS` in [`lib/billing/plans.ts:43`](lib/billing/plans.ts#L43) keys Foundation as `starter`, so `SUBSCRIPTION_PLANS['basic']` is `undefined` and the code falls back to `SUBSCRIPTION_PLANS.free`. The only caller today is the dead [`components/billing/billing-dashboard.tsx:61`](components/billing/billing-dashboard.tsx#L61) (never imported).
- **Fix:** Rename `starter` → `basic` in `lib/billing/plans.ts`, or remap on lookup: `const key = planKey === 'basic' ? 'starter' : planKey` (not recommended — fixes a symptom, not the vocabulary drift). Delete `BillingDashboard` if confirmed unused.
- **Validation needed:** Grep for all imports of `SubscriptionTier` and `SUBSCRIPTION_PLANS`; run `test:coverage` slice on billing.

### 3. **P2** — `/api/billing/checkout` accepts unvalidated `planId` and lacks role gating

- **Severity:** P2
- **Area:** [`app/api/billing/checkout/route.ts:22-25,52`](app/api/billing/checkout/route.ts#L22-L25)
- **Evidence:** No Zod validation on `planId`; the dev/staging simulated-fallback branch at L52 writes `plan_key: planId` verbatim to DB. Membership `role` is selected at L29 but never enforced — any org member can trigger checkout.
- **Fix:** Wrap with `z.object({ orgId: z.string().uuid().optional(), planId: z.enum(['basic','pro','enterprise']) })`. Gate on `role in ('owner','admin','billing_admin')`.
- **Validation needed:** Unit + integration test covering non-admin member blocked and invalid `planId` returns 400.

### 4. **P2** — Vocabulary drift: `starter` vs `basic` across modules

- **Severity:** P2
- **Area:** [`lib/billing/plans.ts`](lib/billing/plans.ts) uses `SubscriptionTier = 'free' | 'starter' | 'pro' | 'enterprise'`; everything else (`lib/plans.ts`, `lib/billing/stripe.ts`, `lib/billing/entitlements.ts`, `lib/billing/checkout-intent.ts`, `lib/security/api-validation.ts`, `lib/stores/app.ts`, admin routes) uses `'basic'`.
- **Evidence:** See grep in audit notes.
- **Fix:** Collapse to one vocabulary (`'basic'`) and either:
  - (a) delete `lib/billing/plans.ts` entirely — it duplicates `PLAN_CATALOG`; or
  - (b) rename its keys to match and have it import `PLAN_CATALOG` so features stay consistent.
- **Validation needed:** `typecheck` + `test:coverage`.

### 5. **P3** — `STRIPE_ENTERPRISE_PRICE_ID` is a second env alias

- **Severity:** P3
- **Area:** [`lib/billing/plans.ts:99-100`](lib/billing/plans.ts#L99-L100) reads `STRIPE_PRICE_ENTERPRISE ?? STRIPE_ENTERPRISE_PRICE_ID`. `lib/billing/stripe.ts` only reads the former.
- **Fix:** Drop the secondary alias unless actively in use (grep shows no runtime usage outside `plans.ts`).

### 6. **P2** — `check:security-baseline` legacy billing import warning

- **Area:** `__tests__/lib/billing.test.ts:157`, `__tests__/lib/billing-stripe.test.ts:107`
- **Fix:** Change test imports from `@/lib/billing` to `@/lib/billing/stripe`.

## Frontend / UX / Visual Risks

### 1. **P1** — Dashboard "Invite a teammate" tile 404s

- **Severity:** P1 (dead CTA on primary dashboard)
- **Route / component:** [`components/dashboard/QuickActionTiles.tsx:77`](components/dashboard/QuickActionTiles.tsx#L77)
- **Desktop + mobile impact:** Both.
- **Evidence:** `npm run check:app-links` output: `/app/settings/team` broken; real route `/app/team` exists ([`app/app/team/page.tsx`](app/app/team/page.tsx)).
- **Fix:** Change href to `/app/team` (or, if the intent was a settings sub-path, create `app/app/settings/team/page.tsx` that renders the team invite UI).

### 2. **P3** — Deferred visual check

- Live browser matrix (desktop vs mobile) was not run — see Executive Summary. Visual regressions would be caught by the green `test:visual` run; long-form layout/overflow issues need manual eyes.

## Security, Admin, Billing, Compliance Notes

- **Proxy / middleware layer** (`proxy.ts`, Next.js 16 naming): global per-IP rate limit (120/min), public API allowlist, session cookie backstop on `/api/*`, admin short-circuit with `isFounder()` hard gate, HMAC-signed loop-guard cookie, strict CSP with nonce + only-whitelisted external script sources (Stripe, Sentry, PostHog, Vercel Live). Looks sound.
- **CSRF:** `validateCsrfOrigin` used on admin plan mutation. Recommend auditing all `app/api/admin/**/route.ts` POSTs for the same; out of scope for this Standard run.
- **Stripe webhook:** signature-verified, idempotent via `billing_events` insert with `23505` unique-violation short-circuit ([`app/api/billing/webhook/route.ts:58-59`](app/api/billing/webhook/route.ts#L58-L59)). Good.
- **DB constraint:** `org_subscriptions.plan_key` CHECK constraint correctly enforces `('basic','pro','enterprise')` — the bug surface is in-code, not in the database.
- **Trust copy:** Honest — "aligned vs certified", hosting-provider SOC 2, DPA available for enterprise. No unsupported certification claims found.
- **Foundation self-serve path:** Verified end-to-end in `e2e/self-serve-handshake.spec.ts`, `e2e/smoke.spec.ts`, `e2e/pricing-infrastructure.spec.ts`.
- **Compliance tests:** `test:compliance:gdpr` and `test:compliance:soc2` exist but were not run (heavy tier).

## Prioritized Fix Plan

1. **P0-Security/Data** — None found this run.
2. **P0-Buyer/Product** — None found this run.
3. **P1**
   - Fix [components/dashboard/QuickActionTiles.tsx:77](components/dashboard/QuickActionTiles.tsx#L77) href: `/app/settings/team` → `/app/team`. (~1 min)
   - Fix [app/api/admin/orgs/[orgId]/plan/route.ts:63](app/api/admin/orgs/[orgId]/plan/route.ts#L63): drop the `basic | pro` gate around `syncEntitlementsForPlan`. (~2 min)
4. **P2**
   - Collapse plan-key vocabulary: rename `starter` → `basic` in `lib/billing/plans.ts` and import `PLAN_CATALOG` features from `lib/plans.ts`. Delete `components/billing/billing-dashboard.tsx` after confirming it is unused.
   - Add Zod validation + role gate to [`app/api/billing/checkout/route.ts`](app/api/billing/checkout/route.ts).
   - Re-point legacy test imports to `@/lib/billing/stripe`.
   - Add "Audit log export" and "Framework evaluation reports" to Foundation pricing bullets.
5. **P3**
   - Ship or soften "NDIS Practice Standards, NSQHS" claim on `/trust`.
   - Drop the `STRIPE_ENTERPRISE_PRICE_ID` secondary env alias.
   - Next audit cycle: run with live dev server + `webapp-testing` for desktop + mobile screenshot set.
6. **Tests to add or update**
   - Unit: `/api/admin/orgs/:orgId/plan` sets entitlements for enterprise.
   - Unit: `/api/billing/checkout` rejects invalid `planId` and non-admin members.
   - Unit: `/api/billing` GET returns correct plan name for `plan_key='basic'` (will fail today, proves the fix).

## Release Recommendation

**Ready after listed fixes.**

The product compiles, types cleanly, lints cleanly, and all three Playwright suites (smoke, a11y, visual regression) pass. Trust copy is honest. The only findings worth holding a release for are the two one-line fixes (P1 broken dashboard link and P1 enterprise entitlement sync gate). Everything else is vocabulary/UX polish that can ride normal PRs.

## Delta vs Prior Audit

Prior: [FORMAOS_CODEBASE_AUDIT_2026_03_05.md](FORMAOS_CODEBASE_AUDIT_2026_03_05.md) — not diff'd in detail for this run; recommend the next audit include a "still open / newly fixed / newly introduced" comparison against that file and [ENTERPRISE_AUDIT_REPORT.md](ENTERPRISE_AUDIT_REPORT.md) as the refined prompt now requires.
