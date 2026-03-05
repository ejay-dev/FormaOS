# FormaOS Full Codebase Audit

**Date:** 5 March 2026
**Scope:** Full source audit — security, architecture, code quality, and reliability
**Auditor:** Independent technical review
**Excluded:** Phase 5 (Enterprise Buyer Simulation) and Phase 6 (Enterprise Product Positioning) — those audits are already in progress per `TODO.md`

---

## Executive Summary

FormaOS has a solid security foundation with good practices in place: rate limiting with Redis-backed sliding windows, structured permission guards, Stripe webhook signature verification, TOTP 2FA, password-breach checking, timing-safe token comparisons, and strong HTTP security headers. The codebase compiles cleanly with zero TypeScript errors.

However, several targeted security weaknesses exist that need remediation before the platform handles sensitive compliance data at enterprise scale. Additionally, some architectural patterns introduce reliability and consistency gaps that should be addressed.

**Findings Summary:**
| Severity | Count |
|----------|-------|
| 🔴 Critical | 4 |
| 🟠 High | 4 |
| 🟡 Medium | 7 |
| 🔵 Low / Code Quality | 6 |

---

## 🔴 Critical Findings

---

### C-1: 2FA Backup Codes use `Math.random()` — Not Cryptographically Secure

**File:** `lib/security.ts:47`

```ts
const backupCodes = Array.from({ length: 8 }, () =>
  Math.random().toString(36).substring(2, 10).toUpperCase(),
);
```

`Math.random()` in V8/Node.js is not a CSPRNG. An attacker who can determine the PRNG state (e.g., through timing side channels or XS-Leaks) could predict all 8 backup codes. Backup codes are single-use 2FA bypass credentials — their compromise fully bypasses two-factor authentication.

**Fix:**

```ts
import { randomBytes } from 'crypto';

const backupCodes = Array.from({ length: 8 }, () =>
  randomBytes(6).toString('hex').toUpperCase(),
);
```

---

### C-2: `disable2FA` Skips Password Verification

**File:** `lib/security.ts:163`

```ts
export async function disable2FA(userId: string, _password: string): Promise<boolean> {
  // Verify password (implement password verification)
  // const passwordValid = await verifyPassword(userId, password);
  // if (!passwordValid) return false;
```

The password verification is entirely commented out. Any authenticated session (including a stolen session cookie) can disable 2FA without re-confirming the user's password. This negates the security model of 2FA: an attacker who gains temporary session access can permanently remove the 2FA protection without knowing the password.

**Fix:** Uncomment and implement `verifyPassword`. Call Supabase `signInWithPassword` to re-validate credentials before allowing 2FA removal. The route `app/api/security/mfa/disable/route.ts` already accepts the `password` field — it just needs this to actually matter.

---

### C-3: Raw Supabase Error Objects Leaked to API Clients

**File:** `app/api/auth/signup/route.ts:45, 58`

```ts
return NextResponse.json({ ok: false, error: orgError }, { status: 500 });
// ...
return NextResponse.json({ ok: false, error: memberError }, { status: 500 });
```

Supabase error objects contain internal details: table names, constraint names (e.g., `org_members_pkey`), column names, and sometimes partial SQL. This is an information disclosure vulnerability that maps internal schema to external attackers.

The same pattern also appears in `app/api/debug/bootstrap/route.ts:76, 89` (debug-guarded, lower risk).

**Fix:** Return a generic error string:

```ts
return NextResponse.json(
  { ok: false, error: 'organization_creation_failed' },
  { status: 500 },
);
```

Log the full `orgError` server-side only.

---

### C-4: `/api/trust-packet/vendor` Is Public and Unrate-Limited — DoS Risk

**File:** `app/api/trust-packet/vendor/route.ts`

This endpoint:

1. Has no authentication requirement
2. Has no rate limiting
3. Queries the database for 20,000+ uptime records
4. Generates a multi-page PDF on every request

A single attacker can hammer this endpoint with concurrent requests, saturating the Supabase connection pool and consuming large amounts of CPU/memory on each PDF generation. This is a serverless amplification DoS vector.

**Fix:**

