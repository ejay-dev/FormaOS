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

## Onboarding / Activation

- Areas: `app/onboarding`, `lib/analytics/activation-telemetry`, `lib/provisioning`
- Minimum checks:
  - `npx tsc -p tsconfig.json --noEmit`
- Also verify:
  - step progression
  - fallback/error behavior
  - activation metrics remain consistent
