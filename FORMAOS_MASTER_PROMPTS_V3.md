# FormaOS Master Prompts V3

Generated: 2026-04-02
Based on: Full codebase gap analysis post-V2 implementation. All V2 prompts (1-5) are implemented and verified.

These ten prompts are designed to be executed independently. Each targets a different dimension of the product and is scoped to produce 1,500–3,000+ lines of production code. Combined, they close the largest remaining gaps across product depth, enterprise readiness, and care-industry differentiation.

Previous coverage (V2, implemented):

- Prompt V2-1: Test infrastructure & business logic verification
- Prompt V2-2: Customer-facing API platform, webhooks, integrations
- Prompt V2-3: Workflow automation engine with visual builder
- Prompt V2-4: Notifications & activity intelligence
- Prompt V2-5: Enterprise identity, SCIM, SSO, data governance

---

## Gap Summary Informing V3

| Gap                                          | Severity                                      | Current State                           |
| -------------------------------------------- | --------------------------------------------- | --------------------------------------- |
| Form builder                                 | Critical — skeletal, no DB/API/submissions    | ~604 lines, builder UI only             |
| AI intelligence (RAG, context, metering)     | High — no document-aware search               | ~2,612 lines, chat works but no RAG     |
| Care plan detail & clinical workflows        | High — can create, can't view/edit            | ~4,215 lines, schema deep but UI gaps   |
| Custom reports & analytics                   | High — PDF-only, no scheduling, no trends     | ~1,576 lines, narrow scope              |
| Global search                                | Medium — per-table only, no unified index     | ~1,216 lines across 3 components        |
| External auditor portal & evidence lifecycle | Medium — no auditor access, no smart evidence | ~1,992 lines, strong core               |
| Admin operations completion                  | Medium — 5 TODO items outstanding             | Data/schema exists, UI incomplete       |
| Incident analytics & CAPA                    | Medium — data captured, no trend views        | ~1,366 lines, well-built core           |
| Mobile native features & offline             | Medium — pure WebView shell                   | Capacitor scaffolding only              |
| Executive reporting & multi-org rollup       | Low-Medium — dashboards exist, no export      | ~2,785 lines, strong but not exportable |

---

## Master Prompt 6: Full-Stack Form Builder Platform With Evidence Pipeline

> **Expected output: ~2,500+ lines of database schema, API, form builder, submission handling, templates, and evidence integration**

You are the forms platform engineer for FormaOS. Compliance platforms live on structured data collection — risk assessments, vendor questionnaires, audit checklists, incident reports, staff training acknowledgments, and care assessments. A skeletal form builder exists (`lib/forms/types.ts`, `lib/forms/field-templates.ts`, `app/app/forms/builder/[id]/form-builder-client.tsx` — ~604 lines total) but has no database schema, no API, no submission handling, no form list page, and no connection to the evidence pipeline.

### Context

Current state:

- `lib/forms/types.ts` (~50 lines): field types (text, email, number, textarea, select, radio, checkbox, date, file), validation schema, conditional logic types, `FormSettings`
- `lib/forms/field-templates.ts` (~80 lines): template definitions for each field type
- `app/app/forms/builder/[id]/form-builder-client.tsx` (378 lines): builder UI shell — unclear if drag-and-drop is functional
- No `org_forms` or `form_submissions` tables in any migration
- No API routes for forms
- No `app/app/forms/page.tsx` — no form list page
- No public/shareable form URLs
- No form templates for compliance use cases
- No form → evidence pipeline (submissions should generate evidence artifacts for compliance controls)
- Evidence upload is manual only — no structured data collection feeding into compliance scoring

### Your Job

#### Phase 1: Database Schema & Data Model (produce ~300 lines)

1. Create migration `supabase/migrations/20260402_forms_platform.sql`:
   - `org_forms` table: id, org_id, title, description, slug (unique per org), version, status (draft | published | archived), fields JSONB, settings JSONB (submissions_enabled, requires_auth, notify_on_submission, auto_close_date, max_submissions, redirect_url, evidence_mapping), created_by, created_at, updated_at, published_at
   - `org_form_submissions` table: id, form_id, org_id, submitted_by (nullable for anonymous), respondent_email, respondent_name, data JSONB, metadata JSONB (ip_address, user_agent, submission_duration_ms), status (submitted | reviewed | approved | rejected), reviewed_by, reviewed_at, review_notes, evidence_id (FK to evidence if linked), created_at
   - `org_form_templates` table: id, name, description, category (compliance | risk | care | hr | security | custom), industry (general | healthcare | ndis | fintech | saas), fields JSONB, settings JSONB, usage_count, created_at
   - RLS policies: org_id scoped for forms and submissions, template read for all authenticated users
   - Indexes: form slug+org_id, form status, submission form_id+created_at, submission status
   - GIN index on submission data for JSON querying

2. Create `lib/forms/form-store.ts` (~150 lines):
   - `createForm(orgId, createdBy, data)` — create draft form
   - `updateForm(formId, orgId, updates)` — update form fields/settings with version bump
   - `publishForm(formId, orgId)` — set status to published, record published_at
   - `archiveForm(formId, orgId)` — soft archive
   - `duplicateForm(formId, orgId, createdBy)` — clone form as new draft
   - `getForm(formId, orgId)` — load form definition
   - `getFormBySlug(slug, orgId)` — load by slug for public URL
   - `listForms(orgId, { status?, search?, cursor?, limit? })` — paginated list

#### Phase 2: Submission Engine (produce ~400 lines)

1. Create `lib/forms/submission-engine.ts`:
   - `submitForm(formId, orgId, data, metadata)` — validate submission against form field definitions, run all validators (required, pattern, min/max, custom), store submission, trigger notifications, return submission ID
   - `validateSubmission(fields, data)` — per-field validation with typed error messages
   - `evaluateConditionalLogic(fields, data)` — evaluate show/hide conditions to determine which fields are required
   - `getSubmission(submissionId, orgId)` — load single submission
   - `listSubmissions(formId, orgId, { status?, dateRange?, cursor?, limit? })` — paginated list with filters
   - `reviewSubmission(submissionId, orgId, reviewerId, status, notes)` — mark as approved/rejected
   - `exportSubmissions(formId, orgId, format: 'csv' | 'json' | 'xlsx')` — bulk export
   - `getSubmissionAnalytics(formId, orgId)` — count by status, average completion time, field-level answer distribution

2. Create `lib/forms/evidence-pipeline.ts` (~100 lines):
   - `linkSubmissionToEvidence(submissionId, orgId, controlId)` — create evidence artifact from form submission, linking structured answers as evidence
   - `autoMapSubmission(formId, submissionId, orgId)` — if form has `evidence_mapping` in settings, auto-create evidence records and link to configured controls
   - `generateEvidencePDF(submissionId, orgId)` — render form submission as branded PDF for audit trail

#### Phase 3: API Routes (produce ~400 lines)

1. `app/api/v1/forms/route.ts` — GET (list forms), POST (create form)
2. `app/api/v1/forms/[formId]/route.ts` — GET (form detail), PATCH (update), DELETE (archive)
3. `app/api/v1/forms/[formId]/publish/route.ts` — POST (publish form)
4. `app/api/v1/forms/[formId]/duplicate/route.ts` — POST (duplicate form)
5. `app/api/v1/forms/[formId]/submissions/route.ts` — GET (list submissions with filters), POST (submit)
6. `app/api/v1/forms/[formId]/submissions/[submissionId]/route.ts` — GET (detail), PATCH (review)
7. `app/api/v1/forms/[formId]/submissions/export/route.ts` — GET (export as CSV/JSON/XLSX)
8. `app/api/v1/forms/[formId]/analytics/route.ts` — GET (submission analytics)
9. `app/api/v1/form-templates/route.ts` — GET (list templates by category/industry)
10. `app/submit/[orgSlug]/[formSlug]/route.ts` — public submission page (no auth required if form allows anonymous)

All endpoints must use API key or session auth, org-scoped RLS, pagination (`{ data, meta: { cursor, hasMore, total } }`), and audit logging.

#### Phase 4: Form Templates (produce ~300 lines)

Create `lib/forms/templates/` with pre-built compliance form templates:

1. `risk-assessment.ts` — likelihood/impact matrix, risk category, mitigation plan, owner, review date
2. `vendor-questionnaire.ts` — vendor name, data handling, security certifications, sub-processors, breach history, SLA terms
3. `access-review.ts` — system, current access level, justification, manager approval, review period
4. `incident-report.ts` — date/time, type, affected systems, severity, initial response, witnesses, root cause (optional)
5. `policy-acknowledgment.ts` — policy name, version, read confirmation, questions/understanding check, digital signature
6. `staff-training-record.ts` — training module, completion date, assessment score, trainer, certificate upload
7. `care-assessment.ts` — participant, assessment type, functional domains, goals, risk factors, support needs, reviewer sign-off
8. `compliance-checklist.ts` — control reference, status (compliant/non-compliant/partial/N-A), evidence reference, notes, assessor

Create `lib/forms/templates/index.ts` — template registry with metadata, search, and category filtering.

#### Phase 5: Form Builder Enhancement & UI (produce ~800 lines)

1. Enhance `app/app/forms/builder/[id]/form-builder-client.tsx`:
   - Drag-and-drop field reordering using `@dnd-kit/core`
   - Field property panel (label, placeholder, required, validation rules, help text, conditional logic)
   - Multi-page/section support with page breaks
   - Live preview pane showing rendered form
   - Settings panel (auth required, notification emails, evidence mapping, slug, close date)
   - Import from template with customization

2. Create `app/app/forms/page.tsx` — form management page:
   - Grid/list of forms with status badge (draft/published/archived)
   - Submission count, last submission date, response rate
   - Quick actions: edit, duplicate, archive, view submissions, share link
   - Create new (blank or from template)
   - Search and filter by status

3. Create `app/app/forms/[formId]/submissions/page.tsx` — submission viewer:
   - Table of submissions with respondent, date, status, review state
   - Click to expand full submission detail
   - Bulk approve/reject
   - Export buttons (CSV, JSON)
   - Link to evidence button (for compliance-mapped forms)

4. Create `app/submit/[orgSlug]/[formSlug]/page.tsx` — public submission form:
   - Clean, minimal design for external respondents
   - FormaOS branding (configurable)
   - Progress indicator for multi-page forms
   - File upload support
   - Submission confirmation screen
   - No login required if form settings allow anonymous

5. Create `components/forms/form-renderer.tsx` — reusable form rendering component:
   - Renders form fields from JSON definition
   - Handles all field types including file upload
   - Conditional field visibility
   - Real-time validation
   - Used by both public submission page and in-app rendering

#### Phase 6: Wire Into Platform (produce ~300 lines)

1. Wire form submission notifications: on submission → notify form owner via notification engine
2. Wire form submissions into activity feed
3. Wire webhook dispatch: `form.submitted`, `form.reviewed` events
4. Add forms to global search results
5. Add forms section to workspace navigation sidebar
6. Add form submission count to dashboard KPIs

### Output Required

- Database migration with forms, submissions, and templates tables
- Form store with full CRUD
- Submission engine with validation, conditional logic, evidence pipeline
- 10 API routes
- 8 compliance form templates
- Enhanced form builder with DnD, preview, settings
- Form management page, submission viewer, public submission page
- Form renderer component
- Platform wiring (notifications, activity, webhooks, search, nav)
- All passing typecheck

### Verification

