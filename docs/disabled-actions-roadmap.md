# Disabled Actions Roadmap

Generated from `docs/app-action-inventory.md` and `docs/full-app-action-crawler-report.md`.
Updated on 2026-04-28 after CAPA phase 1 implementation.

## Summary

- Total visible actions crawled: 363
- Passing actions: 269
- Disabled truthful actions remaining in the last crawler snapshot: 94
- Expected disabled truthful actions after the CAPA migration is applied and crawler is rerun: 93
- Remaining failed actions: 0
- Main finding: 81 disabled actions are the AI assistant `Send message` button in its truthful empty-input state. They should not become roadmap work unless the assistant entry pattern changes.
- Cleanup delta: removed 4 report placeholder exports and merged the workflow schema-disabled creation/template placeholders into one `Create workflow` disabled action.
- CAPA delta: CAPA moved from roadmap BUILD_NEXT into implemented phase 1 with schema, lifecycle, evidence, audit trail, and incident source link. The UI still shows a truthful schema-disabled state in environments where the migration has not been applied.

## Classification Breakdown

| Recommendation | Count | Meaning |
|---|---:|---|
| KEEP_DISABLED | 84 | Correct state-gated disabled controls, mostly empty assistant sends plus stateful refresh/report/feed buttons. |
| PLAN_GATE | 9 | Useful paid capabilities, but should ship behind Growth or Enterprise entitlements. |
| REMOVE | 0 | Previous report export placeholders were removed from `/app/reports`. |
| BUILD_NEXT | 0 | CAPA was implemented in phase 1. |
| IMPLEMENTED | 1 | CAPA lifecycle workflow is now backed by migration, server actions, UI, evidence uploads, and audit events. |
| MERGE_WITH_EXISTING | 0 | Previous duplicate workflow template affordance was merged into one `Create workflow` placeholder. |
| BUILD_NOW | 0 | No docs-only pass item was small enough to implement safely without changing product behavior. |
| ROLE_GATE | 0 | No action should be classified only by role; several plan-gated items also need role restrictions when built. |

## Classification Profiles

| Profile | Current state | Why disabled | User value | Compliance value | Engineering effort | Risk if left disabled | Recommendation |
|---|---|---|---|---|---|---|---|
| A1 Empty assistant send | Disabled button | Prompt input is empty or assistant input is unavailable. | Low as a standalone action; protects users from blank sends. | Low directly; avoids noisy or unauditable assistant requests. | Low | Low | KEEP_DISABLED |
| A2 Stateful report/feed/refresh | Disabled button | Required prerequisite is missing, loading is active, or there is no more data. | Medium; communicates current state. | Medium when tied to SOC 2 or audit trails. | Low | Low | KEEP_DISABLED |
| B1 CAPA workflow | Implemented; schema guard remains | Phase 1 requires `org_capa_items` lifecycle columns and `org_capa_events`; older DBs remain truthfully disabled. | High for incident follow-up and corrective action ownership. | High for auditability, closure evidence, and regulator readiness. | Completed phase 1; phase 2 medium | Lower after migration | IMPLEMENTED |
| B2 Workflow schema | Schema-degraded disabled CTA | `workflow_definitions` or `workflow_executions` tables can be absent. | High for automation and repeatable operations. | High for obligation execution trails. | High | Medium | PLAN_GATE |
| B3 Custom reports schema | Schema-degraded disabled CTA | `org_saved_reports` backing table can be absent. | Medium for power users and recurring exports. | Medium for scheduled evidence packs. | Medium | Medium | PLAN_GATE |
| B4 Enterprise identity/sync | Disabled until configured | SSO must be enabled or a directory provider selected. | Medium for IT admins. | Medium for access governance. | Medium | Medium | PLAN_GATE |
| B5 Retention governance | Schema-degraded disabled CTA | Retention tables or columns can be absent. | Medium for admins. | High for data lifecycle and legal hold controls. | Medium | Medium | PLAN_GATE |
| B6 Form analytics | Coming soon disabled CTA | Analytics surface is not yet implemented. | Medium for operations users. | Medium for submission trend evidence. | Medium | Low | PLAN_GATE |
| C1 Unsupported industry exports | Removed | Export template placeholders were advertised without backing exports. | Low until backed by real report data. | Medium only if report is implemented. | Medium | Resolved | REMOVE completed |
| C2 Duplicate template action | Merged | Workflow unavailable state now shows one `Create workflow` placeholder. | Low as duplicate UI. | Low | Low | Resolved | MERGE completed |

## Full Action Classification Matrix

Scores are `user/compliance/sales/effort/risk`. Row numbers remain the original crawler row identifiers where unchanged; removed rows are omitted so follow-up diffs are easy to trace.

