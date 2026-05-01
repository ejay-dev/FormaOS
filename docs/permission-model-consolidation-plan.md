# Permission Model Consolidation Plan

This is the deferred P1 from `docs/deep-codebase-audit.md` (item #9 in the Top 25). Estimated effort: **30 days** of focused work. Don't start unless that capacity is real — half-finished is worse than untouched, because the codebase will end up using FIVE permission systems instead of four.

This doc is a planning artifact. It does NOT get executed by the audit-fix sprint.

---

## Current state — four overlapping systems

Per the audit's §6 and §12:

| System | File | What it models | Where it's called |
|---|---|---|---|
| **`rbac.ts`** | `app/app/actions/rbac.ts` | `RoleKey` enum (OWNER, COMPLIANCE_OFFICER, MANAGER, STAFF, VIEWER, AUDITOR), `PermissionKey` enum (~13 hardcoded keys like `VIEW_CONTROLS`, `EDIT_CONTROLS`), and a static `ROLE_PERMISSIONS` map. | `requirePermission()` is called by `app/app/actions/*` server actions and by some pages. |
| **`api-permission-guards.ts`** | `lib/api-permission-guards.ts` | Resource-type guards (`canModifyResource('team' \| 'cert' \| 'evidence' \| 'task' \| 'settings')`). Wraps role + entitlement checks in functional bundles. | `app/api/v1/*` route handlers via `authenticateV1Request` middleware. |
| **`permission-engine.ts`** | `lib/authz/permission-engine.ts` | Module × action matrix (read/write/delete/export/admin per module). Reads `custom_roles` table for org-defined roles. Uses service-role client. | `app/app/settings/roles/*` UI, plus a few module-specific gates. |
| **`roles.ts`** | `lib/roles.ts` | A flat enum of 72+ permissions (e.g., `org:edit`, `team:invite`, `cert:approve`, `audit:export`, `billing:manage`). `ROLE_CAPABILITIES` map per `DatabaseRole`. | Mixed — some checks call into here directly, often duplicating logic the other three systems also handle. |

These four disagree on:
- **Role names**. `rbac.ts` uses uppercase enums; `roles.ts` and the DB use lowercase. `permission-engine.ts` distinguishes only `admin`/`member`/`viewer` for the BASE_PERMISSIONS map.
- **Role hierarchy**. Is COMPLIANCE_OFFICER a peer of MANAGER or above STAFF? Different files give different answers.
- **Permission grain**. `rbac.ts` is coarse (`EDIT_CONTROLS`); `roles.ts` is fine (`cert:approve`, `cert:revoke`); `permission-engine.ts` is module-action; `api-permission-guards.ts` is resource-functional.
- **Custom-role support**. Only `permission-engine.ts` honors `custom_roles`. The others bypass it.
- **Entitlement integration**. Some systems (api-permission-guards) bake entitlement checks in; others (rbac, roles) don't.

The result: a server-side ACL decision can produce different answers depending on which file the calling code happens to import.

---

## Target state — one system

**Name**: `lib/authz/` (existing folder; consolidates everything).

**Inputs** to a permission decision:
- `userId` (auth.uid)
- `organizationId`
- `permissionKey` (a single canonical enum)
- Optional `resourceType` + `resourceId` for ownership-scoped checks
- Optional `entitlementKey` if the action is paid-plan-gated

**Outputs**:
- `Allow` — proceed.
- `Deny(reason)` — typed reason (`role-insufficient`, `entitlement-missing`, `subscription-inactive`, `org-membership-missing`, etc.) for clean error messaging and audit trails.

**Resolution order** (must be consistent):
1. **Authentication**: user must be signed in.
2. **Membership**: user must be a member of `organizationId`.
3. **Subscription gate**: org subscription must be `active`/`trialing`/`pending_checkout`.
4. **Entitlement gate**: if specified, `org_entitlements.enabled = true` for the key.
5. **Role gate**: user's role on `org_members` (or assigned `custom_roles` row) must include `permissionKey`.

Each step short-circuits with the right `Deny` reason; downstream code never has to think about the ordering.

**Public API** (target):

```typescript
// In server actions:
const decision = await requirePermission({
  organizationId,
  permission: 'evidence:upload',
  entitlement: 'audit_export',  // optional
});
if (!decision.allowed) {
  return errorResponse(decision.reason);
}

// In API route handlers:
const guard = await requireApiPermission(authContext, {
  permission: 'reports:export',
  entitlement: 'reports',
});
if (!guard.allowed) {
  return jsonWithContext(authContext, { error: guard.reason }, { status: 403 });
}
```

Both wrap the same underlying engine. Only one role-permission map exists — `lib/authz/permission-matrix.ts`. Only one custom-role merger exists — `lib/authz/custom-roles.ts`. No more `app/app/actions/rbac.ts` once migration is done.

---

## Migration phases

### Phase A — Inventory & contract (week 1)

1. Catalog every permission name in use. Cross-reference all four systems. Output: `docs/permission-catalog.md` listing each canonical permission and which file(s) currently express it.
2. Decide canonical permission names. Format: `<resource>:<action>` (e.g., `policy:approve`, `evidence:verify`, `report:export`, `org:settings:edit`). Document the role → permission grants for each role.
3. Write the new types in `lib/authz/types.ts`. Don't delete anything yet — both old and new coexist.
4. Write `lib/authz/permission-matrix.ts` with the canonical role × permission matrix.
5. Write the unified `requirePermission` and `requireApiPermission` functions in `lib/authz/require.ts`.
6. Build a feature flag `USE_UNIFIED_AUTHZ` defaulted off. New entry points check the flag and route to either old or new — gives a backout valve during the cutover.

**Artifacts**: 1 new doc, 3 new lib files. No call-site changes yet.
**Risk**: low.

### Phase B — Migrate API v1 routes (week 2)

`api-permission-guards.ts` is the smallest of the four systems and the cleanest entry point.

1. For each `app/api/v1/**/route.ts` that currently calls `canModifyResource()`: introduce a parallel `requireApiPermission()` call behind the flag. Test both paths return the same answer.
2. Once green for one full deploy cycle, flip the flag for that route. Remove the old `canModifyResource` call.
3. Delete `lib/api-permission-guards.ts` once all v1 routes are migrated.

**Artifacts**: ~30 route files updated.
**Risk**: medium. Routes are exposed surface; bugs are visible to API customers.

### Phase C — Migrate server actions (weeks 3-4)

`app/app/actions/rbac.ts` `requirePermission` is invoked by ~50 server actions across compliance, evidence, policies, care, CAPA, etc.

1. Add `requirePermission()` (new signature) to `lib/authz/require.ts` covering all the keys `rbac.ts` exposed. Keep names compatible where possible (`EDIT_CONTROLS` → `controls:edit`).
2. Replace call sites in batches grouped by module: compliance, then evidence, then policies, etc. Each batch is its own commit.
3. Delete `app/app/actions/rbac.ts` once empty.

**Artifacts**: ~50 action files touched.
**Risk**: medium-high. Actions are the workhorse of the app; regressions affect every authenticated user.

### Phase D — Reconcile `roles.ts` flat enum (week 4)

`lib/roles.ts` exists for a slightly different purpose — it's the catalog of capabilities used by the role-management UI. Phase D is mostly a rename + reshape, not a behavior change.

1. Map the flat `Permission` enum onto canonical `<resource>:<action>` names.
2. Replace `ROLE_CAPABILITIES` static map with a derived view from `permission-matrix.ts`.
3. Roles UI now reads the matrix, not the parallel enum.

**Artifacts**: `lib/roles.ts` shrinks to a thin re-export.
**Risk**: low.

### Phase E — Custom roles via permission-engine (week 4-5)

`lib/authz/permission-engine.ts` already supports custom roles. Move it inside `lib/authz/require.ts` as the source of "additional grants beyond base role".

1. Custom-role logic merges into `require.ts`: if the user has a `custom_role_id` on their `team_members` row, union those permissions with the base role's.
2. The team-membership lookup gets org-scoped (audit P1 #9 sub-finding).
3. Settings UI for creating custom roles continues to work — it just writes `custom_roles` rows that the unified engine reads.

**Artifacts**: `permission-engine.ts` code merges; the file's public API stays so settings UI doesn't break.
**Risk**: medium. Custom roles affect a small subset of orgs; the explosion radius is small but the test surface is large.

### Phase F — Cleanup (week 5-6)

1. Remove the `USE_UNIFIED_AUTHZ` flag.
2. Delete the deprecated files (`api-permission-guards.ts`, `app/app/actions/rbac.ts`, parallel sections of `roles.ts`).
3. Run a final `gitnexus_impact` sweep on every removed symbol to confirm zero remaining references.
4. Update `docs/deep-codebase-audit.md` to mark P1 #9 closed.

---

## Test strategy

Per phase:
- **Unit tests** for `permission-matrix.ts` covering every role × permission cell.
- **Unit tests** for `require.ts` covering each Deny reason path.
- **Integration tests** for representative API v1 routes and server actions, asserting that both old and new paths return identical decisions during the parallel-run window.
- **E2E tests** that exercise admin-only flows (CAPA, policy approval, report export, team management) under viewer/member/admin/owner roles.

Coverage gate: the consolidation is done when permission decisions in tests:
- Always go through `lib/authz/`.
- Don't import from `app/app/actions/rbac.ts`, `lib/api-permission-guards.ts`, or the legacy `lib/roles.ts` shapes.

---

## Acceptance

This work is "done" when:

1. There is exactly one place in the codebase that decides "does user U have permission P on org O for resource R?".
2. That place explains its decision with a typed `Deny` reason that's safe to surface (or log) verbatim.
3. Custom roles, entitlements, and subscription state all participate in that single decision.
4. Removing any one of the legacy permission files no longer breaks the build, because nothing imports it.
5. The audit doc's P1 #9 line is struck through.

---

## Why this is 30 days

A back-of-envelope: ~80 server actions + ~50 API routes + 4 lib files + ~10 settings/UI surfaces + parallel-run validation + test rewrites + a careful cleanup. At 1-2 files per day with proper testing, that's ~5-6 weeks. Buffer to 30 days assumes one engineer working full-time on this and nothing else.

If the work has to share time with other features, it should be planned across 2-3 calendar months, not 1 calendar month, even though the engineering hours are the same.

---

## Pre-flight checks before starting

Run these before opening Phase A:

1. `gitnexus_impact({target: "requirePermission", direction: "upstream"})` — confirms total call site count.
2. `git log --oneline -- app/app/actions/rbac.ts lib/api-permission-guards.ts lib/authz/permission-engine.ts lib/roles.ts` — ensures no other team is mid-flight on these.
3. Smoke test `docs/smoke-test-checklist.md` sections 5, 7, 8, 11, 12 (the entitlement and role-gated flows). Capture the baseline behavior so the parallel-run window has something to compare against.

If any of those surfaces something unexpected, slow down before starting Phase A.