```bash
npm run typecheck
npm test -- --testPathPattern="form"
# Manual: create form from template → publish → submit from public URL → view submission → link to evidence → verify compliance score update
```

---

## Master Prompt 7: AI-Powered Compliance Intelligence With RAG And Document Analysis

> **Expected output: ~2,500+ lines of vector search infrastructure, document indexing, context-aware AI, evidence analysis, and usage metering**

You are the AI platform engineer for FormaOS. The AI assistant exists (`components/ai-assistant/` — 7 files, `lib/ai/` — 4 files, ~2,612 lines) and supports chat with prompt templates, but it has no awareness of the customer's actual documents, evidence, policies, or compliance state. For a compliance AI to be genuinely useful, it must understand the customer's specific context — their uploaded evidence, their policies, their control gaps, and their compliance history.

### Context

Current state:

- AI chat works end-to-end via Vercel AI SDK + OpenAI gpt-4o-mini
- 5 prompt templates: compliance Q&A, draft policy, evidence guidance, gap analysis, implementation guidance
- `AIComplianceAssistant` class with document analysis, task recommendation, NL query
- `compliance-ai.ts` with evidence quality scoring, audit response generation, caching, rate limiting
- API routes: `/api/v1/ai/chat`, `/api/v1/ai/conversations`
- No RAG / vector search — no embeddings, no document indexing
- No file/evidence attachment in chat context
- Hardcoded to OpenAI gpt-4o-mini only — no model selection
- No usage metering per org — no token tracking, no cost allocation
- No conversation export or sharing
- Supabase supports `pgvector` extension for embeddings

### Your Job

#### Phase 1: Vector Search Infrastructure (produce ~500 lines)

1. Create migration `supabase/migrations/20260402_ai_vector_search.sql`:
   - Enable `pgvector` extension
   - `ai_document_embeddings` table: id, org_id, source_type (evidence | policy | control | task | form_submission), source_id, chunk_index, chunk_text, embedding vector(1536), metadata JSONB (title, section, page, created_at), created_at
   - `ai_conversations` table enhancement: add `context_sources` JSONB column to track which documents were referenced
   - `ai_usage_log` table: id, org_id, user_id, model, input_tokens, output_tokens, total_tokens, cost_usd, conversation_id, created_at
   - RLS: org_id scoped on all tables
   - HNSW index on embedding column for fast similarity search
   - Index on source_type + source_id for re-indexing

2. Create `lib/ai/embeddings.ts`:
   - `generateEmbedding(text)` — call OpenAI text-embedding-3-small, return vector
   - `generateEmbeddings(texts[])` — batch embedding with rate limiting
   - `chunkDocument(text, options?)` — split document into semantic chunks (500 tokens with 50 token overlap), handle markdown, tables, and structured content intelligently
   - `chunkPDF(buffer)` — extract text from PDF then chunk
   - Retry logic with exponential backoff for API failures

3. Create `lib/ai/vector-store.ts`:
   - `indexDocument(orgId, sourceType, sourceId, text, metadata)` — chunk, embed, store all chunks
   - `deleteDocumentIndex(orgId, sourceType, sourceId)` — remove all chunks for a document
   - `reindexDocument(orgId, sourceType, sourceId, text, metadata)` — delete old chunks, create new
   - `similaritySearch(orgId, query, options?)` — embed query, find top-K similar chunks (default K=10), filter by source_type, return ranked results with scores
   - `hybridSearch(orgId, query, options?)` — combine vector similarity with full-text search for better recall
   - `getIndexStats(orgId)` — counts by source type, total chunks, last indexed

#### Phase 2: Document Indexing Pipeline (produce ~400 lines)

1. Create `lib/ai/indexing-pipeline.ts`:
   - `indexEvidence(orgId, evidenceId)` — fetch evidence document, extract text (PDF/DOCX/TXT/MD), chunk and embed
   - `indexPolicy(orgId, policyId)` — index policy content
   - `indexControl(orgId, controlId)` — index control description, requirements, and linked evidence summaries
   - `indexFormSubmission(orgId, submissionId)` — index form answers as structured text
   - `fullReindex(orgId)` — reindex all documents for an org (background job)
   - `incrementalIndex(orgId, since)` — index only documents created/updated since timestamp

2. Create `trigger/ai-indexing.ts` — Trigger.dev tasks:
   - `indexDocumentTask` — index a single document (triggered on upload/update)
   - `fullReindexTask` — full org reindex (triggered manually or on framework install)
   - `indexCleanupTask` — remove orphaned embeddings where source document was deleted

3. Wire indexing into existing mutation paths:
   - After evidence upload → trigger `indexDocumentTask`
   - After policy create/update → trigger `indexDocumentTask`
   - After form submission → trigger `indexDocumentTask`
   - After evidence/policy delete → trigger embedding deletion

#### Phase 3: Context-Aware AI Chat (produce ~600 lines)

1. Enhance `lib/ai/sdk-client.ts` or create `lib/ai/rag-chat.ts`:
   - Before sending user message to LLM, run similarity search against org's document index
   - Inject top-K relevant chunks as context in system prompt
   - Include source attribution: each referenced chunk includes source type, title, and link
   - Support explicit document attachment: user can attach a file or reference evidence/policy by name
   - Dynamic context window management: prioritize most relevant chunks within token budget

2. Create `lib/ai/compliance-context.ts`:
   - `buildComplianceContext(orgId)` — gather current compliance state summary: active frameworks, overall score, critical gaps, overdue tasks, recent score changes
   - `buildControlContext(orgId, controlId)` — deep context for a specific control: requirements, evidence, status, related controls, history
   - Inject compliance context into every AI conversation so the assistant is always aware of org state

3. Enhance chat API (`app/api/v1/ai/chat/route.ts`):
   - Accept optional `attachments` parameter (evidence IDs, file uploads)
   - Accept optional `context_controls` parameter to focus on specific controls
   - Return `sources` array in response: referenced documents with links
   - Stream response with source attribution markers

4. Create `lib/ai/analysis.ts`:
   - `analyzeEvidence(orgId, evidenceId, controlId)` — AI assessment of whether evidence satisfies a control's requirements, with gap identification and recommendations
   - `analyzeComplianceGaps(orgId, frameworkId)` — AI-driven gap analysis using indexed documents and control requirements
   - `generateAuditResponse(orgId, question)` — generate audit-ready response with evidence citations
   - `suggestEvidenceForControl(orgId, controlId)` — search indexed documents for potential evidence matches

#### Phase 4: Usage Metering & Model Management (produce ~300 lines)

1. Create `lib/ai/usage-meter.ts`:
   - `trackUsage(orgId, userId, model, inputTokens, outputTokens, conversationId)` — log usage record
   - `getOrgUsage(orgId, period)` — aggregate usage by day/week/month with cost calculation
   - `getUserUsage(orgId, userId, period)` — per-user usage breakdown
   - `checkUsageLimit(orgId)` — check against plan entitlement (Starter: 1K msgs/mo, Pro: 10K, Enterprise: unlimited)
   - `getUsageSummary(orgId)` — current period usage, remaining allowance, projected cost

2. Create `lib/ai/model-config.ts`:
   - Model registry: gpt-4o-mini (fast, cheap), gpt-4o (accurate), claude-sonnet (alternative)
   - Per-org model selection (default to gpt-4o-mini, upgrade path)
   - Cost per model per 1K tokens
   - Automatic model downgrade when approaching usage limit

3. Create `app/api/v1/ai/usage/route.ts` — GET org AI usage analytics

#### Phase 5: AI UI Enhancements (produce ~500 lines)

1. Enhance `components/ai-assistant/AiAssistantPanel.tsx`:
   - Source attribution panel: after AI response, show "Sources" section with linked documents
   - Inline evidence reference: clickable document links in AI responses
   - Attach evidence/file button in chat input
   - "Ask about this control" context action from control detail pages
   - Usage indicator: remaining messages this month

2. Create `components/ai-assistant/AiSourceCard.tsx`:
   - Compact card showing source document: type icon, title, relevance score, snippet
   - Click to navigate to source document

3. Create `components/ai-assistant/AiUsageDashboard.tsx`:
   - Usage chart by day/week
   - Per-user breakdown
   - Cost projection
   - Plan limit indicator

4. Create `app/app/settings/ai/page.tsx` — AI settings page:
   - Model selection (if plan allows)
   - Usage overview with upgrade prompt
   - Indexing status: documents indexed, last reindex time
   - Reindex button
   - AI features toggle (enable/disable AI assistant per org)

5. Add AI context actions across the app:
   - On evidence detail page: "Analyze with AI" button
   - On control detail page: "Ask AI about this control" button
   - On compliance dashboard: "AI Gap Analysis" button
   - On task detail: "AI suggest evidence" button

#### Phase 6: Tests (produce ~200 lines)

1. `__tests__/lib/ai-vector-store.test.ts` — test chunking, embedding storage, similarity search, hybrid search
2. `__tests__/lib/ai-indexing-pipeline.test.ts` — test document indexing, reindexing, cleanup
3. `__tests__/lib/ai-usage-meter.test.ts` — test usage tracking, limit enforcement, cost calculation

### Output Required

- Vector search infrastructure with pgvector migration
- Document chunking and embedding pipeline
- Trigger.dev indexing tasks
- RAG-enhanced chat with source attribution
- Compliance context injection
- Evidence analysis and gap identification
- Usage metering with plan limits
- Model configuration system
- Enhanced AI assistant UI with sources and attachments
- AI settings page
- Context actions across the app
- Tests for core AI modules
- All passing typecheck

### Verification

```bash
npm run typecheck
npm test -- --testPathPattern="ai-"
# Manual: upload evidence → verify indexed → ask AI about control → verify sources cited → check usage logged
```

---

## Master Prompt 8: Care Plan Depth, Clinical Workflows, And NDIS Claiming

> **Expected output: ~2,800+ lines of care plan CRUD, goal tracking, visit calendar, medication tracking, clinical workflows, and NDIS claiming**

You are the care operations engineer for FormaOS. The care module has solid foundations (~4,215 lines) with database schema for patients, progress notes, incidents, shifts, staff credentials, visits, and care plans. However critical workflows are incomplete: care plans can be created but not viewed or edited individually, there's no goal tracking UI, visits are list-only with no calendar, there's no medication tracking, and NDIS billing codes exist in schema but have no claiming workflow.

### Context

Current state:

- DB schema: `org_patients`, `org_progress_notes`, `org_incidents`, `org_shifts`, `org_staff_credentials`, `org_visits`, `org_care_plans` — all with RLS
- Server actions: `care-operations.ts` (CRUD for participants, incidents, visits), `progress-notes.ts` (create/sign-off with audit logging)
- Pages: `app/app/care-plans/` (list + new), `app/app/participants/` (list + detail + new), `app/app/incidents/` (list + detail + new), `app/app/visits/` (list + detail + new), `app/app/staff-compliance/`
- Care scorecard: `lib/care-scorecard/` (types, scorecard-service, credential-monitor)
- `org_care_plans` has `goals` JSONB column but no UI to manage individual goals
- No `app/app/care-plans/[id]/` page — can create but not view/edit
- Visits are list-based only — no calendar or timeline view
- No medication management tables or UI
- No NDIS claiming/invoicing workflow
- NDIS industry pack exists with marketing pages, policies, and framework tasks

### Your Job

#### Phase 1: Care Plan Detail & CRUD (produce ~600 lines)