| # | Module | Route | Action label | Profile | Scores | Plan/role gate |
|---:|---|---|---|---|---|---|
| 1 | Dashboard | `/app` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 2 | Dashboard | `/app/dashboard` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 3 | Compliance | `/app/compliance` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 4 | Compliance | `/app/compliance/frameworks` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 5 | Compliance | `/app/compliance/cross-map` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 6 | Compliance | `/app/compliance/soc2` | Generate Report | A2 | M/M/M/L/L | Foundation, after assessment exists |
| 7 | Compliance | `/app/compliance/soc2` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 8 | Compliance | `/app/controls` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 9 | Compliance | `/app/controls/journey` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 10 | Policies | `/app/policies` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 11 | Policies | `/app/policies/new` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 12 | Policies | `/app/policies/versions` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 13 | Evidence Vault | `/app/vault` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 14 | Evidence Vault | `/app/vault/review` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 15 | Evidence Vault | `/app/evidence` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 16 | Evidence Vault | `/app/evidence/gaps` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 17 | Participants | `/app/participants` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 18 | Participants | `/app/participants/new` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 19 | Care Plans | `/app/care-plans` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 20 | Care Plans | `/app/care-plans/journey` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 21 | Care Plans | `/app/care-plans/new` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 22 | Visits | `/app/visits` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 23 | Visits | `/app/visits/new` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 24 | Progress Notes | `/app/progress-notes` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 25 | Incidents | `/app/incidents` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 26 | Incidents | `/app/incidents/new` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 27 | Incidents | `/app/incidents/analytics` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 28 | Staff Compliance | `/app/staff-compliance` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 29 | Staff Compliance | `/app/staff-compliance/new` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 30 | Staff Compliance | `/app/certificates` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 31 | Team | `/app/team` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 32 | Team | `/app/team/org-chart` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 33 | Registers | `/app/registers` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 34 | Registers | `/app/registers/training` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 35 | Forms | `/app/forms` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 36 | Forms | `/app/forms/builder/new` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 37 | Reports | `/app/reports` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 42 | Reports | `/app/reports/custom` | Custom reports unavailable | B3 | M/M/M/M/M | Growth plan; Manager/Admin authoring |
| 43 | Reports | `/app/reports/custom` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 44 | Reports | `/app/reports/custom/new` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 45 | Reports | `/app/reports/trends` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 46 | Executive | `/app/executive` | Refresh | A2 | M/L/M/L/L | Enterprise executive users; state-dependent |
| 47 | Executive | `/app/executive` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 48 | Executive | `/app/executive/group` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 49 | Settings | `/app/settings` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 50 | Settings | `/app/settings/organization` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 51 | Settings | `/app/settings/roles` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 52 | Settings | `/app/settings/roles/new` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 53 | Settings | `/app/settings/ai` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 54 | Settings | `/app/settings/security` | Test Connection | B4 | M/M/H/M/M | Enterprise; Admin only |
| 55 | Settings | `/app/settings/security` | Save + Sync Now | B4 | M/M/H/M/M | Enterprise; Admin only |
| 56 | Settings | `/app/settings/security` | Run One-Off Sync | B4 | M/M/H/M/M | Enterprise; Admin only |
| 57 | Settings | `/app/settings/security` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 58 | Settings | `/app/settings/notifications` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 59 | Settings | `/app/settings/email-preferences` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 60 | Settings | `/app/settings/email-history` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 61 | Settings | `/app/settings/executive-digest` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 62 | Settings | `/app/settings/integrations` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 63 | Settings | `/app/settings/integrations/marketplace` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 64 | Settings | `/app/settings/retention` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 65 | Settings | `/app/settings/auditor-access` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 66 | Settings | `/app/settings/auditor-access/new` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 67 | Billing | `/app/billing` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 68 | Workflows | `/app/workflows` | Create workflow | B2 | H/H/H/H/M | Enterprise; Admin/Manager only |
| 70 | Workflows | `/app/workflows` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 72 | Audit Trail | `/app/audit-trail` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 73 | Audit Trail | `/app/audit` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 74 | Audit Trail | `/app/activity` | End of feed | A2 | L/L/L/L/L | Foundation; state-dependent |
| 75 | Audit Trail | `/app/activity` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 76 | Tasks | `/app/tasks` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 77 | Tasks | `/app/tasks/board` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 78 | Tasks | `/app/tasks/calendar` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 79 | CAPA | `/app/capa` | CAPA unavailable | B1 | H/H/H/M/H | Removed from migrated environments; remains as truthful schema guard until DB migration |
| 80 | CAPA | `/app/capa` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 81 | CAPA | `/app/capa/new` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 82 | Dashboard | `/app/governance` | Dry Run | B5 | M/H/M/M/M | Enterprise; Admin only |
| 83 | Dashboard | `/app/governance` | Execute | B5 | M/H/M/M/M | Enterprise; Admin only |
| 84 | Dashboard | `/app/governance` | Save Policy | B5 | M/H/M/M/M | Enterprise; Admin only |
| 85 | Dashboard | `/app/governance` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 86 | Dashboard | `/app/search` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 87 | Participants | `/app/participants/dd325a91-c214-43a7-a489-0139853ed77a` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 88 | Participants | `/app/participants/dd325a91-c214-43a7-a489-0139853ed77a/medications` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 89 | Participants | `/app/patients/dd325a91-c214-43a7-a489-0139853ed77a` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 90 | Visits | `/app/visits/3bd63f54-169b-4ca1-975f-6dbdda00a98b` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 91 | Incidents | `/app/incidents/14ea8be2-c661-4933-b2b3-29dec55f277d` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 92 | Incidents | `/app/incidents/14ea8be2-c661-4933-b2b3-29dec55f277d/investigation` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 93 | Staff Compliance | `/app/staff-compliance/24391a59-29bd-4d1f-950f-ebe840bce1e5` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 94 | Policies | `/app/policies/685d4523-2bdc-435b-8135-918f5c437afa` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 95 | Policies | `/app/policies/685d4523-2bdc-435b-8135-918f5c437afa/edit` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 96 | Policies | `/app/policies/685d4523-2bdc-435b-8135-918f5c437afa/versions` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 97 | Care Plans | `/app/care-plans/65fec6c7-aa72-4a38-89f4-ad9bdb3a112a` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 98 | Forms | `/app/forms/4510d147-d1eb-4f20-bc59-0cce396caeb8/submissions` | Analytics coming soon | B6 | M/M/M/M/L | Growth; Manager/Admin only |
| 99 | Forms | `/app/forms/4510d147-d1eb-4f20-bc59-0cce396caeb8/submissions` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |
| 100 | Forms | `/app/forms/builder/4510d147-d1eb-4f20-bc59-0cce396caeb8` | Send message | A1 | L/L/L/L/L | Viewer read-only keeps disabled until input |

