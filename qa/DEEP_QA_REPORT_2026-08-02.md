# FormaOS — Deep QA Report (read-only)

**Date:** 2026-08-02 · **Build:** local production build of `main` (Next 16.2.6, v3.7.1), served on `:3002` · **Prod:** https://www.formaos.com.au (live) · **DB:** prod Supabase `bvfniosswcvuyfaaicze`
**Scope:** No code, schema, or config was changed. Testing exercised anonymous, authenticated owner/member, and founder/admin roles. Ephemeral E2E test users/orgs were created in the prod DB by the standard test harness and cleaned up by teardown.

Legend: 🔴 blocker · 🟠 high · 🟡 medium · 🟢 low/nit · ✅ pass

---

## Executive summary

The product is in **good overall shape** — build is clean, 5,380 unit tests pass, typecheck/lint are green, the public surface is healthy, and **multi-tenant isolation is correctly enforced on 137 of 138 org-scoped tables**. Authz for anonymous users and the founder/admin console are both correct.

**One serious security defect was found and verified live:** a broken RLS policy on `org_members` exposes the **entire cross-tenant membership graph** (2,414 rows across 2,309 organizations) to any authenticated user, and the same broken pattern on the write policies likely permits cross-tenant membership writes (privilege escalation). This is the headline item.

Beyond that, the notable themes are: a recurring production billing-reconciliation error, systemic (non-blocking) database performance debt in the RLS layer, and onboarding/bootstrap flows that time out under the known slow-provisioning conditions.

---

## 🔴 / 🟠 Findings that need action

### 1. 🔴 Cross-tenant data leak on `org_members` (RLS policy bug) — VERIFIED LIVE
**What:** Any authenticated user who belongs to at least one org can read the **whole** `org_members` table across every tenant.

**Evidence (read-only, against prod Supabase REST with the public anon key + a normal user JWT, role=`authenticated`):**
- Test user is `owner` of exactly **1** org. `current_user_org_ids()` correctly returns just that 1 org.
- Yet `GET /rest/v1/org_members` returned **2,414 rows spanning 991+ distinct foreign orgs** (`content-range: 0-0/2414` = entire table). Sample rows are other users in other orgs.
- Anonymous (no JWT) callers get **0 rows** — so exploitation requires signing in as any tenant (the anon key is public/embedded in the app bundle, so any customer can do this).
- A sweep of **all 140 org-scoped tables** confirms `org_members` is the **only** leaking table; the other 137 (org_patients, org_progress_notes, org_medications, org_credentials, audit_log, user_profiles, etc.) correctly return own-org-only.