1. Create `app/app/care-plans/[id]/page.tsx` — care plan detail page:
   - Header: participant name, plan status (draft | active | review | completed | archived), plan dates (start → end), review due date
   - Tabs: Overview, Goals, Services, Notes, History
   - Overview tab: plan summary, key contacts, risk level, support needs summary, linked participant
   - Edit mode: inline editing for plan details (objectives, risk factors, support needs, review dates)
   - Status transitions: draft → active → review → active (cycle) or completed/archived with audit trail
   - Print/export as PDF for participant or external stakeholders

2. Enhance `app/app/care-plans/new/page.tsx`:
   - Step-by-step plan creation: participant selection → assessment summary → goals → services → review schedule → confirmation
   - Import goals from assessment forms (link to form builder from Prompt 6)
   - Template selection by care type (disability day support, SIL, early intervention, community access, etc.)

3. Create server actions in `app/app/actions/care-plans.ts`:
   - `getCareplan(planId, orgId)` — full plan with goals, services, notes
   - `updateCarePlan(planId, orgId, updates)` — update with version tracking and audit log
   - `transitionPlanStatus(planId, orgId, newStatus, reason)` — status change with validation and notification
   - `duplicateCarePlan(planId, orgId)` — clone plan for new period or participant
   - `exportCarePlanPDF(planId, orgId)` — generate branded PDF

#### Phase 2: Goal Tracking System (produce ~500 lines)

1. Create migration `supabase/migrations/20260402_care_goals.sql`:
   - `org_care_goals` table: id, org_id, care_plan_id, participant_id, goal_text, category (daily_living | social | health | employment | education | community | independence | safety), target_date, status (not_started | in_progress | achieved | partially_achieved | discontinued), progress_percentage, measurement_method, baseline_value, target_value, current_value, created_by, created_at, updated_at
   - `org_goal_progress_entries` table: id, goal_id, org_id, recorded_by, recorded_at, value, notes, evidence_ids JSONB
   - RLS on org_id
   - Indexes on care_plan_id, participant_id, status

2. Create `components/care/goal-tracker.tsx`:
   - Goal list within care plan detail page (Goals tab)
   - Add/edit/remove goals
   - Progress bar per goal with percentage
   - Progress entry form: date, value/observation, notes, attach evidence
   - Goal history timeline showing progress over time
   - Visual status indicators (color-coded by status)

3. Create `components/care/goal-progress-chart.tsx`:
   - Line chart showing goal progress over time (target vs actual)
   - Milestone markers
   - Trend indicator (on track, behind, exceeded)

4. Create server actions:
   - `createGoal(planId, orgId, goalData)` — create goal linked to care plan
   - `updateGoal(goalId, orgId, updates)` — update goal details
   - `recordGoalProgress(goalId, orgId, entry)` — add progress measurement
   - `getGoalHistory(goalId, orgId)` — progress entries over time

#### Phase 3: Visit Calendar & Scheduling (produce ~500 lines)

1. Create `components/care/visit-calendar.tsx`:
   - Monthly/weekly/daily calendar views
   - Visit cards showing: participant, worker, time, type, status (scheduled | in_progress | completed | cancelled | no_show)
   - Drag-to-reschedule (update visit time)
   - Click to view visit detail
   - Color-coded by visit type (personal care, community access, therapy, group activity)
   - Filter by: worker, participant, visit type, status
   - Today indicator and current time marker

2. Create `components/care/visit-scheduler.tsx`:
   - Create new visit: select participant, worker, date/time, duration, type, location, recurrence (one-off, daily, weekly, fortnightly, monthly)
   - Recurring visit series with exception handling (skip specific dates, reschedule individual occurrences)
   - Conflict detection: warn if worker already has a visit at the same time
   - Participant availability checking

3. Enhance `app/app/visits/page.tsx`:
   - Toggle between list view (current) and calendar view
   - Calendar view as default
   - Quick-create from clicking empty calendar slot

4. Create migration `supabase/migrations/20260402_visit_enhancements.sql`:
   - Add `recurrence_rule` JSONB, `recurrence_parent_id` UUID, `cancelled_at`, `cancellation_reason` to `org_visits`
   - Add `location` text, `actual_start_time`, `actual_end_time`, `travel_time_minutes` columns
   - Index on worker_id + date for conflict detection

#### Phase 4: Medication Tracking (produce ~400 lines)

1. Create migration `supabase/migrations/20260402_medication_tracking.sql`:
   - `org_medications` table: id, org_id, participant_id, name, dosage, frequency, route (oral | topical | injection | inhaled | sublingual | other), prescribed_by, start_date, end_date, instructions, precautions, is_prn (as-needed), status (active | completed | discontinued | on_hold), created_by, created_at
   - `org_medication_administrations` table: id, medication_id, org_id, participant_id, administered_by, administered_at, dose_given, status (given | withheld | refused | self_administered), notes, witness_id, created_at
   - RLS on org_id
   - Indexes for participant lookup, administration time windows

2. Create `components/care/medication-chart.tsx`:
   - Participant medication list (active, discontinued, PRN)
   - Administration schedule (next due times)
   - Administer button → record administration with witness (if required by PRN protocol)
   - Withhold/refuse with mandatory reason
   - History view: administration log by date
   - Alerts: overdue, missed, interaction warnings (basic text-based)

3. Create `app/app/participants/[id]/medications/page.tsx`:
   - Medication management for a specific participant
   - Add/edit/discontinue medications
   - Administration history
   - Print medication chart (PDF)

4. Create server actions in `app/app/actions/medications.ts`

#### Phase 5: NDIS Claiming Workflow (produce ~500 lines)

1. Create migration `supabase/migrations/20260402_ndis_claiming.sql`:
   - `org_ndis_line_items` table: id, org_id, participant_id, visit_id, care_plan_id, support_category (core | capacity_building | capital), support_item_number, support_item_name, unit_price, quantity, total_amount, claim_type (standard | cancellation | travel | non_face_to_face), status (draft | ready | submitted | paid | rejected), claimed_at, payment_reference, rejection_reason, created_at
   - `org_ndis_price_guide` table: id, effective_date, support_item_number, support_item_name, unit, price_national, price_remote, price_very_remote, category, registration_group, created_at
   - RLS on org_id

2. Create `lib/care/ndis-claiming.ts`:
   - `generateLineItems(orgId, visitId)` — auto-generate NDIS line items from a completed visit (map visit type + duration to support items using price guide)
   - `validateLineItem(lineItem)` — validate against NDIS price guide: correct item number, price within ceiling, valid dates
   - `batchValidateClaims(orgId, lineItemIds)` — bulk validation before submission
   - `exportClaimFile(orgId, lineItemIds, format)` — generate NDIS bulk claim file (CSV per NDIS portal spec)
   - `markAsPaid(orgId, lineItemIds, paymentRef)` — record payment
   - `getClaimingSummary(orgId, period)` — total claimed, total paid, total pending, total rejected

3. Create `app/app/ndis-claiming/page.tsx`:
   - Dashboard: current period summary (claimed, pending, paid, rejected)
   - Line item list with filters (status, participant, date range, category)
   - Generate claims from completed visits (select visits → preview line items → confirm)
   - Export claim file for NDIS portal upload
   - Mark claims as paid/rejected with reference number
   - Reconciliation view: expected vs received

4. Create `components/care/ndis-claim-generator.tsx`:
   - Select date range and participants
   - Preview auto-generated line items
   - Edit/adjust before finalizing
   - Validate against price guide
   - Export or save as draft

#### Phase 6: Care Dashboard Enhancement (produce ~300 lines)

1. Enhance care dashboard with:
   - Active care plans count with expiry alerts
   - Goals progress summary (on-track vs behind)
   - Visit completion rate this period
   - Medication compliance rate
   - Incident trend (rolling 30 days)
   - NDIS claiming: total claimable, unclaimed visits indicator
   - Staff credential expiry alerts (existing, wire to dashboard)

2. Wire care events into notification engine:
   - Care plan review due → notify case manager
   - Goal target date approaching → notify worker
   - Medication due (configurable) → notify assigned worker
   - Visit no-show → notify supervisor
   - NDIS claim rejected → notify billing admin

### Output Required

- Care plan detail page with full CRUD and PDF export
- Goal tracking system with progress entries and charts
- Visit calendar with scheduling, recurrence, and conflict detection
- Medication tracking with administration records and charts
- NDIS claiming workflow with price guide, validation, and export
- Enhanced care dashboard
- Notification wiring for care events
- Database migrations for all new tables
- Server actions for all operations
- All passing typecheck

### Verification

```bash
npm run typecheck
npm test -- --testPathPattern="care|ndis|medication|goal"
# Manual: create care plan → add goals → schedule visits → record visit → generate NDIS claim → export claim file
```

---

## Master Prompt 9: Custom Report Builder, Trend Analytics, And Scheduled Delivery

> **Expected output: ~2,200+ lines of custom report builder, trend analytics engine, multi-format export, and scheduled report delivery**

You are the analytics and reporting engineer for FormaOS. The reporting system exists (~1,576 lines) with compliance score reports, gap analysis, and framework-specific exports, but users cannot create custom reports, there are no trend analytics over time, export is PDF-only, and there is no scheduled report delivery. Enterprise customers need to generate recurring board reports, weekly compliance summaries, and track their compliance posture over time.

### Context

Current state:

- `app/app/reports/page.tsx` — fixed report types: compliance score, gap analysis, SOC 2, ISO 27001, NDIS, HIPAA
- `lib/reports/export-jobs.ts` — async report export with job queue and Trigger.dev
- `lib/audit-reports/` — `report-builder.ts`, `pdf-generator.ts`, `types.ts`
- `lib/report-builder.ts` — widget-based report composition
- Dashboard components: `compliance-chart.tsx`, `kpi-card.tsx`, `score-ring.tsx`
- Executive dashboard: full page with posture ring, framework rollup, critical controls, audit readiness, deadline calendar
- No custom report builder — users can't choose their own metrics
- No trend analytics — no "compliance score over 6 months" view
- No CSV/Excel export — PDF only
- No scheduled report generation or email delivery
- No team/member analytics dashboards

### Your Job

#### Phase 1: Analytics Data Layer (produce ~400 lines)

1. Create migration `supabase/migrations/20260402_analytics_snapshots.sql`:
   - `org_analytics_snapshots` table: id, org_id, snapshot_date (date, unique per org per day), metrics JSONB (compliance_score, framework_scores, control_stats, evidence_stats, task_stats, member_stats, incident_count, overdue_count), created_at
   - `org_saved_reports` table: id, org_id, name, description, type (custom | scheduled), config JSONB (widgets, filters, date_range, comparison), schedule JSONB (frequency, recipients, next_send_at, timezone), created_by, last_generated_at, created_at, updated_at
   - `org_report_generations` table: id, report_id, org_id, file_url, format (pdf | csv | xlsx | json), generated_at, file_size_bytes, expires_at
   - RLS on org_id
   - Index on snapshot_date for range queries

2. Create `lib/analytics/snapshot-engine.ts`:
   - `captureSnapshot(orgId)` — calculate all current metrics and store as daily snapshot
   - `getSnapshots(orgId, dateRange)` — load snapshots for trend analysis
   - `getTrend(orgId, metric, dateRange, granularity)` — extract and interpolate a specific metric over time
   - `compareSnapshots(orgId, date1, date2)` — delta calculation between two snapshots
   - `getMetricSummary(orgId, metric, period)` — min, max, avg, current, change for a metric over period

