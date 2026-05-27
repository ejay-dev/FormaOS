# 01 — Development

For an engineer joining cold. By the end of this doc you should be able to (a) run FormaOS locally, (b) navigate the repo with intent, and (c) ship a small change without breaking conventions.

## 1. Stack — what runs where

| Layer | Choice | Why / notes |
|---|---|---|
| **Web framework** | Next.js 16 (App Router) — `^16.1.6` declared, resolves to `16.2.4` | Server components by default, route handlers under `app/api/`. Runtime: Node.js 20.x (declared in `engines`). |
| **UI** | React `19.2.3` + Tailwind CSS `3.4.17` + Radix UI primitives + `lucide-react` icons | `components/ui/` is the project's design-token wrapper layer. Marketing demo components live in `components/marketing/` and `components/motion/` — they intentionally bypass the design tokens. |
| **Language** | TypeScript `5.9.3`, strict mode | Two configs: `tsconfig.json` (build) and `tsconfig.typecheck.json` (CI gate — **excludes `__tests__/`, `tests/`, `e2e/`**, see §8). |
| **Database** | Supabase Postgres 17 (project ref `bvfniosswcvuyfaaicze`, region `ap-southeast-1`, name "Care OS"). RLS on every tenant table. Migrations in `supabase/migrations/`. | The MCP server `mcp__claude_ai_Supabase__*` is wired in tooling. The Supabase CLI is also configured (`supabase/` config dir). |
| **Auth** | Supabase Auth via `@supabase/ssr` + Google OAuth + email/password + magic link + SAML/SSO + SCIM for enterprise | MFA via TOTP (encrypted at rest with `TOTP_ENCRYPTION_KEY`, AES-256-GCM). Backup codes hashed with scrypt + atomic single-use via the `consume_backup_code_hash` RPC. |
| **Billing** | Stripe `^22.1.1` (SDK pinned to API version `2026-04-22.dahlia`) | Webhook idempotency via `billing_events` table, customer-drift + first-bind guards in the webhook handler. Stripe Tax for AU GST. Plans defined in `lib/plans.ts`. |
| **Cache / rate-limiting** | Upstash Redis (`UPSTASH_REDIS_REST_*`) with in-memory fallback for non-critical rate limiters | `lib/security/rate-limiter.ts` has the bucket definitions. Auth-critical buckets are fail-closed; UX-critical ones are fail-open. |
| **Background jobs** | Trigger.dev + Vercel Cron + manual processors | Cron entries in `vercel.json`. See [02-workflow.md §Crons](./02-workflow.md). |
| **Email** | Resend | Templates in `emails/`. Webhook + signed unsubscribe tokens (`EMAIL_UNSUBSCRIBE_SECRET`). |
| **Observability** | Sentry (server + client + edge configs) + OpenTelemetry (HTTP + undici spans) + Langfuse (LLM ops, optional) + PostHog (client-side; **server capture not yet wired**) + structured pino logger (`lib/monitoring/server-logger.ts` via `routeLog(route)`) | PII scrubbing in `lib/sentry/scrub-pii.ts` covers emails, tokens, PCI fields, SSN/TFN/ABN, PHI (DOB, phone, address, names, emergency contact, diagnosis). |
| **Test framework** | Jest 30.x (jsdom default, `@jest-environment node` for integration) + Playwright 1.55 for E2E + Pa11y/Axe for a11y + Lighthouse CI for perf | See §8. |
| **Hosting** | Vercel project `forma-os` (`prj_xHXEcnSdaZq1kB3eSqMtcYs2IINR`), region `syd1` only | Configured in `vercel.json`. Cron entries + per-function timeouts there too. |
| **Search** | Postgres full-text + curated views | No external search service. |

## 2. Architecture mental model

Three surfaces, one codebase:

