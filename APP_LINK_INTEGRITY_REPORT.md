# APP Link Integrity Report

Generated: 2026-02-11T11:45:21.600Z

## Fix Summary

- Broken link targets fixed: 4
- Missing app routes implemented: 2
- Redirect targets corrected: 1

## Issues Fixed

- Added missing `/app/compliance` route and canonical redirect to `/app/compliance/frameworks`.
- Added missing `/app/policies/new` route used by Policy Library CTAs.
- Corrected stale auth continuation target from `/app/onboarding` to `/onboarding`.

## Summary

- Total app internal links validated: 119
- Valid links: 119
- Broken links: 0
- App routes discovered: 98

## Files Changed (App Integrity Audit)

- `scripts/app-link-integrity-audit.mjs`: route inventory + internal link extraction + markdown report generation + CI-fail on broken targets.
- `app/app/compliance/page.tsx`: canonical compliance index route.
- `app/app/policies/new/page.tsx`: implemented missing new policy page and create flow.
- `app/auth/check-email/page.tsx`: fixed broken post-confirmation redirect target.
- `e2e/app-link-integrity.spec.ts`: authenticated critical-route smoke test with redirect-loop guard.
- `package.json`: added `check:app-links`; extended `qa:smoke` to include app link integrity smoke.
- `.github/workflows/quality-gates.yml`: added app route/link integrity gate to code quality stage.

## Link Validation

