# FormaOS — Fresh Comprehensive Audit (2026-05-24)

**Branch:** `main` (commit `0ddf6bb3`) · **Audit window:** 2026-05-24 02:56 → 04:03 ACST (~1 h 7 m wall, plenty parallel) · **Run by:** Claude (fresh run; no reliance on prior notes, agents, or AUDIT_REPORT_*v1-v4)
**Working dir:** `audit-2026-05-24/raw/` (one log per suite)
**Scope:** every published test/audit tooling in this repo — static analysis, contract checks, security baselines, multi-tenant RLS, compliance, unit (Jest), full E2E (Playwright chromium), accessibility, performance (Lighthouse), DB integrity, integrations, A/B tests, marketing copy.

> **Status:** This report consolidates 25 independent audit suites that were executed in parallel. Results below are raw outcomes from this run only — no historical inference, no fix attempts.

---

## 0 · Executive snapshot

| Area | Suite | Outcome |
|------|-------|---------|
| Type safety | `tsc -p tsconfig.typecheck.json` | **PASS** — 0 errors |
| Lint | `eslint .` (.js/.jsx/.ts/.tsx) | **PASS** — 0 errors / 17 warnings (all unused-imports) |
| Style lint | `scripts/stylelint-lite.mjs` | **PASS** |
| Design audit | `scripts/design-check.mjs` | **PASS** |
| Bundle size | `scripts/check-bundle-size.mjs` | **PASS** — 352 chunks / 7669 KB total / 453 KB largest (within caps) |
| Static security baseline | `check-security-baseline.mjs` | **PASS** — 8/8 |
| Security monitoring wiring | `verify-security-monitoring.js` | **PASS** — 10/10 |
| App link integrity | `app-link-integrity-audit.mjs` | **PASS** — 367 links, 0 broken |
| Admin nav integrity | `check-admin-nav-integrity.mjs` | **PASS** — 20 sidebar routes / 25 admin routes |
| API contracts (OpenAPI ratchet) | `check-api-contracts.mjs` | **FAIL** — 10 ratchet entries stale (§4) |
| Marketing copy audit | `tests/marketing/marketing-enterprise-audit.mjs` | **PASS** — 257 files, 0 warn/info |
| PDF render | `scripts/verify-pdf-render.mjs` | **PASS** — board-pack, posture-report, audit-extract OK |
| Stripe price wiring | `scripts/check-stripe-prices.mjs` | **FAIL** — Growth mis-mapped to Scale product; SCALE env unset (§7) |
| Supabase health (live) | `scripts/test-supabase-health.js` | **FAIL** — upstream request timeout on DB & Storage (§5) |
| Supabase RLS contracts | `scripts/check-supabase-rls-contracts.mjs` | **FAIL** — 17 failures (16 tables w/o RLS enable + live catalog timeout) (§5) |
| DB integrity | `scripts/test-db-integrity.js` | **FAIL** — upstream timeout reading `organizations` (§5) |
| RLS drift fix probe | `scripts/check-rls-drift-fix.mjs` | **FAIL** — exec_sql upstream timeout (§5) |
| Orgs sync | `scripts/check-orgs-sync.mjs` | **FAIL** — upstream timeout (§5) |
| GDPR compliance | `tests/compliance/gdpr-compliance.js` | **FAIL** — 12 tests: 3 pass / 9 fail / 4 violations (§6) |
| SOC2 compliance | `tests/compliance/soc2-compliance.js` | **FAIL** — 12 controls: 5 pass / 6 fail / 1 null / 2 violations (§6) |
| Accessibility deep gate | `scripts/run-a11y-quality-gate.mjs` | **FAIL** — global-setup aborts: Supabase auth bootstrap timeout (§5/§8) |
| Lighthouse public | `scripts/run-lighthouse-public.mjs` | **PASS** — A11y 100, BP 100, SEO 92, Perf 65–76 across 6 routes (see §9) |
| Jest unit suite (w/ coverage) | `npx jest --coverage` | **PASS** — 5333/5348 (15 skipped, 0 fail); 62.2% lines · 65.8% functions · 59.3% branches |
| Playwright E2E (chromium) | `playwright test --project=chromium` | **18 fail / 346 pass / 424 skip** (skips are Supabase-auth-blocked) — see §3 |
| A/B test config | `npm run test:ab-testing` | **PASS** — 5/5 tests valid |
| Quick QA harness | `node tests/quick-qa.js` | **PASS** (silent exit 0) |

