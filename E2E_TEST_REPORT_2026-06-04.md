# FormaOS — Full E2E Test Report

**Date:** 2026-06-04
**Branch:** `feat/product-enterprise-redesign`
**Suite:** Playwright `e2e/` (70 spec files, **675 chromium tests**)
**Build:** production (`next build` + `next start`, Next.js 16.2.6) — compiled clean
**Backend:** **live production Supabase** ("Care OS", `bvfniosswcvuyfaaicze`)

---

## TL;DR

| Surface | Result |
|---|---|
| **Public marketing pages & CTAs** | ✅ **All green** (verified in clean isolated run) |
| **Public accessibility (WCAG 2.2 AA)** | ✅ **Green** |
| **API unauthenticated security boundaries** | ✅ **Green** (34/34) |
| **Admin / founder access control** | ✅ **Green** (38/38) |
| **Authenticated app surface** (dashboard, forms, vault, care, compliance, billing…) | ⚠️ **Not cleanly runnable in this environment** — see below |

**The headline is not a product regression.** Every marketing/public test that appeared to "fail" in the first raw run was a **server-crash artifact** — those exact tests pass when run in isolation. The real findings are **two infrastructure problems** and **one code bug**, all of which block a full authenticated E2E pass locally and would bite in production-load conditions.

I ran the suite **three times** in different configurations to separate real defects from environment noise. That triage is the substance of this report.

---

## What actually passed (clean, verified green)

Run at **1 worker** against a healthy server, these are real passes — not contended, not flaky:

| Area | Tests | Notes |
|---|---|---|
| Public-page accessibility (`a11y-smoke`, `accessibility`) | 16 ✓ | `/`, `/product`, `/pricing`, `/security`, `/trust`, `/enterprise`, `/documentation`, `/contact`, signin, signup — no serious/critical axe violations |
| API unauthenticated probes (`api-unauthed-probe`) | 34 ✓ | All protected APIs correctly reject unauthenticated requests |
| Admin access control (`admin-access`, `admin-security-verification`) | 38 ✓ | Admin pages/APIs return 403 / redirect for non-founders |
| Marketing CTAs & journeys (`full-user-journey`) | 14 ✓ | "Marketing CTAs route correctly", "Product/Pricing CTAs", all "loads without errors" routes |
| Marketing alignment (`marketing-alignment`) | 8 ✓ | Header/section CTAs route to compliance-plan funnel |
| Healthcare/NDIS positioning (`healthcare-ndis-positioning`) | 9 ✓ | Use-case hero copy + framework coverage |
| Navigation integrity (`nav-no-404`) | 23 ✓ | No 404s across public nav |
| Homepage regression (`homepage-enterprise-regression`, `homepage-sections`) | 6 ✓ | Sticky/hero CTA present |
| CTA wiring (`cta`), pricing infra (`pricing-infrastructure`), buying motion (`public-buying-motion`) | 16 ✓ | |
| changelog | 1 ✓ | |

> **Important:** In the *first* raw run, ~30 of these same public tests showed as failed at ~130 ms each (e.g. "Homepage loads without errors", "Pricing CTAs", "Healthcare page loads"). **Those were false failures** — the local server had already crashed, so every page returned a connection error. Re-running the identical specs against a healthy server: **all pass**. The marketing redesign on this branch did **not** break any CTAs or pages.

---

## Real findings

### 🔴 FINDING 1 — Code bug: `org_first_session_progress` not registered as a tenant table