3. Create `trigger/analytics-snapshot.ts` — Trigger.dev scheduled task:
   - Run daily at midnight UTC
   - For each active org: `captureSnapshot(orgId)`
   - Cleanup: remove snapshots older than retention period (default 2 years)

#### Phase 2: Custom Report Builder (produce ~600 lines)

1. Create `components/reports/report-builder.tsx`:
   - Widget palette: compliance score ring, score trend line, framework comparison bar, gap table, task status pie, evidence freshness, member activity heatmap, incident trend, certificate timeline, custom KPI card
   - Drag-and-drop widget placement on report canvas (2-column grid)
   - Widget configuration panel: title, data source, date range, filters, comparison period
   - Report settings: name, description, page orientation, header/footer, logo
   - Preview mode with live data
   - Save as custom report

2. Create `components/reports/report-widgets/`:
   - `ScoreTrendWidget.tsx` — line chart showing compliance score over time with configurable timeframe
   - `FrameworkComparisonWidget.tsx` — multi-bar chart comparing framework scores
   - `GapTableWidget.tsx` — table of controls without adequate evidence
   - `TaskStatusWidget.tsx` — pie/donut chart of task statuses
   - `EvidenceFreshnessWidget.tsx` — heatmap showing evidence age across controls
   - `MemberActivityWidget.tsx` — per-member activity metrics (tasks completed, evidence uploaded, reviews done)
   - `IncidentTrendWidget.tsx` — incident count by severity over time
   - `CertificateTimelineWidget.tsx` — Gantt-style bar showing certificate validity periods with expiry warnings
   - `CustomKPIWidget.tsx` — single metric display with trend arrow and comparison
   - `ComplianceSnapshotWidget.tsx` — point-in-time compliance state comparison (this month vs last month)

3. Create `lib/reports/widget-data.ts`:
   - Data resolver per widget type
   - Accepts date range, filters, comparison period
   - Returns chart-ready data structures
   - Caches expensive queries (compliance score calculation, cross-framework rollup)

#### Phase 3: Multi-Format Export (produce ~400 lines)

1. Enhance `lib/reports/export-jobs.ts`:
   - Add CSV export: flatten report data into tabular format
   - Add XLSX export: use `exceljs` for styled spreadsheet with multiple sheets per widget, conditional formatting, charts
   - Add JSON export: structured report data for programmatic consumption
   - PDF enhancement: table of contents, page numbers, watermark (draft/confidential), charts rendered as images

2. Create `lib/reports/csv-generator.ts`:
   - `generateCSV(reportData, options)` — generate CSV from report widget data
   - Handle multi-section reports (each widget becomes a section with header row)
   - Configurable delimiter, encoding, date format

3. Create `lib/reports/xlsx-generator.ts`:
   - `generateXLSX(reportData, options)` — generate Excel workbook
   - Summary sheet + detail sheet per widget
   - Branded header with logo
   - Conditional formatting (red/amber/green for compliance scores)
   - Auto-fit column widths

#### Phase 4: Scheduled Report Delivery (produce ~400 lines)

1. Create `lib/reports/scheduler.ts`:
   - `scheduleReport(reportId, orgId, config)` — configure recurring generation: frequency (daily/weekly/monthly), day/time, timezone, recipients (email list), format
   - `unscheduleReport(reportId, orgId)` — cancel schedule
   - `getNextScheduled(orgId)` — list upcoming scheduled reports
   - `generateScheduledReport(reportId)` — generate report, store file, email to recipients

2. Create `trigger/report-scheduler.ts` — Trigger.dev scheduled task:
   - Run every hour
   - Find reports where `next_send_at <= now()`
   - Generate each report in configured format
   - Send via email (Resend) with report attached
   - Update `next_send_at` based on frequency
   - Store generation record in `org_report_generations`
   - Cleanup: delete generated files older than 90 days

3. Create email template `emails/scheduled-report.tsx`:
   - Branded email with report summary
   - Report file attached (or download link for large files)
   - Quick stats inline (key metrics from report)
   - Unsubscribe link per recipient

#### Phase 5: Reports UI (produce ~400 lines)

1. Enhance `app/app/reports/page.tsx`:
   - Tabs: Standard Reports (existing), My Reports (saved custom), Scheduled
   - Custom report list with last generated, next scheduled, quick actions (generate now, edit, schedule, delete)
   - "New Custom Report" button → report builder

2. Create `app/app/reports/[reportId]/page.tsx`:
   - View generated report with interactive widgets
   - Export dropdown (PDF, CSV, XLSX, JSON)
   - Schedule button
   - Edit button (opens builder)
   - Generation history with download links

3. Create `app/app/reports/trends/page.tsx` — trend analytics dashboard:
   - Compliance score trend (default: 6 months)
   - Framework progress over time
   - Task completion rate trend
   - Evidence collection velocity
   - Incident frequency
   - Configurable date range and granularity (daily/weekly/monthly)
   - Compare to previous period toggle
   - Exportable as report

4. Add API routes:
   - `app/api/v1/reports/custom/route.ts` — GET (list saved reports), POST (create)
   - `app/api/v1/reports/custom/[reportId]/route.ts` — GET, PATCH, DELETE
   - `app/api/v1/reports/custom/[reportId]/generate/route.ts` — POST (generate now)
   - `app/api/v1/reports/custom/[reportId]/schedule/route.ts` — POST (set schedule), DELETE (cancel)
   - `app/api/v1/analytics/trends/route.ts` — GET trend data for specified metrics and date range
   - `app/api/v1/analytics/snapshots/route.ts` — GET snapshots for a period

### Output Required

- Daily analytics snapshot engine with Trigger.dev cron
- Custom report builder with 10 widget types
- Widget data resolvers
- Multi-format export (CSV, XLSX, JSON, enhanced PDF)
- Scheduled report delivery with email
- Trend analytics dashboard
- Saved report CRUD with API routes
- All passing typecheck

### Verification

```bash
npm run typecheck
npm test -- --testPathPattern="report|analytics|snapshot"
# Manual: create custom report → add widgets → preview → export as PDF and XLSX → schedule weekly delivery → verify email received
```

---

## Master Prompt 10: Global Search Platform And Command Center

> **Expected output: ~1,800+ lines of unified search index, search API, saved searches, enhanced command palette, and recent activity**

You are the search and navigation engineer for FormaOS. Users interact with tasks, evidence, controls, policies, forms, participants, incidents, reports — dozens of entity types across the workspace. Currently search is fragmented: `topbar-search.tsx` searches policies/tasks/evidence, `advanced-search.tsx` has filters, and `CommandPalette.tsx` provides keyboard navigation. There is no unified search index, no search API, no saved searches, and no cross-entity search ranking.

### Context

Current state:

- `components/topbar-search.tsx` — searches policies, tasks, evidence (client-side?)
- `components/search/advanced-search.tsx` — advanced search with autocomplete across tasks, members, certificates, evidence
- `components/command-palette/CommandPalette.tsx` — cmdk-based palette with navigation shortcuts
- DB: gin index on comments for full-text search
- No unified search API endpoint backing the UI
- No cross-entity ranking or relevance scoring
- No search analytics (what users search for)
- No saved searches or bookmarks
- No recent items / frequently accessed resources
- No keyboard-first workflow optimization

### Your Job

#### Phase 1: Unified Search Index (produce ~400 lines)

1. Create migration `supabase/migrations/20260402_search_index.sql`:
   - `search_index` table: id, org_id, entity_type (task | evidence | control | policy | form | participant | incident | member | care_plan | report | certificate), entity_id, title, body (searchable text), metadata JSONB, search_vector tsvector, last_indexed_at, created_at
   - `search_history` table: id, org_id, user_id, query, result_count, clicked_result_id, clicked_result_type, searched_at
   - `saved_searches` table: id, org_id, user_id, name, query, filters JSONB, created_at
   - `recent_items` table: id, org_id, user_id, entity_type, entity_id, entity_title, accessed_at
   - GIN index on search_vector
   - Trigram index on title for fuzzy matching (pg_trgm extension)
   - RLS on org_id
   - Function: `search_entities(org_id, query, entity_types[], limit, offset)` — full-text search with ranking, returning entity_type, entity_id, title, snippet, rank

2. Create `lib/search/indexer.ts`:
   - `indexEntity(orgId, entityType, entityId, title, body, metadata)` — upsert into search_index, generate tsvector
   - `removeEntity(orgId, entityType, entityId)` — remove from index
   - `reindexEntityType(orgId, entityType)` — rebuild index for all entities of a type
   - `fullReindex(orgId)` — rebuild entire org search index
   - Text extraction helpers per entity type (strip markdown, extract key fields, concatenate searchable text)

3. Create `trigger/search-indexing.ts` — Trigger.dev tasks:
   - `reindexOrgTask` — full reindex for an org (manual trigger or post-migration)
   - Wire into existing mutation paths: after task/evidence/control/policy/form/participant CRUD → update search index

#### Phase 2: Search API (produce ~300 lines)

1. Create `lib/search/search-engine.ts`:
   - `search(orgId, query, options)` — unified search:
     - Full-text search with `ts_rank` scoring
     - Fuzzy matching fallback using trigram similarity
     - Entity type filtering
     - Date range filtering
     - Boosting: title matches ranked higher than body
     - Highlight: return snippets with query terms highlighted (<mark> tags)
     - Pagination with cursor
   - `suggest(orgId, prefix)` — autocomplete suggestions from recent searches and entity titles
   - `trackSearch(orgId, userId, query, resultCount)` — log search for analytics
   - `trackClick(orgId, userId, searchId, entityType, entityId)` — log result click for ranking improvement
   - `getSearchAnalytics(orgId)` — popular queries, zero-result queries, click-through rate

2. Create API routes:
   - `app/api/v1/search/route.ts` — GET unified search with query, entity type filter, date range, cursor pagination
   - `app/api/v1/search/suggest/route.ts` — GET autocomplete suggestions
   - `app/api/v1/search/saved/route.ts` — GET saved searches, POST save search
   - `app/api/v1/search/saved/[id]/route.ts` — DELETE saved search
   - `app/api/v1/search/recent/route.ts` — GET recent items for current user
   - `app/api/v1/search/analytics/route.ts` — GET search analytics (admin only)

#### Phase 3: Enhanced search UI (produce ~600 lines)

1. Rewrite `components/topbar-search.tsx` as `components/search/global-search.tsx`:
   - Instant results as you type (debounced 200ms)
   - Results grouped by entity type with counts
   - Entity type icon + title + snippet with highlights
   - Keyboard navigation: arrow keys, enter to open, tab to switch groups
   - Search filters: entity type tabs, date range
   - "Save this search" button
   - Recent searches shown on empty input
   - Zero-results state with suggestions
   - `Cmd+K` keyboard shortcut to open

2. Create `components/search/search-results.tsx`:
   - Full search results page for complex queries
   - Left sidebar: entity type facets with counts
   - Results with highlighted snippets
   - Sort by: relevance, date created, last updated
   - Pagination

3. Create `app/app/search/page.tsx`:
   - Full-page search results
   - URL-driven: `/app/search?q=password+policy&type=evidence&from=2026-01-01`
   - Shareable search URLs

4. Enhance `components/command-palette/CommandPalette.tsx`:
   - Add entity search results alongside navigation commands
   - Show recent items section
   - Quick actions: "Create task", "Upload evidence", "New form"
   - Contextual commands based on current page (e.g., on control page: "Find evidence for this control")
   - Keyboard shortcuts reference section