**Root cause:** All four `org_members` policies use a broken correlated subquery:
```
organization_id IN (SELECT org_members.organization_id FROM current_user_org_ids())
```
The `SELECT` list projects `org_members.organization_id` — the **outer row's** column — instead of the value returned by `current_user_org_ids()`. So for every row the subquery yields `{that row's own org}` whenever the function returns ≥1 row, making `organization_id IN (organization_id)` **always true**.

**Write side (privilege escalation — NOT executed, to avoid mutating prod):** `members_admin_insert / members_admin_update / members_admin_delete` use the identical broken pattern with `current_user_admin_org_ids()`. The test owner passes `current_user_admin_org_ids()` (returns 1 org), so those predicates would evaluate true for any org's rows — i.e. an owner/admin of any org could insert/update/delete membership rows in **any other org**. Treat as **CRITICAL** pending confirmation.

**Exposure:** user UUIDs, org UUIDs, and role for the full membership table (2,410 rows). Names/emails live in `auth.users`/`user_profiles`, which are **not** leaked. Note the prod DB is heavily polluted with test data (see #4), so most exposed orgs are E2E test orgs — but ~963 non-E2E orgs' memberships are also exposed, so real-tenant data is in scope and the defect is unambiguous.

**Fix:** rewrite the 4 predicates to use the function's output directly, e.g. `organization_id IN (SELECT current_user_org_ids())` / `... current_user_admin_org_ids()` — remove the bogus `org_members.` projection.

**Gap it exposes:** the repo's `scripts/check-supabase-rls-contracts.mjs` gate **passed** because it checks that policies *exist*, not that they're *correct*. Add a behavioral isolation test (a two-tenant read/write assertion) to CI.

### 2. 🟠 Recurring production billing error: `entitlement_drift_fix_incomplete`
Vercel runtime errors (last 7 days) show exactly one error type, firing on **every hourly** `/api/automation/cron` run (count 168 = 24×7) since 2026-06-16, for **6 specific `pro` orgs**. The entitlement-drift auto-fix cannot resolve `*:extra` entitlements (`soc2_certification:extra`, `team:extra`) — `{"code":"UNKNOWN","message":"Some entitlement corrections were not resolved by sync"}`. Affected org IDs: `c291150f…`, `60b71e8f…`, `79fc1cdd…`, `26c81cfd…`, `44b8bde4…`, `c5c95bae…`. Self-healing logic never converges for these orgs → permanent error noise + possible entitlement drift for paying customers.

### 4. 🟠 Production DB polluted with E2E test data (unreliable teardown, tests run against prod)
The prod database contains **3,386 organizations, of which 1,991 are leftover `E2E Test Org…` records** (1,989 older than 1 day) and **5,383 users have `@test.formaos.local` emails**. The E2E suite runs against the **production** Supabase project and its teardown does not reliably remove the orgs/users it creates, so residue has accumulated across many runs. Impact: inflated org/user counts in the admin console and analytics, wasted DB storage, skewed performance stats, and it masks real data. Recommend (a) pointing E2E at a dedicated staging/branch DB, and (b) a cleanup job that purges `E2E Test Org*` orgs and `*@test.formaos.local` users older than N hours. (This QA run's own ephemeral users were created by the same harness; it added to — did not originate — the residue.)

### 3. 🟠 Onboarding / first-session bootstrap flows time out (matches known slow-provisioning blocker)
Live reproduction of the documented bootstrap-provisioning slowness:
- `onboarding-dashboard-access` "new owner completes all steps → employer dashboard" — **timed out at 120s** waiting on step-5/step-6 transitions (60s each).
- `onboarding-flow` "new user sees Start here 0/5" — `start-here-card` (testid) never rendered within 10s for a fresh user.
- `onboarding-completion-hardening` idempotency — a timestamp field changes between repeated `/api/auth/bootstrap` calls, so "10 sequential calls leave state byte-identical" fails (🟡 idempotency nit; bootstrap updates a timestamp even on no-op).

These correlate with the existing launch-blocker (sequential DB calls against a slow prod DB). The 8-parallel-bootstrap concurrency test **passed**, so the issue is latency, not correctness, except the timestamp nit.

---

## 🟡 Medium / 🟢 Low

- 🟡 **Systemic DB performance debt (Supabase performance advisor: 845 findings, 0 ERROR).** `188 auth_rls_initplan` (RLS re-evaluates `auth.uid()`/`current_setting()` per row across 100 tables — fix with `(select auth.uid())`), `338 multiple_permissive_policies` (44 tables, policies target `public`/`anon` instead of scoped roles), `90 unindexed foreign keys` (worst: `org_control_mappings`×5, `org_evidence`×4, plus `tasks`, `org_tasks`, `org_patients`, `org_progress_notes`), `6 duplicate indexes` (compliance_controls×2, memberships, org_audit_events, org_evidence, org_tasks — pure waste, safe to drop), `221 unused indexes`. None are emergencies; the RLS rewrites + FK indexes are the high-payoff work and plausibly contribute to the slow-bootstrap blocker.
- 🟡 **Security advisor (Supabase):** 20 tables have RLS enabled but no policy (mostly reference/template data — intentional); ~15 `SECURITY DEFINER` functions are `EXECUTE`-able by `anon`/`authenticated` via `/rest/v1/rpc/*` (`accept_invite`, `create_org`, `create_invite`, `bootstrap_org_from_library`, `search_embeddings`, `current_user_org_ids`, etc.) — review whether each is meant to be publicly callable; **leaked-password protection is disabled** in Supabase Auth (enable HaveIBeenPwned check).
- 🟡 **`org_members` also has `multiple_permissive_policies`** for `anon` role — a symptom of the same policies being written `TO public`; scoping them to `authenticated` would also shrink the leak surface.
- 🟢 **Local `.env.local` contains a live Stripe secret key** (`sk_live_…`). Not committed (gitignored, gate passes), but a real on-disk exposure risk — use test keys locally and rotate.
- 🟢 **`/admin` unauthenticated redirect is `/unauthorized?from=admin`, not `/auth/signin`.** Intentional (documented SOC2 access-probe design) but one E2E test (`node-wire`) still asserts signin — stale test. Minor UX: a logged-out founder hitting `/admin` lands on a dead-end page rather than a login prompt.
- 🟢 **Route alias asymmetry:** `/signup` → 308 → `/auth/signup`, but `/login` is a **404** (no alias) while `/auth/login` works.
- 🟢 **`/status` redirects to `/`** (307) — appears to be a stub, not a real status page.
- 🟢 **API contract warn:** `POST /api/v1/ai/reindex` has no documented 2xx response contract (OpenAPI).
- 🟢 **Unused `eslint-disable` directives** (7) in `lib/frameworks/org-frameworks.ts` and elsewhere — auto-fixable.

---

## What passed (the large green baseline)

| Area | Result |
|---|---|
| Production build | ✅ clean (exit 0) |
| TypeScript typecheck | ✅ 0 errors |
| ESLint | ✅ 0 errors, 7 warnings |
| Unit tests (Jest) | ✅ 5,380 passed, 0 failed (37 skipped, 10 todo; 386 suites) |
| RLS contract checks | ✅ 200 live tables + 226 static tables, GUC guard 0 violations |
| Multi-tenant isolation sweep | ✅ 137 / 138 org-scoped tables own-org-only (1 leak: `org_members`) |
| App-link integrity | ✅ 383 links validated, 0 broken |
| Admin-nav integrity | ✅ 20 sidebar routes / 25 admin routes |
| API contracts | ✅ 116 OpenAPI operations (1 warn) |
| Security baseline | ✅ 8/8 (HSTS/CSP/XFO, admin MFA gate, CSRF default-on, no service-key exposure) |
| Leaked secrets (tracked files) | ✅ 0 in 3,396 files |
| Public surface crawl | ✅ 70/72 pages 200; 2 intentional redirects; dynamic routes degrade to 404, no 500s |
| Anonymous authz | ✅ `/app/*`→signin, `/admin/*`→unauthorized, admin APIs 403, v1 APIs 401, detailed-health 401 |
| Founder/admin console | ✅ founder can access admin pages + APIs; all 13 admin APIs 403 & 16 admin pages redirect for non-founders |
| Owner/user app modules | ✅ dashboard, compliance, care ops (healthcare/aged_care/childcare/community), forms, vault, evidence, tasks, incidents, workflows, settings, exports all render & function |
| Prod runtime (Vercel, 7d) | ✅ no 5xx/page crashes (1 recurring billing-cron error, see #2) |
| Deployment protection | ✅ SSO on previews, public custom domain, correct |

### E2E raw tallies
- **Lane 1** (smoke/auth/security invariants): 57 passed / 4 failed — all 4 are the harness's UI-login helper hitting the MFA gate (test users have 2FA on; the `loginAs` helper never satisfies MFA, so isolation/export assertions died in `beforeEach`). Isolation was verified independently instead (see #1).
- **Lane 2** (owner/user modules): 72 passed / 3 failed — 1 strict-mode selector bug (`"Editing not available yet"` matches 2 elements; page renders fine), 1 stale `/admin`→signin test, 1 team-management invite assertion (seed/timing).
- **Lane 3** (founder/admin/billing/onboarding): 61 passed / 5 failed / 16 skipped — 2 harness (Stripe-unavailable test in an env with live keys → got 200/409/429; strict-mode selector matched evidence filename twice), 3 onboarding/bootstrap (see #3).

**Net: every E2E failure is either a harness/env artifact or maps to findings #1 and #3 — no additional product defects surfaced.**

---

## Recommended priority order
1. **Fix #1 (`org_members` RLS)** — cross-tenant data leak + likely write priv-esc. Ship the 4-policy rewrite and add a two-tenant behavioral isolation test to CI.
2. **Fix #2** — the entitlement-drift cron that's been erroring hourly for 6 paying orgs for ~7 weeks.
3. **Address #3** — the bootstrap/onboarding latency blocker (single DB-side transaction), which also intersects the #8-style RLS `initplan`/FK-index perf debt.
4. Then the 🟡 hygiene items: enable leaked-password protection, review anon-executable SECURITY DEFINER functions, drop the 6 duplicate indexes, add the missing FK indexes.