**Top-line themes:**

1. **The static / code-quality layer is in great shape.** TypeScript: 0 errors. ESLint: 0 errors, 17 cosmetic warnings. Stylelint, design check, bundle size, app-link integrity (367 links), admin nav integrity, security baseline (8/8), security monitoring wiring (10/10), marketing copy (257 files), PDF render, A/B test config — all green. Jest unit suite is **5,333 / 5,348 passing (0 failures, 15 skipped)** across **383 suites** in 10 minutes; coverage 62.2% lines / 65.8% functions / 59.3% branches. Lighthouse public set: **Accessibility 100, Best Practices 100, SEO 92 across all 6 routes**; Performance 65–76 (changelog is the laggard at 65).

2. **Supabase upstream is degraded right now, and that's masking the truth of the dynamic layer.** Every script that hits PostgREST or `exec_sql` returned `upstream request timeout`: `test-supabase-health.js`, `test-db-integrity.js`, `check-orgs-sync.mjs`, `check-rls-drift-fix.mjs`, the live half of `check-supabase-rls-contracts.mjs`. The Next dev server still serves cached/SSG public routes, but Playwright's `global-setup` couldn't bootstrap a test user — so **424 of 788 E2E tests (54%) were `test.skip`-ped with reason "E2E auth bootstrap unavailable"**. Of the 18 Playwright failures, 12 are auth/DB-dependent and probably attributable to this outage rather than to the product. The remaining **6 are real product/content findings** (see §3.2).

3. **The static RLS scan flags 16 tables created without a discoverable `ENABLE ROW LEVEL SECURITY` statement** — including security-critical, multi-tenant ones: `memberships`, `tasks`, `policies`, `form_responses`, `compliance_scans`, `report_generations`, `report_templates`, `risk_analyses`, `webhook_configs`, `integration_events`, `email_preferences`, `file_metadata`, `org_compliance_status`, `registers`, `scheduled_tasks`, `api_alert_config`. The scan is grep-based so some may have RLS enabled in a later migration the scanner doesn't recognise; the live catalog probe that would tell us couldn't run because of the same Supabase upstream issue. **Treat as a HIGH/CRITICAL finding until verified live.**

4. **Compliance posture has real gaps** even after discounting test-infrastructure noise: GDPR — data controller declaration, legal basis, DSAR/erasure/portability flows, cookie consent banner + granularity, marketing consent separation all fail. SOC2 — Authorization (CC6.2), Session Management (CC6.1), Backup/Recovery documentation (A1.3), Data Integrity (PI1.1), RBAC (C1.2) all fail; HSTS is healthy.

5. **OpenAPI ratchet has drifted positive** — 10 endpoints are documented in `openapi.json` but still listed in `scripts/api-contracts-known-undocumented.json`. Mechanical clean-up.

6. **Stripe price config is broken on this branch** — `STRIPE_PRICE_GROWTH` (`price_1TOe05AHrAKKo3OliCrZNnkx`) resolves to the "Formaos Scale" product (expected "Growth"), and `STRIPE_PRICE_SCALE` is not set at all. Anyone selecting Growth at checkout would be charged for Scale, or the flow would 500.

7. **6 Playwright failures that are not blamed on Supabase upstream** — these need attention regardless of when the DB recovers:
   - `changelog-page.spec.ts` › marketing changelog page › "loads latest release, major update themes, internal links, and CTA"
   - `healthcare-ndis-positioning.spec.ts` × 2 — both Healthcare and NDIS use-case page hero-copy checks
   - `node-wire.spec.ts:308` — homepage "Book Demo" CTA navigation to /contact
   - `node-wire.spec.ts:516` — basic accessibility › accessible navigation
   - `public-buying-motion.spec.ts:84` — compare page avoids trial-funnel copy (content drift)

---

## 1 · Static analysis (type/lint/style/design)