#### Phase 4: Recent Items & Bookmarks (produce ~300 lines)

1. Create `lib/search/recent-items.ts`:
   - `trackAccess(orgId, userId, entityType, entityId, entityTitle)` — record access, keep last 50 per user
   - `getRecentItems(orgId, userId, limit)` — most recently accessed items
   - `getFrequentItems(orgId, userId, limit)` — most frequently accessed items over 30 days

2. Create `components/search/recent-items.tsx`:
   - Compact list of recent items in global search dropdown
   - Also available as sidebar widget on dashboard
   - Icon per entity type, title, last accessed timestamp

3. Wire access tracking into page loads:
   - Task detail page → track access
   - Evidence detail page → track access
   - Control detail page → track access
   - Care plan detail → track access
   - Any entity detail page → track access

#### Phase 5: Search Index Maintenance (produce ~200 lines)

1. Create `lib/search/maintenance.ts`:
   - `validateIndex(orgId)` — compare search index with source tables, find orphaned or missing entries
   - `pruneOrphans(orgId)` — remove search index entries for deleted entities
   - `getIndexHealth(orgId)` — coverage percentage per entity type, last full reindex, orphan count

2. Create `trigger/search-maintenance.ts`:
   - Weekly: prune orphans, validate index health
   - Log health metrics

3. Admin page addition (wire into admin settings):
   - Search index health status
   - Reindex button per entity type or full
   - Search analytics: popular queries, zero-result queries (hint for content gaps)

### Output Required

- Unified search index with tsvector and trigram support
- Search engine with ranking, highlighting, fuzzy matching
- Autocomplete suggestions
- Search API with 6 endpoints
- Global search UI with instant results and keyboard navigation
- Full search results page
- Enhanced command palette
- Recent items tracking and display
- Saved searches
- Search analytics
- Index maintenance system
- All passing typecheck

### Verification

```bash
npm run typecheck
npm test -- --testPathPattern="search|indexer"
# Manual: create task → search for it → verify instant result → save search → verify recent items → check search analytics
```

---

## Master Prompt 11: External Auditor Portal And Evidence Lifecycle Management

> **Expected output: ~2,000+ lines of auditor access system, evidence upload workflow, freshness tracking, gap visualization, and evidence comparison**

You are the evidence and audit engineer for FormaOS. The audit and evidence core is strong (~1,992 lines) with immutable audit trails, tamper protection, and SOC 2 report generation. However, there is no way for external auditors to review evidence without a full user account, evidence upload has no smart control mapping, evidence has no expiry or freshness tracking, there is no visual "gaps" view showing controls without evidence, and there is no evidence version comparison.

### Context

Current state:

- `lib/audit/` — `org-audit-log.ts`, `readiness-calculator.ts`, `soc2-report.ts`
- `lib/audit-reports/` — `report-builder.ts`, `pdf-generator.ts`, `types.ts`
- `components/audit/` — `audit-trail-viewer.tsx`, `print-pack-button.tsx`
- Evidence is managed per org with RLS
- File versioning exists in `lib/file-versioning.ts` but no diff viewer
- No external auditor portal or read-only access
- No evidence upload workflow with automatic control mapping
- No evidence expiry/freshness alerts
- No visual "evidence gap" view
- No evidence version comparison
- SOC 2 report generation exists but only single-format

### Your Job

#### Phase 1: External Auditor Portal (produce ~600 lines)

1. Create migration `supabase/migrations/20260402_auditor_portal.sql`:
   - `auditor_access_tokens` table: id, org_id, auditor_name, auditor_email, auditor_company, token_hash, scopes JSONB (frameworks, date_range, evidence_types), expires_at, last_accessed_at, access_count, created_by, created_at, revoked_at
   - `auditor_activity_log` table: id, token_id, org_id, action (viewed_evidence | downloaded_evidence | viewed_control | viewed_report | exported_data), resource_type, resource_id, ip_address, user_agent, created_at
   - RLS: activities visible to org admins only
   - Indexes on token_hash, org_id

2. Create `lib/auditor/portal.ts`:
   - `createAuditorAccess(orgId, createdBy, config)` — generate time-limited, scope-restricted access token for external auditor
   - `revokeAuditorAccess(tokenId, orgId)` — revoke access
   - `validateAuditorToken(token)` — verify token hash, check expiry, check scopes, log access
   - `listAuditorAccess(orgId)` — list active and expired access grants
   - `getAuditorActivity(orgId, tokenId?)` — audit log of what the auditor accessed

3. Create `app/audit-portal/[token]/` — external auditor interface:
   - `layout.tsx` — minimal layout with FormaOS branding, no sidebar, no navigation to non-audit areas
   - `page.tsx` — dashboard: scoped frameworks, overall compliance score, control status summary
   - `evidence/page.tsx` — evidence browser: list evidence by control, download, view metadata
   - `controls/page.tsx` — control browser: list controls with evidence status, filter by framework
   - `reports/page.tsx` — downloadable reports (SOC 2, compliance snapshot)
   - Token-authenticated middleware (not session-based)
   - All pages read-only — no edit capability
   - All access logged to `auditor_activity_log`

4. Create `app/app/settings/auditor-access/page.tsx` — auditor access management:
   - Create new auditor access: name, email, company, frameworks to share, date range restriction, expiry date
   - List active access grants with last accessed, access count
   - Revoke button
   - Activity log per auditor

#### Phase 2: Smart Evidence Upload Workflow (produce ~400 lines)

1. Create `components/evidence/evidence-uploader.tsx`:
   - Drag-and-drop upload zone accepting PDF, DOCX, images, spreadsheets
   - Multi-file upload with progress bars
   - Post-upload workflow: for each file → show AI-suggested control mappings (using AI from Prompt 7 if available, otherwise keyword matching)
   - User confirms or adjusts control mappings
   - Auto-extract metadata: document title, dates, author (from PDF metadata)
   - Bulk tagging: apply tags across multiple uploads
   - Duplicate detection: warn if file hash matches existing evidence

2. Create `lib/evidence/smart-mapper.ts`:
   - `suggestControlMappings(orgId, fileName, fileContent)` — analyze file name and content to suggest relevant controls
   - Keyword matching: map document keywords to control requirements (e.g., "password policy" → AC-7, AC-11)
   - Historical mapping: suggest based on what controls similar files were previously mapped to
   - Confidence scoring: high/medium/low confidence per suggestion

3. Create `lib/evidence/duplicate-detector.ts`:
   - `checkDuplicate(orgId, fileHash)` — check if evidence with same hash exists
   - `findSimilar(orgId, fileName)` — find evidence with similar names (fuzzy match)
   - Return existing evidence for user to decide: replace, version, or skip

#### Phase 3: Evidence Freshness & Expiry (produce ~300 lines)

1. Create migration `supabase/migrations/20260402_evidence_freshness.sql`:
   - Add to evidence table: `valid_from` date, `valid_until` date, `review_cycle_days` integer, `last_reviewed_at` timestamp, `reviewed_by` uuid, `freshness_status` enum (current | expiring_soon | expired | needs_review)
   - Function: `update_evidence_freshness()` — called daily to recalculate freshness_status based on valid_until and review_cycle

2. Create `lib/evidence/freshness-engine.ts`:
   - `calculateFreshness(evidence)` — determine status based on dates
   - `getExpiringEvidence(orgId, withinDays)` — evidence expiring within N days
   - `getExpiredEvidence(orgId)` — all expired evidence
   - `getStaleEvidence(orgId)` — evidence past review cycle without review
   - `setReviewCycle(orgId, evidenceId, cycleDays)` — configure review frequency

3. Create `trigger/evidence-freshness.ts`:
   - Daily: recalculate freshness for all evidence
   - Notify assigned users when evidence is expiring (30 day, 7 day, expired)
   - Auto-transition freshness_status

#### Phase 4: Evidence Gap Visualization (produce ~400 lines)

1. Create `components/evidence/evidence-gap-map.tsx`:
   - Visual grid/heatmap: rows = controls (grouped by framework domain), columns = evidence status
   - Color coding: green (adequate evidence), yellow (expiring evidence), red (no evidence or expired), gray (N/A)
   - Click on gap cell → see control requirements, suggest evidence to upload
   - Filter by framework, control domain, gap severity
   - Export gap report as PDF/CSV

2. Create `components/evidence/evidence-coverage-chart.tsx`:
   - Donut chart: controls with adequate evidence vs gaps
   - Trend line: evidence coverage over time
   - Breakdown by framework

3. Create `app/app/evidence/gaps/page.tsx`:
   - Full evidence gap analysis page
   - Gap map as primary view
   - Sidebar: gap summary stats, critical gaps listed
   - "Upload evidence for this control" quick-action from any gap cell

4. Create `lib/evidence/coverage-calculator.ts`:
   - `calculateCoverage(orgId, frameworkId?)` — evidence coverage percentage
   - `identifyGaps(orgId, frameworkId?)` — list controls without adequate evidence
   - `getCriticalGaps(orgId)` — gaps on high-priority controls

#### Phase 5: Evidence Version Comparison (produce ~300 lines)

1. Create `components/evidence/evidence-diff-viewer.tsx`:
   - Side-by-side comparison of two evidence versions
   - For text/PDF: highlight changed sections (additions in green, deletions in red)
   - For metadata: show what changed (title, tags, control mappings, dates)
   - Version timeline showing all versions with comparison selector
   - "Revert to this version" action

2. Create `lib/evidence/diff-engine.ts`:
   - `compareVersions(orgId, evidenceId, versionA, versionB)` — generate diff
   - Text diff for document content (line-level)
   - Metadata diff for structured fields
   - Return structured diff result for UI rendering

### Output Required

- External auditor portal with scoped, tokenized access
- Auditor access management UI
- Smart evidence upload with control mapping suggestions
- Duplicate detection
- Evidence freshness engine with daily recalculation
- Expiry notifications
- Evidence gap visualization (heatmap + coverage chart)
- Gap analysis page
- Evidence version comparison viewer
- Database migrations
- All passing typecheck

### Verification

```bash
npm run typecheck
npm test -- --testPathPattern="auditor|evidence|freshness|coverage"
# Manual: create auditor access → open portal link → verify scoped read-only view → upload evidence → verify mapping suggestions → check gap map → compare evidence versions
```

---

## Master Prompt 12: Admin Operations Completion And Customer Health Dashboard

> **Expected output: ~2,000+ lines of org lifecycle, billing intervention, support SLA, bulk operations, and customer health dashboard**

You are the platform operations engineer for FormaOS. The admin console is mature with delegated admin governance, customer-360 views, and immutable audit feeds. However 5 critical operator capabilities are incomplete per the TODO: org suspend/restore/retire lifecycle, export retry/cancel, billing intervention tools (refund/dunning/invoice rescue), support case SLA enforcement, and bulk operator actions with dry-run. Additionally, the customer health engine is fully built (`lib/customer-health/`) but has no admin dashboard.

### Context

Current state:

- Admin console: delegated admin, approval workflows, customer-360, security triage, CSRF protection
- `lifecycle_status` column exists on organizations but no UI to change it
- Export page exists but no retry/cancel functionality
- `billing-action-buttons.tsx` (235 lines) exists but refund, dunning, and invoice rescue are incomplete
- Support page (637 lines) with case actions (156 lines) but no formal SLA enforcement
- Bulk operations page exists but no dry-run capability
- `lib/customer-health/health-score-engine.ts` — 5-factor scoring (login frequency, feature adoption, compliance trend, automation usage, overdue penalty)
- `org_health_scores` table exists
- No customer health dashboard in admin
- No automated health alerts
- No health score recalculation cron
- No NPS/CSAT collection