| Source | Target Route | Exists | Requires Auth | Requires Role | Matched Route |
|---|---|---|---|---|---|
| `app/(dashboard)/accept-invite/[token]/page.tsx` | `/app` | YES | YES | auth | `/app` |
| `app/admin/layout.tsx` | `/app` | YES | YES | auth | `/app` |
| `app/app/audit/page.tsx` | `/app` | YES | YES | auth | `/app` |
| `app/app/dashboard/page.tsx` | `/app` | YES | YES | auth | `/app` |
| `app/app/executive/ExecutiveDashboardClient.tsx` | `/app` | YES | YES | auth | `/app` |
| `app/app/executive/page.tsx` | `/app` | YES | YES | auth | `/app` |
| `app/app/staff/page.tsx` | `/app` | YES | YES | auth | `/app` |
| `app/app/tasks/page.tsx` | `/app` | YES | YES | auth | `/app` |
| `app/auth/reset-password/page.tsx` | `/app` | YES | YES | auth | `/app` |
| `app/join/page.tsx` | `/app` | YES | YES | auth | `/app` |
| `app/not-found.tsx` | `/app` | YES | YES | auth | `/app` |
| `app/onboarding/page.tsx` | `/app` | YES | YES | auth | `/app` |
| `components/command-menu.tsx` | `/app` | YES | YES | auth | `/app` |
| `components/command-palette.tsx` | `/app` | YES | YES | auth | `/app` |
| `components/feature-discovery/FeatureDiscoverySystem.tsx` | `/app` | YES | YES | auth | `/app` |
| `lib/navigation/industry-sidebar.ts` | `/app` | YES | YES | auth | `/app` |
| `lib/onboarding/industry-checklists.ts` | `/app` | YES | YES | auth | `/app` |
| `components/compliance-system/compliance-lifecycle-header.tsx` | `/app/audit` | YES | YES | auth | `/app/audit` |
| `components/dashboard/employer-dashboard.tsx` | `/app/audit` | YES | YES | auth | `/app/audit` |
| `lib/navigation/industry-sidebar.ts` | `/app/audit` | YES | YES | auth | `/app/audit` |
| `app/app/actions/billing.ts` | `/app/billing` | YES | YES | auth | `/app/billing` |
| `app/app/components/TrialStatusBanner.tsx` | `/app/billing` | YES | YES | auth | `/app/billing` |
| `app/app/reports/page.tsx` | `/app/billing` | YES | YES | auth | `/app/billing` |
| `app/app/team/page.tsx` | `/app/billing` | YES | YES | auth | `/app/billing` |
| `app/onboarding/page.tsx` | `/app/billing` | YES | YES | auth | `/app/billing` |
| `components/billing/FeatureGate.tsx` | `/app/billing` | YES | YES | auth | `/app/billing` |
| `components/billing/TrialCountdownBanner.tsx` | `/app/billing` | YES | YES | auth | `/app/billing` |
| `components/billing/TrialDaysRemaining.tsx` | `/app/billing` | YES | YES | auth | `/app/billing` |
| `components/dashboard/employer-dashboard.tsx` | `/app/billing` | YES | YES | auth | `/app/billing` |
| `components/topbar.tsx` | `/app/billing` | YES | YES | auth | `/app/billing` |
| `components/trial/TrialExpirationBanner.tsx` | `/app/billing` | YES | YES | auth | `/app/billing` |
| `app/app/actions/care-operations.ts` | `/app/care-plans` | YES | YES | auth | `/app/care-plans` |
| `lib/navigation/industry-sidebar.ts` | `/app/care-plans` | YES | YES | auth | `/app/care-plans` |
| `components/dashboard/employer-dashboard.tsx` | `/app/certificates` | YES | YES | auth | `/app/certificates` |
| `components/automation/ComplianceDashboardWidget.tsx` | `/app/compliance` | YES | YES | auth | `/app/compliance` |
| `components/dashboard/IndustryGuidancePanel.tsx` | `/app/compliance` | YES | YES | auth | `/app/compliance` |
| `app/app/compliance/page.tsx` | `/app/compliance/frameworks` | YES | YES | auth | `/app/compliance/frameworks` |
| `lib/onboarding/industry-checklists.ts` | `/app/compliance/frameworks` | YES | YES | auth | `/app/compliance/frameworks` |
| `components/demo/WatchDemoCTA.tsx` | `/app/dashboard` | YES | YES | auth | `/app/dashboard` |
| `app/app/reports/page.tsx` | `/app/evidence` | YES | YES | auth | `/app/evidence` |
| `components/dashboard/employer-dashboard.tsx` | `/app/executive` | YES | YES | auth | `/app/executive` |
| `lib/navigation/industry-sidebar.ts` | `/app/executive` | YES | YES | auth | `/app/executive` |
| `app/app/actions/care-operations.ts` | `/app/incidents` | YES | YES | auth | `/app/incidents` |
| `app/app/incidents/new/page.tsx` | `/app/incidents` | YES | YES | auth | `/app/incidents` |
| `app/app/registers/page.tsx` | `/app/incidents` | YES | YES | auth | `/app/incidents` |
| `lib/navigation/industry-sidebar.ts` | `/app/incidents` | YES | YES | auth | `/app/incidents` |
| `app/app/incidents/page.tsx` | `/app/incidents/new` | YES | YES | auth | `/app/incidents/new` |
| `components/dashboard/IndustryGuidancePanel.tsx` | `/app/onboarding-roadmap` | YES | YES | auth | `/app/onboarding-roadmap` |
| `app/app/actions/care-operations.ts` | `/app/participants` | YES | YES | auth | `/app/participants` |
| `app/app/participants/new/page.tsx` | `/app/participants` | YES | YES | auth | `/app/participants` |
| `app/app/registers/page.tsx` | `/app/participants` | YES | YES | auth | `/app/participants` |
| `lib/navigation/industry-sidebar.ts` | `/app/participants` | YES | YES | auth | `/app/participants` |
| `app/app/participants/page.tsx` | `/app/participants/new` | YES | YES | auth | `/app/participants/new` |
| `app/app/patients/[id]/page.tsx` | `/app/patients` | YES | YES | auth | `/app/patients` |
| `components/feature-discovery/FeatureDiscoverySystem.tsx` | `/app/patients` | YES | YES | auth | `/app/patients` |
| `lib/navigation/industry-sidebar.ts` | `/app/patients` | YES | YES | auth | `/app/patients` |
| `components/command-palette.tsx` | `/app/people` | YES | YES | auth | `/app/people` |
| `lib/navigation/industry-sidebar.ts` | `/app/people` | YES | YES | auth | `/app/people` |
| `app/app/policies/[id]/page.tsx` | `/app/policies` | YES | YES | auth | `/app/policies` |
| `app/app/policies/new/page.tsx` | `/app/policies` | YES | YES | auth | `/app/policies` |
| `components/command-menu.tsx` | `/app/policies` | YES | YES | auth | `/app/policies` |
| `components/command-palette.tsx` | `/app/policies` | YES | YES | auth | `/app/policies` |
| `components/compliance-system/compliance-lifecycle-header.tsx` | `/app/policies` | YES | YES | auth | `/app/policies` |
| `lib/navigation/industry-sidebar.ts` | `/app/policies` | YES | YES | auth | `/app/policies` |
| `lib/onboarding/industry-checklists.ts` | `/app/policies` | YES | YES | auth | `/app/policies` |
| `app/app/policies/new/page.tsx` | `/app/policies/:param` | YES | YES | auth | `/app/policies/:id` |
| `app/app/policies/page.tsx` | `/app/policies/new` | YES | YES | auth | `/app/policies/new` |
| `components/topbar.tsx` | `/app/profile` | YES | YES | auth | `/app/profile` |
| `app/app/patients/[id]/page.tsx` | `/app/progress-notes` | YES | YES | auth | `/app/progress-notes` |
| `app/app/staff/page.tsx` | `/app/progress-notes` | YES | YES | auth | `/app/progress-notes` |
| `lib/navigation/industry-sidebar.ts` | `/app/progress-notes` | YES | YES | auth | `/app/progress-notes` |
| `components/command-menu.tsx` | `/app/registers` | YES | YES | auth | `/app/registers` |
| `components/compliance-system/compliance-lifecycle-header.tsx` | `/app/registers` | YES | YES | auth | `/app/registers` |
| `lib/navigation/industry-sidebar.ts` | `/app/registers` | YES | YES | auth | `/app/registers` |
| `components/command-palette.tsx` | `/app/reports` | YES | YES | auth | `/app/reports` |
| `lib/navigation/industry-sidebar.ts` | `/app/reports` | YES | YES | auth | `/app/reports` |
| `lib/onboarding/industry-checklists.ts` | `/app/reports` | YES | YES | auth | `/app/reports` |
| `app/app/settings/security/page.tsx` | `/app/settings` | YES | YES | auth | `/app/settings` |
| `components/command-menu.tsx` | `/app/settings` | YES | YES | auth | `/app/settings` |
| `components/command-palette.tsx` | `/app/settings` | YES | YES | auth | `/app/settings` |
| `components/dashboard/employer-dashboard.tsx` | `/app/settings` | YES | YES | auth | `/app/settings` |
| `components/topbar.tsx` | `/app/settings` | YES | YES | auth | `/app/settings` |
| `components/user-nav.tsx` | `/app/settings` | YES | YES | auth | `/app/settings` |
| `lib/navigation/industry-sidebar.ts` | `/app/settings` | YES | YES | auth | `/app/settings` |
| `components/command-palette.tsx` | `/app/settings/email-preferences` | YES | YES | auth | `/app/settings/email-preferences` |
| `components/notifications/notification-center.tsx` | `/app/settings/email-preferences` | YES | YES | auth | `/app/settings/email-preferences` |
| `lib/navigation/industry-sidebar.ts` | `/app/settings/email-preferences` | YES | YES | auth | `/app/settings/email-preferences` |
| `components/feature-discovery/FeatureDiscoverySystem.tsx` | `/app/staff` | YES | YES | auth | `/app/staff` |
| `lib/navigation/industry-sidebar.ts` | `/app/staff` | YES | YES | auth | `/app/staff` |
| `app/app/actions/care-operations.ts` | `/app/staff-compliance` | YES | YES | auth | `/app/staff-compliance` |
| `app/app/registers/page.tsx` | `/app/staff-compliance` | YES | YES | auth | `/app/staff-compliance` |
| `app/app/staff-compliance/new/page.tsx` | `/app/staff-compliance` | YES | YES | auth | `/app/staff-compliance` |
| `lib/navigation/industry-sidebar.ts` | `/app/staff-compliance` | YES | YES | auth | `/app/staff-compliance` |
| `app/app/staff-compliance/page.tsx` | `/app/staff-compliance/new` | YES | YES | auth | `/app/staff-compliance/new` |
| `app/app/patients/[id]/page.tsx` | `/app/tasks` | YES | YES | auth | `/app/tasks` |
| `app/app/staff/page.tsx` | `/app/tasks` | YES | YES | auth | `/app/tasks` |
| `components/command-menu.tsx` | `/app/tasks` | YES | YES | auth | `/app/tasks` |
| `components/command-palette.tsx` | `/app/tasks` | YES | YES | auth | `/app/tasks` |
| `components/compliance-system/compliance-lifecycle-header.tsx` | `/app/tasks` | YES | YES | auth | `/app/tasks` |
| `components/dashboard/employer-dashboard.tsx` | `/app/tasks` | YES | YES | auth | `/app/tasks` |
| `lib/navigation/industry-sidebar.ts` | `/app/tasks` | YES | YES | auth | `/app/tasks` |
| `lib/onboarding/industry-checklists.ts` | `/app/tasks` | YES | YES | auth | `/app/tasks` |
| `components/command-menu.tsx` | `/app/team` | YES | YES | auth | `/app/team` |
| `components/dashboard/employer-dashboard.tsx` | `/app/team` | YES | YES | auth | `/app/team` |
| `lib/navigation/industry-sidebar.ts` | `/app/team` | YES | YES | auth | `/app/team` |
| `lib/onboarding/industry-checklists.ts` | `/app/team` | YES | YES | auth | `/app/team` |
| `app/app/evidence/page.tsx` | `/app/vault` | YES | YES | auth | `/app/vault` |
| `components/compliance-system/compliance-lifecycle-header.tsx` | `/app/vault` | YES | YES | auth | `/app/vault` |
| `components/dashboard/employer-dashboard.tsx` | `/app/vault` | YES | YES | auth | `/app/vault` |
| `lib/navigation/industry-sidebar.ts` | `/app/vault` | YES | YES | auth | `/app/vault` |
| `lib/onboarding/industry-checklists.ts` | `/app/vault` | YES | YES | auth | `/app/vault` |
| `components/feature-discovery/FeatureDiscoverySystem.tsx` | `/app/vault/review` | YES | YES | auth | `/app/vault/review` |
| `app/app/actions/care-operations.ts` | `/app/visits` | YES | YES | auth | `/app/visits` |
| `app/app/registers/page.tsx` | `/app/visits` | YES | YES | auth | `/app/visits` |
| `app/app/visits/new/page.tsx` | `/app/visits` | YES | YES | auth | `/app/visits` |
| `components/feature-discovery/FeatureDiscoverySystem.tsx` | `/app/visits` | YES | YES | auth | `/app/visits` |
| `lib/navigation/industry-sidebar.ts` | `/app/visits` | YES | YES | auth | `/app/visits` |
| `app/app/visits/page.tsx` | `/app/visits/new` | YES | YES | auth | `/app/visits/new` |
| `components/command-palette.tsx` | `/app/workflows` | YES | YES | auth | `/app/workflows` |