### TypeScript (`npm run type-check`)
**Status:** **PASS** — exit 0 (run wall time ~26 min).
**Command:** `tsc -p tsconfig.typecheck.json`
**Raw log:** `audit-2026-05-24/raw/typecheck.log`

Zero type errors across the full project.

### ESLint (`npm run lint`)
**Status:** **PASS** — `0 errors, 17 warnings` (exit 0).
**Command:** `eslint --ext .js,.jsx,.ts,.tsx .`
**Raw log:** `audit-2026-05-24/raw/lint.log`

All 17 warnings are unused-imports / unused-vars / unused-eslint-disable-directives. No correctness issues. 7 are auto-fixable with `--fix`.

Files with warnings:
- `__tests__/lib/exports/pdf/renderer.test.tsx`, `__tests__/lib/security.test.ts`, `__tests__/lib/system-state/actions.test.ts`, `__tests__/lib/trust/runtime-claims.test.ts`
- `app/api/trust-packet/generate/route.ts`, `app/app/settings/page.tsx`
- `e2e/billing-gate.spec.ts`, `e2e/enterprise-government-audit.spec.ts`, `e2e/homepage-enterprise-regression.spec.ts`, `e2e/onboarding-dashboard-access.spec.ts`, `e2e/product-walkthrough.spec.ts`

### Stylelint (`npm run stylelint`)
**Status:** **PASS** — "Style syntax check passed."

### Design audit (`npm run design:check`)
**Status:** **PASS** — "Design check passed."

### Bundle size (`scripts/check-bundle-size.mjs`)
**Status:** **PASS** — within caps.
- 352 top-level chunks, 7669 KB total
- Largest chunk: 453 KB (`00o7vpjt5ivpw.js`)
- Largest CSS: 401.7 KB (`13q.x~pfbbpe1.css`)
- Caps: max chunk 585.9 KB, total 9765.6 KB

---

## 2 · Unit tests — Jest (`npm test -- --coverage`)

**Status:** **PASS** — `success: true` (10 min 7 s).
**Raw log:** `audit-2026-05-24/raw/jest.log` · **JSON results:** `audit-2026-05-24/raw/jest-results.json` (8.6 MB) · **Coverage:** `coverage/lcov-report/index.html`

| Metric | Total | Passed | Failed | Pending/Skipped |
|---|---|---|---|---|
| Test suites | 383 | 382 | 0 | 1 |
| Tests | 5348 | 5333 | 0 | 15 |

**Coverage (instrumented files: 885):**

| Dimension | Total | Covered | % |
|---|---|---|---|
| Lines | 26,009 | 16,168 | **62.16%** |
| Statements | 27,760 | 17,104 | **61.61%** |
| Functions | 3,955 | 2,601 | **65.76%** |
| Branches | 18,226 | 10,804 | **59.27%** |

**Notes:**
- Suite emitted "A worker process has failed to exit gracefully and has been force exited" — non-fatal, but indicates active timers / open handles in some test (Jest itself exits 0). Re-run with `--detectOpenHandles` if you want to chase.
- No failing tests, so no triage list. Areas with 0% line coverage are pre-existing gaps (e.g., `lib/utils/export-helper.ts`, `lib/utils/pdf-generator.ts`, several `lib/users/*` helpers) — see `coverage/lcov-report/index.html` for the full breakdown.

---

## 3 · End-to-end — Playwright (chromium, fresh)

**Command:** `PLAYWRIGHT_REUSE_SERVER=true PLAYWRIGHT_USE_DEV_SERVER=true npx playwright test --project=chromium --workers=4`
**Specs:** 73 spec files under `e2e/` · **Duration:** 1h 03m 46s · **Exit:** 1
**Raw log:** `audit-2026-05-24/raw/playwright-full.log` (~5 MB, includes embedded JSON)

| Outcome | Count |
|---|---|
| Passed (expected) | **346** |
| Failed (unexpected) | **18** |
| Skipped | **424** |
| Flaky | **0** |
| **Total** | **788** |