### Your Job

#### Phase 1: Org Lifecycle Controls (produce ~400 lines)

1. Create `lib/admin/org-lifecycle.ts`:
   - `suspendOrg(orgId, adminId, reason, duration?)` — set lifecycle_status to 'suspended', disable all member sessions, block API key access, log action with reason. Optional auto-restore date.
   - `restoreOrg(orgId, adminId, reason)` — set lifecycle_status to 'active', re-enable access, notify org admins, log action
   - `retireOrg(orgId, adminId, reason)` — set lifecycle_status to 'retired', cancel subscription (Stripe), archive all data, disable all access permanently, log action. Require confirmation (reason + admin password/MFA)
   - `getOrgLifecycleHistory(orgId)` — audit trail of status changes
   - Validation: cannot suspend already suspended, cannot restore if retired, retire requires founder/platform-admin approva

2. Create `components/admin/org-lifecycle-controls.tsx`:
   - Status badge showing current lifecycle state
   - Suspend button → confirmation dialog with reason textarea, optional duration picker
   - Restore button (only if suspended) → confirmation with reason
   - Retire button (only if suspended or active) → multi-step confirmation: reason → impact preview (members affected, active subscription details, data to archive) → final confirm with MFA
   - Lifecycle history timeline

3. Wire into admin org detail page (customer-360 view)

#### Phase 2: Export Retry/Cancel (produce ~200 lines)

1. Enhance export management in admin:
   - `retryExport(exportId, adminId)` — re-enqueue failed export job with same parameters
   - `cancelExport(exportId, adminId)` — cancel queued/in-progress export, clean up partial files
   - `getExportDetails(exportId)` — full export details including job status, attempts, error logs

2. Enhance admin exports page:
   - Retry button on failed exports
   - Cancel button on queued/in-progress exports
   - Error details expandable on failed exports
   - Bulk retry for all failed exports in a date range

#### Phase 3: Billing Intervention Tools (produce ~400 lines)

1. Create `lib/admin/billing-interventions.ts`:
   - `issueRefund(orgId, adminId, amount, reason, invoiceId?)` — process Stripe refund (full or partial), log action with reason, notify org billing contact
   - `pauseDunning(orgId, adminId, reason, untilDate)` — pause automated payment reminders, set grace period, log action
   - `resumeDunning(orgId, adminId)` — resume dunning process
   - `rescueInvoice(orgId, adminId, invoiceId, action)` — mark invoice as void/uncollectible/write-off, optionally create credit note, log action
   - `applyCredit(orgId, adminId, amount, reason)` — apply account credit via Stripe, log action
   - `extendTrial(orgId, adminId, days, reason)` — extend trial period, update subscription, log action
   - All actions require admin reason text and generate immutable audit entries

2. Enhance `components/admin/billing-action-buttons.tsx`:
   - Refund dialog: amount (full/partial), reason, confirmation with refund preview
   - Dunning pause: reason, duration, confirmation
   - Invoice rescue: select action (void/write-off), reason, impact preview
   - Credit application: amount, reason, confirmation
   - Trial extension: days, reason, confirmation
   - All with approval gate for amounts over threshold

3. Create `components/admin/billing-intervention-history.tsx`:
   - Timeline of all billing interventions for an org
   - Amount, type, admin who acted, reason, Stripe reference

#### Phase 4: Support Case SLA (produce ~300 lines)

1. Create `lib/admin/support-sla.ts`:
   - SLA definitions per plan: Starter (48h response, 5d resolution), Pro (24h response, 3d resolution), Enterprise (4h response, 1d resolution, dedicated rep)
   - `calculateSLAStatus(caseId)` — time elapsed since creation, time to first response, resolution status, breach/warning/on-track
   - `getSLABreaches(dateRange?)` — all cases that breached SLA
   - `getSLAMetrics(dateRange)` — average response time, resolution time, breach rate, CSAT per resolution
   - `escalateCase(caseId, adminId, reason)` — escalate breached or at-risk case to senior support

2. Enhance admin support page:
   - SLA status badge per case: green (on-track), yellow (at-risk, >75% of SLA used), red (breached)
   - SLA metrics dashboard: avg response time, avg resolution time, breach rate, trend
   - Auto-escalation toggle: auto-escalate when SLA breaches
   - Filter by SLA status

#### Phase 5: Bulk Operations With Dry-Run (produce ~300 lines)

1. Create `lib/admin/bulk-operations.ts`:
   - `executeBulkOperation(operation, targets, adminId, dryRun)` — execute or preview bulk action
   - Supported operations: bulk suspend orgs, bulk email org admins, bulk extend trials, bulk update plan, bulk recalculate health scores
   - Dry-run mode: return preview of what would happen (list of affected orgs, estimated impact) without executing
   - Blast-radius calculation: for each operation, show number of affected users, active subscriptions, and potential revenue impact
   - Execution: apply operation to each target with per-target success/failure tracking
   - Full audit trail of bulk operations

2. Enhance `components/admin/bulk-operations.tsx`:
   - Select operation type → select targets (multi-select orgs, or filter criteria) → dry-run preview → confirm → execute
   - Dry-run results: table showing each target, current state, projected new state, warnings
   - Execution progress: real-time progress bar, per-target status
   - Post-execution report: success/failure summary, rollback instructions if applicable

#### Phase 6: Customer Health Dashboard (produce ~400 lines)

1. Create `app/admin/customer-health/page.tsx`:
   - Health score distribution chart: how many orgs at each health level (healthy/at-risk/critical)
   - Sortable org table: org name, plan, health score, trend (↑↓→), logins this week, last active, overdue tasks, compliance score
   - Click-through to customer-360
   - Filter by: plan, health status (healthy/at-risk/critical), industry, signup date range
   - "At Risk" and "Critical" tabs for quick triage

2. Create `trigger/customer-health-recalc.ts`:
   - Daily cron: recalculate health scores for all active orgs
   - Store results in `org_health_scores`
   - Fire notifications when health drops to "Critical" (notify platform ops via Slack/email)

3. Create `components/admin/health-score-card.tsx`:
   - Visual health score with 5-factor breakdown (radar chart)
   - Score trend (last 30 days)
   - Key risk indicators highlighted
   - Recommended actions (based on lowest-scoring factor)

4. Wire health alerts:
   - Health drops to "Critical" → notify admin Slack channel
   - Health drops from "Healthy" to "At Risk" → create internal task for customer success review
   - No login for 14+ days on paid plan → flag for outreach

### Output Required

- Org lifecycle controls (suspend/restore/retire) with UI
- Export retry/cancel functionality
- Billing intervention tools (refund, dunning, credit, trial extension)
- Support case SLA enforcement with metrics
- Bulk operations with dry-run preview and blast-radius
- Customer health dashboard with daily recalculation
- Health alerts and notifications
- All audit-logged with immutable entries
- All passing typecheck

### Verification

```bash
npm run typecheck
npm test -- --testPathPattern="lifecycle|billing-intervention|sla|bulk|health"
# Manual: suspend org → verify access blocked → restore → verify access restored → issue refund → verify Stripe → dry-run bulk operation → verify preview → execute
```

---

## Master Prompt 13: Incident Analytics, Investigation Management, And CAPA System

> **Expected output: ~1,800+ lines of incident dashboards, investigation workflows, CAPA tracking, regulatory notifications, and trend analysis**

You are the incident and safety engineer for FormaOS. The incident management system is well-built (~1,366 lines) with creation, severity classification, resolution workflows, and automation templates. However, there are no incident analytics dashboards, no formal investigation management, no CAPA (Corrective and Preventive Action) tracking, and no regulatory notification workflows — all critical for NDIS providers and regulated industries.

### Context

Current state:

- Incidents: create with type (injury, medication error, behavioral, abuse, property, complaint, near-miss), severity, resolution workflow
- DB: `org_incidents` with location, witnesses, immediate actions, notifications, follow-up tracking, root cause, preventive measures
- Workflow automation: `incident-response.ts` template with severity routing
- E2E helpers for incident seeding
- No investigation management — no assigned investigators, no structured investigation workflow
- No incident analytics dashboard — no trend charts, MTTR, recurring patterns
- No CAPA system — no corrective action entity tracked separately from incidents
- No SIRS (Serious Incident Response Scheme) or regulatory notification tracking
- No incident → root cause → action → verification chain

### Your Job

#### Phase 1: Incident Analytics Dashboard (produce ~500 lines)

1. Create `app/app/incidents/analytics/page.tsx`:
   - Incident count by type (bar chart, selectable date range)
   - Incident count by severity (pie chart)
   - Trend over time: incidents per week/month (line chart, rolling 12 months)
   - Mean Time to Resolution (MTTR) by severity
   - Open vs resolved ratio by month
   - Top incident locations (if location data tracked)
   - Recurring pattern detection: incidents with same type + location above threshold
   - Exportable as PDF

2. Create `lib/incidents/analytics.ts`:
   - `getIncidentStats(orgId, dateRange)` — count by type, severity, status
   - `getIncidentTrend(orgId, dateRange, granularity)` — time series data
   - `getMTTR(orgId, dateRange)` — mean time to resolution by severity
   - `detectPatterns(orgId, dateRange)` — identify repeat incidents by type/location/participant
   - `getIncidentHeatmap(orgId, dateRange)` — incidents by day-of-week and hour

3. Create dashboard chart components:
   - `components/incidents/incident-trend-chart.tsx`
   - `components/incidents/incident-type-chart.tsx`
   - `components/incidents/mttr-chart.tsx`
   - `components/incidents/incident-heatmap.tsx`

#### Phase 2: Investigation Management (produce ~500 lines)

1. Create migration `supabase/migrations/20260402_investigations.sql`:
   - `org_investigations` table: id, org_id, incident_id, status (assigned | in_progress | findings_ready | review | closed), lead_investigator_id, team_member_ids JSONB, assigned_at, due_date, findings TEXT, root_cause TEXT, contributing_factors JSONB, methodology (5_whys | fishbone | timeline_analysis | barrier_analysis), evidence_ids JSONB, interviews JSONB (interviewee, date, notes), recommendations TEXT, reviewed_by, reviewed_at, closed_at, created_at
   - RLS on org_id

2. Create `app/app/incidents/[id]/investigation/page.tsx`:
   - Investigation assignment: select lead investigator and team members
   - Investigation methodology selector (5 Whys, Fishbone/Ishikawa, Timeline Analysis, Barrier Analysis)
   - Structured findings form: root cause, contributing factors, evidence collected
   - Interview log: add interviewees with date and summary
   - Recommendations section
   - Review and sign-off workflow: investigator completes → reviewer approves → close with actions
   - Link to generated CAPA items

3. Create `components/incidents/investigation-form.tsx`:
   - Dynamic form based on selected methodology
   - 5 Whys: sequential "Why?" fields
   - Fishbone: category-based cause inputs (People, Process, Equipment, Environment, Management, Materials)
   - Timeline: chronological event entries
   - Evidence attachment per finding

4. Create server actions for investigation CRUD

#### Phase 3: CAPA System (produce ~400 lines)

