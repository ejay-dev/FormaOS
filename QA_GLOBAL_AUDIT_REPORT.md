# FormaOS Global QA Audit Report

Date: 2026-02-04
Scope: Marketing site + app (local build) + production read-only checks

## 1) Test Commands Executed (with outputs)

### Local
- `npm run lint` → warnings only (no errors). Log: `logs/qa-audit/npm-run-lint-2.log`
- `npm run typecheck` → pass. Log: `logs/qa-audit/npm-run-typecheck-3.log`
- `npm run build` → pass with Next warnings (multiple lockfiles, middleware deprecation, edge runtime). Log: `logs/qa-audit/npm-run-build-2.log`
- `npx playwright test --config=playwright.config.ts` (local prod build server) → **160 passed / 10 skipped / 0 failed**. Log: `logs/qa-audit/playwright-local-10.log`
- `node scripts/site-audit.js` → pass. Log: `logs/qa-audit/site-audit-local.log`
- `node node_wire_verification_test.js` → pass. Log: `logs/qa-audit/node-wire-verification.log`
- `bash validate-production.sh` → pass (local checks). Log: `logs/qa-audit/validate-production.log`
- `bash validate-rls.sh` → pass (static + manual placeholders). Log: `logs/qa-audit/validate-rls.log`
- `node scripts/qa-auth-flows.js` → **blocked** (missing `test-results/qa-test-accounts.json`). Log: `logs/qa-audit/qa-auth-flows.log`

### Production (read-only)
- `PLAYWRIGHT_SITE_BASE=https://www.formaos.com.au PLAYWRIGHT_APP_BASE=https://app.formaos.com.au npx playwright test --config=playwright.prod.config.ts`
  - **Result: 160 passed / 10 skipped / 0 failed**
  - Log: `logs/qa-audit/playwright-prod-3.log`

## 2) Playwright Artifacts
- Local artifacts: `test-results/` and `playwright-report/`
- Production artifacts: `test-results/prod/` and `playwright-report/prod/`

## 3) Bugs Found + Fixes (Local Code)

### Bug A — Homepage hydration mismatch (console error)
1. **Repro**
   - Visit `/` and open browser console.
   - Hydration mismatch warnings appear from random particle positions.
2. **Root cause**
   - `Industries` in `app/(marketing)/components/FigmaHomepage.tsx` generated background particles using `Math.random()` during render, causing SSR/client mismatch.
3. **Fix**
   - Added deterministic `seededRandom` with `useMemo` to generate stable particle coordinates for SSR and first hydration render.
4. **Proof**
   - Local Playwright console error checks now pass.
   - Log: `logs/qa-audit/playwright-local-10.log`

### Bug B — Request Demo CTA not reliably navigating (Firefox)
1. **Repro**
   - On `/`, click **Request Demo** in Firefox. Navigation did not always occur in automated runs.
2. **Root cause**
   - CTA layering/interaction could intercept clicks in Firefox; link did not always bubble above overlays.
3. **Fix**
   - Updated CTA to ensure it sits above overlay layers and uses explicit router navigation: `z-30`, `pointer-events-auto`, and a guarded `router.push('/contact')` click handler.
   - File: `app/(marketing)/components/FigmaHomepage.tsx`.
4. **Proof**
   - Local Playwright CTA tests pass in all projects.
   - Log: `logs/qa-audit/playwright-local-10.log`

### Bug C — Marketing CTA wiring to app domain (pricing + header/menu)
1. **Repro**
   - On marketing pages, CTAs like **Start Free**, **Login**, and pricing plan actions sometimes used site-relative URLs instead of app domain.
2. **Root cause**
   - Hardcoded/relative URLs in marketing components.
3. **Fix**
   - Unified CTA base using `NEXT_PUBLIC_APP_URL` fallback to `https://app.formaos.com.au`.
   - Updated files:
     - `app/(marketing)/components/HeaderCTA.tsx`
     - `app/(marketing)/components/MobileNav.tsx`
     - `app/(marketing)/components/CinematicHero.tsx`
     - `app/(marketing)/components/oauth-redirect-wrapper.tsx`
     - `app/(marketing)/product/ProductHero.tsx`
     - `app/(marketing)/pricing/PricingPageContentSync.tsx`