> **Big caveat on the skip count.** 424/788 tests were skipped via `test.skip()` because Playwright `global-setup` could not bootstrap a test user — `e2e/helpers/test-auth.ts:1016` threw `E2EAuthBootstrapError: E2E auth bootstrap unavailable: Supabase auth is timing out`. The skip reason on each skipped test is literally `E2E auth bootstrap unavailable: Supabase auth is timing out. Tests will be skipped until Supabase recovers.` That covers practically every authenticated and DB-backed spec. **Once Supabase upstream is healthy these need to be re-run before any release-readiness call.**

### 3.1 · Failure list (18 unexpected)

| # | Spec | Test | Bucket |
|---|---|---|---|
| 1 | `api-unauthed-probe.spec.ts:92` | API unauthenticated probe › public endpoints respond 200 without auth (2.0 min) | Flake / timeout against public endpoints |
| 2 | `app-action-integrity.spec.ts:296` | row detail links discovered by the crawler resolve end to end (2.3 min) | Auth/DB-dependent |
| 3 | `auth/mfa-enforcement.spec.ts:169` | password-only sign-in for an MFA-enabled user lands on the challenge, not /app (1.4 min) | Auth bootstrap |
| 4 | `auth-invariant.spec.ts:254` | Google OAuth signup lands in /app with trial entitlements (4.3 min) | Auth bootstrap / OAuth |
| 5 | `changelog-page.spec.ts:4` | Marketing changelog page › loads latest release, major update themes, internal links, CTA (26.3 s) | **Marketing content/page** |
| 6 | `compliance-export.spec.ts:179` | Export job starts and produces downloadable file (26.8 s) | DB/job-dependent |
| 7 | `deep-workflow-integrity.spec.ts:182` | Obligation evidence upload API rejects unauthorised + invalid input (662 ms) | API contract / auth |
| 8 | `healthcare-ndis-positioning.spec.ts:24` | Healthcare use-case page loads with current hero copy (18.5 s) | **Marketing copy** |
| 9 | `healthcare-ndis-positioning.spec.ts:61` | NDIS use-case page loads with current hero copy (24.7 s) | **Marketing copy** |
| 10 | `node-wire.spec.ts:308` | Homepage CTAs › should navigate to Contact from Book Demo CTA (2.8 min) | **Homepage CTA wiring** |
| 11 | `node-wire.spec.ts:516` | Basic Accessibility › should have accessible navigation (11.1 s) | **A11y nav** |
| 12 | `onboarding-flow.spec.ts:24` | new user sees Start here with 0/5 then progresses after first action (45.6 s) | Auth-dependent |
| 13 | `product-walkthrough.spec.ts:277` | A2-A3: Signup and login flow (V1: New user) (57.6 s) | Auth bootstrap |
| 14 | `product-walkthrough.spec.ts:544` | V2: Login with existing user (1.3 min) | Auth bootstrap |
| 15 | `public-buying-motion.spec.ts:84` | compare page avoids trial funnel copy (1.4 s) | **Marketing copy** |
| 16 | `smoke.spec.ts:76` | Critical user journey smoke test (38.3 s) | Auth bootstrap |
| 17 | `trial-provisioning-guarantee.spec.ts:270` | Legacy trialing subscription stores trial_expires_at 14 days from start (35.2 s) | DB / business logic |
| 18 | `trial-provisioning-guarantee.spec.ts:325` | Legacy trialing org has basic entitlements but not pro-only features (35.5 s) | DB / business logic |

### 3.2 · Failure clusters

- **Real product bugs that need attention (independent of Supabase upstream)** — 6 failures:
  - `changelog-page` (marketing content drift)
  - `healthcare-ndis-positioning` x2 (hero-copy drift on the two use-case pages)
  - `node-wire` Homepage CTA "Book Demo → /contact" (wiring or selector)
  - `node-wire` Basic Accessibility › accessible navigation
  - `public-buying-motion` compare page › trial funnel copy

- **Authenticated / DB-dependent failures that may be Supabase-upstream artefacts** — 12 failures:
  - `app-action-integrity`, `auth/mfa-enforcement`, `auth-invariant` (Google OAuth), `compliance-export`, `deep-workflow-integrity` (evidence upload), `onboarding-flow`, `product-walkthrough` x2, `smoke` critical journey, `trial-provisioning-guarantee` x2, plus `api-unauthed-probe` (timeout).
  - These need a second run once Supabase is healthy to separate "real bug" from "infra outage" — currently can't be triaged in isolation.