```
┌─────────────────────────────────────────────────────────────────────┐
│ Marketing site                  → app/(marketing)/                  │
│ /, /pricing, /trust, /security, /enterprise, /blog/...              │
│ Public, indexed, no auth. Different design system (cyan accent).    │
└─────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────┐
│ Product app                     → app/app/                          │
│ /app/dashboard, /app/incidents, /app/evidence, /app/billing, ...    │
│ Multi-tenant, RLS-scoped. Calls server actions in app/app/actions/  │
│ + API routes in app/api/v1/. Enterprise-aesthetic design.           │
└─────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────┐
│ Admin console                   → app/admin/                        │
│ Founder + delegated platform-admin only. Customer-360, lifecycle    │
│ ops, releases, control-plane. Approval-gated mutations per          │
│ ADMIN_OPERATING_POLICY.md.                                          │
└─────────────────────────────────────────────────────────────────────┘
```

**Request flow** (typical product-app mutation):

```
Browser
  → Server Action in app/app/actions/<domain>.ts
    → Domain helper in lib/<domain>/
      → createSupabaseOrgClient(orgId)        ← tenant-scoped
        → PostgREST → Postgres + RLS
      → logAuditEventCore(...)                ← hash-chained audit
      → revalidatePath/revalidateTag          ← Next.js cache bust
  → Client receives updated server-rendered HTML
```

