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
- Also verify:
  - route assumptions match column names
  - lifecycle/audit/status semantics stay consistent
  - new columns have safe defaults where needed
- **Before applying a new migration to production**:
  - Confirm `supabase migration list --linked` shows the previous migration recorded.
    If history is broken (only 19 of 217 files recorded as of audit 2026-05-26),
    run `docs/operations/migration-history-repair.md` FIRST. The repair is read-only
    on prod; production data is not affected.
  - For tenant-table DDL: verify on a dev branch (`supabase branch create`) and
    confirm `mcp__claude_ai_Supabase__get_advisors` reports no new RLS / search-path
    warnings before merging.

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