- Add rate limiting (e.g., `RATE_LIMITS.EXPORT` config — 5 req / 10 min per IP)
- Add HTTP caching (the uptime data changes slowly):
  ```ts
  'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
  ```
- Or generate the PDF at build time / on a cron and serve the cached result

---

## 🟠 High Severity

---

### H-1: Session Token Insecure Fallback Path

**File:** `lib/security/session-security.ts:76`

```ts
} else {
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
}
```

If `globalThis.crypto.getRandomValues` is unavailable (degraded environment, edge runtime misconfiguration), session tokens fall back to being generated with `Math.random()`. Such tokens would be fully predictable given knowledge of PRNG state.

In Node.js 18+ / Vercel functions environment, `globalThis.crypto` is always present, so this fallback should never trigger in production. However, the fallback itself is a time-bomb that creates a false sense of security.

**Fix:** Remove the fallback entirely. Throw a hard error instead:

```ts
} else {
  throw new Error('crypto.getRandomValues is not available — cannot generate secure session token');
}
```

---

### H-2: No Root-Level Next.js Middleware — No Route Protection Backstop

There is no `middleware.ts` at the project root. Every one of the 107 API routes must individually implement auth checks. There is no centralized control point to enforce authentication as a baseline.

Evidence: the grep for routes without explicit auth patterns found 15+ routes that don't match common auth patterns. While several are intentionally public (health, billing webhook, SSO, trust-packet), the absence of middleware means a developer adding a new route can forget auth checks with no safety net.

**Fix:** Add a root `middleware.ts` that:

1. Blocks all `/app/*` page routes for unauthenticated users (redirect to `/signin`)
2. Blocks all `/api/*` routes (except an explicit allowlist) with a 401 for unauthenticated requests
3. Adds `x-verified-ip` header using `request.ip` so rate limiters trust server-determined IPs rather than user-supplied `x-forwarded-for`

---

### H-3: `getUserContext()` Picks Arbitrary First Org for Multi-Org Users

**File:** `lib/api-permission-guards.ts:38`

```ts
const { data: membership } = await supabase
  .from('org_members')
  .select('organization_id, role')
  .eq('user_id', user.id)
  .maybeSingle();
```

`.maybeSingle()` returns the first row found from the database. For a user who is a member of multiple organizations (e.g., a consultant, or someone who accepted invitations from two orgs), the "first" membership is determined by Postgres index scan order — non-deterministic from the application's perspective.

This affects all code paths using this function: webhook registration, audit log access, compliance endpoints.

Compare to `getMembershipData()` in `lib/system-state/server.ts` which correctly uses `pickPrimaryMembership()` with role-weight sorting.

**Fix:** Adopt the same `pickPrimaryMembership` pattern in `getUserContext()`, or add an `order('created_at', { ascending: true })` to get the oldest (primary) membership consistently.

---

### H-4: Multiple Authenticated Routes Lack Rate Limiting

Routes that accept authenticated POST requests and perform database writes but have **no rate limiting**:

| Route                                        | Risk                           |
| -------------------------------------------- | ------------------------------ |
| `app/api/auth/bootstrap/route.ts`            | Session creation amplification |
| `app/api/onboarding/select-plan/route.ts`    | Org creation spam              |
| `app/api/onboarding/checklist/route.ts`      | DB write spam                  |
| `app/api/compliance/exports/create/route.ts` | Export job queue flooding      |
| `app/api/reports/export/route.ts`            | Report generation flooding     |
| `app/api/staff-credentials/export/route.ts`  | Export abuse                   |
| `app/api/incidents/export/route.ts`          | Export abuse                   |

Authentication prevents external abuse but not abuse by authenticated users (e.g., a compromised account, or a paying customer intentionally abusing the system).

**Fix:** Apply `RATE_LIMITS.API` or `RATE_LIMITS.EXPORT` to each of these routes.

---

## 🟡 Medium Severity

---

### M-1: `unauthorizedResponse()` Returns HTTP 403 Instead of 401 for Unauthenticated Users

**File:** `lib/api-permission-guards.ts:84`

```ts
export function unauthorizedResponse(reason: string = 'Unauthorized') {
  return NextResponse.json({ error: reason }, { status: 403 });
```