1. Create migration `supabase/migrations/20260402_capa.sql`:
   - `org_capa_items` table: id, org_id, incident_id, investigation_id, type (corrective | preventive), title, description, assigned_to, due_date, status (open | in_progress | implemented | verified | closed), verification_method, verified_by, verified_at, effectiveness_check_date, effectiveness_status (pending | effective | ineffective | needs_revision), priority (critical | high | medium | low), created_by, created_at, updated_at
   - RLS on org_id

2. Create `app/app/capa/page.tsx`:
   - CAPA register: list all corrective and preventive actions
   - Filter by: status, priority, type, assigned user, due date
   - Overdue highlighting
   - Create CAPA (standalone or from investigation)
   - CAPA lifecycle: open → in_progress → implemented → verified → closed

3. Create `components/incidents/capa-tracker.tsx`:
   - CAPA detail view within incident/investigation context
   - Status progression (visual stepper)
   - Effectiveness verification step: re-check after implementation to confirm fix works
   - Attach evidence of implementation
   - Link back to originating incident and investigation

4. Create server actions for CAPA CRUD

#### Phase 4: Regulatory Notification Tracking (produce ~200 lines)

1. Create migration `supabase/migrations/20260402_regulatory_notifications.sql`:
   - `org_regulatory_notifications` table: id, org_id, incident_id, regulation (ndis_sirs | state_health | aged_care_quality | workplace_safety | custom), notification_type (immediate | 5_day | final), due_date, submitted_at, submitted_by, reference_number, status (required | draft | submitted | acknowledged | overdue), body_name (NDIS Quality & Safeguards Commission, etc.), notes, created_at

2. Create `components/incidents/regulatory-notification-tracker.tsx`:
   - For reportable incidents: show which notifications are required based on incident type and severity
   - NDIS SIRS: if severity is "reportable" → immediate notification within 24h, 5-day notification, final report
   - Notification checklist per incident: due date, status, submitted date, reference number
   - Overdue alert for unsubmitted required notifications
   - Mark as submitted with reference number

3. Wire into incident detail page — show regulatory requirements panel when incident type matches reportable criteria

#### Phase 5: Incident → Investigation → CAPA Chain (produce ~200 lines)

1. Create `components/incidents/incident-chain-view.tsx`:
   - Visual chain: Incident → Investigation → Findings → CAPA Items → Verification
   - Each node clickable to navigate to detail
   - Status indicators on each node
   - Timeline of the full resolution chain
   - Show on incident detail page as "Resolution Chain" section

2. Wire incidents into reporting:
   - Add incident report type to report builder (Prompt 9)
   - Include: incident summary, investigation summary, CAPA items, regulatory notifications, trend data
   - Pre-built template: "Monthly Incident Report" with all charts and tables

### Output Required

- Incident analytics dashboard with trend charts, MTTR, heatmap
- Investigation management with methodology-based forms
- CAPA system with lifecycle tracking and effectiveness verification
- Regulatory notification tracking (NDIS SIRS and configurable)
- Full Incident → Investigation → CAPA chain visualization
- Database migrations for investigations, CAPA, and regulatory notifications
- All passing typecheck

### Verification

```bash
npm run typecheck
npm test -- --testPathPattern="incident|investigation|capa|regulatory"
# Manual: create incident → assign investigation → complete with 5 Whys → generate CAPA → implement → verify effectiveness → check regulatory notifications if applicable
```

---

## Master Prompt 14: Mobile Native Features, Offline Capability, And Push Notifications

> **Expected output: ~2,000+ lines of service worker, offline data sync, push notifications, biometric auth, camera evidence capture, and deep linking**

You are the mobile platform engineer for FormaOS. The mobile app exists as a Capacitor WebView wrapper (`mobile/` directory) with Android/iOS scaffolding but zero native features — no push notifications, no biometric auth, no offline capability, no camera for evidence capture, and no deep linking. For care workers in the field, offline form submission and push notifications are critical.

### Context

Current state:

- `mobile/` — full Capacitor project, Android/iOS scaffolding, build scripts, branding
- `capacitor.config.ts` — points to `app.formaos.com.au`, splash screen, status bar config
- `mobile/src/` — `mobile.ts` + `mobile.css` (~359 lines) — minimal bridge code
- `public/manifest.json` — basic PWA manifest
- No service worker, no `sw.js`, no workbox, no `next-pwa`
- No IndexedDB sync, no offline-first architecture
- No push notifications (no FCM/APNs)
- No offline form submission queue
- No camera capture for evidence
- No biometric auth (Touch ID/Face ID)
- No deep linking / URL scheme handling
- Notification system exists (Prompt V2-4) but no push channel
- Form builder being built (Prompt 6) but no offline submission queue

### Your Job

#### Phase 1: Service Worker & Offline Shell (produce ~400 lines)

1. Create `public/sw.js` or configure `next-pwa` / Workbox:
   - Cache-first strategy for static assets (JS, CSS, fonts, images)
   - Network-first strategy for API routes with offline fallback
   - Offline page: show cached content with "You're offline" banner
   - Background sync: queue failed API requests for retry when online
   - Skip waiting and immediate activation for updates
   - Cache versioning for clean upgrades

2. Enhance PWA manifest (`public/manifest.json`):
   - Complete icon set (72, 96, 128, 144, 152, 192, 384, 512)
   - Shortcuts: "New Task", "Upload Evidence", "My Visits"
   - Screenshots for install prompt
   - Share target: receive shared files as evidence

3. Create `lib/offline/sync-manager.ts`:
   - `queueOfflineAction(action)` — store pending action in IndexedDB
   - `processPendingActions()` — replay queued actions when back online, in order
   - `getOfflineStatus()` — check connectivity, return pending action count
   - Conflict resolution: if server state changed while offline, flag for user review
   - Merge strategy: last-write-wins for simple fields, manual merge for complex conflicts

#### Phase 2: Offline Data Cache (produce ~400 lines)