4. **Proof**
   - Local Playwright CTA suite passes.
   - Log: `logs/qa-audit/playwright-local-10.log`

### Bug D — Playwright stability + nav flakiness (local)
1. **Repro**
   - Intermittent failures in WebKit/Firefox for nav + CTA tests; dev-server chunk load errors.
2. **Root cause**
   - Dev server compilation and brittle click timing in tests.
3. **Fix**
   - Switched local Playwright to run against a production build (`npm run build && npm run start`).
   - Added hardened nav click helper and mobile menu handling in `e2e/node-wire.spec.ts` and `e2e/cta.spec.ts`.
4. **Proof**
   - Local Playwright suite passes across all projects.
   - Log: `logs/qa-audit/playwright-local-10.log`

### Bug E — Production CTA navigation flake (test harness)
1. **Repro**
   - Production Playwright in Firefox intermittently failed to detect navigation after clicking **Request Demo**.
2. **Root cause**
   - CTA tests used `force` clicks without explicit navigation waits and did not normalize `www` variations.
3. **Fix**
   - Added site-base variants and explicit `waitForURL` for CTA navigation in `e2e/cta.spec.ts` and `e2e/node-wire.spec.ts`.
4. **Proof**
   - Production Playwright run passes across all projects.
   - Log: `logs/qa-audit/playwright-prod-3.log`

## 4) Production Findings (Read-only)

### No blocking issues observed
- Latest production run passed across Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari.
- See `logs/qa-audit/playwright-prod-3.log` for full output.

## 5) Database / RLS / Supabase Audit (Static + Local)

### Static RLS checks (migrations)
- RLS enabled tables found: **49**
- Tables with policies found: **62**
- **RLS enabled but no policy:** **none**
- Command run (static analysis): Python scan over `supabase/migrations/*.sql` (see terminal output).

### Views exposure
- Views defined in `supabase/migrations/20260402_secure_public_views.sql` do **not** reference `auth.users`.
- `user_profiles_public` explicitly avoids `auth.users` and uses `public.user_profiles` only.

### Schema consistency (plan_key)
- `plan_key` column exists in migrations (`supabase/migrations/20250314_org_onboarding_fields.sql`) and referenced consistently in code.

### Supabase CLI / live DB checks
- **Blocked:** No Supabase credentials or CLI context provided. Scripts requiring service keys could not be executed.
  - `scripts/test-db-integrity.js`, `check-schema.js` require `.env.local` and service role keys.
  - `scripts/qa-auth-flows.js` blocked by missing `test-results/qa-test-accounts.json`.

## 6) Required Journey Coverage (Local)
- Marketing → App CTA wiring: **passed** (local)
- Auth flows (error paths, redirects): **partial** (requires real accounts; QA auth flow script blocked)
- Onboarding + role routing: **requires authenticated accounts** (not executed; no credentials)
- App core flows (create/edit/read): **requires authenticated accounts** (not executed; no credentials)
- Cross-domain + deep links: **passed for public routes** (local)

## 7) Remaining Known Issues (Must Resolve Before Prod Sign-off)
- None observed in the tested scope.

## 7b) Blocked Coverage (Requires Credentials)
- QA auth flow automation blocked without `test-results/qa-test-accounts.json` and service keys.
- Authenticated app journeys, onboarding, and RLS live verification require test accounts or a QA environment.

## 8) Confirmation Status
- **Local build:** 0 build errors ✅
- **Local runtime crashes:** none observed ✅
- **Local CTA wiring:** pass ✅
- **Production CTA wiring:** pass ✅
- **Dead-end nodes:** none detected in local nav flow ✅

## 9) Notes / Actions Required
- Provide Supabase service credentials or a restricted QA environment to complete RLS/orphaned-user and authenticated flow audits.
- Provide QA test accounts (or a secure seed) to run authenticated journeys and onboarding verification.