## Top 10 Build Priorities

1. Workflow schema deployment and creation path. High user, compliance, and sales value; high effort; should be Enterprise-gated.
2. Workflow template creation from curated templates. High sales/demo value; high effort; keep behind the single creation path.
3. Retention policy save. High compliance value; medium effort; Enterprise/Admin-only.
4. Retention dry-run preview. High compliance value because it makes lifecycle execution safe; medium effort; Enterprise/Admin-only.
5. Custom report builder schema. Medium-high buyer value; medium effort; Growth or Enterprise gate.
6. SSO test connection. High enterprise sales value; medium effort; Enterprise/Admin-only.
7. Directory sync save and immediate sync. High enterprise sales value; medium effort; Enterprise/Admin-only.
8. Form submission analytics. Medium user/compliance/demo value; medium effort; Growth gate.
9. CAPA phase 2 source links from obligations, policies, and investigations. High compliance value; medium effort; keep Growth+.
10. Add one real industry report pack, preferably NDIS or healthcare based on target sales motion, before reintroducing industry export CTAs.

## Remove Candidates

| Action | Why remove |
|---|---|
| None remaining after cleanup | The 4 `Export coming soon` buttons on `/app/reports` were removed. Reintroduce industry report CTAs only when backed by working exports. |

## Plan And Role Gate Candidates

| Area | Suggested plan | Suggested role behavior |
|---|---|---|
| CAPA create/update | Growth | Implemented for owner/admin authoring in phase 1; future entitlement should make this Growth+ with Viewer read-only. |
| Workflow automation | Enterprise | Admins/managers can build and run; viewers read-only; auditors can inspect execution traces. |
| Custom reports | Growth | Managers/admins build and schedule; viewers can run or view assigned reports. |
| SSO and directory sync | Enterprise | Admin only. |
| Retention governance | Enterprise | Admin only, with dry-run before destructive execute. |
| Forms analytics | Growth | Managers/admins view analytics; viewers limited to submission lists. |
| Future industry report packs | Growth or Enterprise depending on pack | Managers/admins generate; auditors can access shared packs. |
| AI assistant send | Foundation | Available to all roles only after the user enters text; preserve disabled empty state. |

## Quick Wins

- Keep `/app/reports` limited to working exports and meaningful navigation.
- Keep workflow creation represented by one clear action while schema is unavailable.
- Add clearer disabled copy for empty AI assistant input if users mistake the disabled send icon for a broken feature.
- Keep `Generate Report` disabled until a SOC 2 assessment exists; optionally add inline copy explaining the prerequisite.
- Apply the CAPA migration to preview/production and rerun the crawler so the `CAPA unavailable` guard disappears from migrated environments.

## High-Effort Future Features

- Workflow automation with definitions, templates, executions, approvals, toggles, and audit traceability.
- Retention governance with policy storage, dry-runs, legal holds, execution history, and safe destructive-operation controls.
- Enterprise identity operations covering SAML test redirects, directory sync provider config, sync run history, and failure recovery.
- Custom report builder with saved definitions, schedule delivery, permissions, and export job status.
- Industry-specific report packs backed by real data mappings rather than placeholder exports.

## Recommended Next Engineering Sprint

1. CAPA deployment verification: apply `20260618_capa_lifecycle_workflow.sql`, run the focused CAPA flow, then rerun app-action crawler.
2. CAPA phase 2 planning: add obligation, policy, and investigation source links after phase 1 is stable.
3. Enterprise gate design: define entitlement checks for Growth and Enterprise so CAPA, workflow, retention, custom reports, SSO, directory sync, and analytics can ship behind clear plan boundaries.
4. Workflow foundation: deploy workflow schema and enable read/list plus creation before template execution.
5. Report packs: only reintroduce industry-specific export CTAs when one pack is backed by real data and a working export endpoint.