HTTP semantics: `401` = not authenticated, `403` = authenticated but forbidden. Using 403 for unauthenticated requests causes OAuth clients and SDKs to mishandle the response (they won't prompt for re-authentication), and breaks API consumers that pattern-match on status codes.

**Fix:** Change to `status: 401` for unauthenticated cases. Create a separate `forbiddenResponse()` for `403` cases.

---

### M-2: In-Memory Rate Limit Fallback Is Not Distributed

**File:** `lib/security/rate-limiter.ts` (memory store)

When Redis is unavailable, the rate limiter falls back to an in-memory `Map`. On Vercel, each function invocation can be a separate process. A single user could send `maxRequests × concurrentInstances` requests before being rate-limited.

This specifically affects auth endpoints (`rateLimitAuth` is 10 req / 10 min) — the effective limit without Redis could be effectively unbounded.

**Fix:** Log a loud warning when the fallback activates. Consider failing closed (returning 429) for auth-critical rate limiters when Redis is down, rather than falling back to memory.

---

### M-3: `createSupabaseAdminClient()` Silently Returns a No-Op Client on Misconfiguration

**File:** `lib/supabase/admin.ts`

When `SUPABASE_SERVICE_ROLE_KEY` is missing or invalid, `createSupabaseAdminClient()` returns a fake "fallback" client that silently swallows all queries and returns empty results. Callers won't receive errors — they'll receive `{ data: null, error: { message: '...' } }` silently.

This means cron jobs, billing webhooks, and admin operations could silently do nothing in a misconfigured environment with no runtime crash.

**Fix:** Throw at construction time when service role config is missing in non-test environments:

```ts
if (!hasValidUrl || !serviceKey) {
  throw new Error(
    '[Supabase] Service role client cannot be constructed — check SUPABASE_SERVICE_ROLE_KEY',
  );
}
```

---

### M-4: 2FA Secret Stored as Plaintext Despite "Encrypted" Comment

**File:** `lib/security.ts:54`

```ts
// Store secret (encrypted)
const supabase = await createClient();
await supabase.from('user_security').upsert({
  user_id: userId,
  two_factor_secret: secret.base32,  // ← plaintext base32
```

The comment says "encrypted" but no encryption is applied. The TOTP secret is stored as a raw base32 string in the database. Anyone with read access to the `user_security` table (or a Supabase service role key) can extract secrets and generate valid TOTP codes indefinitely.

**Fix:** Encrypt the secret with `AES-256-GCM` or `crypto.createCipheriv` using a server-side encryption key (`TOTP_ENCRYPTION_KEY` env var) before storing. Decrypt only during verification.

---

### M-5: TOTP Verification Window of ±2 Steps is Overly Generous

**File:** `lib/security.ts` (both `verify2FAToken` and `enable2FA`)

```ts
speakeasy.totp.verify({ ..., window: 2 });
```

`window: 2` means codes from ±60 seconds are accepted (each TOTP step is 30s). The NIST recommendation is `window: 1` (±30s). `window: 2` increases the brute-force window and code reuse window.

**Fix:** Change to `window: 1`. If clock drift is a concern, implement NTP sync monitoring rather than widening the acceptance window.

---

### M-6: 65 `any` Types in API Routes

```bash
grep -rn ": any" app/api/ --include="*.ts" | wc -l
# → 65
```

`any` casts in API route handlers bypass TypeScript's type guards. In routes like `app/api/admin/security/route.ts`: `events.filter((e: any) => ...)` — if the database schema changes, the code silently processes wrong-shaped data.

**Fix:** Run `npx tsc --strict` and address `any` usages in security-sensitive routes first. Replace with typed Supabase row types using `supabase-js` generated types.

---

### M-7: `lib/security/correlation.ts` Uses `Math.random()` — Collision Risk at Scale

**File:** `lib/security/correlation.ts:7`

```ts
return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
```

Correlation IDs are used for distributed tracing across logs. With high request concurrency (Vercel scales horizontally), two requests could theoretically get the same timestamp and the same `Math.random()` output if initialized at the same V8 startup seed. This would merge two separate request traces in logs.

**Fix:**

```ts
import { randomUUID } from 'crypto';
return randomUUID();
```

---

## 🔵 Low / Code Quality

---

### L-1: `lib/permissions.ts` is Dead Code

The file is fully deprecated, exports `@deprecated` types, and was never imported during this audit. It should be deleted to reduce confusion and prevent future accidental imports.

**Fix:** `trash lib/permissions.ts`

---

### L-2: 149 `console.*` Statements in API Routes Instead of Structured Logger

`lib/logger.ts` exists as a structured logger. However, API routes use `console.error`, `console.warn`, and `console.log` directly in 149 places. This means:

- No correlation IDs attached to logs
- No log-level filtering
- No structured JSON in log aggregators (e.g., Datadog, LogDNA)

**Fix:** Replace `console.error('[route] message', err)` with `logger.error({ route: '...', err }, 'message')` progressively, starting with security-sensitive routes.

---

### L-3: `async function disable2FA` Accepts But Ignores the `_password` Parameter

The `_` prefix signals intentional ignoring, but since this is security code the parameter should not be silently swallowed — see C-2 above. The parameter naming reinforces the false security assumption.

---

### L-4: `app/api/auth/signup/route.ts` UUID Fallback is Malformed

```ts
const userId =
  (globalThis as any).crypto?.randomUUID?.() ??
  `00000000-0000-4000-8000-${Date.now()}`;
```

The fallback UUID format `00000000-0000-4000-8000-${Date.now()}` does not conform to UUIDv4 format (the last segment must be 12 hex characters, not 13 decimal digits). If Postgres has a UUID format constraint on the column, this would cause an insert failure. If not, it would cause ID parsing issues downstream.

Note: this route is guarded by `ensureDebugAccess()` (development only), so it's lower risk in production, but still incorrect.

**Fix:** `import { randomUUID } from 'crypto'` and use that directly.

---

### L-5: `getSubscriptionDataCached` and `getEntitlementsCached` Share Generic Cache Keys

**File:** `lib/system-state/server.ts`

```ts
unstable_cache(async (orgId: string) => ..., ['subscription-data'], { revalidate: 300 })
unstable_cache(async (orgId: string) => ..., ['entitlements-data'], { revalidate: 300 })
```

The `unstable_cache` key `['subscription-data']` does not include `orgId`. This means the cache key is shared across all organizations, and the first org's data will be served to subsequent requests for different orgs until TTL expiry.

**Fix:**

```ts
unstable_cache(
  async (orgId: string) => getSubscriptionDataFresh(orgId),
  // ↓ Include the dynamic parameter in the key
  [(orgId: string) => `subscription-data:${orgId}`],
  { revalidate: 300, tags: ['subscription'] },
);
```

Or pass the key as a dependency:

```ts
unstable_cache(fn, ['subscription-data', orgId], ...)
```

> ⚠️ **This is a data isolation bug** — it may intermittently serve one org's subscription data to another org. Requires immediate investigation and testing.

---

### L-6: No CORS Configuration on `/api/v1/` Public API Routes

The v1 REST API (`/api/v1/audit-logs`, `/api/v1/tasks`, etc.) is a documented external integration API. There are no explicit CORS headers set, meaning cross-origin requests from browser-based third-party integrators would be blocked by browsers. If this API is intended to be consumed from browser environments, CORS headers are required.

**Fix:** Add a `corsHeaders` response helper and apply it to v1 routes, or configure CORS in `next.config.ts` headers rules scoped to `/api/v1/*`.

---

## Summary Table

| ID  | Description                                       | File(s)                                | Severity    |
| --- | ------------------------------------------------- | -------------------------------------- | ----------- |
| C-1 | 2FA backup codes use `Math.random()`              | `lib/security.ts:47`                   | 🔴 Critical |
| C-2 | `disable2FA` skips password verification          | `lib/security.ts:163`                  | 🔴 Critical |
| C-3 | Raw DB errors leaked in API response              | `app/api/auth/signup/route.ts:45,58`   | 🔴 Critical |
| C-4 | Public PDF endpoint with no rate limiting         | `app/api/trust-packet/vendor/route.ts` | 🔴 Critical |
| H-1 | Session token insecure fallback path              | `lib/security/session-security.ts:76`  | 🟠 High     |
| H-2 | No root Next.js middleware backstop               | (missing `middleware.ts`)              | 🟠 High     |
| H-3 | `getUserContext` inconsistent multi-org selection | `lib/api-permission-guards.ts:38`      | 🟠 High     |
| H-4 | Multiple authenticated routes lack rate limiting  | Various (8 routes)                     | 🟠 High     |
| M-1 | `unauthorizedResponse` returns 403 not 401        | `lib/api-permission-guards.ts:84`      | 🟡 Medium   |
| M-2 | In-memory RL fallback not distributed             | `lib/security/rate-limiter.ts`         | 🟡 Medium   |
| M-3 | Admin Supabase client silently returns no-op      | `lib/supabase/admin.ts`                | 🟡 Medium   |
| M-4 | TOTP secret stored as plaintext                   | `lib/security.ts:54`                   | 🟡 Medium   |
| M-5 | TOTP window ±2 is overly generous                 | `lib/security.ts`                      | 🟡 Medium   |
| M-6 | 65 `any` types in API routes                      | `app/api/**`                           | 🟡 Medium   |
| M-7 | Correlation IDs use non-CSPRNG                    | `lib/security/correlation.ts:7`        | 🟡 Medium   |
| L-1 | Dead deprecated `lib/permissions.ts`              | `lib/permissions.ts`                   | 🔵 Low      |
| L-2 | 149 `console.*` instead of structured logger      | `app/api/**`                           | 🔵 Low      |
| L-3 | `_password` param silently ignored                | `lib/security.ts:163`                  | 🔵 Low      |
| L-4 | Malformed UUID fallback in debug signup           | `app/api/auth/signup/route.ts`         | 🔵 Low      |
| L-5 | `unstable_cache` keys don't include `orgId`       | `lib/system-state/server.ts`           | 🔵 Low\*    |
| L-6 | No CORS headers on `/api/v1/` routes              | `app/api/v1/**`                        | 🔵 Low      |

> \*L-5 is marked Low but has **data isolation implications** — treat as Medium/High if multiple orgs share the same deployment.

---

## Positive Findings

The following security practices are well-implemented and should be preserved:

- ✅ Stripe webhook signature verification with `stripe.webhooks.constructEvent`
- ✅ `timingSafeEqual` used for all token comparisons (health endpoint, cron secret)
- ✅ Password breach-checking via HaveIBeenPwned API (`lib/security/password-security.ts`)
- ✅ Password reuse history tracking (`lib/security/password-history.ts`)
- ✅ `poweredByHeader: false` in next.config.ts removing the `x-powered-by` fingerprint
- ✅ `X-Frame-Options: DENY` and full HTTP security header suite in `next.config.ts`
- ✅ HSTS with `preload` and `includeSubDomains`
- ✅ Zod schema validation on all public-facing signup inputs
- ✅ Rate limiting with Redis sliding window on auth routes
- ✅ Idempotent billing webhook processing with unique event ID constraint
- ✅ `requireFounderAccess()` uses Supabase session (not just headers) for admin checks
- ✅ Debug endpoints blocked in non-development environments via `NODE_ENV` guard
- ✅ TypeScript passes with zero errors (`npx tsc --noEmit` clean)
- ✅ `lib/security/session-security.ts` uses `SHA-256` for session token hashing

---

## Priority Remediation Order

1. **L-5** — `unstable_cache` key bug (potential cross-org data leak, investigate immediately)
2. **C-2** — Re-enable password verification before disabling 2FA
3. **C-1** — Replace `Math.random()` backup codes with `crypto.randomBytes`
4. **C-4** — Add rate limiting and caching to trust-packet vendor endpoint
5. **C-3** — Replace raw error objects with generic error strings in API responses
6. **H-2** — Add root `middleware.ts` as auth backstop
7. **H-4** — Apply rate limiting to the 8 unprotected write routes
8. **H-3** — Fix `getUserContext` multi-org selection
9. **M-4** — Encrypt TOTP secret before storage
10. **H-1** — Remove unsafe session token fallback

---

_Report generated 2026-03-05. Does not overlap with Phase 5 (Enterprise Buyer Simulation) or Phase 6 (Enterprise Product Positioning Report) audits currently in progress._
