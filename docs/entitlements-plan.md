# Entitlements Plan

This note maps disabled or schema-degraded actions from the disabled-actions review to the product plan and role model. CAPA phase 1 implements role-limited authoring but does not add full plan gating yet.

## Existing Grounding

- Public plan names are Foundation, Growth, and Enterprise.
- Internal plan keys currently map as `basic` = Foundation, `pro` = Growth, and `enterprise` = Enterprise.
- `lib/billing/entitlements.ts` already supports feature keys and org-scoped entitlement records in `org_entitlements`.
- Current entitlement keys are broad: `audit_export`, `reports`, `framework_evaluations`, `certifications`, `team_limit`, `ai_assistant`, and `soc2_certification`.
- Future gating should extend this existing entitlement service rather than adding one-off page checks.

## Foundation

Foundation should include the core compliance operating loop:

- Dashboard, tasks, controls, policies, evidence, audit trail, standard reports, and framework evaluations.
- SOC 2 report generation after an assessment exists.
- AI assistant access once the user has entered a prompt; the empty `Send message` disabled state should remain state-based, not plan-based.
- Viewer read-only access to records, exports shared with them, and audit evidence.

Disabled actions that belong here:

- `Generate Report` on `/app/compliance/soc2`, gated by assessment state rather than plan once the workspace has the standard reports entitlement.
- `End of feed` on `/app/activity`, which is state-only.
- Empty `Send message` buttons, which are input-state-only.

## Growth

Growth should unlock operational scale features that teams use weekly:

- CAPA create/update and status management. Implemented in phase 1 without full Growth entitlement enforcement.
- Custom reports and saved report definitions.
- Form submission analytics.
- Industry-specific report packs once backed by real data and exports.

Disabled actions that belong here:

- `/app/capa` `CAPA unavailable` only when the CAPA lifecycle migration is absent
- `/app/reports/custom` `Custom reports unavailable`
- `/app/forms/[formId]/submissions` `Analytics coming soon`
- Future replacement for the removed `/app/reports` placeholder industry exports

Recommended new entitlement keys:

- `capa_management`
- `custom_reports`
- `form_analytics`
- `industry_report_packs`

## Enterprise

Enterprise should cover administrative, identity, governance, and automation features that increase operational risk or procurement value:

- Workflow automation: blank workflow, template install, execution, toggles, approvals, and execution traces.
- SSO test connection and SAML configuration.
- Directory sync save/sync and one-off sync.
- Data retention governance: save policy, dry-run, execute, legal hold support, and execution history.

Disabled actions that belong here:

- `/app/workflows` create workflow/template actions when workflow schema is absent.
- `/app/settings/security` `Test Connection`
- `/app/settings/security` `Save + Sync Now`
- `/app/settings/security` `Run One-Off Sync`
- `/app/governance` `Dry Run`
- `/app/governance` `Execute`
- `/app/governance` `Save Policy`
- `/app/executive` `Refresh` remains state-based but the executive surface itself is an Enterprise fit.

Recommended new entitlement keys:

- `workflow_automation`
- `sso_saml`
- `directory_sync`
- `retention_governance`
- `executive_rollup`

## Role Notes

- Admin: can configure plan-gated settings, SSO, directory sync, retention, workflow execution, and CAPA administration.
- Manager: should be able to create and update operational artifacts such as CAPA items, workflows, reports, and analytics views when the plan allows it. In the current system-state mapping, manager/compliance roles resolve to `admin`, so CAPA phase 1 authoring is implemented for owner/admin.
- Viewer: read-only by default; can view records, dashboards, and shared reports, but cannot mutate settings, retention policies, workflow definitions, or CAPA status.
- Auditor: read-only audit/evidence/report access; can inspect workflow executions and CAPA history when shared, but should not edit.

## Recommended Gating Implementation

1. Extend `EntitlementKey` in `lib/billing/entitlements.ts` with the keys listed above.
2. Add plan defaults for Foundation/Growth/Enterprise in the existing `PLAN_ENTITLEMENTS` map.
3. Create a small server helper, for example `getFeatureAccess(orgId, featureKey)`, that returns `{ enabled, reason, planRequired }` without throwing for UI reads.
4. Pair entitlement checks with role checks from the existing role/ability model; plan access should not bypass role permissions.
5. Render gated CTAs as either hidden, disabled with concise upgrade copy, or linked to billing depending on surface:
   - Hide low-value future placeholders.
   - Disable state-dependent actions where a prerequisite is missing.
   - Show upgrade copy for high-value paid capabilities.
6. Enforce every gated mutation on the server action/API route, not only in UI.
7. Add app-action crawler assertions that paid unavailable actions are truthful and not silently clickable.

## Near-Term Recommendation

Do not implement broad gating until the entitlement helper is extended. First add entitlement keys and read helpers behind tests, then migrate one vertical slice at a time:

1. CAPA management as Growth + Manager/Admin, replacing the current role-only phase 1 behavior.
2. Custom reports as Growth + Manager/Admin.
3. Workflow automation as Enterprise + Manager/Admin.
4. SSO/directory sync and retention governance as Enterprise + Admin only.
