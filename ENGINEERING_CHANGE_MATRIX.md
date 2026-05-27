# FormaOS Engineering Change Matrix

Use this matrix before merging changes.

## Admin Console

- Areas: `app/admin`, `app/api/admin`, `lib/admin`, `lib/control-plane`
- Minimum checks:
  - `npx tsc -p tsconfig.json --noEmit`
  - `npm run check:admin-nav`
- Also verify:
  - CSRF still enforced on privileged mutations
  - audit logging still writes correctly
  - permission gates match route intent

## Billing / Trials / Entitlements

- Areas: `lib/billing`, `app/api/admin/orgs/*/plan`, `app/api/admin/trials*`
- Minimum checks:
  - `npx tsc -p tsconfig.json --noEmit`
- Also verify:
  - restore/blocked status logic
  - plan sync and entitlement sync
  - trial expiry/extension semantics

## Security / Sessions / Alerts

- Areas: `lib/security`, `app/api/admin/security*`, `app/api/session/*`
- Minimum checks:
  - `npx tsc -p tsconfig.json --noEmit`
  - `npm run check:security-baseline`
- Also verify:
  - authz boundaries
  - rate limiting
  - session revoke / alert state transitions

## Marketing / Trust / Enterprise Pages

- Areas: `app/(marketing)`
- Minimum checks:
  - `npx tsc -p tsconfig.json --noEmit`
  - `npm run audit:marketing-copy`
- Also verify:
  - no unsupported claims
  - trust/procurement links still resolve

## Migrations / Schema

- Areas: `supabase/migrations`
- Minimum checks:
  - `npx tsc -p tsconfig.json --noEmit`
  - `npm run test:db:ledger-alignment` (R6 — fails if FS files drift from the recorded ledger snapshot)
  - `npm run test:db:secdef-grants` (Audit 2026-05-27 — fails if a new SECURITY DEFINER function leaks anon/auth EXECUTE; allowlist in `scripts/.security-definer-rpc-allowlist.json`)
- Also verify:
  - route assumptions match column names
  - lifecycle/audit/status semantics stay consistent
  - new columns have safe defaults where needed
  - For SECURITY DEFINER functions: `REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated;`
    explicitly — Supabase auto-grants to anon + authenticated on CREATE FUNCTION
    via default privileges; a `REVOKE FROM PUBLIC` alone does NOT remove the
    explicit anon/auth grants. See `supabase/migrations/20260624060_*` for the canonical pattern.
- **Before applying a new migration to production**:
  - The historical "19/217 ledger gap" is repaired as of 2026-05-27 (R6). For any
    new migration, apply via `mcp__claude_ai_Supabase__execute_sql` and explicitly
    INSERT the ledger row under the FS-prefix version. See
    `docs/operations/migration-history-repair.md` for the pattern + idempotent
    insert recipe.
  - For tenant-table DDL: verify on a dev branch (`supabase branch create`) and
    confirm `mcp__claude_ai_Supabase__get_advisors` reports no new RLS / search-path
    warnings before merging.
  - For schema additions that touch existing tables: rerun
    `npm run db:ledger:snapshot` after apply so the alignment check has the
    latest baseline.

## Tenant Data Access (lib/ + app/api/)

- New code that reads or writes tenant tables MUST use `createSupabaseOrgClient(orgId)`
  from `@/lib/supabase/org-scoped` rather than `createSupabaseAdminClient()` +
  `.eq('organization_id', orgId)`. The wrapper makes the org filter structural so a
  missed `.eq()` cannot leak rows across tenants once FORCE RLS is enabled.
- If admin-client access is intentional (cron, cross-tenant scan, security
  detection that legitimately spans orgs), suppress the warning inline with:
    ```
    // eslint-disable-next-line formaos/no-admin-client-with-org-filter
    // Reason: <one-line justification>
    const admin = createSupabaseAdminClient();
    ```
- When you add a new tenant table, register it in `TENANT_TABLE_SCOPES`
  in `lib/supabase/org-scoped.ts` along with its `organization_id` /
  `org_id` column name. The wrapper will throw at runtime if a caller
  touches an unregistered table — this is intentional and forces an
  explicit decision rather than silent admin-fall-through.

## Onboarding / Activation

- Areas: `app/onboarding`, `lib/analytics/activation-telemetry`, `lib/provisioning`
- Minimum checks:
  - `npx tsc -p tsconfig.json --noEmit`
- Also verify:
  - step progression
  - fallback/error behavior
  - activation metrics remain consistent

## Audit Chain (lib/audit/)

- Areas: `lib/audit`, `app/api/audit/*`, `app/api/cron/audit-chain-anchor`
- Minimum checks:
  - `npx jest __tests__/lib/audit`
  - `npm run test:db:secdef-grants`
- Also verify:
  - any new SECURITY DEFINER function REVOKEs anon + authenticated explicitly
  - `entry_hash` + `entry_mac` columns NOT mutated post-write (RESTRICTIVE policies)
  - canonical JSON payload in `hash-utils.ts` matches Postgres `_audit_log_compute_hash_v2` byte-for-byte
  - new audit-emitting paths use `writeAuditLog()` (v2 default, v3-hmac under
    `AUDIT_CHAIN_V3_ENABLED=true`), never raw `INSERT INTO audit_log`

## Operations / Runbooks

- Areas: `docs/operations`, `docs/audit`, `docs/adr`
- Minimum checks:
  - `npm run test:db:ledger-alignment`
  - `npm run test:db:restore-recency` (passes warn-only until first DR drill recorded)
  - `npm run test:security:leaked-secrets`
- Cadence:
  - Monthly PITR restore drill — `docs/operations/pitr-restore-runbook.md`.
    Record via `scripts/verify-restore.mjs` against a restored branch.
  - Per secret-rotation event — `docs/operations/secret-rotation-runbook.md`.
    Record via `scripts/record-secret-rotation.mjs`.
  - Monthly dormant-user review — read latest `dormant_user_reviews` row.
