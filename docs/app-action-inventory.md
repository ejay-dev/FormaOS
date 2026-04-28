# App Action Inventory

Generated from `e2e/full-app-action-crawler.spec.ts` on 2026-04-27T16:09:12.433Z.
Updated on 2026-04-28 after removing report placeholder exports and merging the workflow creation placeholder.

## Summary

- Modules audited: 21
- Routes inspected: 81
- Visible actions recorded: 363
- PASS: 269
- DISABLED: 94
- FAIL: 0

## By Module

| Module | Routes | Actions | Disabled |
|---|---:|---:|---:|
| Audit Trail | 3 | 14 | 4 |
| Billing | 1 | 3 | 1 |
| CAPA | 2 | 9 | 3 |
| Care Plans | 4 | 16 | 4 |
| Compliance | 6 | 24 | 7 |
| Dashboard | 4 | 43 | 7 |
| Evidence Vault | 4 | 14 | 4 |
| Executive | 2 | 9 | 3 |
| Forms | 4 | 24 | 5 |
| Incidents | 5 | 21 | 5 |
| Participants | 5 | 19 | 5 |
| Policies | 6 | 23 | 6 |
| Progress Notes | 1 | 3 | 1 |
| Registers | 2 | 7 | 2 |
| Reports | 4 | 22 | 5 |
| Settings | 15 | 62 | 18 |
| Staff Compliance | 4 | 17 | 4 |
| Tasks | 3 | 11 | 3 |
| Team | 2 | 7 | 2 |
| Visits | 3 | 11 | 3 |
| Workflows | 1 | 4 | 2 |

## Actions