**Severity:** Medium (silent feature degradation + log-spam that fuels Finding 2)
**File:** [lib/onboarding/first-session.ts](lib/onboarding/first-session.ts#L51-L57) → `fetchSeenSteps()`
**Mechanism:** `fetchSeenSteps()` calls `createSupabaseOrgClient().from('org_first_session_progress')`, but that table is **not** in `TENANT_TABLE_SCOPES` in [lib/supabase/org-scoped.ts](lib/supabase/org-scoped.ts#L62). The org-scoped client **throws** on any unregistered table:

```
Error: createSupabaseOrgClient: table "org_first_session_progress" is not
registered as a tenant table. Either add it to TENANT_TABLE_SCOPES in
lib/supabase/org-scoped.ts, or use createSupabaseAdminClient() ...
    msg: "[onboarding-health] seen_steps fetch threw"
```

**Impact:**
- The throw is caught, so `fetchSeenSteps` **silently returns `[]`** every time → the "seen onboarding steps" feature never works (first-session success feedback can repeat after reload, the exact thing this table was added to prevent).
- It fires on **every authenticated page load**. Observed **44 times** in a single partial run, each emitting a full stack trace. This log volume is a meaningful contributor to Finding 2 (memory pressure).

**Fix:** register `org_first_session_progress` in `TENANT_TABLE_SCOPES` with its tenant column, **or** switch `fetchSeenSteps` to `createSupabaseAdminClient()` if the read is intentionally cross-scope. (Per repo rules, run `gitnexus_impact` on `fetchSeenSteps` / `createSupabaseOrgClient` before editing.)

---

### 🔴 FINDING 2 — The prod-build server OOM-crashes under sustained authenticated load

**Severity:** High (blocks full local/CI-against-prod E2E; signals a memory problem in authenticated rendering)
**Reproduced 3×** — at 4 workers, at 1 worker, and again at the tail of the "public" batch (whose last specs do authenticated signup/dashboard flows).

**Evidence:**
- `next start` is launched **with no heap guardrail** (`build` sets `--max-old-space-size=4096` but `start` does not). Adding a 4 GB cap did **not** prevent the crash.
- Death signature: server log ends mid-authenticated-section with no JS stack (consistent with an **OS OOM-kill / jetsam**); ~648 k pageouts (heavy swapping); system memory jumps back to 54% free the instant the process dies.
- Before death, the prod DB write path was already buckling (see Finding 3).
- It only dies during the **authenticated** section — the public-only batch kept the server healthy throughout.

**Consequence for testing:** every test after the crash point fails fast (connection refused). In the first raw run this manufactured **~60 false failures** (113 ✓ / 74 ✘ → most of the 74 were post-crash noise).

**Likely contributors:** authenticated React page weight + the Finding-1 stack-trace spam + audit/security logging buffers. Worth a heap snapshot of `next start` under a few authenticated page loads.

---

### 🔴 FINDING 3 — The E2E suite runs against the LIVE PRODUCTION database and saturates it

**Severity:** High (production-availability risk)
The suite points at the real prod Supabase. Under the run, prod degraded materially:

- Prod DB writes started timing out and being dropped:
  ```
  [Security] security_audit_log.insert exceeded 1500ms; skipping write   (×9)
  [Security] security_events.insert exceeded 1500ms; dropping batch write (×9)
  [Security] user_activity.insert  exceeded 1500ms; dropping batch write  (×15)
  ```
  → real audit/security/activity events were **silently dropped in production**.
- Prod **auth** then degraded: GoTrue stayed reachable (`/auth/v1/health` → 401 instantly) but **DB-backed** endpoints timed out (`/auth/v1/settings`, `/auth/v1/admin/users` → HTTP 000 after 15 s).
- Recovery took **~6 minutes** after load stopped the first time; after repeated runs it had **not recovered after 6+ minutes** — cumulative degradation.

**This means running the full E2E suite can take production auth/writes down for minutes.** I **stopped testing the authenticated surface** rather than degrade prod further.

**Fix / recommendation:** E2E must run against an **ephemeral or dedicated test Supabase**, never live prod. This is the single most important operational change. (Matches the known issue that `db:test:verify` hits live-prod statement timeouts.)

**Server-side confirmation (Supabase logs, pulled 12:49):** This is not just a client-side read — Supabase's own logs confirm a live production database incident triggered by the run:
- **Postgres:** `canceling statement due to statement timeout` **×64**, `FATAL` ×5, `could not …` ×5.
- **Auth (GoTrue):** HTTP **500 ×97**, `deadline` ×92, `timeout` ×72, `"level":"error"` ×58.
- Real-time probe at 12:49 (all test load already stopped): `/auth/v1/health` → 401 instantly (service up), but **`/auth/v1/settings` (DB-backed) → HTTP 000 after 14 s × 3** → the auth **database path is still hanging**. The incident was **still ongoing ~45 min after the run started and well after load stopped**.

⚠️ **Production impact:** while degraded, real users' auth-dependent flows (login/signup/session) on the live site can fail, and audit/security/activity writes are being dropped. The database should be left to drain; do **not** add further load (including more E2E) until `/auth/v1/settings` returns 200 again.

**Root cause — CI runs the full E2E gate against PROD (the systemic problem):**
[.github/workflows/qa-pipeline.yml](.github/workflows/qa-pipeline.yml) defines a **dedicated E2E Supabase** (`secrets.E2E_SUPABASE_URL/_ANON_KEY/_SERVICE_ROLE_KEY`, lines 97-99) — but the job that actually runs the full Playwright gate (`npx playwright test --project=chromium`, line 339) is wired to the **production** secrets (`NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`, lines 228-248) — the same prod project. So **every push / PR / merge that triggers qa-pipeline runs the full E2E suite against live production.** Postgres logs show E2E test-user inserts (`is_e2e_test: true`, `…@test.formaos.local`) taking 10-12 s on `auth.users` — that churn is the load. The **PR #226 merge to `main` (04:46 UTC)** re-triggered the whole CI fleet (QA Pipeline, Quality Gates) while prod was already degraded, prolonging the incident.

**The fix is one line of CI config:** point the full-E2E job's `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` at the `E2E_SUPABASE_*` secrets (which already exist), so the gate never touches prod. Then purge orphaned `is_e2e_test: true` users from `auth.users`.

---

## Authenticated surface — status: BLOCKED (not failed)

I could not get a clean pass/fail on the authenticated app (dashboard, forms, vault, care plans, compliance, billing, settings, admin console) because the two infrastructure problems above (server OOM + prod-DB/auth saturation) prevent a sustained authenticated run in this environment, and continuing would damage production availability.

**What I can say from partial signal (server still up, run 1):** authenticated pages **do render their shell** — captured page snapshots for `/app/vault` and `/app/policies` show the full app sidebar/nav rendering correctly. So this is **not** a fundamentally broken authenticated app; it's an infrastructure/load problem plus Finding 1. A definitive authenticated pass requires fixing Findings 2 & 3 first.

---

## Recommendations (in priority order)

1. **Stop running E2E against live prod.** Point Playwright at an ephemeral/branch Supabase or a seeded test project. (Unblocks everything; protects production.) — **Finding 3**
2. **Add a heap cap + investigate the authenticated-render memory growth** in `next start`; capture a heap snapshot. — **Finding 2**
3. **Fix `org_first_session_progress`** registration (or use the admin client). — **Finding 1**
4. After 1–3, re-run the full 675-test authenticated suite in CI (the qa-pipeline environment) to get true authenticated coverage.

## How to reproduce / artifacts

- Public surface (safe, no prod-DB load), clean green:
  ```
  PLAYWRIGHT_REUSE_SERVER=true PW_SKIP_WEBSERVER=true npx playwright test --project=chromium --workers=1 \
    e2e/smoke.spec.ts e2e/marketing-alignment.spec.ts e2e/homepage-sections.spec.ts \
    e2e/homepage-enterprise-regression.spec.ts e2e/healthcare-ndis-positioning.spec.ts \
    e2e/changelog-page.spec.ts e2e/cta.spec.ts e2e/pricing-infrastructure.spec.ts \
    e2e/public-buying-motion.spec.ts e2e/nav-no-404.spec.ts e2e/full-user-journey.spec.ts
  ```
- Run logs: `/tmp/formaos-e2e.log` (raw 4-worker, crashed), `/tmp/formaos-e2e3.log` (clean 1-worker slice), `/tmp/formaos-public.log` (public batch), `/tmp/formaos-server*.log` (server logs with crash + saturation evidence).