### 3.3 · What did pass cleanly
All 346 expected-pass tests across these specs (sampling, full list in `playwright-full.log`):
`admin-access`, `admin-security-verification`, `a11y-smoke`, `accessibility` (public routes only), most of `_design-audit-2026-04-23`, all `api-unauthed-probe.spec.ts:104` rejection cases (admin/v1/governance routes return correct unauth status), `safari-oauth-cookies`, `pricing-infrastructure`, `marketing-alignment`, `homepage-sections`, `homepage-enterprise-regression`, `redirect-loop`, `nav-no-404`, `cta.spec.ts`, `forms-new`, `mobile/*`, `qa-enterprise-smoke`.

---

## 4 · API contracts (`npm run test:api-contracts`)

**Status:** **FAIL** — 10 failures (all ratchet drift, no live probes were run because `API_CONTRACT_BASE_URL` is not set).

**Endpoints now documented in `openapi.json` but still listed in `scripts/api-contracts-known-undocumented.json` (remove from JSON to ratchet down):**
- `/api/v1/ai/usage`
- `/api/v1/analytics/trends`
- `/api/v1/audit-trail`
- `/api/v1/compliance/deadlines`
- `/api/v1/compliance/obligations`
- `/api/v1/compliance/summary`
- `/api/v1/dashboard/stand-up`
- `/api/v1/preferences/plain-english`
- `/api/v1/search/recent`
- `/api/v1/tasks/my-actions`

Filesystem coverage check still PASS: 81 v1 route handlers, 41 undocumented (51 grandfathered, 0 new).
Live API probes **skipped** — set `API_CONTRACT_BASE_URL` to enable.

---

## 5 · Supabase / database (RLS, integrity, health)

### Supabase health (`scripts/test-supabase-health.js`)
**Status:** **FAIL** (with env loaded). Connection times out:
```
1️⃣  DB connection: ❌ upstream request timeout
2️⃣  Auth service:  ✅
3️⃣  Realtime:      ✅
4️⃣  Storage:       ⚠️  connection to the database timed out
5️⃣  DB access:     ❌ (errors observed)
Passed: 2 · Warnings: 2 · Failed: 1
```

### DB integrity (`scripts/test-db-integrity.js`) — detailed
With env loaded the script picked up 5 distinct failures + 2 skipped + a 25 s slow query indicator:
```
1️⃣  Essential tables (organizations, org_members, profiles, org_subscriptions): ❌ all 4 upstream request timeout
2️⃣  RLS policies:                  ⚠️  Service role access issue: upstream request timeout
3️⃣  Data relationships:            ❌ upstream connect error or disconnect/reset before headers (transport failure: delayed connect error: 111)
4️⃣  Query performance:             ⚠️  Query took 25,552 ms — may need optimization
Passed 0 · Failed 5 · Skipped 2
```

### Static RLS contract (`scripts/check-supabase-rls-contracts.mjs`)
**Status:** **FAIL** — 17 failures, 21 warnings.

**Tables created without a discoverable `ENABLE ROW LEVEL SECURITY` statement (16):**
`api_alert_config`, `compliance_scans`, `email_preferences`, `file_metadata`, `form_responses`, `integration_events`, `memberships`, `org_compliance_status`, `policies`, `registers`, `report_generations`, `report_templates`, `risk_analyses`, `scheduled_tasks`, `tasks`, `webhook_configs`

> Note: the static scanner is grep-based; some of these tables may have RLS enabled in a later migration but not in a form the scanner recognises. Live verification (below) could not run, so this list cannot currently be triaged against the running DB.

**Tables with no `CREATE POLICY` in migrations (4 warnings):** `migration`, `comment_reactions`, `statement`, `file_versions`, plus a generic `statement` warning.

**Live RLS catalog probe:** **FAIL** — `upstream request timeout. Apply migration 20260624018_audit_sprint2_rls_status_fn.sql.`

### DB integrity (`scripts/test-db-integrity.js`)
**Status:** **FAIL** — `organizations` table read upstream timeout.