| Module | Route | Label | Type | Destination/Handler | Expected | Tested | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| Dashboard | /app | Page load | link | /app | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Dashboard | /app | Skip to main content | link | /app | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Dashboard | /app | Obligations | link | /app/compliance | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Dashboard | /app | Policies | link | /app/policies | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Dashboard | /app | Evidence Vault | link | /app/vault | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Dashboard | /app | Participants | link | /app/participants | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Dashboard | /app | Service Delivery | link | /app/visits | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Dashboard | /app | Progress Notes | link | /app/progress-notes | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Dashboard | /app | Incidents | link | /app/incidents | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Dashboard | /app | Staff Compliance | link | /app/staff-compliance | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Dashboard | /app | Team | link | /app/team | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Dashboard | /app | Registers | link | /app/registers | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Dashboard | /app | Forms | link | /app/forms | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Dashboard | /app | Reports | link | /app/reports | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Dashboard | /app | Executive View | link | /app/executive | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Dashboard | /app | Settings | link | /app/settings | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Dashboard | /app | 14d left | link | /app/billing | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Dashboard | /app | New Task | link | /app/tasks | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Dashboard | /app | Open obligations0No open obligations | link | /app/tasks?status=open | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Dashboard | /app | Overdue obligations0Nothing past SLA | link | /app/tasks?filter=overdue | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Dashboard | /app | Due this week0Nothing due this week | link | /app/tasks?filter=due_soon | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Dashboard | /app | Review active participant compliance tasksCompliance OpsSLA WeeklyNormal | link | /app/tasks?filter=assigned_to_me | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Dashboard | /app | 1 certifications are expiring soonEvidence OwnersSLA 7dHigh | link | /app/staff-compliance?filter=expiring | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Dashboard | /app | Verify pending evidence submissionsApproversSLA 48hHigh | link | /app/vault/review | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Dashboard | /app | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Dashboard | /app | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Dashboard | /app/dashboard | Page load | link | /app/dashboard | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Dashboard | /app/dashboard | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Dashboard | /app/dashboard | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Compliance | /app/compliance | Page load | link | /app/compliance | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Compliance | /app/compliance | Frameworks | link | /app/compliance/frameworks | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Compliance | /app/compliance | Controls | link | /app/controls | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Compliance | /app/compliance | Cross-Map | link | /app/compliance/cross-map | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Compliance | /app/compliance | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Compliance | /app/compliance | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Compliance | /app/compliance/frameworks | Page load | link | /app/compliance/frameworks | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Compliance | /app/compliance/frameworks | SOC 2 Readiness DashboardAutomated evidence checks, gap analysis, and certification tracking | link | /app/compliance/soc2 | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Compliance | /app/compliance/frameworks | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Compliance | /app/compliance/frameworks | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Compliance | /app/compliance/cross-map | Page load | link | /app/compliance/cross-map | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Compliance | /app/compliance/cross-map | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Compliance | /app/compliance/cross-map | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Compliance | /app/compliance/soc2 | Page load | link | /app/compliance/soc2 | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Compliance | /app/compliance/soc2 | Generate Report | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Compliance | /app/compliance/soc2 | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Compliance | /app/compliance/soc2 | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Compliance | /app/controls | Page load | link | /app/controls | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Compliance | /app/controls | Journey view | link | /app/controls/journey | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Compliance | /app/controls | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Compliance | /app/controls | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Compliance | /app/controls/journey | Page load | link | /app/controls/journey | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Compliance | /app/controls/journey | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Compliance | /app/controls/journey | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Policies | /app/policies | Page load | link | /app/policies | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Policies | /app/policies | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Policies | /app/policies | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Policies | /app/policies/new | Page load | link | /app/policies/new | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Policies | /app/policies/new | Skip to main content | link | /app/policies/new | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Policies | /app/policies/new | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Policies | /app/policies/new | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Policies | /app/policies/versions | Page load | link | /app/policies/versions | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Policies | /app/policies/versions | Skip to main content | link | /app/policies/versions | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Policies | /app/policies/versions | Crawler Policy e812ae90v1 · Created 4/28/2026draft | link | /app/policies/685d4523-2bdc-435b-8135-918f5c437afa/versions | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Policies | /app/policies/versions | Continue editing | link | /app/policies/685d4523-2bdc-435b-8135-918f5c437afa/edit | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Policies | /app/policies/versions | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Policies | /app/policies/versions | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Evidence Vault | /app/vault | Page load | link | /app/vault | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Evidence Vault | /app/vault | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Evidence Vault | /app/vault | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Evidence Vault | /app/vault/review | Page load | link | /app/vault/review | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Evidence Vault | /app/vault/review | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Evidence Vault | /app/vault/review | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Evidence Vault | /app/evidence | Page load | link | /app/evidence | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Evidence Vault | /app/evidence | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Evidence Vault | /app/evidence | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Evidence Vault | /app/evidence/gaps | Page load | link | /app/evidence/gaps | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Evidence Vault | /app/evidence/gaps | Skip to main content | link | /app/evidence/gaps | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Evidence Vault | /app/evidence/gaps | Upload Evidence | link | /app/evidence | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Evidence Vault | /app/evidence/gaps | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Evidence Vault | /app/evidence/gaps | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Participants | /app/participants | Page load | link | /app/participants | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Participants | /app/participants | Add Participant | link | /app/participants/new | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Participants | /app/participants | View | link | /app/participants/dd325a91-c214-43a7-a489-0139853ed77a | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Participants | /app/participants | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Participants | /app/participants | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Participants | /app/participants/new | Page load | link | /app/participants/new | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Participants | /app/participants/new | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Participants | /app/participants/new | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Care Plans | /app/care-plans | Page load | link | /app/care-plans | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Care Plans | /app/care-plans | Skip to main content | link | /app/care-plans | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Care Plans | /app/care-plans | Journey view | link | /app/care-plans/journey | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Care Plans | /app/care-plans | New Plan | link | /app/care-plans/new | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Care Plans | /app/care-plans | View | link | /app/care-plans/65fec6c7-aa72-4a38-89f4-ad9bdb3a112a | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Care Plans | /app/care-plans | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Care Plans | /app/care-plans | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Care Plans | /app/care-plans/journey | Page load | link | /app/care-plans/journey | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Care Plans | /app/care-plans/journey | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Care Plans | /app/care-plans/journey | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Care Plans | /app/care-plans/new | Page load | link | /app/care-plans/new | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Care Plans | /app/care-plans/new | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Care Plans | /app/care-plans/new | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Visits | /app/visits | Page load | link | /app/visits | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Visits | /app/visits | New Visit | link | /app/visits/new | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Visits | /app/visits | View | link | /app/visits/3bd63f54-169b-4ca1-975f-6dbdda00a98b | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Visits | /app/visits | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Visits | /app/visits | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Visits | /app/visits/new | Page load | link | /app/visits/new | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Visits | /app/visits/new | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Visits | /app/visits/new | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Progress Notes | /app/progress-notes | Page load | link | /app/progress-notes | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Progress Notes | /app/progress-notes | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Progress Notes | /app/progress-notes | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Incidents | /app/incidents | Page load | link | /app/incidents | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Incidents | /app/incidents | Export | download/export | /api/incidents/export | Endpoint responds with non-empty file | HTTP 200 | PASS |  |
| Incidents | /app/incidents | Report | link | /app/incidents/new | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Incidents | /app/incidents | View | link | /app/incidents/14ea8be2-c661-4933-b2b3-29dec55f277d | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Incidents | /app/incidents | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Incidents | /app/incidents | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Incidents | /app/incidents/new | Page load | link | /app/incidents/new | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Incidents | /app/incidents/new | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Incidents | /app/incidents/new | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Incidents | /app/incidents/analytics | Page load | link | /app/incidents/analytics | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Incidents | /app/incidents/analytics | Skip to main content | link | /app/incidents/analytics | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Incidents | /app/incidents/analytics | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Incidents | /app/incidents/analytics | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Staff Compliance | /app/staff-compliance | Page load | link | /app/staff-compliance | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Staff Compliance | /app/staff-compliance | Export | download/export | /api/staff-credentials/export | Endpoint responds with non-empty file | HTTP 200 | PASS |  |
| Staff Compliance | /app/staff-compliance | Add | link | /app/staff-compliance/new | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Staff Compliance | /app/staff-compliance | View | link | /app/staff-compliance/24391a59-29bd-4d1f-950f-ebe840bce1e5 | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Staff Compliance | /app/staff-compliance | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Staff Compliance | /app/staff-compliance | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Staff Compliance | /app/staff-compliance/new | Page load | link | /app/staff-compliance/new | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Staff Compliance | /app/staff-compliance/new | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Staff Compliance | /app/staff-compliance/new | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Staff Compliance | /app/certificates | Page load | link | /app/certificates | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Staff Compliance | /app/certificates | Skip to main content | link | /app/certificates | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Staff Compliance | /app/certificates | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Staff Compliance | /app/certificates | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Team | /app/team | Page load | link | /app/team | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Team | /app/team | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Team | /app/team | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Team | /app/team/org-chart | Page load | link | /app/team/org-chart | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Team | /app/team/org-chart | Skip to main content | link | /app/team/org-chart | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Team | /app/team/org-chart | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Team | /app/team/org-chart | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Registers | /app/registers | Page load | link | /app/registers | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Registers | /app/registers | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Registers | /app/registers | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Registers | /app/registers/training | Page load | link | /app/registers/training | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Registers | /app/registers/training | Skip to main content | link | /app/registers/training | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Registers | /app/registers/training | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Registers | /app/registers/training | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Forms | /app/forms | Page load | link | /app/forms | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Forms | /app/forms | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Forms | /app/forms | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Forms | /app/forms/builder/new | Page load | link | /app/forms/builder/new | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Forms | /app/forms/builder/new | Skip to main content | link | /app/forms/builder/c286c13f-0c0c-4460-995e-263114498047 | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Forms | /app/forms/builder/new | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Forms | /app/forms/builder/new | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Reports | /app/reports | Page load | link | /app/reports | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Reports | /app/reports | My Reports | link | /app/reports/custom | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Reports | /app/reports | Trends | link | /app/reports/trends | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Reports | /app/reports | Generate | download/export | /api/reports/export?type=trust&format=pdf&mode=sync | Endpoint responds with non-empty file | HTTP 200 | PASS |  |
| Reports | /app/reports | Governance | link | /app/governance | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Reports | /app/reports | Generate | download/export | /api/reports/export?type=soc2&format=pdf&mode=sync | Endpoint responds with non-empty file | HTTP 200 | PASS |  |
| Reports | /app/reports | Generate | download/export | /api/reports/export?type=iso27001&format=pdf&mode=sync | Endpoint responds with non-empty file | HTTP 200 | PASS |  |
| Reports | /app/reports | Generate | download/export | /api/reports/export?type=ndis&format=pdf&mode=sync | Endpoint responds with non-empty file | HTTP 200 | PASS |  |
| Reports | /app/reports | Generate | download/export | /api/reports/export?type=hipaa&format=pdf&mode=sync | Endpoint responds with non-empty file | HTTP 200 | PASS |  |
| Reports | /app/reports | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Reports | /app/reports | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Reports | /app/reports/custom | Page load | link | /app/reports/custom | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Reports | /app/reports/custom | Custom reports unavailable | button | custom-reports-schema-disabled | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Reports | /app/reports/custom | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Reports | /app/reports/custom | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Reports | /app/reports/custom/new | Page load | link | /app/reports/custom/new | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Reports | /app/reports/custom/new | Skip to main content | link | /app/reports/custom/new | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Reports | /app/reports/custom/new | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Reports | /app/reports/custom/new | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Reports | /app/reports/trends | Page load | link | /app/reports/trends | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Reports | /app/reports/trends | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Reports | /app/reports/trends | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Executive | /app/executive | Page load | link | /app/executive | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Executive | /app/executive | Automation Reliability0% workflow successCritical | link | /app/workflows | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Executive | /app/executive | Refresh | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Executive | /app/executive | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Executive | /app/executive | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Executive | /app/executive/group | Page load | link | /app/executive/group | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Executive | /app/executive/group | Skip to main content | link | /app/executive/group | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Executive | /app/executive/group | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Executive | /app/executive/group | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Settings | /app/settings | Page load | link | /app/settings | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Settings | /app/settings | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Settings | /app/settings | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Settings | /app/settings/organization | Page load | link | /app/settings/organization | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Settings | /app/settings/organization | Skip to main content | link | /app/settings/organization | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Settings | /app/settings/organization | Roles & PermissionsManage default and custom roles, fine-tune access controls | link | /app/settings/roles | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Settings | /app/settings/organization | Document RetentionConfigure retention policies, legal holds, and lifecycle management | link | /app/settings/retention | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Settings | /app/settings/organization | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Settings | /app/settings/organization | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Settings | /app/settings/roles | Page load | link | /app/settings/roles | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Settings | /app/settings/roles | Create Custom Role | link | /app/settings/roles/new | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Settings | /app/settings/roles | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Settings | /app/settings/roles | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Settings | /app/settings/roles/new | Page load | link | /app/settings/roles/new | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Settings | /app/settings/roles/new | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Settings | /app/settings/roles/new | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Settings | /app/settings/ai | Page load | link | /app/settings/ai | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Settings | /app/settings/ai | Skip to main content | link | /app/settings/ai | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Settings | /app/settings/ai | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Settings | /app/settings/ai | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Settings | /app/settings/security | Page load | link | /app/settings/security | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Settings | /app/settings/security | Skip to main content | link | /app/settings/security | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Settings | /app/settings/security | Test Connection | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Settings | /app/settings/security | Save + Sync Now | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Settings | /app/settings/security | Run One-Off Sync | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Settings | /app/settings/security | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Settings | /app/settings/security | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Settings | /app/settings/notifications | Page load | link | /app/settings/notifications | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Settings | /app/settings/notifications | Skip to main content | link | /app/settings/notifications | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Settings | /app/settings/notifications | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Settings | /app/settings/notifications | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Settings | /app/settings/email-preferences | Page load | link | /app/settings/email-preferences | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Settings | /app/settings/email-preferences | Skip to main content | link | /app/settings/email-preferences | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Settings | /app/settings/email-preferences | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Settings | /app/settings/email-preferences | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Settings | /app/settings/email-history | Page load | link | /app/settings/email-history | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Settings | /app/settings/email-history | Skip to main content | link | /app/settings/email-history | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Settings | /app/settings/email-history | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Settings | /app/settings/email-history | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Settings | /app/settings/executive-digest | Page load | link | /app/settings/executive-digest | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Settings | /app/settings/executive-digest | Skip to main content | link | /app/settings/executive-digest | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Settings | /app/settings/executive-digest | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Settings | /app/settings/executive-digest | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Settings | /app/settings/integrations | Page load | link | /app/settings/integrations | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Settings | /app/settings/integrations | Skip to main content | link | /app/settings/integrations | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Settings | /app/settings/integrations | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Settings | /app/settings/integrations | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Settings | /app/settings/integrations/marketplace | Page load | link | /app/settings/integrations/marketplace | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Settings | /app/settings/integrations/marketplace | Skip to main content | link | /app/settings/integrations/marketplace | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Settings | /app/settings/integrations/marketplace | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Settings | /app/settings/integrations/marketplace | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Settings | /app/settings/retention | Page load | link | /app/settings/retention | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Settings | /app/settings/retention | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Settings | /app/settings/retention | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Settings | /app/settings/auditor-access | Page load | link | /app/settings/auditor-access | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Settings | /app/settings/auditor-access | Skip to main content | link | /app/settings/auditor-access | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Settings | /app/settings/auditor-access | Grant Access | link | /app/settings/auditor-access/new | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Settings | /app/settings/auditor-access | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Settings | /app/settings/auditor-access | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Settings | /app/settings/auditor-access/new | Page load | link | /app/settings/auditor-access/new | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Settings | /app/settings/auditor-access/new | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Settings | /app/settings/auditor-access/new | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Billing | /app/billing | Page load | link | /app/billing | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Billing | /app/billing | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Billing | /app/billing | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Workflows | /app/workflows | Page load | link | /app/workflows | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Workflows | /app/workflows | Create workflow | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Workflows | /app/workflows | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Workflows | /app/workflows | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Audit Trail | /app/audit-trail | Page load | link | /app/audit-trail | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Audit Trail | /app/audit-trail | Skip to main content | link | /app/audit-trail | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Audit Trail | /app/audit-trail | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Audit Trail | /app/audit-trail | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Audit Trail | /app/audit | Page load | link | /app/audit | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Audit Trail | /app/audit | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Audit Trail | /app/audit | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Audit Trail | /app/activity | Page load | link | /app/activity | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Audit Trail | /app/activity | Skip to main content | link | /app/activity | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Audit Trail | /app/activity | Export CSV | download/export | /api/activity?orgId=bdb38fb5-21c0-42cb-b09a-7b6bd6d2a043&format=csv | Endpoint responds with non-empty file | HTTP 200 | PASS |  |
| Audit Trail | /app/activity | End of feed | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Audit Trail | /app/activity | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Audit Trail | /app/activity | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Audit Trail | /app/activity | Apply Filters | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Tasks | /app/tasks | Page load | link | /app/tasks | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Tasks | /app/tasks | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Tasks | /app/tasks | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Tasks | /app/tasks/board | Page load | link | /app/tasks/board | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Tasks | /app/tasks/board | Skip to main content | link | /app/tasks/board | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Tasks | /app/tasks/board | Calendar | link | /app/tasks/calendar | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Tasks | /app/tasks/board | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Tasks | /app/tasks/board | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Tasks | /app/tasks/calendar | Page load | link | /app/tasks/calendar | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Tasks | /app/tasks/calendar | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Tasks | /app/tasks/calendar | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| CAPA | /app/capa | Page load | link | /app/capa | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| CAPA | /app/capa | Skip to main content | link | /app/capa | Destination resolves without app 404 | HTTP 200 | PASS |  |
| CAPA | /app/capa | CAPA unavailable | button | capa-schema-disabled | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| CAPA | /app/capa | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| CAPA | /app/capa | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| CAPA | /app/capa/new | Page load | link | /app/capa/new | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| CAPA | /app/capa/new | Skip to main content | link | /app/capa/new | Destination resolves without app 404 | HTTP 200 | PASS |  |
| CAPA | /app/capa/new | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| CAPA | /app/capa/new | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Dashboard | /app/governance | Page load | link | /app/governance | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Dashboard | /app/governance | Export CSV | download/export | /api/identity/audit?orgId=bdb38fb5-21c0-42cb-b09a-7b6bd6d2a043&format=csv | Endpoint responds with non-empty file | HTTP 200 | PASS |  |
| Dashboard | /app/governance | Export PDF | download/export | /api/identity/audit?orgId=bdb38fb5-21c0-42cb-b09a-7b6bd6d2a043&format=pdf | Endpoint responds with non-empty file | HTTP 200 | PASS |  |
| Dashboard | /app/governance | Dry Run | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Dashboard | /app/governance | Execute | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Dashboard | /app/governance | Save Policy | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Dashboard | /app/governance | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Dashboard | /app/governance | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Dashboard | /app/search | Page load | link | /app/search | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Dashboard | /app/search | Skip to main content | link | /app/search | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Dashboard | /app/search | All (0) | link | /app/search?q= | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Dashboard | /app/search | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Dashboard | /app/search | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Dashboard | /app/search | Search | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Participants | /app/participants/dd325a91-c214-43a7-a489-0139853ed77a | Page load | link | /app/participants/dd325a91-c214-43a7-a489-0139853ed77a | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Participants | /app/participants/dd325a91-c214-43a7-a489-0139853ed77a | + New care plan | link | /app/care-plans/new?client_id=dd325a91-c214-43a7-a489-0139853ed77a | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Participants | /app/participants/dd325a91-c214-43a7-a489-0139853ed77a | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Participants | /app/participants/dd325a91-c214-43a7-a489-0139853ed77a | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Participants | /app/participants/dd325a91-c214-43a7-a489-0139853ed77a/medications | Page load | link | /app/participants/dd325a91-c214-43a7-a489-0139853ed77a/medications | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Participants | /app/participants/dd325a91-c214-43a7-a489-0139853ed77a/medications | People | link | /app/people | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Participants | /app/participants/dd325a91-c214-43a7-a489-0139853ed77a/medications | Patients | link | /app/patients | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Participants | /app/participants/dd325a91-c214-43a7-a489-0139853ed77a/medications | Audit Trail | link | /app/audit | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Participants | /app/participants/dd325a91-c214-43a7-a489-0139853ed77a/medications | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Participants | /app/participants/dd325a91-c214-43a7-a489-0139853ed77a/medications | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Participants | /app/patients/dd325a91-c214-43a7-a489-0139853ed77a | Page load | link | /app/patients/dd325a91-c214-43a7-a489-0139853ed77a | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Participants | /app/patients/dd325a91-c214-43a7-a489-0139853ed77a | Skip to main content | link | /app/patients/dd325a91-c214-43a7-a489-0139853ed77a | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Participants | /app/patients/dd325a91-c214-43a7-a489-0139853ed77a | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Participants | /app/patients/dd325a91-c214-43a7-a489-0139853ed77a | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Visits | /app/visits/3bd63f54-169b-4ca1-975f-6dbdda00a98b | Page load | link | /app/visits/3bd63f54-169b-4ca1-975f-6dbdda00a98b | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Visits | /app/visits/3bd63f54-169b-4ca1-975f-6dbdda00a98b | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Visits | /app/visits/3bd63f54-169b-4ca1-975f-6dbdda00a98b | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Incidents | /app/incidents/14ea8be2-c661-4933-b2b3-29dec55f277d | Page load | link | /app/incidents/14ea8be2-c661-4933-b2b3-29dec55f277d | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Incidents | /app/incidents/14ea8be2-c661-4933-b2b3-29dec55f277d | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Incidents | /app/incidents/14ea8be2-c661-4933-b2b3-29dec55f277d | file input | upload |  | Upload control is present and enabled where exposed | visible enabled file input | PASS |  |
| Incidents | /app/incidents/14ea8be2-c661-4933-b2b3-29dec55f277d | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Incidents | /app/incidents/14ea8be2-c661-4933-b2b3-29dec55f277d/investigation | Page load | link | /app/incidents/14ea8be2-c661-4933-b2b3-29dec55f277d/investigation | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Incidents | /app/incidents/14ea8be2-c661-4933-b2b3-29dec55f277d/investigation | Skip to main content | link | /app/incidents/14ea8be2-c661-4933-b2b3-29dec55f277d/investigation | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Incidents | /app/incidents/14ea8be2-c661-4933-b2b3-29dec55f277d/investigation | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Incidents | /app/incidents/14ea8be2-c661-4933-b2b3-29dec55f277d/investigation | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Staff Compliance | /app/staff-compliance/24391a59-29bd-4d1f-950f-ebe840bce1e5 | Page load | link | /app/staff-compliance/24391a59-29bd-4d1f-950f-ebe840bce1e5 | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Staff Compliance | /app/staff-compliance/24391a59-29bd-4d1f-950f-ebe840bce1e5 | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Staff Compliance | /app/staff-compliance/24391a59-29bd-4d1f-950f-ebe840bce1e5 | file input | upload |  | Upload control is present and enabled where exposed | visible enabled file input | PASS |  |
| Staff Compliance | /app/staff-compliance/24391a59-29bd-4d1f-950f-ebe840bce1e5 | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Policies | /app/policies/685d4523-2bdc-435b-8135-918f5c437afa | Page load | link | /app/policies/685d4523-2bdc-435b-8135-918f5c437afa | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Policies | /app/policies/685d4523-2bdc-435b-8135-918f5c437afa | Skip to main content | link | /app/policies/685d4523-2bdc-435b-8135-918f5c437afa | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Policies | /app/policies/685d4523-2bdc-435b-8135-918f5c437afa | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Policies | /app/policies/685d4523-2bdc-435b-8135-918f5c437afa | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Policies | /app/policies/685d4523-2bdc-435b-8135-918f5c437afa/edit | Page load | link | /app/policies/685d4523-2bdc-435b-8135-918f5c437afa/edit | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Policies | /app/policies/685d4523-2bdc-435b-8135-918f5c437afa/edit | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Policies | /app/policies/685d4523-2bdc-435b-8135-918f5c437afa/edit | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Policies | /app/policies/685d4523-2bdc-435b-8135-918f5c437afa/versions | Page load | link | /app/policies/685d4523-2bdc-435b-8135-918f5c437afa/versions | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Policies | /app/policies/685d4523-2bdc-435b-8135-918f5c437afa/versions | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Policies | /app/policies/685d4523-2bdc-435b-8135-918f5c437afa/versions | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Care Plans | /app/care-plans/65fec6c7-aa72-4a38-89f4-ad9bdb3a112a | Page load | link | /app/care-plans/65fec6c7-aa72-4a38-89f4-ad9bdb3a112a | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Care Plans | /app/care-plans/65fec6c7-aa72-4a38-89f4-ad9bdb3a112a | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Care Plans | /app/care-plans/65fec6c7-aa72-4a38-89f4-ad9bdb3a112a | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Forms | /app/forms/4510d147-d1eb-4f20-bc59-0cce396caeb8/submissions | Page load | link | /app/forms/4510d147-d1eb-4f20-bc59-0cce396caeb8/submissions | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Forms | /app/forms/4510d147-d1eb-4f20-bc59-0cce396caeb8/submissions | Skip to main content | link | /app/forms/4510d147-d1eb-4f20-bc59-0cce396caeb8/submissions | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Forms | /app/forms/4510d147-d1eb-4f20-bc59-0cce396caeb8/submissions | Export CSV | download/export | /api/v1/forms/4510d147-d1eb-4f20-bc59-0cce396caeb8/submissions/export?format=csv | Endpoint responds with non-empty file | HTTP 200 | PASS |  |
| Forms | /app/forms/4510d147-d1eb-4f20-bc59-0cce396caeb8/submissions | Submitted | link | /app/forms/4510d147-d1eb-4f20-bc59-0cce396caeb8/submissions?status=submitted | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Forms | /app/forms/4510d147-d1eb-4f20-bc59-0cce396caeb8/submissions | Approved | link | /app/forms/4510d147-d1eb-4f20-bc59-0cce396caeb8/submissions?status=approved | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Forms | /app/forms/4510d147-d1eb-4f20-bc59-0cce396caeb8/submissions | Rejected | link | /app/forms/4510d147-d1eb-4f20-bc59-0cce396caeb8/submissions?status=rejected | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Forms | /app/forms/4510d147-d1eb-4f20-bc59-0cce396caeb8/submissions | Analytics coming soon | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Forms | /app/forms/4510d147-d1eb-4f20-bc59-0cce396caeb8/submissions | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Forms | /app/forms/4510d147-d1eb-4f20-bc59-0cce396caeb8/submissions | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
| Forms | /app/forms/builder/4510d147-d1eb-4f20-bc59-0cce396caeb8 | Page load | link | /app/forms/builder/4510d147-d1eb-4f20-bc59-0cce396caeb8 | Authenticated page loads without 404 or crash | HTTP 200 | PASS |  |
| Forms | /app/forms/builder/4510d147-d1eb-4f20-bc59-0cce396caeb8 | Skip to main content | link | /app/forms/builder/4510d147-d1eb-4f20-bc59-0cce396caeb8 | Destination resolves without app 404 | HTTP 200 | PASS |  |
| Forms | /app/forms/builder/4510d147-d1eb-4f20-bc59-0cce396caeb8 | Send message | button |  | Disabled actions must not be silently clickable | disabled in UI | DISABLED |  |
| Forms | /app/forms/builder/4510d147-d1eb-4f20-bc59-0cce396caeb8 | Quick Search⌘K | modal/dropdown | safe opener | Opens or toggles visible UI without app errors | opened overlay | PASS |  |
