# App Integrity Audit

Updated: 2026-04-26

## Scope

Authenticated app surfaces audited in this pass:

- Dashboard and sidebar navigation
- Obligations / Compliance
- Policies and policy lifecycle routes
- Evidence Vault
- Participants, visits, progress notes, incidents, staff compliance
- Team and settings roles
- Registers and forms
- Reports and export surfaces
- Executive view and billing/settings entry points

This pass focused first on known user-reachable broken surfaces, then extended static route validation and targeted browser checks around routes, CTAs, exports, and downloads.

## Broken Routes Found And Fixed

| Surface | Problem | Resolution |
|---|---|---|
| Policy management | `/app/policies/[id]/versions` was linked but missing | Added org-scoped policy version history page with fallback to the current policy record when no lifecycle rows exist |
| Policy management | `/app/policies/[id]/edit` was linked but missing | Added org-scoped edit page with locked-state guidance for published or approval-controlled policies |
| Settings roles | `/app/settings/roles/[roleId]` was linked but missing | Added org-scoped custom role detail page with permissions and assigned member summary |
| Form submissions | `/app/forms/[formId]/analytics` linked to no page | Replaced visible link with disabled "Analytics coming soon" control |

Static validation after the fixes:

- `npm run check:app-links`: 303 internal app links validated, 0 broken.

## Exports Found

| Surface | Status | Notes |
|---|---|---|
| Reports Center - trust packet | Working | `/api/reports/export?type=trust&format=pdf&mode=sync` remains exposed only when export access is available |
| Reports Center - SOC 2 | Working | Existing supported report type |
| Reports Center - ISO 27001 | Working | Existing supported report type |
| Reports Center - NDIS | Working | Existing supported report type |
| Reports Center - HIPAA | Working | Existing supported report type |
| Industry report templates | Disabled | Unsupported specific report types no longer link to `/api/reports/export`; controls now say "Export coming soon" |
| Universal RAG status report | Disabled | Unsupported `rag-status` export no longer links to `/api/reports/export` |
| Form submissions CSV | Implemented | Added `/api/v1/forms/[formId]/submissions/export` with session/API-key auth, org scope, UUID validation, CSV headers, empty CSV support, and content disposition |
| Vault/evidence download | Working | Download action is exposed with a stable test id and verified by E2E against signed storage URL/download behavior |
| Incident export | Existing | `/api/incidents/export` already exists and remains exposed from incidents |
| Staff credentials export | Existing | `/api/staff-credentials/export` already exists and remains exposed from staff compliance |

## Forms Schema Verification

- Current app table names are `org_forms`, `org_form_submissions`, and `org_form_templates`.
- The original matching repo migration is `supabase/migrations/20260402_forms_platform.sql`.
- Added repair migration `supabase/migrations/20260426_001_ensure_forms_platform_schema.sql` so environments that missed the original migration still receive the forms tables idempotently.
- No alternate/legacy table name was found in active forms code; `lib/forms/*`, app forms pages, and the new export route all consistently use `org_forms` and `org_form_submissions`.
- The `PGRST205` export failure is environment schema drift against the configured Supabase project, not an app route mismatch. Real `select`/`insert` calls to `org_forms` fail until the migration is applied.
- The export E2E no longer skips when forms tables are missing; it fails loudly and points back to the missing migration.
- Apply the repair through the linked Supabase migration flow before running forms E2E against this project. This checkout does not include a committed `supabase/config.toml`, and `npx supabase projects list` reports no access token, so the agent could not apply the remote migration from this shell. Once linked/logged in, run `npx supabase db push`; for a local linked dev stack, run `npx supabase db reset`.

## API And Server Action Notes

- Added `app/api/v1/forms/[formId]/submissions/export/route.ts`.
- The form export route uses `authenticateV1Request`, so it supports authenticated app sessions and API-key access consistently with adjacent V1 form routes.
- The route scopes both form and submission reads to `auth.context.orgId`.
- Invalid `formId` returns 400. Missing org-scoped form returns 404.
- Export output uses the shared tabular formatter and `Content-Disposition` attachment headers.
- `updatePolicy` now revalidates policy detail, edit, and version-history paths after save.
- Policy detail editing now treats both `owner` and `admin` as managers.

## Hidden Or Deferred Features

- Industry-specific report exports are deferred until the backend supports those exact report types.
- Universal RAG status export is deferred until a matching backend report type exists.
- Form submissions analytics is deferred because only the API analytics endpoint exists; there is no authenticated app analytics page.
- Custom role editing is deferred; the role detail page is read-only and says editing is not available yet.

## Tests Added

### `e2e/app-action-integrity.spec.ts`

Covers:

- Sidebar route load sweep for the authenticated app
- Policy versions route
- Policy edit route
- Custom role detail route
- Primary CTAs for reports and settings roles
- App/API 404 response capture for authenticated routes

### `e2e/export-integrity.spec.ts`

Covers:

- Supported report export download
- Unsupported report template controls disabled instead of linked
- Form submissions CSV export when forms tables exist
- Verified vault evidence download action

Forms schema note: `supabase/migrations/20260402_forms_platform.sql` is the original repo-level migration that creates `org_forms`, `org_form_submissions`, and `org_form_templates`. This pass adds `supabase/migrations/20260426_001_ensure_forms_platform_schema.sql` as an idempotent repair because the configured Supabase project still returns `PGRST205` for real `org_forms` reads/writes. The form export E2E now seeds a real form plus submission and fails instead of skipping when the forms schema is absent.

## Validation Results

- `npm run typecheck`: passed
- `npm run lint`: passed
- `npm run build`: passed
- `npm run check:app-links`: passed, 0 broken app links
- `npx playwright test e2e/app-action-integrity.spec.ts --project=chromium --reporter=list`: passed, 4 passed
- `npx playwright test e2e/export-integrity.spec.ts --project=chromium --reporter=list`: 2 passed, 1 failed. Report export and vault/evidence download passed; form submissions export failed at seed time with `PGRST205` because the configured Supabase project has not applied the forms schema yet. There are no skips.
- Critical regression command across onboarding, care plans, task flow, forms, incidents, dashboard, deep workflow integrity, and system integration: first run 12 passed / 6 failed. Retried failing spec set once: 6 passed / 7 failed.
- Repeatable/environment failures from critical regression: `forms-new` is blocked by missing `org_forms`; several workflow specs time out or miss seeded obligation/care-plan rows under local Supabase/Redis degradation; audit-trail API returned 429 on the first run and passed on retry; one incident detail strict-selector failure passed on retry.

## Remaining Risks

- Environment schema drift remains a deployment/readiness risk: forms E2E now fails instead of skipping if `org_forms` is absent. The repair migration is `supabase/migrations/20260426_001_ensure_forms_platform_schema.sql`.
- Broader CRUD/state mutation coverage remains distributed across existing suites. This pass ran the requested critical regression command, but several pre-existing workflow specs still fail in the current environment and should be triaged separately from the four fixed surfaces.
- Local web-server logs show degraded Redis/rate-limit persistence, slow/dropped security activity writes, and missing optional tables such as `organization_sso`; those were not introduced by this pass, but they should be watched in environment readiness work.

## Verdict

The four known broken surfaces are fixed:

- Report export mismatch no longer exposes unsupported export calls.
- Form submissions export route exists and is implemented.
- Policy dynamic routes no longer 404.
- Role detail route no longer 404.

Current app link inventory is zero-broken for static `/app` links. User-visible unsupported exports/actions touched in this pass are now disabled with truthful copy instead of linking to broken endpoints.
