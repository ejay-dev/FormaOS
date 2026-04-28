# CAPA Implementation Spec

This spec prepares the next CAPA build. It does not implement CAPA in this cleanup sprint.

## Product Goal

CAPA should turn incidents, investigations, audit findings, and control failures into assigned corrective and preventive actions with evidence, verification, and audit history. It should be usable by regulated care and compliance teams without requiring a separate spreadsheet register.

## Required Schema

Base table: `public.org_capa_items`

Required columns:

- `id uuid primary key default gen_random_uuid()`
- `organization_id uuid not null references organizations(id) on delete cascade`
- `incident_id uuid null references org_incidents(id) on delete set null`
- `investigation_id uuid null references org_investigations(id) on delete set null`
- `source_type text null` with values such as `incident`, `investigation`, `audit_finding`, `control_gap`, `manual`
- `source_id uuid null`
- `type text not null` with values `corrective`, `preventive`
- `title text not null`
- `description text null`
- `root_cause text null`
- `corrective_action text null`
- `preventive_action text null`
- `assigned_to uuid null`
- `due_date date null`
- `priority text not null default 'medium'` with values `critical`, `high`, `medium`, `low`
- `status text not null default 'draft'`
- `verification_method text null`
- `verification_notes text null`
- `verified_by uuid null`
- `verified_at timestamptz null`
- `effectiveness_check_date date null`
- `effectiveness_status text default 'pending'`
- `closed_by uuid null`
- `closed_at timestamptz null`
- `archived_at timestamptz null`
- `created_by uuid null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Supporting tables:

- `org_capa_evidence_links`: `id`, `organization_id`, `capa_id`, `evidence_id`, `linked_by`, `linked_at`, `reason`.
- `org_capa_activity`: immutable status/comment/change log with `id`, `organization_id`, `capa_id`, `actor_id`, `event_type`, `from_status`, `to_status`, `metadata`, `created_at`.
- Optional later: `org_capa_tasks` if CAPA action steps need multiple owners.

Indexes:

- `(organization_id, status)`
- `(organization_id, due_date)`
- `(organization_id, assigned_to)`
- `(incident_id)`
- `(investigation_id)`
- `(source_type, source_id)`

RLS:

- All rows must be org-scoped through `org_members`.
- Viewers can select.
- Managers/admins can insert/update.
- Admins can archive/delete if deletion is ever allowed; prefer archive.

## Status Lifecycle

Recommended lifecycle:

1. `draft`: created but not yet committed to ownership/SLA.
2. `open`: accepted into the register.
3. `investigation`: root cause analysis in progress.
4. `corrective_action_assigned`: corrective action owner and due date set.
5. `preventive_action_assigned`: preventive action owner and due date set.
6. `verification`: action evidence is ready for review.
7. `closed`: verified and complete.
8. `archived`: retained for history but removed from active operational views.

Allowed transitions:

- `draft -> open`
- `open -> investigation`
- `investigation -> corrective_action_assigned`
- `corrective_action_assigned -> preventive_action_assigned`
- `corrective_action_assigned -> verification`
- `preventive_action_assigned -> verification`
- `verification -> closed`
- any non-closed active state -> `archived` by admin only
- `verification -> corrective_action_assigned` when verification fails

## Required Routes

Product pages:

- `/app/capa`: register with filters, counts, overdue view, and links to details.
- `/app/capa/new`: create form with optional `incident_id`, `investigation_id`, or `source` query params.
- `/app/capa/[id]`: detail, status lifecycle, assignment, evidence links, activity log.
- `/app/incidents/[id]`: link/create CAPA from an incident.
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

- `createCapa(input)`: validates org, role, plan, source links, and inserts a draft/open CAPA.
- `updateCapa(id, input)`: edits title, description, owner, due date, priority, root cause, and action fields.
- `transitionCapaStatus(id, nextStatus, reason)`: validates allowed transition and writes audit/activity events.
- `assignCapa(id, assigneeId, dueDate)`: role checked; optionally creates task.
- `linkCapaEvidence(id, evidenceId, reason)`: checks evidence org and writes link event.
- `unlinkCapaEvidence(id, evidenceId, reason)`: admin/manager only with audit event.
- `verifyCapa(id, verification)`: records verification method, notes, verifier, and status.
- `archiveCapa(id, reason)`: admin only; no hard delete for normal users.

All server actions must:

- validate org membership and role
- enforce Growth-or-higher `capa_management` entitlement when gating is implemented
- use Zod or equivalent structured validation
- preserve org isolation
- write immutable audit/activity events
- revalidate relevant pages

## Required UI

Register page:

- Summary cards: open, investigation, assigned, verification, overdue, closed.
- Filters: status, priority, assignee, due date, source type.
- Table/list: title, source, owner, due date, status, priority, last update.
- Empty state with `New CAPA` when schema and entitlement are available.
- Truthful schema/entitlement disabled state when unavailable.

Create page:

- Title, description, source, type, priority, assignee, due date.
- Corrective/preventive action fields can be optional until assignment stage.
- If launched from incident/investigation, preserve backlink.

Detail page:

- Lifecycle stepper.
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
- `CAPA_EVIDENCE_LINKED`
- `CAPA_EVIDENCE_UNLINKED`
- `CAPA_VERIFICATION_STARTED`
- `CAPA_VERIFIED`
- `CAPA_VERIFICATION_FAILED`
- `CAPA_CLOSED`
- `CAPA_ARCHIVED`

Audit metadata should include `capa_id`, previous/new status, assignee, due date, linked source, evidence id, and reason where applicable.

## Evidence Links

- CAPA should link to existing `org_evidence` records rather than duplicating files.
- Evidence upload from a CAPA detail page should create evidence first, then link it.
- Evidence link/unlink must be auditable.
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
4. Update app code to use the expanded lifecycle.
5. Remove old compatibility paths only after crawler and production smoke pass.

## E2E Test Plan

App action crawler:

- `/app/capa` exposes `New CAPA` when schema is present.
- `/app/capa/new` submits a CAPA and lands on register/detail.
- `/app/capa/[id]` resolves from register row link.
- Disabled schema state remains truthful when tables are absent.

Focused Playwright:

- Create CAPA from incident.
- Assign corrective action and due date.
- Move through investigation, corrective action, preventive action, verification, closed.
- Link existing evidence and verify audit/activity timeline.
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
- Add focused CAPA spec once implementation begins.
