# CAPA Implementation Spec

Updated 2026-04-29 for CAPA post-migration verification. The first implementation adds real Supabase schema, server actions, lifecycle validation, incident source links, entity evidence uploads, and audit trail display. The connected Supabase project has been verified with the focused CAPA E2E flow and app action crawler. Remaining phase 2 work is called out below.

## Product Goal

CAPA should turn incidents, investigations, audit findings, and control failures into assigned corrective and preventive actions with evidence, verification, and audit history. It should be usable by regulated care and compliance teams without requiring a separate spreadsheet register.

## Required Schema

Base table: `public.org_capa_items`

Required columns:

- `id uuid primary key default gen_random_uuid()`
- `organization_id uuid not null references organizations(id) on delete cascade`
- `incident_id uuid null references org_incidents(id) on delete set null`
- `investigation_id uuid null references org_investigations(id) on delete set null`
- `source_type text null` with values `incident`, `obligation`, `policy`, `manual`
- `source_id uuid null`
- `type text not null` with values `corrective`, `preventive`
- `title text not null`
- `description text null`
- `root_cause text null`
- `corrective_action text null`
- `preventive_action text null`
- `owner_id uuid null`
- `assigned_to uuid null` retained as compatibility alias for older CAPA rows
- `due_date date null`
- `severity text not null default 'medium'` with values `critical`, `high`, `medium`, `low`
- `priority text not null default 'medium'` retained as compatibility alias for older CAPA rows
- `status text not null default 'open'`
- `verification_method text null`
- `verification_notes text null`
- `verified_by uuid null`
- `verified_at timestamptz null`
- `effectiveness_check_date date null`
- `effectiveness_status text default 'pending'`
- `closed_at timestamptz null`
- `archived_at timestamptz null`
- `created_by uuid null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Supporting tables:

- `org_capa_events`: CAPA-specific activity log with `id`, `organization_id`, `capa_id`, `actor_id`, `event_type`, `comment`, `metadata`, `created_at`.
- Evidence uses the existing polymorphic `org_evidence.entity_type/entity_id` model with `entity_type='capa'`.
- `org_audit_logs`: user-facing immutable audit trail target `capa:{id}` used by `AuditTrailPanel`.
- Future optional `org_capa_evidence_links`: only needed if one evidence artifact must link to many CAPAs independent of the polymorphic entity pointer.
- Optional later: `org_capa_tasks` if CAPA action steps need multiple owners.

Indexes:

- `(organization_id, status)`
- `(organization_id, due_date)`
- `(organization_id, owner_id)`
- `(incident_id)`
- `(investigation_id)`
- `(source_type, source_id)`

RLS:

- All rows must be org-scoped through `org_members`.
- Authenticated org members can select through RLS.
- App-level phase 1 authoring is limited to owner/admin system roles, which maps manager/compliance roles into admin.
- Admins can archive/delete if deletion is ever allowed; prefer archive.

## Status Lifecycle

Recommended lifecycle:

1. `draft`: created but not yet committed to ownership/SLA.
2. `open`: accepted into the register.
3. `investigating`: root cause analysis in progress.
4. `action_assigned`: corrective/preventive action owner and due date are set.
5. `verification`: action evidence is ready for review.
6. `closed`: verified and complete.
7. `archived`: retained for history but removed from active operational views.

Allowed transitions:

- `draft -> open`
- `open -> investigating`
- `open -> action_assigned`
- `investigating -> action_assigned`
- `action_assigned -> verification`
- `verification -> closed`
- active states -> `archived` by admin/manager
- `verification -> action_assigned` when verification fails or needs rework
- `closed -> archived`

## Required Routes

Product pages implemented in phase 1:

- `/app/capa`: register with filters, counts, overdue view, and links to details.
- `/app/capa/new`: create form with optional `incident_id`, `investigation_id`, or `source` query params.
- `/app/capa/[id]`: detail, status lifecycle, assignment, evidence links, activity log.
- `/app/incidents/[id]`: link/create CAPA from an incident.

Phase 2 routes/touchpoints:

- `/app/incidents/[id]/investigation`: create CAPA from investigation findings.

API/server routes:

- Prefer server actions for form mutations in `app/app/capa/actions.ts`.
- Optional REST API later:
  - `GET /api/v1/capa`
  - `POST /api/v1/capa`
  - `GET /api/v1/capa/[id]`
  - `PATCH /api/v1/capa/[id]`
  - `POST /api/v1/capa/[id]/status`
  - `POST /api/v1/capa/[id]/evidence`

## Required Server Actions

- `createCapa(formData)`: validates org, role, source link, owner, severity, and inserts an open CAPA.
- `updateCapa(formData)`: edits title, description, severity, and due date.
- `assignCapaOwner(formData)`: validates owner membership and records assignment.
- `updateCapaStatus(formData)`: validates allowed transition and writes audit/activity events.
- `addRootCause(formData)`: records root cause.
- `addCorrectiveAction(formData)`: records corrective action.
- `addPreventiveAction(formData)`: records preventive action.
- `verifyCapa(formData)`: records verification notes, verifier, and verification timestamp.
- `closeCapa(formData)`: requires verification notes and closes from `verification`.
- `archiveCapa(formData)`: archives through the same transition validator.

All server actions must:

- validate org membership and role
- enforce Growth-or-higher `capa_management` entitlement when gating is implemented; phase 1 deliberately does not fake plan gates
- use Zod or equivalent structured validation
- preserve org isolation
- write immutable audit/activity events
- revalidate relevant pages

## Required UI

Register page:

- Summary cards: open, active, overdue, closed.
- Filters: status and severity.
- Table/list: title, source, owner, due date, status, severity, short description.
- Empty state with `New CAPA` when schema and entitlement are available.
- Truthful schema/entitlement disabled state when unavailable.

Create page:

- Title, description, source, type, severity, owner, due date.
- Corrective/preventive action fields can be optional until assignment stage.
- If launched from incident/investigation, preserve backlink.

Detail page:

- Lifecycle/status panel with allowed next transitions.
- Editable fields by role.
- Evidence links panel.
- Activity/audit timeline.
- Verification panel.
- Related incident/investigation context.

## Audit Events

Write both user-facing CAPA activity and platform audit events for:

- `CAPA_CREATED`
- `CAPA_UPDATED`
- `CAPA_ASSIGNED`
- `CAPA_STATUS_CHANGED`
- `CAPA_ROOT_CAUSE_ADDED`
- `CAPA_CORRECTIVE_ACTION_ADDED`
- `CAPA_PREVENTIVE_ACTION_ADDED`
- `CAPA_EVIDENCE_UPLOADED`
- `CAPA_VERIFICATION_COMPLETED`
- `CAPA_CLOSED`
- `CAPA_ARCHIVED`

Audit metadata should include `capa_id`, previous/new status, assignee, due date, linked source, evidence id, and reason where applicable.

## Evidence Links

- CAPA phase 1 uploads evidence directly through `EntityEvidencePanel` using `entity_type='capa'` and `entity_id=capa.id`.
- Evidence upload creates an `org_evidence` row and writes both evidence and CAPA audit events.
- Evidence Vault can show CAPA-linked evidence through the existing entity fields where those columns are present.
- Evidence status should affect CAPA verification readiness: unverified evidence should be visible but not sufficient for closure unless an admin overrides with reason.

## Dashboard And Reporting Impact

Dashboard:

- Add CAPA counts to operational/compliance dashboard only after schema is guaranteed.
- Include overdue CAPA in the obligations/task risk band.

Incidents:

- Incident detail should show linked CAPA count and statuses.
- Investigation page should prompt CAPA creation after findings/root cause.

Reports:

- Standard report exports should include CAPA summary once implemented.
- Future custom reports should expose CAPA dataset fields.

Executive:

- CAPA overdue, closure rate, and verification failure rate can feed executive risk once enough data exists.

## Migration Plan

1. Add a forward-only migration that expands existing `org_capa_items` safely:
   - add missing lifecycle columns with defaults
   - relax or replace status check constraint to include the new lifecycle
   - add supporting evidence/activity tables
   - add indexes and RLS policies
2. Backfill existing statuses:
   - `open -> open`
   - `in_progress -> corrective_action_assigned`
   - `implemented -> verification`
   - `verified -> closed`
   - `closed -> closed`
3. Keep schema compatibility guards until production and preview DBs confirm the migration.
4. Update app code to use the expanded lifecycle. Completed in phase 1.
5. Remove old compatibility paths only after crawler and production smoke pass.

## E2E Test Plan

App action crawler:

- `/app/capa` exposes `New CAPA` when schema is present.
- `/app/capa/new` submits a CAPA and lands on detail.
- `/app/capa/[id]` resolves from register row link.
- Disabled schema state remains truthful when tables are absent.

Focused Playwright:

- Create CAPA from incident.
- Assign owner and due date.
- Move through investigating, action assigned, verification, closed.
- Upload evidence and verify audit/activity timeline.
- Viewer cannot edit or transition status.
- Manager can create/update but cannot archive if archive is admin-only.

API/server action tests:

- Validation rejects invalid status transitions.
- Org isolation prevents cross-org CAPA reads/writes.
- Evidence link requires same organization.
- Audit events are written for every mutation.

Regression checks:

- `npm run typecheck`
- `npm run lint`
- `npm run test:e2e:app-actions`
- `npx playwright test e2e/full-app-action-crawler.spec.ts --project=chromium --reporter=list`
- `npx playwright test e2e/capa-flow.spec.ts --project=chromium --reporter=list`

Post-migration result:

- `e2e/capa-flow.spec.ts` now runs without skip and passes against the connected Supabase project.
- Verified create, owner assignment, root cause, corrective action, preventive action, status transitions, verification, close, evidence upload, audit trail display after reload, persistence after reload, and incident backlink.
- Schema probe confirmed authenticated org-scoped CAPA reads/writes, CAPA event writes, `org_evidence.entity_type='capa'`, and cross-org write blocking by RLS.

## Phase 2 Items

- Obligation detail/drawer to CAPA creation.
- Policy to CAPA creation for policy exceptions or review findings.
- Investigation findings to CAPA creation.
- Dashboard/reporting CAPA metrics once production schema is guaranteed.
- Growth+ entitlement gate with Admin/Manager authoring and Viewer read-only behavior.
- Optional many-to-many evidence linking if one artifact must support multiple CAPA records.