**External-integrator flow** (a customer's Zapier-style integration hitting our v1 API):

```
Customer system
  → Bearer fos_xxx
    → app/api/v1/<resource>/route.ts
      → authenticateV1Request(request, {requiredScopes, ...})
        → API-key validation, rate-limit, scope check, subscription check
      → Zod parse req.body
      → Domain helper or org-scoped Supabase call
      → JSON envelope reply
```

**Webhook flow** (Stripe billing event):

```
Stripe
  → app/api/billing/webhook/route.ts
    → constructEvent (signature verify)
    → claim `billing_events` row (idempotency)
    → upsertFromSubscription (drift / first-bind guards)
    → syncEntitlementsForPlan
    → writeBillingAudit
  → 200 OK
```

## 3. Repo layout

```
/
├── app/                            ← Next.js App Router. THREE route groups.
│   ├── (marketing)/                ← public marketing pages
│   ├── (standalone)/               ← standalone flows (auth callbacks, plan-select)
│   ├── api/                        ← route handlers
│   │   ├── v1/                     ← public API (Bearer fos_xxx or session fallback)
│   │   ├── admin/                  ← platform admin (founder + delegated)
│   │   ├── auth/                   ← signup, signin, MFA, password reset
│   │   ├── billing/                ← Stripe webhook, checkout, portal
│   │   ├── cron/                   ← Vercel cron handlers
│   │   ├── webhooks/               ← inbound webhooks from third parties
│   │   └── ...                     ← comments, feedback, csp-report, etc.
│   ├── admin/                      ← admin console UI
│   ├── app/                        ← authenticated product UI + server actions
│   │   └── actions/                ← server actions (form/mutation entry points)
│   └── auth/, onboarding/, signin/, etc.
│
├── components/                     ← shared React components
│   ├── ui/                         ← design-token primitives (button, input, dialog, ...)
│   ├── admin/                      ← admin-console widgets
│   ├── compliance/                 ← compliance-specific widgets
│   ├── care/                       ← care-ops widgets
│   ├── marketing/                  ← marketing-page components (intentionally NOT token-scoped)
│   ├── motion/                     ← motion/animation showcase (marketing only)
│   └── ...                         ← 70+ domain subdirs
│
├── lib/                            ← domain logic, isomorphic helpers, infra wrappers
│   ├── supabase/                   ← admin / server / browser / org-scoped clients
│   ├── auth/                       ← session, MFA, SSO, SCIM, JWT helpers, session-revocation
│   ├── api-keys/                   ← fos_xxx key mgmt + middleware
│   ├── billing/                    ← Stripe + entitlements + plans + grace period
│   ├── audit/                      ← hash-chain audit writer + redactor
│   ├── audit-reports/              ← compliance report builder + PDF generator
│   ├── compliance/                 ← framework engine + control evaluators
│   ├── admin/                      ← admin actions, audit, GDPR purge, org lifecycle
│   ├── security/                   ← rate limits, CSRF, password security, session security
│   ├── observability/              ← structured logger, OpenTelemetry, paging
│   ├── eslint/                     ← custom ESLint rules (formaos/* — see §6.4)
│   └── ...                         ← ~100 subdirs total
│
├── supabase/migrations/            ← 220+ SQL migrations. Source of truth for schema.
├── framework-packs/                ← bundled framework definitions (SOC 2, ISO, NDIS, etc.)
├── docs/                           ← all written documentation (incl. this folder)
├── e2e/                            ← Playwright specs
├── __tests__/                      ← jest unit + integration tests (alongside lib/)
├── tests/                          ← jest tests + load/perf + factory fixtures
├── scripts/                        ← CI scripts, env checks, audit gates, helpers
├── .github/workflows/              ← 12 GitHub Actions workflows
├── proxy.ts                        ← Next.js middleware (CSRF, CSP, cookie hygiene)
├── vercel.json                     ← cron schedule + per-route function timeouts
└── package.json                    ← 70 deps, scripts, engines
```

**The map you'll consult most often**: `lib/<domain>/` for backend logic, `app/api/v1/<resource>/route.ts` for the public API, `app/app/actions/<domain>.ts` for product-app mutations, `components/<domain>/` for matching UI.

## 4. Local development

### 4.1 First-time setup

```bash
# Node 20 required (not 22+, not 18 — strict).
nvm install 20 && nvm use 20

# Clone + install
git clone git@github.com:ejay-dev/FormaOS.git
cd FormaOS
npm install

# Env vars — copy the example and fill in
cp .env.example .env.local
# Then edit .env.local with the values from your Vercel project settings
# (see 03-services-and-access.md for what each key is and where to source it)

# Verify env is sane — this fails fast with a list of missing/invalid keys
npm run check-env

# Start dev server
npm run dev
# → http://localhost:3000
```

### 4.2 Recurring commands

| Command | What it does | When |
|---|---|---|
| `npm run dev` | Next.js dev server (Turbopack) | Always during work |
| `npm run type-check` | Run `tsc -p tsconfig.typecheck.json`, fast, no emit | Before every PR; pre-push hook recommended |
| `npm run lint` | ESLint everywhere | Before PR. CI caps warnings at 25. |
| `npm run lint:tenant-isolation` | The `formaos/no-admin-client-with-org-filter` rule — separate config because it warns on ~278 historical sites | Periodically. Ratchet at `scripts/check-tenant-isolation-ratchet.mjs` blocks count growth. |
| `npm run build` | Production build with `CHECK_ENV_STRICT=1` | Before deploy; CI runs this. |
| `npm run test` / `npm run test:coverage` | Jest unit + integration | Before PR for changed areas |
| `npm run test:e2e` | Full Playwright suite, chromium-only release gate | Heavy — typically CI-only |
| `npm run test:e2e:smoke` / `qa:smoke` | Lightweight E2E (3-4 specs) | Pre-commit if you've touched auth or core flows |
| `npm run test:db:rls` | Live RLS contract check via Supabase | Required Supabase creds; runs on every PR via the `rls-contract` workflow |
| `npm run check:security-baseline` | 8-check static security gate (env files, headers, MFA gate, CSRF, etc.) | CI runs this; you can locally too |
| `npm run check:framework-packs` | Verify SHA-256 hashes of framework packs match manifest | Run after any change in `framework-packs/` |

### 4.3 Required env vars

`.env.example` is the source of truth — copy + fill. Production-critical ones (validated by `check-env` strictly when `CHECK_ENV_STRICT=1` or in Vercel prod):

- **Supabase**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **App**: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_URL`, `FOUNDER_EMAILS`
- **Stripe**: `STRIPE_SECRET_KEY` (sk_test_ for dev, sk_live_ for prod), `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_FOUNDATION/GROWTH/SCALE`, `STRIPE_REQUIRE_LIVEMODE_IN_PROD=true`
- **Resend**: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- **Redis**: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- **Cron auth**: `CRON_SECRET`
- **Sentry**: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`
- **Encryption keys** (rotate carefully — affects all existing data): `TOTP_ENCRYPTION_KEY` (32-byte hex), `INTEGRATION_CONFIG_KEY`, `TRUST_PACKET_SIGNING_KEY`, `EMAIL_UNSUBSCRIBE_SECRET`
- **Health**: `HEALTH_DETAILED_FOUNDER_TOKEN`

Optional / per-feature: SAML SP key/cert, VAPID web-push, FCM server key, OpenTelemetry endpoint, Langfuse keys, PagerDuty routing key. See `.env.example` for the full annotated list.

### 4.4 Two known local-dev gotchas

1. **Node 20 + Supabase JS** — `supabase-js` eagerly instantiates `RealtimeClient` which expects `globalThis.WebSocket`. Node 20 doesn't have it. Three CI scripts hit this; the workaround is `scripts/_node20-ws-shim.mjs` (side-effect import). If you write a new script that uses `createClient`, import the shim first. (Node 22+ has native WebSocket and the shim becomes a no-op.)
2. **Jest + integration tests** — `jest.setup.js` replaces `global.fetch` with `jest.fn()`, which crashes integration tests that hit real Supabase. The existing `__tests__/integration/rls/*.test.ts` files work around it but the underlying setup gap is a real follow-up. If you're writing a new integration test, override `globalThis.fetch` from `undici` inside the test file's `beforeAll`.

## 5. Database

### 5.1 Where schema lives

**`supabase/migrations/`** is the source of truth. Every schema change is a numbered SQL file. Naming convention:

```
20260624052_audit_2026_05_27_org_evidence_file_hash.sql
^^^^^^^^^^^^^ ^^^^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^^^^^^^^^^
timestamp     audit-cycle slug short description
```

Recent (audit-cycle) migrations have a defensive shape: pre-check counts, abort cleanly if anomalies, apply, post-condition assertion. Copy that style.

### 5.2 Three kinds of Supabase client (don't mix them up)

| Client | Source | Identity | Bypasses RLS? | When to use |
|---|---|---|---|---|
| `createSupabaseAdminClient()` | `lib/supabase/admin.ts` | service role | **Yes** | Privileged platform ops, webhooks, cron, admin endpoints. NEVER pair with a manual `.eq('org_id', x)` — the ESLint rule catches that. |
| `createSupabaseOrgClient(orgId)` | `lib/supabase/org-scoped.ts` | service role + scoped wrapper | RLS bypass + structural org filter | The default for any code path that knows its org. Stamps the org filter automatically so a missed `.eq()` can't leak cross-tenant. |
| `createSupabaseServerClient()` | `lib/supabase/server.ts` | authenticated user (from cookies) | No | Reading data on behalf of the signed-in user. RLS applies. |
| `createSupabaseBrowserClient()` | `lib/supabase/client.ts` | authenticated user | No | Browser-side only (real-time subscriptions, etc.) |

**Cardinal rule**: prefer `createSupabaseOrgClient` whenever you have an `orgId`. Only use `createSupabaseAdminClient` for cross-tenant ops (cron, billing reconciliation, platform admin) — and document why with an `// eslint-disable-next-line formaos/no-admin-client-with-org-filter` if the linter warns.

### 5.3 Migration apply paths

Two ways migrations get applied:

1. **`supabase db push` from CLI** (the documented path; requires `supabase/` config + service role).
2. **`mcp__claude_ai_Supabase__apply_migration` from the Supabase MCP** (used heavily during the recent audit cycle; bypasses the CLI but timestamps differently).

There's a known drift: `supabase_migrations.schema_migrations` has 19/217 of `supabase/migrations/` entries. Fresh `supabase create-branch` fails because of this. The repair runbook is at `docs/operations/migration-history-repair.md` — **fixing this is one of your first ops jobs** (it blocks new contributors).

### 5.4 RLS conventions

Every tenant table has:
- RLS `ENABLED` (and `FORCE`d for newer ones).
- A permissive `FOR SELECT` policy gated on `org_members` membership.
- A permissive `FOR ALL` or `FOR INSERT` policy from `service_role` for the write path.
- (Audit tables only) RESTRICTIVE `FOR UPDATE/DELETE USING (false)` policies preventing in-place mutation.

When you add a new tenant table:
1. Add `org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE`.
2. Enable RLS + add the membership SELECT policy + service_role write policy.
3. Add a composite index on `(organization_id, created_at DESC)` if you'll query by date.
4. The PR will fail the `rls-contract` workflow if you don't.

## 6. Conventions

### 6.1 Server actions

Mutations from product UI go through server actions in `app/app/actions/<domain>.ts`. Pattern:

```ts
'use server';

export async function createEvidence(input: { ... }) {
  // 1. Auth + org context (one of):
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');
  const ctx = await requireActiveOrgContext(supabase);
  if (!ctx.ok) return ctx.response;

  // 2. Zod-parse input. Refuse on parse failure.
  const parsed = CreateEvidenceSchema.parse(input);

  // 3. Domain logic via lib/<domain>/
  const result = await evidence.create(ctx.orgId, parsed);

  // 4. Audit-log it (hash-chained).
  await logAuditEvent({ organizationId, actorUserId, actionType, ... });

  // 5. Bust caches.
  revalidatePath('/app/evidence');
}
```

### 6.2 API routes

Public API routes (`app/api/v1/<resource>/route.ts`) wrap their handler with `authenticateV1Request`:

```ts
export async function POST(request: Request) {
  const auth = await authenticateV1Request(request, {
    requiredScopes: ['evidence:write'],
    requireActiveSubscription: true,
  });
  if (!auth.ok) return auth.response;
  const { orgId, userId, role, db } = auth.context;
  // ... Zod parse, do work, return JSON envelope ...
}
```

Admin routes (`app/api/admin/**/route.ts`) wrap with `requireAdminAccess`:

```ts
export async function POST(request: Request) {
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;
  const access = await requireAdminAccess({ permission: 'orgs:manage' });
  const reason = await requireAdminChangeControl({
    context: access, action: 'org_lock',
    targetType: 'organization', targetId: orgId,
    reason: extractAdminReason(body, request),
    requireApproval: true,
  });
  // ... do the thing ...
  await logAdminAction({ actorUserId: access.user.id, action: 'org_lock', ... });
}
```

### 6.3 Logging

Use `routeLog` from `lib/monitoring/server-logger.ts`. **Do not use `console.*` in `app/api/`** — the audit cycle migrated 73 such calls; the ESLint config doesn't yet enforce it but the convention is settled.

```ts
import { routeLog } from '@/lib/monitoring/server-logger';
const log = routeLog('/api/v1/evidence');

log.error({ err: error }, 'evidence create failed');
log.warn({ data: { count: rows.length } }, 'low-row warning');
log.info({ orgId }, 'sync started');
```

For domain-level structured logs (outside API routes), use the domain loggers from `lib/observability/structured-logger.ts` — `billingLogger`, `authLogger`, `exportLogger`, etc.

### 6.4 Custom ESLint rules

In `lib/eslint/formaos-design-rules.mjs`:

- `formaos/no-hardcoded-colors` — flags `bg-[#xxx]`, etc. Warn in app code, off in marketing.
- `formaos/no-admin-client-with-org-filter` — pairs `createSupabaseAdminClient()` with a manual `.eq('org_id', x)`. Default off (~278 historical sites — ratcheted, not blocked). Run `npm run lint:tenant-isolation` to see them.
- `formaos/no-math-random` — set to error on `lib/security/**` and `lib/api-keys/**`. New code there must use `crypto.randomUUID/randomInt/getRandomValues`.

### 6.5 Restricted imports

`eslint.config.mjs` has `no-restricted-imports` blocking:
- `@/lib/logger` (renamed to `@/lib/audit/legacy-log-activity` — for *real* structured logging use `@/lib/monitoring/server-logger` or the domain loggers)
- `@/lib/audit-trail` (deleted as of R2/audit-2026-05-27 — use `@/lib/audit/log-audit-event` via the `@/app/app/actions/audit` server-action wrapper)

### 6.6 Comments

Project preference (also encoded in `CLAUDE.md`): comments explain **why**, not what. A short "audit-2026-05-XX:" or "P0-Y:" prefix on a comment is the convention — it ties a piece of code to the audit cycle that put it there. Multi-line block docstrings are discouraged in favour of one tight sentence.

## 7. Testing

### 7.1 What runs where

| Suite | Where | Coverage gate | Run command |
|---|---|---|---|
| Jest unit + integration | `__tests__/`, `tests/` | Statements 40%, branches 34%, functions 43%, lines 40% (current actual is well above) | `npm run test` / `:coverage` |
| Playwright E2E (chromium release gate) | `e2e/*.spec.ts` (~80 specs) | n/a | `npm run test:e2e:bounded` (cap 25 failures) |
| Playwright smoke | `e2e/smoke.spec.ts` + `app-link-integrity` + `admin-founder-smoke` | required on PR | `npm run qa:smoke` |
| Visual regression | `playwright.capture.config.ts` (Backstop-style captured screenshots) | advisory | `npm run test:visual` |
| Accessibility (axe) | `e2e/accessibility.spec.ts` | required (no `serious` or `critical`) | `npm run test:a11y` |
| Lighthouse perf | `lighthouserc.json` (warn-only for perf, error for a11y) | advisory | `npm run test:lighthouse` |
| API contract diff | `scripts/check-api-contracts.mjs` | warn-only ratchet | `npm run test:api-contracts` |
| Live RLS contract | jest `__tests__/integration/rls/` + `scripts/check-supabase-rls-contracts.mjs` + `scripts/check-orgs-sync.mjs` | **required on PR** when secrets present | `npm run test:db:rls` |
| Compliance / GDPR / SOC2 | `tests/compliance/*` | advisory | `npm run test:compliance:gdpr` etc. |
| Load (k6) | `tests/load/` + `load-tests/` | scheduled | nightly |

### 7.2 Conventions for new tests

- **Unit tests** live alongside the lib they cover: `lib/foo/bar.ts` → `__tests__/lib/foo/bar.test.ts`.
- **`@jest-environment node`** at the top for any test that creates a real Supabase client or touches Node-only globals.
- **Mock factories** in `tests/factories/`. Don't roll your own.
- **Always test the deny path**. The codebase culture is suspicious of tests that only validate the happy path.

### 7.3 What CI runs on a PR

1. **type-check** (blocking) — note: this excludes `__tests__/`, `tests/`, `e2e/`. Test code typechecking is not gated.
2. **lint** with `--max-warnings 25` (blocking).
3. **unit tests + coverage** (blocking).
4. **rls-contract job** (blocking when secrets present, skipped on fork PRs).
5. **security-baseline** (blocking).
6. **build** (blocking).
7. **app-link integrity** (blocking).
8. **db verify** (blocking).
9. **Full E2E** (advisory).
10. **Visual regression** (advisory).
11. **Lighthouse + load** (advisory).
12. **Snyk + npm audit** (blocking on high-severity prod CVEs).

Full workflow definitions: `.github/workflows/`.

## 8. Debugging cheat sheet

| Symptom | Where to look |
|---|---|
| "Why isn't this row visible to the user?" | RLS policy on the table (`pg_policies`), then the user's `org_members` membership, then whether the call used `createSupabaseOrgClient` vs `createSupabaseAdminClient`. |
| "Audit chain broke / verifyChainIntegrity false" | `lib/audit/hash-utils.ts` — check the row's `sequence_number` continuity first (most common: deletion), then `entry_hash` recomputation per `hash_algo` (v1 vs v2). |
| "Stripe webhook keeps retrying" | `billing_events` table — claim/idempotency may be stuck in `pending`. Look at `app/api/billing/webhook/route.ts:200-280` for the claim logic. |
| "MFA verify slow / locked out" | `RATE_LIMITS.MFA_VERIFY_PER_USER` (10/15min, fail-closed); plus the account-lockout in `lib/security/account-lockout.ts` (5 in 15min). |
| "Subscription says past_due but customer says they paid" | Check `org_subscriptions.payment_failed_at` — the grace period cron (`enforce-grace-period`) flips entitlements after 3 days. Recovery via `invoice.paid` webhook. |
| "User is in 2 orgs and sees the wrong one" | `getSessionMembership` in `lib/api-keys/middleware.ts` reads `user_preferences.current_organization_id` first. Confirm that row is set correctly. |
| "Cron didn't fire" | `vercel.json` cron entries + Vercel dashboard → Crons. Cron auth via `verifyVercelCronRequest` (CRON_SECRET). |
| "Org X retired but data still there" | Expected if `ORG_PURGE_ENABLED!=true` OR `retire_purge_at > now()` OR `retire_export_job_id` is null / export status != completed. See `lib/admin/org-purge.ts`. |

## 9. What's intentionally weird (so you don't "fix" it)

- **`orgs` vs `organizations`** — legacy table `orgs` was dropped 2026-05-27 (R2/Phase B). All FKs now point at `organizations(id)`. The flipped invariant gate `scripts/check-orgs-sync.mjs` asserts `orgs` MUST stay dropped. If you ever need a legacy-org concept, name it differently.
- **Multiple "audit" modules** — `lib/audit/` is canonical (hash-chained). `lib/audit/legacy-log-activity.ts` exists for back-compat (some old callers haven't migrated yet). `lib/audit-trail.ts` was deleted 2026-05-27. `lib/audit-reports/` is for compliance report generation (different concern). `lib/auditor/` is the external-auditor portal.
- **`provision` vs `bootstrap`** — both exist (`lib/provisioning/`, `lib/bootstrap/`). `bootstrap` is the org-creation path, `provisioning` is the post-creation idempotent backfill that runs on auth callback. Don't merge them.
- **Comment audit comments** — `// audit-2026-05-XX:` or `// P0-Y:` prefixes on inline comments tie code to a specific audit batch. Don't strip them; they're how the team navigates the history.
- **`docs/dev-team-handover.md`** — 2026-04-29 single-file handover that predates the recent refactors. Useful for some historical context but **this folder supersedes it**.

## 10. What to do in your first week

This is opinion, not policy.

- **Day 1**: read all 6 handover docs, get the app running locally, run the full test suite once. Pair with the outgoing maintainer for 30 min if possible.
- **Day 2**: pick a small, low-risk warning from `npm run lint:tenant-isolation` (e.g., a cron file) and migrate it to `createSupabaseOrgClient`. Get a feel for PR → review → merge → deploy.
- **Day 3**: read `04-project-plan.md` carefully. The remaining audit items (R3-R6, R10, PagerDuty, status page) are the obvious 30/60/90 anchor.
- **Days 4-5**: provision PagerDuty, fix the migration-history-repair gap (it unblocks new contributors), and decide on the NDIS framework question (build real evaluators vs. temper marketing copy).

Welcome aboard. The codebase is more documented than most — use it.
