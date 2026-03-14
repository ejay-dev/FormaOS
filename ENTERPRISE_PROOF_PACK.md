# FormaOS Enterprise Proof Pack

This file is the internal source pack for enterprise proof points. It should stay aligned to implemented product behavior.

## What Buyers Can Validate Now

### Platform Governance

- Founder plus delegated platform-admin model
- Approval-gated high-risk delegated admin changes
- Reason-gated privileged mutations
- Unified admin audit read surface across immutable and legacy feeds

Relevant code:

- `app/app/admin/access.ts`
- `lib/admin/governance.ts`
- `lib/admin/rbac.ts`
- `lib/admin/audit.ts`

### Operator Safety

- org lock/unlock
- org suspend/restore lifecycle
- user lock/unlock
- plan changes, trial extension/reset, billing resync
- session revoke

Relevant code:

- `app/api/admin/orgs/[orgId]/lock/route.ts`
- `app/api/admin/orgs/[orgId]/lifecycle/route.ts`
- `app/api/admin/users/[userId]/lock/route.ts`
- `app/api/session/revoke/route.ts`

### Customer Rescue

- customer-360 org workspace
- member management
- entitlement overrides
- support billing timeline and automation failure visibility
- activation and health signals in admin org view

Relevant code:

- `app/admin/orgs/[orgId]/page.tsx`
- `app/api/admin/orgs/[orgId]/route.ts`
- `app/admin/support/page.tsx`
- `lib/admin/customer-health.ts`

### Security Operations

- security event and alert monitoring
- sessions and activity visibility
- live security triage surfaces

Relevant code:

- `app/admin/security-live/page.tsx`
- `app/admin/sessions/page.tsx`
- `app/admin/activity/page.tsx`
- `app/api/admin/security-live/route.ts`

### Procurement And Trust

- security review page
- trust packet download route
- procurement FAQ
- enterprise proof page

Relevant routes:

- `/security-review`
- `/trust/packet`
- `/trust/procurement`
- `/enterprise-proof`

## Enterprise Claims To Keep Tight

- say “implemented” only where a route, page, or workflow exists now
- say “aligned” when formal certification or third-party attestations are not the claim
- avoid promising future-region residency or certification timelines as present facts

## Missing Proof Assets To Build Next

- delegated-admin policy export
- approval history export
- operator runbook for incident and customer rescue actions
- buyer-facing matrix of control -> product evidence -> artifact