### Orgs sync (`scripts/check-orgs-sync.mjs`)
**Status:** **FAIL** — `Failed to read orgs: upstream request timeout` (and `Failed to read organizations: upstream request timeout` in a parallel branch).

### RLS drift probe (`scripts/check-rls-drift-fix.mjs`)
**Status:** **FAIL** — `exec_sql failed: upstream request timeout`.

> **Common cause across all four:** the Supabase project is currently throwing `upstream request timeout` for PostgREST queries (the dev server's connection pooling appears to mask this for cached routes). Until the upstream is healthy, the live half of every DB audit reports failure.

---

## 6 · Compliance — GDPR & SOC2

### GDPR (`tests/compliance/gdpr-compliance.js`)
**Total:** 12 · **Passed:** 3 · **Failed:** 9 · **Violations:** 4
Raw report: `tests/compliance/reports/gdpr-compliance-report.json`

| Category | Result |
|---|---|
| Privacy Policy Accessibility | ✅ |
| Data Processing Disclosure | ✅ |
| Data Controller Information | ❌ |
| Legal Basis Declaration | ❌ |
| Data Access Request Process | ❌ |
| Data Deletion Process | ❌ |
| Data Portability | ❌ |
| Data Rectification | ✅ |
| Cookie Consent Banner | ❌ |
| Granular Consent Options | ❌ |
| Consent Withdrawal | ❌ |
| Marketing Consent Separate | ❌ |

**Violations (test infra noise, not necessarily product bugs):**
- "HTTPS Enforcement" — test goes to `https://localhost:3000` and fails SSL (dev server is HTTP). Expected behaviour locally.
- "Secure Authentication" / "Session Security" / "Data Breach Notification Process" — failed because dev navigation was interrupted (likely auth redirect) or `chrome-error://chromewebdata/` after an unsuccessful HTTPS hop.

### SOC2 (`tests/compliance/soc2-compliance.js`)
**Total:** 13 controls evaluated · **Passed:** 5 · **Failed:** 6 · **Null:** 1 · **Violations:** 2
Raw report: `tests/compliance/reports/soc2-compliance-report.json`

| Trust criteria | Control | Result |
|---|---|---|
| Security · Authentication Requirements | CC6.1 | ✅ |
| Security · Authorization Controls | CC6.2 | ❌ |
| Security · Session Management | CC6.1 | ❌ |
| Security · Encryption in Transit | CC6.7 | ❌ (local HTTP) |
| Availability · Error Handling | A1.1 | ✅ |
| Availability · Performance Monitoring | A1.2 | ✅ (471 ms) |
| Availability · Backup & Recovery Indicators | A1.3 | ❌ |
| Processing · Data Validation | PI1.1 | ✅ |
| Processing · Audit Trail | PI1.2 | ⚠️ null |
| Processing · Data Integrity Checks | PI1.1 | ❌ |
| Confidentiality · Data Classification | C1.1 | ✅ |
| Confidentiality · Access Controls | C1.2 | ❌ |
| Confidentiality · Data Encryption | C1.1 | ✅ HSTS `max-age=31536000; includeSubDomains; preload` |

---

## 7 · Stripe price wiring (`scripts/check-stripe-prices.mjs`)
**Status:** **FAIL** — 2/3.
- `STRIPE_PRICE_FOUNDATION` → "Formaos Foundation" 297 AUD — **PASS**
- `STRIPE_PRICE_GROWTH` → `price_1TOe05AHrAKKo3OliCrZNnkx` resolves to product "Formaos Scale", expected `/Growth/i` — **FAIL**
- `STRIPE_PRICE_SCALE` is not set — **FAIL**

---

## 8 · Accessibility deep gate (`scripts/run-a11y-quality-gate.mjs`)

**Status:** **FAIL** — couldn't even start. Playwright `global-setup` (e2e/global-setup.ts:84 → e2e/helpers/test-auth.ts:1016) threw `E2EAuthBootstrapError: E2E auth bootstrap unavailable: Supabase auth is timing out. Tests will be skipped until Supabase recovers.`

> The smoke `a11y-smoke.spec.ts` runs in the main Playwright pass (public routes) — those individual results are in §3.

---

## 9 · Lighthouse (`npm run test:lighthouse:public`)
**Status:** **PASS** — exit 0 (re-run after Playwright finished, no dev-server contention).
**Command:** `node scripts/run-lighthouse-public.mjs`
**Raw log:** `audit-2026-05-24/raw/lighthouse-public.log` · **Summary:** `.lighthouseci/public/summary.json` · **Per-URL JSON:** `.lighthouseci/public/{home,pricing,contact,changelog,security,trust}.json`

| Route | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| `/` | **75** | **100** | **100** | **92** |
| `/pricing` | **76** | **100** | **100** | **92** |
| `/contact` | **76** | **100** | **100** | **92** |
| `/changelog` | **65** | **100** | **100** | **92** |
| `/security` | **76** | **100** | **100** | **92** |
| `/trust` | **75** | **100** | **100** | **92** |

**Highlights:**
- **Accessibility 100/100** across all 6 public routes (matches axe-smoke results).
- **Best Practices 100/100** across all 6.
- **SEO 92/92** consistent — same 8-point gap (likely indexability/meta-tag remediation work; check the audit details in the JSON).
- **Performance is the soft spot:** /changelog at 65 stands out as the worst, rest hover 75-76 — for a public marketing surface that's mid-range. Worth profiling LCP/TBT on /changelog specifically.

---

## 10 · Other static / pipeline checks

| Suite | Status | Notes |
|---|---|---|
| Marketing copy enterprise audit | **PASS** | 257 files scanned, 0 warn/info |
| App-link integrity | **PASS** | 367 links validated, 0 broken |
| Admin nav integrity | **PASS** | 20 sidebar routes vs 25 admin routes; 5 admin pages have no sidebar entry — that's the design, but worth double-checking the gap list isn't growing |
| Security baseline | **PASS** | 8/8, fail=0 |
| Security monitoring wiring | **PASS** | 10/10 |
| Design check | **PASS** | |
| PDF render | **PASS** | board-pack 17.5 KB / 1pg, posture-report 16.4 KB / 1pg, audit-extract 18.6 KB / 2pg |
| Bundle size | **PASS** | Within caps (see §1) |

---

## 11 · Suites known but not executed in this audit

These exist in the repo but were intentionally not invoked in this run (require external infra, paid services, or destructive ops):

- `load-tests/*.js` (k6 against prod URLs)
- `npm run test:visual` (Playwright snapshot regression — requires reference set, large baseline diff would dwarf this report)
- `npm run tracetest:local` (requires Tracetest stack via `docker-compose.tracetest.yml`)
- `selenium-tests/*` (legacy Selenium suite; superseded by Playwright in current contracts)
- `npm run test:lighthouse` (LHCI full preset — `test:lighthouse:public` covers the gated public set used in CI)
- `npm run check:production-config` (asserts production env strictness; would fail in this local profile)
- `npm run db:test:reset` / `db:test:verify` (destructive Supabase reset)
- `qa/`-rooted Python visual scripts (`scripts/visual-audit.py`, ad-hoc)

If you want any of these added to this audit, say which and I'll fire a follow-up run.

---

## 12 · Raw artefacts

All raw logs from this run live under `audit-2026-05-24/raw/` — one log per suite. Inspect the `.log` file matching any suite name above for full output and the exit code marker (`<SUITE>_EXIT=N`).

- **Jest:** `jest.log` + `jest-results.json` (8.6 MB); coverage HTML in `coverage/lcov-report/index.html`.
- **Playwright:** `playwright-full.log` (~5 MB; includes embedded list output and final JSON stats block); on-failure screenshots/videos under `test-results/`.
- **Lighthouse:** `lighthouse-public.log` + per-route JSON under `.lighthouseci/public/*.json` + `.lighthouseci/public/summary.json`.
- **Compliance:** `gdpr.log`, `soc2.log` + `tests/compliance/reports/gdpr-compliance-report.json`, `tests/compliance/reports/soc2-compliance-report.json` (overwritten by this run).
- **Security baseline / monitoring:** `security-baseline.log`, `security-monitoring.log` + `artifacts/security-monitoring-report.json` (overwritten by this run).
- **Supabase / DB:** `supabase-health.log` / `supabase-health2.log`, `db-integrity.log` / `db-integrity2.log`, `rls.log` / `rls2.log`, `rls-drift.log`, `orgs-sync.log` / `orgs-sync2.log` — `*2.log` variants ran with `.env.local` sourced.
- **Static checks:** `typecheck.log`, `lint.log`, `stylelint.log`, `design-check.log`, `bundle-size.log`, `app-links.log`, `admin-nav.log`, `api-contracts.log`, `marketing-copy.log`, `pdf-render.log`, `stripe-prices.log`, `ab-testing.log`, `quick-qa.log`.


---

---

## 13 · Recommended next-step priority (release blockers vs. cleanup)

> Ordering reflects HIGH-before-MED across areas (matches your stated severity preference). Nothing here is "do this now to fix"; this is a triage map for whoever picks up the work.

**CRITICAL (do not ship without resolving):**
1. Resolve Supabase upstream timeout and **re-run the DB-bound half of this audit** (Playwright skipped 424 tests, RLS live probe couldn't run, 5 DB scripts failed at connect, A11y deep gate couldn't even bootstrap).
2. Triage the 16 tables flagged as having no `ENABLE ROW LEVEL SECURITY` against the live catalog. If any are genuinely RLS-off in production, that is a cross-tenant data exposure.
3. Fix `STRIPE_PRICE_GROWTH` (currently points to the Scale product) and set `STRIPE_PRICE_SCALE` before any growth-plan checkout is allowed to launch.

**HIGH (real product/content bugs surfaced by this run):**
4. `changelog-page.spec.ts` — marketing changelog doesn't satisfy current expectations.
5. `healthcare-ndis-positioning.spec.ts` x2 — hero copy on Healthcare and NDIS use-case pages drifted from spec.
6. `node-wire.spec.ts:308` — "Book Demo" homepage CTA no longer routes to `/contact`.
7. `node-wire.spec.ts:516` — basic accessibility › accessible navigation regression.
8. `public-buying-motion.spec.ts:84` — compare page contains trial-funnel copy it shouldn't.

**MEDIUM (compliance + ratchet drift):**
9. Address GDPR gaps: controller information, legal basis declaration, DSAR/erasure/portability flows, cookie consent banner with granular options, marketing consent separation.
10. Address SOC2 gaps: CC6.2 Authorization (admin), CC6.1 Session Management, A1.3 Backup/Recovery documentation, PI1.1 Data Integrity, C1.2 RBAC.
11. Clean up the 10-entry OpenAPI ratchet drift in `scripts/api-contracts-known-undocumented.json`.

**LOW (cosmetic):**
12. Auto-fix the 17 ESLint warnings (`npm run lint:fix` covers 7 of them; the rest are unused imports/vars).
13. Investigate /changelog Lighthouse performance score (65 vs the rest at 75–76) — likely the wrapper image set or content list.
14. Investigate the Jest worker exit warning ("worker failed to exit gracefully") with `--detectOpenHandles`.

---

## 14 · Run audit summary

- **Wall-clock window:** ~67 min (02:56 – 04:03 ACST).
- **Suites kicked off:** 25 distinct test/audit suites, run in parallel where possible.
- **Total tests executed in this run:** ~6,140
  - Jest unit: **5,348** (5,333 pass / 0 fail / 15 skip)
  - Playwright E2E: **788** (346 pass / 18 fail / 424 skip / 0 flaky)
  - GDPR: 12 (3 pass / 9 fail)
  - SOC2: 13 (5 pass / 6 fail / 1 null + 2 violations)
  - A/B test configs: 5 (5 valid)
  - Lighthouse routes: 6 (all 100/100/92 on a11y/bp/seo; perf 65–76)
  - API contracts: 57 OpenAPI operations validated + 10 ratchet failures
  - App-link integrity: 367 links checked
  - RLS scan: 208 tables (17 fail / 21 warn)
  - Bundle: 352 chunks measured

This was a comprehensive sweep — every audit script published in the repo's `package.json` plus every Playwright spec under `e2e/` was either executed or explicitly documented as a known skip (§11).

