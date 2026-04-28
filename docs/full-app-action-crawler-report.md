# Full App Action Crawler Report

Generated from `e2e/full-app-action-crawler.spec.ts`.
Updated: 2026-04-29 CAPA post-migration verification

## Executive Verdict

The authenticated app action crawler passes against the production build. In the tested seeded workspace, no visible app 404s, unsupported export links, or failing crawler actions remain. CAPA phase 1 is now verified against the connected Supabase project: the schema is live, the CAPA unavailable guard is gone, list/new/detail/evidence actions pass, and the remaining CAPA disabled actions are only truthful empty assistant sends.

## Inventory Summary

- Modules audited: 21
- Routes inspected: 81
- Visible actions recorded: 368
- Passing actions/page loads: 274
- Disabled truthful actions: 94
- Failed actions: 0

## Modules Audited

- Audit Trail
- Billing
- CAPA
- Care Plans
- Compliance
- Dashboard
- Evidence Vault
- Executive
- Forms
- Incidents
- Participants
- Policies
- Progress Notes
- Registers
- Reports
- Settings
- Staff Compliance
- Tasks
- Team
- Visits
- Workflows

## Broken Actions Found and Fixed

- Integrations marketplace exposed provider-specific Connect/Configure links that routed to missing per-provider pages. Fixed by routing marketplace actions to the working integration control plane.
- Activity CSV export returned HTTP 200 with an empty body when there were no rows. Fixed by exporting stable CSV headers; incident and staff credential exports received the same header guard.
- CAPA and custom report UI exposed workflows while connected schemas could be missing. CAPA now has phase 1 lifecycle implementation verified against the connected database; custom reports still degrade truthfully when their schema is absent.
- Care plan progress-note backlink pointed at a missing participant nested route. Fixed to the real progress notes route.
- Certificates page selected a nonexistent embedded staff relationship. Reworked staff display lookup.
- Credential review selected a missing notes column. Removed the bad column from the queue query.
- Registers used the wrong organization column for some schema variants. Added fallback to the live org_id shape.
- Training register, workflows, governance retention/isolation, notification preferences, and executive intelligence now degrade truthfully when backing tables are missing or older.
- Task board passed server event handlers into a client component. Converted handlers to client-side optional defaults.
- Identity audit export returned 403 when its backing table was unavailable. Fixed to return valid empty exports.
- Report templates no longer advertise unavailable "Export coming soon" actions.
- Workflow schema-disabled state now exposes one clear `Create workflow` placeholder instead of separate blank/template placeholders plus a duplicate template opener.

## Export/Download Result

Crawler and export suite verified visible export/download actions return non-empty files. Unsupported report template export placeholders have been removed from `/app/reports`. Activity, incident, staff credential, forms submissions, vault evidence, and identity audit export paths are covered.

## Form and Modal Result

The app-action suite covers policy edit/version routes, custom role detail, primary CTAs, row detail links, and CAPA create/detail against the migrated schema. The crawler opens safe dropdown/dialog surfaces and records disabled unfinished actions.

## API/Server Action Result

Mutation/export APIs now guard schema drift, validate org context via existing auth helpers, and avoid fake success for missing tables by disabling UI or returning truthful degraded data.

## Deferred Features

- Workflow automation is disabled with copy when workflow tables are absent. Severity: P2 schema deployment dependency.
- Training register creation is disabled with copy when org_training_records is absent. Severity: P2 schema deployment dependency.
- Governance retention actions are disabled with copy when retention tables/columns are absent. Severity: P2 schema deployment dependency.
- Custom reports are disabled with copy when their tables are absent. Severity: P2 schema deployment dependency.
- CAPA no longer appears as unavailable in the connected migrated workspace. Remaining CAPA phase 2 work is source linking beyond incidents and entitlement enforcement.

## Validation

- npm run typecheck: PASS
- npm run lint: PASS
- npm run build: PASS
- npm run check:app-links: PASS, 306 links validated
- npm run test:e2e:app-actions: PASS, 6 passed
- npm run test:e2e:exports: PASS, 4 passed
- npx playwright test e2e/full-app-action-crawler.spec.ts --project=chromium --reporter=list: PASS, 1 passed
- npx playwright test e2e/system-integration.spec.ts e2e/deep-workflow-integrity.spec.ts --project=chromium --reporter=list: PASS, 11 passed

Additional CAPA phase 1 validation added:

- npx playwright test e2e/capa-flow.spec.ts --project=chromium --reporter=list: PASS, 1 passed

## Risk Rating

Medium-low. The crawler is broad and production-build verified, but this is still bounded by seeded data and safe non-destructive action execution. Destructive flows are verified by visibility/route/handler availability rather than deleting seeded records.