1. Create `lib/offline/data-cache.ts`:
   - `cacheEntityList(entityType, orgId, data)` — store entity list in IndexedDB for offline access
   - `getCachedEntities(entityType, orgId)` — retrieve from IndexedDB
   - `cacheEntityDetail(entityType, entityId, data)` — store individual entity
   - `clearCache(orgId?)` — clear all or org-specific cache
   - `getLastSyncTime(entityType, orgId)` — when was this data last synced
   - Strategy: sync key entities on app open (tasks, visits today, active participants, current user's assignments)

2. Create `lib/offline/form-queue.ts`:
   - `queueFormSubmission(formId, data, metadata)` — store complete form submission in IndexedDB
   - `getPendingSubmissions()` — list all queued submissions
   - `submitPending()` — attempt to submit all pending forms, track success/failure
   - `deletePending(id)` — remove from queue (after successful sync)
   - Visual indicator in form UI: "Saved offline — will submit when connected"

3. Create `components/offline/offline-indicator.tsx`:
   - Banner that appears when offline: "You're working offline. Changes will sync when connected."
   - Pending sync count badge
   - Force sync button when back online
   - Sync status per entity (last synced timestamp)

#### Phase 3: Push Notifications (produce ~400 lines)

1. Create `lib/push/push-manager.ts`:
   - `registerPushToken(userId, orgId, token, platform)` — store FCM/APNs token
   - `unregisterPushToken(userId, token)` — remove token (on logout or device removal)
   - `sendPush(userId, notification)` — send push via FCM HTTP v1 API
   - `sendBulkPush(userIds, notification)` — batch send
   - Token refresh handling

2. Create migration `supabase/migrations/20260402_push_tokens.sql`:
   - `push_tokens` table: id, user_id, org_id, token, platform (ios | android | web), device_name, last_used_at, created_at
   - RLS: user can manage their own tokens

3. Create `lib/push/web-push.ts`:
   - Web Push API integration for browser push notifications
   - VAPID key management
   - Service worker push event handler in `sw.js`

4. Enhance notification engine (`lib/notifications/channels/`):
   - Add `push.ts` channel adapter: send via FCM/APNs for mobile, Web Push API for browser
   - Respect user notification preferences for push channel
   - Badge count management

5. Capacitor push plugin integration (`mobile/`):
   - `@capacitor/push-notifications` plugin configuration
   - Token registration on app start
   - Notification tap handling → deep link to relevant resource
   - Badge count sync

#### Phase 4: Biometric Auth (produce ~200 lines)

1. Create `mobile/src/biometric-auth.ts`:
   - `checkBiometricAvailability()` — check if device supports Touch ID / Face ID / fingerprint
   - `enableBiometric(userId)` — store auth credential in secure keychain
   - `authenticateWithBiometric()` — prompt biometric auth, return session token
   - `disableBiometric(userId)` — remove stored credentials

2. Create `components/auth/biometric-login.tsx`:
   - "Use Face ID / Touch ID" button on login page (only on mobile/supported devices)
   - Settings toggle: enable/disable biometric auth
   - Fallback to password if biometric fails

3. Capacitor integration:
   - `@capacitor-community/biometric-auth` or `@capgo/capacitor-native-biometric` plugin
   - Secure token storage via `@capacitor/preferences` or Keychain/Keystore

#### Phase 5: Camera Evidence Capture (produce ~300 lines)

1. Create `components/evidence/camera-capture.tsx`:
   - Camera button in evidence upload UI
   - Uses `@capacitor/camera` on mobile, `getUserMedia` on web
   - Photo capture with optional annotation (draw on image)
   - Capture metadata: timestamp, GPS location (if permitted), device info
   - Multi-photo capture mode (take several photos, review, select)
   - Direct upload to evidence storage with automatic indexing

2. Create `lib/evidence/capture-metadata.ts`:
   - `extractCaptureMetadata(photo)` — extract EXIF data, GPS, timestamp
   - `attachMetadata(evidenceId, metadata)` — store capture context with evidence
   - GPS → address resolution for location tagging

#### Phase 6: Deep Linking (produce ~300 lines)

1. Create `mobile/src/deep-links.ts`:
   - URL scheme: `formaos://` for app-to-app deep linking
   - Universal Links (iOS) / App Links (Android): `app.formaos.com.au/app/*`
   - Route mapping: `/app/tasks/:id` → open task detail, `/app/evidence/:id` → open evidence, `/app/visits/:id` → open visit, `/app/incidents/:id` → open incident
   - `@capacitor/app` plugin for handling incoming URLs
   - Notification tap → deep link to referenced resource

2. Create link configuration:
   - `public/.well-known/apple-app-site-association` — iOS Universal Links
   - `public/.well-known/assetlinks.json` — Android App Links

3. Create `lib/deep-links/link-generator.ts`:
   - `generateDeepLink(entityType, entityId)` — generate universal deep link
   - Used in email notifications, push notifications, and shared links

### Output Required

- Service worker with caching, offline page, background sync
- Offline data cache and form submission queue
- Push notifications (FCM, APNs, Web Push)
- Biometric authentication (Face ID, Touch ID)
- Camera evidence capture with metadata
- Deep linking (Universal Links, App Links, URL scheme)
- Offline indicator UI
- Enhanced PWA manifest
- Capacitor plugin integrations
- All passing typecheck

### Verification

```bash
npm run typecheck
# Manual: install PWA → go offline → submit form → go online → verify sync
# Manual: enable push notifications → trigger task assignment → verify push received
# Manual: enable biometric → lock app → unlock with Face ID
# Manual: capture photo evidence → verify GPS and timestamp metadata
# Manual: tap push notification → verify deep link opens correct page
```

---

## Master Prompt 15: Executive Board Packs, Multi-Org Rollup, And Benchmark Comparison

> **Expected output: ~1,800+ lines of board-ready PDF generation, scheduled executive digests, multi-org consolidation, and industry benchmarks**

You are the executive intelligence engineer for FormaOS. The executive dashboard is well-built (~2,785 lines) with compliance posture ring, framework rollup, critical controls table, audit readiness gauge, and deadline calendar. However, executives cannot export board-ready PDFs, there are no scheduled executive summary emails, enterprises with multiple orgs have no consolidated view, and there are no industry benchmarks for comparison.

### Context

Current state:

- `app/app/executive/` — full page with 5 sub-components
- `lib/executive/` — `posture-calculator.ts`, `multi-framework-rollup.ts`, `deadline-tracker.ts`, `types.ts`
- API: `/api/executive/posture`, `/api/executive/audit-forecast`
- Risk heatmap, action queue, automation reliability metrics
- Owner/admin role restriction, auto-refresh every 5 min
- No PDF export for board consumption
- No weekly/monthly executive summary email
- No multi-org rollup for enterprises holding multiple subsidiaries
- No industry benchmark data for comparison (e.g., "your compliance score vs industry average")
- No custom KPI configuration on executive dashboard

### Your Job

#### Phase 1: Board Pack PDF Generation (produce ~500 lines)

1. Create `lib/executive/board-pack-generator.ts`:
   - `generateBoardPack(orgId, options)` — produce comprehensive board-ready PDF:
     - Cover page with org name, date, classification (Confidential), prepared by
     - Executive summary: one-page compliance posture overview with key metrics
     - Compliance scorecard: scores per framework with trend arrows
     - Risk register: top 10 risks with severity, mitigation status, owner
     - Control gaps: critical controls without adequate evidence
     - Audit readiness: readiness percentage, upcoming audits, preparation status
     - Incident summary: incidents this period, resolved/open, trend vs previous period
     - Remediation tracker: open actions, overdue items, completion rate
     - Appendix: detailed control-by-control status (optional, configurable)
   - Branded design with org logo, consistent typography, page numbers, table of contents
   - Options: date range, frameworks to include, include appendix boolean, classification level

2. Create `lib/executive/chart-renderer.ts`:
   - Render chart components as static images for PDF embedding (using `canvas` or `sharp`)
   - Compliance score ring → PNG
   - Trend line chart → PNG
   - Framework comparison bar chart → PNG
   - Risk heatmap → PNG

3. Add export button to executive dashboard:
   - "Generate Board Pack" button → format options (PDF, PPTX) → generate → download
   - Loading state with progress indicator
   - Generated packs stored in `org_report_generations` (from Prompt 9 or new)

#### Phase 2: Scheduled Executive Digest (produce ~300 lines)

1. Create `lib/executive/digest-generator.ts`:
   - `generateExecutiveDigest(orgId, period)` — create email-friendly summary:
     - Headline metrics: compliance score (change), overdue tasks (change), incidents this period
     - Top 3 risks requiring attention
     - Top 3 wins this period (controls satisfied, evidence uploaded, score improvements)
     - Upcoming deadlines (next 14 days)
     - Recommended actions

2. Create `emails/executive-digest.tsx` — branded email template:
   - Clean, scannable layout suitable for C-suite
   - Key metrics with visual indicators (↑↓→ arrows)
   - "View Full Dashboard" CTA
   - Org branding

3. Create `trigger/executive-digest.ts`:
   - Configurable schedule: weekly (Monday 8am) or monthly (1st of month 8am)
   - Send to configured recipients (org owner + configured executives)
   - Track send history, prevent duplicates

4. Create settings UI: `app/app/settings/executive-digest/page.tsx`:
   - Enable/disable digest
   - Frequency: weekly/monthly
   - Recipients: select from org members or enter email addresses
   - Day and time preference
   - Preview button

#### Phase 3: Multi-Org Rollup (produce ~500 lines)

1. Create migration `supabase/migrations/20260402_org_groups.sql`:
   - `org_groups` table: id, name, parent_org_id (the "holding" org), created_by, created_at
   - `org_group_members` table: id, group_id, org_id, added_at, added_by
   - RLS: only parent org admins can manage groups, member org data visible in rollup
   - Note: build on top of existing multi-org architecture

2. Create `lib/executive/multi-org-rollup.ts`:
   - `createOrgGroup(parentOrgId, name, memberOrgIds)` — group multiple orgs under a parent
   - `getGroupRollup(groupId)` — aggregate compliance posture across all member orgs:
     - Combined compliance score (weighted by org size or equal)
     - Per-org scorecard with comparison
     - Shared gaps: controls failing across multiple orgs
     - Total risk exposure
     - Consolidated incident stats
   - `getOrgComparison(groupId)` — side-by-side comparison of member orgs
   - `getGroupTrend(groupId, dateRange)` — aggregate trend over time

3. Create `app/app/executive/group/page.tsx`:
   - Group management: create group, add/remove member orgs
   - Consolidated dashboard: same widgets as executive dashboard but for the group
   - Per-org comparison table with sparkline trends
   - Drill-down: click org to see its individual executive dashboard
   - Export: group board pack (includes all member orgs)

4. Create `components/executive/org-comparison-table.tsx`:
   - Sortable table: org name, compliance score, framework count, evidence coverage, incident count, health score
   - Conditional formatting (red/amber/green)
   - Sparkline trend per org

#### Phase 4: Industry Benchmarks (produce ~300 lines)

1. Create `lib/executive/benchmarks.ts`:
   - `getBenchmarks(industry, frameworkId)` — return benchmark data:
     - Industry average compliance score
     - Top quartile score
     - Average time to first compliance
     - Average evidence per control
     - Common gap areas
   - Benchmark data source: anonymized aggregation across FormaOS customer base (if sufficient volume) or static industry data for initial launch
   - Privacy: never expose individual org data; only aggregate statistics

2. Create `lib/executive/benchmark-data.ts` — initial static benchmark data:
   - SaaS + SOC 2: avg 72%, top quartile 89%
   - Healthcare + HIPAA: avg 68%, top quartile 85%
   - NDIS providers: avg 65%, top quartile 82%
   - Fintech + PCI-DSS: avg 70%, top quartile 88%
   - General + ISO 27001: avg 67%, top quartile 84%

3. Create `components/executive/benchmark-comparison.tsx`:
   - "Your score vs industry" visualization: gauge or bar showing where org sits relative to average and top quartile
   - Per-framework benchmark where available
   - Trend: how org's position relative to benchmarks has changed over time
   - Motivational messaging: "You're in the top 25% of NDIS providers" or "3 points behind industry average — here's how to improve"

4. Add benchmarks section to executive dashboard

#### Phase 5: Configurable Executive KPIs (produce ~200 lines)

1. Create `components/executive/kpi-configurator.tsx`:
   - Allow owners/admins to configure which KPIs appear on executive dashboard
   - Available KPIs: compliance score, evidence coverage, overdue tasks, incident rate, MTTR, automation coverage, member activity, audit readiness, certificate health, framework progress
   - Drag-and-drop widget arrangement
   - Save per-user dashboard configuration
   - Reset to default

2. Store configuration:
   - User preferences JSONB column or dedicated table
   - Dashboard layout (widget order, widget size, which widgets visible)

### Output Required

- Board pack PDF generator with cover page, charts, and table of contents
- Chart-to-image renderer for PDF embedding
- Scheduled executive digest emails (weekly/monthly)
- Multi-org group management and rollup dashboard
- Org comparison table with sparklines
- Industry benchmark data and comparison visualization
- Configurable KPI dashboard
- Database migrations for org groups
- Trigger.dev digest task
- All passing typecheck

### Verification

```bash
npm run typecheck
npm test -- --testPathPattern="executive|board-pack|benchmark|rollup"
# Manual: generate board pack PDF → verify all sections present → schedule weekly digest → verify email → create org group → verify rollup metrics → check benchmark comparison
```

---

## Execution Notes

### Priority Order

1. **Prompt 6 (Form Builder)** — critical product gap: no data collection = no evidence pipeline
2. **Prompt 8 (Care Plans)** — NDIS providers are the wedge market; care depth is the differentiation
3. **Prompt 7 (AI Intelligence)** — RAG transforms the AI assistant from toy to tool
4. **Prompt 12 (Admin Operations)** — completes operator capabilities needed to run the platform at scale
5. **Prompt 9 (Custom Reports)** — enterprise buyers expect configurable reporting
6. **Prompt 10 (Global Search)** — quality-of-life for daily users, compounds with platform scale
7. **Prompt 11 (Auditor Portal)** — enterprise sales closer: "give your auditor a link"
8. **Prompt 13 (Incident CAPA)** — deepens care/compliance differentiation in regulated industries
9. **Prompt 15 (Executive Board Packs)** — C-suite buy-in tool, multi-org rollup for enterprise upsell
10. **Prompt 14 (Mobile/Offline)** — important for care workers in the field but lower technical urgency

### Estimated Output

| Prompt                        | Estimated Lines | Key Deliverables                                             |
| ----------------------------- | --------------- | ------------------------------------------------------------ |
| 6. Form Builder Platform      | ~2,500          | DB, API, builder, templates, evidence pipeline, public forms |
| 7. AI RAG Intelligence        | ~2,500          | Vector search, indexing, RAG chat, analysis, usage metering  |
| 8. Care Plans & Clinical      | ~2,800          | Care plan CRUD, goals, calendar, medications, NDIS claiming  |
| 9. Custom Reports & Analytics | ~2,200          | Report builder, widgets, trends, multi-format, scheduling    |
| 10. Global Search             | ~1,800          | Unified index, search API, recent items, command palette     |
| 11. Auditor Portal & Evidence | ~2,000          | Auditor access, smart upload, freshness, gaps, diff viewer   |
| 12. Admin Ops & Health        | ~2,000          | Lifecycle, billing tools, SLA, bulk ops, health dashboard    |
| 13. Incident CAPA             | ~1,800          | Analytics, investigations, CAPA, regulatory notifications    |
| 14. Mobile/Offline            | ~2,000          | Service worker, offline sync, push, biometrics, camera       |
| 15. Executive Board Packs     | ~1,800          | PDF board packs, digests, multi-org rollup, benchmarks       |
| **Total**                     | **~21,400**     |                                                              |

### What These Prompts Do NOT Cover

- Internationalization (i18n) — would be its own major prompt, deferred until non-English market entry
- Marketplace / plugin ecosystem — deferred until platform has sufficient customer base
- NPS/CSAT survey collection — minor feature, can be handled as a task
- A/B testing integration — infrastructure exists, wiring is incremental work
- Developer SDK creation — depends on API platform maturity (Prompt V2-2)

### Relationship to V2 Prompts

These V3 prompts build on top of V2 implementations:

- Prompt 6 (Forms) creates data that feeds into Prompt V2-4 (Notifications) and V2-2 (Webhooks)
- Prompt 7 (AI RAG) uses pgvector and builds on V2-2 (API) for the AI endpoints
- Prompt 9 (Reports) uses analytics snapshots that leverage V2-3 (Workflow) completion data
- Prompt 11 (Auditor Portal) extends V2-5 (Identity/Governance) access patterns
- Prompt 14 (Mobile) adds push channel to V2-4 (Notification) engine
- Prompt 15 (Executive) extends V2-3 (Workflow) and V2-4 (Notification) for executive digest delivery