## App Route Inventory

- `/`
- `/about`
- `/accept-invite/:token`
- `/admin`
- `/admin/audit`
- `/admin/billing`
- `/admin/dashboard`
- `/admin/exports`
- `/admin/features`
- `/admin/health`
- `/admin/orgs`
- `/admin/orgs/:orgId`
- `/admin/revenue`
- `/admin/security`
- `/admin/settings`
- `/admin/support`
- `/admin/system`
- `/admin/trials`
- `/admin/users`
- `/app`
- `/app/admin`
- `/app/admin/orgs/:orgId`
- `/app/audit`
- `/app/audit/export/:userId`
- `/app/billing`
- `/app/care-plans`
- `/app/certificates`
- `/app/compliance`
- `/app/compliance/frameworks`
- `/app/dashboard`
- `/app/evidence`
- `/app/executive`
- `/app/forms/builder/:id`
- `/app/history`
- `/app/incidents`
- `/app/incidents/new`
- `/app/onboarding-roadmap`
- `/app/participants`
- `/app/participants/new`
- `/app/patients`
- `/app/patients/:id`
- `/app/people`
- `/app/policies`
- `/app/policies/:id`
- `/app/policies/new`
- `/app/profile`
- `/app/progress-notes`
- `/app/registers`
- `/app/registers/training`
- `/app/reports`
- `/app/settings`
- `/app/settings/email-history`
- `/app/settings/email-preferences`
- `/app/settings/security`
- `/app/staff`
- `/app/staff-compliance`
- `/app/staff-compliance/new`
- `/app/tasks`
- `/app/team`
- `/app/vault`
- `/app/vault/review`
- `/app/visits`
- `/app/visits/new`
- `/app/workflows`
- `/auth`
- `/auth-redirect`
- `/auth/check-email`
- `/auth/forgot-password`
- `/auth/login`
- `/auth/plan-select`
- `/auth/reset-password`
- `/auth/signin`
- `/auth/signup`
- `/blog`
- `/blog/:slug`
- `/contact`
- `/docs`
- `/faq`
- `/industries`
- `/join`
- `/legal/privacy`
- `/legal/terms`
- `/onboarding`
- `/organization/:orgId/audit`
- `/our-story`
- `/pricing`
- `/privacy`
- `/product`
- `/security`
- `/signin`
- `/submit/:formId`
- `/terms`
- `/unauthorized`
- `/use-cases/healthcare`
- `/use-cases/incident-management`
- `/use-cases/ndis-aged-care`
- `/use-cases/workforce-credentials`
- `/workspace-recovery`
