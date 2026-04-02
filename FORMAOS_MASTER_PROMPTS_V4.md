# FormaOS Master Prompts V4

**Created:** 2026-04-02
**Purpose:** Final hardening, integration depth, and polish for production-grade platform
**Scope:** Prompts 16–25 — fills remaining gaps from Prompts 1–15 and adds enterprise-grade quality
**Estimated output:** ~15,000–20,000 lines of production TypeScript

---

## Coverage Map (V1–V3 → V4 Gaps)

| Already Built (V1–V3)                | V4 Fills                                                                  |
| ------------------------------------ | ------------------------------------------------------------------------- |
| Compliance graph, controls, evidence | P16: Multi-framework cross-mapping & conflict resolution                  |
| Tasks page exists                    | P17: Full task management (assignments, dependencies, recurrence, Kanban) |
| Billing page exists                  | P18: Usage analytics, trial intelligence, churn prediction                |
| Team/people pages exist              | P19: Role permissions matrix, team capacity, org chart                    |
| Policy CRUD exists                   | P20: Policy versioning, approval workflows, acknowledgment tracking       |
| Vault/evidence pages exist           | P21: Document lifecycle (retention, legal hold, auto-archive)             |
| Settings pages exist                 | P22: Org settings consolidation, branding, custom domains                 |
| Dashboard page exists                | P23: Dashboard builder (drag-drop widgets, saved layouts)                 |
| Workflows exist                      | P24: Integration marketplace (Slack, Jira, Azure AD connectors)           |
| Activity page exists                 | P25: Comprehensive audit trail viewer, export, tamper-proof log           |

---

## Master Prompt 16: Multi-Framework Cross-Mapping And Control Deduplication

### Context

FormaOS supports SOC 2, ISO 27001, HIPAA, NDIS, PCI-DSS, and GDPR frameworks. Organizations often subscribe to multiple frameworks simultaneously, creating duplicate effort when many controls overlap (e.g., SOC 2 CC6.1 ≈ ISO 27001 A.8.2 ≈ HIPAA §164.312(a)(1)). V3 built compliance scoring and framework packs. V4 adds cross-mapping logic so a single piece of evidence can satisfy controls across frameworks.

### Your Job

#### Phase 1: Cross-Map Schema & Seed Data (produce ~400 lines)

**File: `supabase/migrations/20260403_framework_cross_mapping.sql`**
Create these tables:

```sql
-- framework_control_mappings: canonical map between controls across frameworks
CREATE TABLE framework_control_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_framework TEXT NOT NULL,
  source_control_id TEXT NOT NULL,
  target_framework TEXT NOT NULL,
  target_control_id TEXT NOT NULL,
  mapping_strength TEXT NOT NULL CHECK (mapping_strength IN ('exact', 'partial', 'related')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- control_groups: cluster of equivalent controls across frameworks
CREATE TABLE control_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- e.g. "Access Control", "Encryption", "Incident Response"
  created_at TIMESTAMPTZ DEFAULT now()
);

-- control_group_members: which controls belong to which group
CREATE TABLE control_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES control_groups(id) ON DELETE CASCADE,
  framework TEXT NOT NULL,
  control_id TEXT NOT NULL,
  UNIQUE(group_id, framework, control_id)
);
```

Seed the cross-map with at least 30 mappings covering the top overlaps:

- Access control (SOC2 CC6.1 ↔ ISO A.8 ↔ HIPAA 164.312(a) ↔ PCI-DSS 7)
- Encryption at rest/transit (SOC2 CC6.7 ↔ ISO A.10 ↔ HIPAA 164.312(a)(2)(iv) ↔ PCI-DSS 3/4)
- Incident response (SOC2 CC7.3 ↔ ISO A.16 ↔ HIPAA 164.308(a)(6) ↔ NDIS Practice Standard 3)
- Risk assessment (SOC2 CC3.2 ↔ ISO 6.1.2 ↔ HIPAA 164.308(a)(1)(ii)(A))
- Logging/monitoring (SOC2 CC7.2 ↔ ISO A.12.4 ↔ HIPAA 164.312(b) ↔ PCI-DSS 10)
- Business continuity (SOC2 CC9.1 ↔ ISO A.17 ↔ HIPAA 164.308(a)(7))

#### Phase 2: Cross-Map Engine (produce ~300 lines)

**File: `lib/compliance/cross-map-engine.ts`**
Functions:

- `getMappedControls(framework, controlId)` → returns all mapped controls with strength
- `getControlGroup(framework, controlId)` → returns the group and all members
- `getDeduplicationOpportunities(orgId)` → scans org controls, returns groups where evidence satisfies one control but not others in the group
- `autoLinkEvidence(orgId)` → for each control group, if evidence satisfies source control, auto-suggest linking to target controls
- `getCrossMapCoverage(orgId)` → returns per-framework compliance % considering cross-mapped evidence

#### Phase 3: Cross-Map Visualization UI (produce ~400 lines)

**File: `components/compliance/cross-map-matrix.tsx`** — Client component
A matrix/table showing framework×framework intersections. Rows = source controls, columns = target frameworks. Cells show mapping strength (exact=green, partial=yellow, related=gray). Click a cell to see the specific mapping detail.

**File: `components/compliance/deduplication-opportunities.tsx`** — Client component
List of control groups where evidence is partially linked. Shows:

- Group name and category
- Which frameworks' controls are satisfied vs unsatisfied
- "Link evidence" action button per gap
- Estimated compliance score improvement if linked

**File: `app/app/compliance/cross-map/page.tsx`** — Server component
Full page: summary cards (total mappings, groups, dedup opportunities), matrix view tab, dedup opportunities tab.

#### Phase 4: Unified Compliance Score (produce ~200 lines)

**File: `lib/compliance/unified-score.ts`**

- `getUnifiedComplianceScore(orgId)` → single org-wide score that accounts for cross-mapped evidence
- `getFrameworkScores(orgId)` → per-framework scores, both isolated and cross-mapped
- `getScoreImpact(orgId)` → delta between isolated vs cross-mapped scores per framework

### Output Required

4 files minimum. Cross-map seeded with 30+ real mappings. UI must be dark-mode compatible with Tailwind.

### Verification

```bash
npx tsc --noEmit --project tsconfig.typecheck.json 2>&1 | grep -v ".next/"
```

---

## Master Prompt 17: Full Task Management With Assignments, Dependencies, And Kanban Board

### Context

FormaOS has a basic tasks page (`app/app/tasks/page.tsx`) that lists tasks. V4 elevates this to a full task management system with assignees, due dates, dependencies, recurring tasks, Kanban board view, and compliance task auto-generation.

### Your Job

#### Phase 1: Task Model Enhancement (produce ~200 lines)

**File: `supabase/migrations/20260403_task_management.sql`**

```sql
-- task_dependencies: prerequisite relationships
CREATE TABLE task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES org_tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES org_tasks(id) ON DELETE CASCADE,
  dependency_type TEXT NOT NULL DEFAULT 'blocks' CHECK (dependency_type IN ('blocks', 'related')),
  UNIQUE(task_id, depends_on_task_id)
);

-- task_recurrence: recurring task patterns
CREATE TABLE task_recurrence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  template_task_id UUID REFERENCES org_tasks(id),
  title TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annual')),
  day_of_week INT, -- 0=Sun, 6=Sat
  day_of_month INT,
  assignee_id UUID,
  priority TEXT DEFAULT 'medium',
  labels TEXT[] DEFAULT '{}',
  next_due TIMESTAMPTZ NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- task_comments: threaded discussion on tasks
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES org_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- task_time_tracking: time spent per task
CREATE TABLE task_time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES org_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_minutes INT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Add RLS for all tables: users can access tasks within their org.

#### Phase 2: Task Engine (produce ~400 lines)

**File: `lib/tasks/task-engine.ts`**
Functions:

- `createTask(orgId, data)` → create with validation, set initial status
- `updateTask(taskId, data)` → update, check dependency constraints
- `assignTask(taskId, userId)` → assign with notification trigger
- `addDependency(taskId, dependsOnId)` → with cycle detection (DFS)
- `removeDependency(taskId, dependsOnId)`
- `getBlockedTasks(orgId)` → tasks blocked by incomplete dependencies
- `getTasksByBoard(orgId, filters)` → grouped by status for Kanban
- `batchMoveToStatus(taskIds, status)` → bulk status change

**File: `lib/tasks/recurrence-engine.ts`**

- `processRecurringTasks()` → generates next instance when due
- `createRecurrence(orgId, pattern)` → set up recurring task
- `pauseRecurrence(id)` / `resumeRecurrence(id)`
- `getUpcomingRecurrences(orgId, days)` → preview next N days

**File: `trigger/task-recurrence.ts`**
Trigger.dev cron: daily at 6 AM, runs `processRecurringTasks()`, creates upcoming task instances.

#### Phase 3: Kanban Board UI (produce ~500 lines)

**File: `components/tasks/kanban-board.tsx`** — Client component
Columns: To Do, In Progress, In Review, Done, Blocked.
Each card shows: title, assignee avatar, priority badge, due date, dependency count.
Drag-and-drop between columns (use onDragStart/onDragOver/onDrop native API).
Filter bar: assignee, priority, labels, due date range.

**File: `components/tasks/task-detail-panel.tsx`** — Client component
Slide-over panel when clicking a task:

- Edit title, description, status, priority, assignee, due date
- Dependencies section: list + add/remove
- Comments thread with add comment
- Time tracking: start/stop timer + manual entries
- Linked controls/evidence section
- Activity history

**File: `components/tasks/task-calendar-view.tsx`** — Client component
Calendar grid (month view) showing tasks by due date. Color-coded by priority. Click date to see tasks due.

#### Phase 4: Task Page Upgrade (produce ~200 lines)

**File: `app/app/tasks/page.tsx`** — REPLACE existing content
Server component that fetches tasks, renders view-mode tabs: List (existing), Kanban (new), Calendar (new).
Summary cards: Total, Overdue, Blocked, Completed This Week.

### Output Required

7+ files. Kanban drag-and-drop must work with native HTML5 API (no external deps). Dark-mode Tailwind.

---

## Master Prompt 18: Trial Intelligence, Usage Analytics, And Churn Prediction

### Context

FormaOS has billing with Stripe integration. V4 adds deep usage analytics, trial behavior scoring, and churn prediction signals so the admin team can proactively intervene. The existing `lib/trial/` and `lib/upgrade-intelligence/` directories have scaffolding. V4 fills them out.

### Your Job

#### Phase 1: Usage Events Schema (produce ~200 lines)

**File: `supabase/migrations/20260403_usage_analytics.sql`**

```sql
CREATE TABLE org_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID,
  event_type TEXT NOT NULL, -- 'page_view', 'feature_use', 'api_call', 'export', 'invite_sent'
  event_name TEXT NOT NULL, -- specific action: 'created_task', 'uploaded_evidence', 'ran_report'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_usage_org_time ON org_usage_events(org_id, created_at DESC);
CREATE INDEX idx_usage_event ON org_usage_events(event_type, event_name);

CREATE TABLE org_usage_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  active_users INT DEFAULT 0,
  total_events INT DEFAULT 0,
  feature_usage JSONB DEFAULT '{}', -- {"tasks": 42, "evidence": 18, "reports": 5}
  engagement_score NUMERIC(5,2) DEFAULT 0,
  UNIQUE(org_id, period_start, period_type)
);
```

#### Phase 2: Usage Tracking & Aggregation (produce ~300 lines)

**File: `lib/analytics/usage-tracker.ts`**

- `trackUsageEvent(orgId, userId, eventType, eventName, metadata?)` → insert event
- `getUsageSummary(orgId, period: 'daily'|'weekly'|'monthly', startDate, endDate)` → returns summaries
- `computeEngagementScore(orgId)` → weighted score: DAU/MAU ratio (30%), feature breadth (25%), session frequency (25%), data creation rate (20%)
- `getFeatureAdoption(orgId)` → which features are used vs unused, with % adoption

**File: `lib/analytics/churn-signals.ts`**

- `getChurnRiskScore(orgId)` → 0-100 risk score based on: declining logins, reduced feature usage, support ticket spike, billing issues, stalled onboarding
- `getChurnSignals(orgId)` → array of specific signals with severity: `[{signal: 'login_decline', severity: 'high', detail: '-60% logins last 14d'}]`
- `getTrialHealthScore(orgId)` → for trial orgs: activation %, key milestones hit (created control, uploaded evidence, invited team), days remaining, velocity

**File: `trigger/usage-aggregation.ts`**
Daily cron at 3 AM: aggregates previous day's events into org_usage_summaries, computes engagement scores.

#### Phase 3: Usage Dashboard (produce ~500 lines)

**File: `components/admin/usage-analytics-dashboard.tsx`** — Client component
Charts (CSS-based):

- Active users over time (bar chart)
- Feature adoption heatmap (features × weeks)
- Engagement score trend (line chart)
- Top actions table (event_name, count, unique users)

**File: `components/admin/churn-risk-panel.tsx`** — Client component
Org list sorted by churn risk. Each row: org name, risk score (colored badge), signals list, last login, plan, actions (reach out, extend trial, offer discount).

**File: `components/admin/trial-funnel.tsx`** — Client component
Visual funnel: Signed Up → Activated → First Control → First Evidence → Invited Team → Subscribed
Shows count at each stage, conversion %, drop-off rate per stage.

**File: `app/admin/usage-analytics/page.tsx`** — Server component
Full admin page with: summary cards (total orgs, avg engagement, at-risk count, trial conversion rate), tabs for Usage Analytics, Churn Risk, Trial Funnel.

### Output Required

7+ files. All charts use CSS/SVG (no chart library). Dark-mode compatible.

---

## Master Prompt 19: Role Permissions Matrix, Team Management, And Org Chart

### Context

FormaOS has basic roles (owner, admin, member). V4 adds a fine-grained permission system with custom roles, a visual role editor, team capacity tracking, and an org chart view.

### Your Job

#### Phase 1: Permission Schema (produce ~250 lines)

**File: `supabase/migrations/20260403_permissions_matrix.sql`**

```sql
-- custom_roles: org-specific roles beyond the defaults
CREATE TABLE custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  base_role TEXT NOT NULL DEFAULT 'member' CHECK (base_role IN ('admin', 'member', 'viewer')),
  permissions JSONB NOT NULL DEFAULT '{}',
  -- permissions shape: {"tasks": {"read": true, "write": true, "delete": false}, "evidence": {"read": true, "write": false}}
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, name)
);

-- team_groups: teams/departments within an org
CREATE TABLE team_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  parent_team_id UUID REFERENCES team_groups(id),
  lead_user_id UUID,
  color TEXT, -- hex color for UI
  created_at TIMESTAMPTZ DEFAULT now()
);

-- team_members: user ↔ team assignments
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES team_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  custom_role_id UUID REFERENCES custom_roles(id),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, user_id)
);
```

RLS: org members can read, admins can write.

#### Phase 2: Permission Engine (produce ~300 lines)

**File: `lib/authz/permission-engine.ts`**

- PERMISSION_MODULES: const array of all permission areas: tasks, evidence, compliance, incidents, reports, team, billing, settings, forms, care_plans, audit, policies, integrations
- Each module has: read, write, delete, export, admin (boolean flags)
- `getEffectivePermissions(userId, orgId)` → resolves base role + custom role + team overrides
- `hasPermission(userId, orgId, module, action)` → boolean check
- `getRolePermissions(roleId)` → the full permission matrix for a role
- `createCustomRole(orgId, name, baseRole, permissions)` → creates
- `getPermissionDiff(roleA, roleB)` → shows what's different between two roles

#### Phase 3: Role Management UI (produce ~400 lines)

**File: `components/team/role-editor.tsx`** — Client component
Checkbox matrix: rows = permission modules, columns = read/write/delete/export/admin.
Toggle all row/column. Preset buttons: "Full Admin", "Read Only", "Standard Member", "Auditor".
Save as custom role.

**File: `components/team/team-management.tsx`** — Client component
Team tree (expandable for nested teams). Each team shows name, member count, lead.
Click team: slide-over with members list, add/remove members, assign roles.
Drag users between teams.

**File: `components/team/org-chart.tsx`** — Client component
Visual org chart using CSS flexbox/grid:

- Top: org name
- Below: teams as boxes connected by lines
- Inside each box: team name, lead avatar, member count
- Expandable to show all members
- Color-coded by team color

#### Phase 4: Team Pages (produce ~200 lines)

**File: `app/app/settings/roles/page.tsx`** — Server component
Lists default roles + custom roles. Create custom role button. Each role shows permissions summary count, member count, edit/delete actions.

**File: `app/app/team/org-chart/page.tsx`** — Server component
Full-page org chart with team management sidebar.

### Output Required

7+ files. Permission engine must be comprehensive with 13+ modules. UI uses Tailwind dark mode.

---

## Master Prompt 20: Policy Lifecycle — Versioning, Approval Workflows, And Acknowledgment

### Context

FormaOS has basic policy CRUD (`app/app/policies/`). V4 adds document versioning, multi-stage approval workflows, staff acknowledgment tracking, and policy review reminders.

### Your Job

#### Phase 1: Policy Lifecycle Schema (produce ~250 lines)

**File: `supabase/migrations/20260403_policy_lifecycle.sql`**

```sql
-- policy_versions: track every version of a policy
CREATE TABLE policy_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES org_policies(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  change_summary TEXT,
  author_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'published', 'archived')),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(policy_id, version_number)
);

-- policy_approvals: approval workflow entries
CREATE TABLE policy_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES policy_versions(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'skipped')),
  comments TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- policy_acknowledgments: staff must acknowledge reading policies
CREATE TABLE policy_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES org_policies(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES policy_versions(id),
  user_id UUID NOT NULL,
  acknowledged_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  UNIQUE(version_id, user_id)
);

-- policy_review_schedules: when policies need re-review
CREATE TABLE policy_review_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES org_policies(id) ON DELETE CASCADE,
  review_frequency_months INT NOT NULL DEFAULT 12,
  next_review_date DATE NOT NULL,
  last_reviewed_at TIMESTAMPTZ,
  assignee_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

RLS: org members can read, owners/admins can write.

#### Phase 2: Policy Engine (produce ~350 lines)

**File: `lib/policies/policy-engine.ts`**

- `createPolicyVersion(policyId, data)` → increments version, status=draft
- `submitForApproval(versionId, approverIds)` → creates approval entries, sets status=pending_review
- `approvePolicy(approvalId, comments?)` → marks approved; if all approvers approved, auto-set version status=approved
- `rejectPolicy(approvalId, comments)` → marks rejected, sets version status=draft
- `publishPolicy(versionId)` → sets published_at, sends acknowledgment requests to all org members
- `acknowledgePolicy(policyId, versionId, userId)` → record acknowledgment
- `getAcknowledgmentStatus(policyId)` → % acknowledged, list of pending users
- `getPoliciesDueForReview(orgId)` → policies with next_review_date ≤ today + 30 days
- `getVersionHistory(policyId)` → all versions with status, diff summary

**File: `trigger/policy-review-reminder.ts`**
Weekly cron (Monday 9 AM): scans `policy_review_schedules`, sends reminder emails for policies due within 30 days.

#### Phase 3: Policy UI (produce ~500 lines)

**File: `components/policies/policy-version-timeline.tsx`** — Client component
Vertical timeline of versions: version number, author, status badge, date, change summary. Current published version highlighted.

**File: `components/policies/approval-workflow.tsx`** — Client component
Shows approval chain: each approver with status (pending=gray, approved=green, rejected=red). Approve/Reject buttons for current user. Comments thread.

**File: `components/policies/acknowledgment-tracker.tsx`** — Client component
Progress bar showing % acknowledged. Table of users: name, role, acknowledged date (or "Pending" with remind button). Bulk remind action.

**File: `app/app/policies/[id]/versions/page.tsx`** — Server component
Version history page for a specific policy. Shows timeline, current version content, approval workflow for latest version, acknowledgment tracker for published version.

### Output Required

7+ files. Approval workflow must handle multi-approver chains. Acknowledgment tracking with reminder capability.

---

## Master Prompt 21: Document Retention, Legal Hold, And Auto-Archive

### Context

FormaOS vault stores evidence and documents. V4 adds retention policies (auto-archive/delete after N months), legal hold (prevent deletion during investigations), and lifecycle automation.

### Your Job

#### Phase 1: Retention Schema (produce ~200 lines)

**File: `supabase/migrations/20260403_document_retention.sql`**

```sql
CREATE TABLE retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  document_types TEXT[] DEFAULT '{}', -- which types this applies to
  retention_period_months INT NOT NULL,
  action_on_expiry TEXT NOT NULL CHECK (action_on_expiry IN ('archive', 'delete', 'review')),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE legal_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  reason TEXT NOT NULL,
  custodian_ids UUID[] DEFAULT '{}', -- users responsible
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'released')),
  activated_at TIMESTAMPTZ DEFAULT now(),
  released_at TIMESTAMPTZ,
  created_by UUID NOT NULL
);

CREATE TABLE legal_hold_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hold_id UUID NOT NULL REFERENCES legal_holds(id) ON DELETE CASCADE,
  evidence_id UUID NOT NULL REFERENCES org_evidence(id),
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(hold_id, evidence_id)
);

CREATE TABLE document_lifecycle_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  evidence_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'archived', 'restored', 'deleted', 'hold_placed', 'hold_released')),
  performed_by UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### Phase 2: Retention Engine (produce ~300 lines)

**File: `lib/evidence/retention-engine.ts`**

- `applyRetentionPolicy(orgId, policyId)` → applies to matching documents
- `getDocumentsExpiringSoon(orgId, days)` → documents whose retention ends within N days
- `archiveDocument(evidenceId, performedBy)` → move to archived status, log action
- `restoreDocument(evidenceId, performedBy)` → restore from archive
- `isUnderLegalHold(evidenceId)` → check if document is held
- `placeLegalHold(holdId, evidenceIds)` → add documents to hold, block deletion
- `releaseLegalHold(holdId)` → release hold, re-enable normal retention
- `processRetention()` → batch process: find expired docs, check holds, execute action

**File: `trigger/retention-processor.ts`**
Daily cron at 2 AM: runs `processRetention()`, archives/flags expired documents, skips held ones.

#### Phase 3: Retention UI (produce ~400 lines)

**File: `components/vault/retention-policy-editor.tsx`** — Client component
Form to create/edit retention policies: name, document types (multi-select), period in months, expiry action. Shows how many documents currently match.

**File: `components/vault/legal-hold-manager.tsx`** — Client component
Active holds list with: name, reason, document count, custodians, status. Create new hold with document selection. Release hold with confirmation.

**File: `components/vault/document-lifecycle.tsx`** — Client component
Timeline of lifecycle events for a document: created → updated → hold placed → archived. Each event with user, date, action icon.

**File: `app/app/vault/retention/page.tsx`** — Server component
Page with tabs: Retention Policies, Legal Holds, Expiring Soon. Summary cards: active policies, active holds, documents expiring this month.

### Output Required

7+ files. Legal hold must prevent deletion absolutely. Retention processor must respect holds.

---

## Master Prompt 22: Organization Settings Hub And Workspace Customization

### Context

FormaOS has scattered settings pages. V4 consolidates into a single settings hub with org branding, custom domain configuration, feature toggles, data export, and danger zone.

### Your Job

#### Phase 1: Org Settings Schema (produce ~150 lines)

**File: `supabase/migrations/20260403_org_settings_hub.sql`**

```sql
CREATE TABLE org_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) UNIQUE,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  accent_color TEXT DEFAULT '#8B5CF6',
  sidebar_style TEXT DEFAULT 'default' CHECK (sidebar_style IN ('default', 'compact', 'minimal')),
  custom_css TEXT, -- limited custom CSS for white-labeling
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE org_feature_toggles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  feature_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB DEFAULT '{}',
  UNIQUE(org_id, feature_key)
);
```

#### Phase 2: Settings Engine (produce ~250 lines)

**File: `lib/org/settings-engine.ts`**

- `getBranding(orgId)` → returns branding config (with defaults)
- `updateBranding(orgId, data)` → upsert branding
- `getFeatureToggles(orgId)` → all toggles for org
- `setFeatureToggle(orgId, featureKey, enabled, config?)` → upsert
- `isFeatureEnabled(orgId, featureKey)` → boolean check
- `exportOrgData(orgId)` → generates JSON export of all org data (for GDPR compliance)
- `getOrgProfile(orgId)` → org name, industry, plan, member count, created date
- `updateOrgProfile(orgId, data)` → update name, industry, timezone, locale

#### Phase 3: Settings UI (produce ~600 lines)

**File: `components/settings/branding-editor.tsx`** — Client component
Live preview panel showing how sidebar/topbar look with current branding. Color pickers for primary/accent. Logo upload area. Sidebar style selector. Reset to defaults button.

**File: `components/settings/feature-toggles.tsx`** — Client component
Grid of feature toggles with: feature name, description, toggle switch, config expand (if applicable). Categories: Core, Care, Compliance, Reporting, Integrations.

**File: `components/settings/data-export.tsx`** — Client component
Export org data in JSON format. Shows data categories with sizes. Download button. GDPR compliance note.

**File: `components/settings/danger-zone.tsx`** — Client component
Red-bordered section: Transfer ownership, Delete organization. Each requires typed confirmation of org name.

**File: `app/app/settings/organization/page.tsx`** — Server component
Settings hub: General (profile), Branding, Features, Data Export, Danger Zone tabs.

### Output Required

7+ files. Branding editor must have live preview. Feature toggles must use consistent pattern.

---

## Master Prompt 23: Dashboard Builder With Drag-Drop Widgets And Saved Layouts

### Context

FormaOS has a static dashboard (`app/app/dashboard/page.tsx`). V4 adds a configurable dashboard where users can add/remove/rearrange widgets and save their layout.

### Your Job

#### Phase 1: Dashboard Config Schema (produce ~150 lines)

**File: `supabase/migrations/20260403_dashboard_builder.sql`**

```sql
CREATE TABLE dashboard_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Dashboard',
  is_default BOOLEAN DEFAULT false,
  layout JSONB NOT NULL DEFAULT '[]',
  -- layout shape: [{"widgetId": "compliance-score", "x": 0, "y": 0, "w": 4, "h": 2, "config": {}}]
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE dashboard_widget_registry (
  id TEXT PRIMARY KEY, -- e.g. 'compliance-score', 'task-summary', 'incident-trend'
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'compliance', 'tasks', 'incidents', 'care', 'analytics'
  default_size JSONB DEFAULT '{"w": 4, "h": 2}',
  configurable BOOLEAN DEFAULT false,
  config_schema JSONB DEFAULT '{}' -- what config options the widget accepts
);
```

Seed widget_registry with 15+ widgets: compliance-score, task-summary, incident-trend, recent-activity, evidence-freshness, upcoming-deadlines, team-workload, framework-progress, risk-heatmap, care-plan-status, notification-feed, quick-actions, onboarding-progress, audit-readiness, policy-status.

#### Phase 2: Dashboard Engine (produce ~200 lines)

**File: `lib/dashboard/dashboard-engine.ts`**

- `getUserLayout(userId, orgId)` → returns saved layout or default
- `saveLayout(userId, orgId, layout)` → persist layout
- `getAvailableWidgets(orgId)` → all widgets from registry, filtered by org features
- `getWidgetData(widgetId, orgId, config?)` → fetches live data for a specific widget
- `resetToDefault(userId, orgId)` → resets to system default layout
- `duplicateLayout(layoutId, name)` → copy a layout

#### Phase 3: Widget Components (produce ~500 lines)

**File: `components/dashboard/widget-renderer.tsx`** — Client component
Takes widgetId + config, renders the appropriate widget. Switch statement mapping each widgetId to its rendering logic. Each widget is a self-contained card with title, content, loading state.

Built-in widgets to render:

- ComplianceScoreWidget: ring chart + %, framework breakdown
- TaskSummaryWidget: overdue/today/total, mini bar chart
- IncidentTrendWidget: last 7 days sparkline
- RecentActivityWidget: last 10 activity entries
- EvidenceFreshnessWidget: stale/fresh/expired counts
- UpcomingDeadlinesWidget: next 5 deadlines
- TeamWorkloadWidget: tasks per member horizontal bars
- QuickActionsWidget: 4 quick action buttons
- FrameworkProgressWidget: progress bars per framework
- AuditReadinessWidget: score gauge + top gaps

#### Phase 4: Dashboard Builder UI (produce ~400 lines)

**File: `components/dashboard/dashboard-grid.tsx`** — Client component
Grid-based layout (12-column). Each widget positioned by x,y,w,h from layout config.
Edit mode toggle: when editing, show remove button on each widget, add widget button.
Widget sidebar: shows available widgets by category, drag to add to grid.

**File: `components/dashboard/widget-picker.tsx`** — Client component
Modal showing all available widgets grouped by category. Each widget: name, description, preview, "Add" button. Search/filter.

**File: `app/app/dashboard/page.tsx`** — REPLACE existing content
Server component: fetches user layout, renders DashboardGrid. Edit dashboard button. Layout name selector for users with multiple layouts.

### Output Required

7+ files. Widget registry seeded with 15+ widgets. Grid layout without external dependencies.

---

## Master Prompt 24: Integration Marketplace — Slack, Jira, Azure AD, And Webhook Connectors

### Context

FormaOS has a basic integrations page and webhook infrastructure. V4 adds pre-built connectors for Slack, Jira, Azure AD, and a generic webhook builder so orgs can wire FormaOS into their existing tools.

### Your Job

#### Phase 1: Integration Schema (produce ~200 lines)

**File: `supabase/migrations/20260403_integration_marketplace.sql`**

```sql
CREATE TABLE org_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  integration_type TEXT NOT NULL, -- 'slack', 'jira', 'azure_ad', 'webhook', 'google_workspace', 'teams'
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('inactive', 'active', 'error', 'pending_auth')),
  config JSONB NOT NULL DEFAULT '{}', -- encrypted sensitive fields
  credentials JSONB DEFAULT '{}', -- access_token, refresh_token (encrypted)
  last_sync_at TIMESTAMPTZ,
  error_message TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE integration_event_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES org_integrations(id) ON DELETE CASCADE,
  formaos_event TEXT NOT NULL, -- 'task.created', 'incident.reported', 'evidence.uploaded'
  external_action TEXT NOT NULL, -- 'send_message', 'create_issue', 'sync_user'
  config JSONB DEFAULT '{}', -- channel, project, template
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE integration_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES org_integrations(id),
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  event_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),
  payload JSONB DEFAULT '{}',
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### Phase 2: Integration Engine & Connectors (produce ~600 lines)

**File: `lib/integrations/integration-engine.ts`**
Core engine:

- `getIntegrations(orgId)` → list all configured integrations
- `configureIntegration(orgId, type, config)` → set up
- `activateIntegration(id)` / `deactivateIntegration(id)`
- `processEvent(orgId, event)` → routes FormaOS events to all active integrations
- `logSync(integrationId, direction, eventType, status, payload?, error?)`

**File: `lib/integrations/connectors/slack-connector.ts`**

- `sendSlackMessage(webhookUrl, channel, message)` → sends formatted message
- `buildSlackMessage(event)` → formats FormaOS events into Slack blocks
- Event handlers: task.created → send to channel, incident.reported → urgent message, evidence.uploaded → notification

**File: `lib/integrations/connectors/jira-connector.ts`**

- `createJiraIssue(config, data)` → creates issue from FormaOS task/incident
- `syncJiraStatus(config, issueKey, status)` → syncs status back
- `mapPriority(formaosPriority)` → maps to Jira priority levels
- Event handlers: task.created → create issue, task.status_changed → update issue

**File: `lib/integrations/connectors/azure-ad-connector.ts`**

- `syncUsers(config)` → pulls users from Azure AD, creates/updates org members
- `syncGroups(config)` → pulls groups, maps to teams
- `handleUserChange(event)` → processes user provisioning/deprovisioning
- Scheduled sync support

**File: `lib/integrations/connectors/webhook-connector.ts`**

- `sendWebhook(url, payload, headers?, secret?)` → sends with HMAC signature
- `buildPayload(event, template?)` → constructs webhook payload
- `verifyDelivery(deliveryId)` → check delivery status

#### Phase 3: Integration UI (produce ~400 lines)

**File: `components/integrations/marketplace.tsx`** — Client component
Grid of available integrations: Slack, Jira, Azure AD, Google Workspace, Teams, Custom Webhook.
Each card: logo, name, description, status badge, "Configure" button.
Categories: Communication, Project Management, Identity, Custom.

**File: `components/integrations/integration-config.tsx`** — Client component
Dynamic config form per integration type:

- Slack: webhook URL, default channel, event selections
- Jira: domain, project key, issue type, priority mapping
- Azure AD: tenant ID, client ID, sync schedule
- Webhook: URL, secret, event selections, payload template editor

**File: `components/integrations/sync-log-viewer.tsx`** — Client component
Table of recent sync events: timestamp, direction, event type, status (green/red), payload preview. Filter by integration, status, date.

**File: `app/app/settings/integrations/page.tsx`** — REPLACE or enhance existing
Marketplace view + configured integrations list + sync log tab.

### Output Required

9+ files. Each connector must handle errors gracefully and log to sync_log.

---

## Master Prompt 25: Comprehensive Audit Trail Viewer And Tamper-Proof Logging

### Context

FormaOS has an audit log table and basic audit page. V4 adds a full-featured audit trail viewer with advanced filtering, tamper-proof hash chaining, export capability, and compliance-ready reports.

### Your Job

#### Phase 1: Audit Enhancement Schema (produce ~200 lines)

**File: `supabase/migrations/20260403_audit_trail_enhanced.sql`**

```sql
-- Add hash chain for tamper detection
ALTER TABLE org_audit_logs ADD COLUMN IF NOT EXISTS hash TEXT;
ALTER TABLE org_audit_logs ADD COLUMN IF NOT EXISTS prev_hash TEXT;
ALTER TABLE org_audit_logs ADD COLUMN IF NOT EXISTS sequence_num BIGINT;

-- audit_export_jobs: track export requests
CREATE TABLE audit_export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  requested_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  filters JSONB DEFAULT '{}',
  date_range_start TIMESTAMPTZ,
  date_range_end TIMESTAMPTZ,
  record_count INT,
  file_url TEXT,
  format TEXT DEFAULT 'csv' CHECK (format IN ('csv', 'json', 'pdf')),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- audit_retention_config: how long to keep audit logs
CREATE TABLE audit_retention_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) UNIQUE,
  retention_months INT NOT NULL DEFAULT 84, -- 7 years default (SOC 2 requirement)
  archive_after_months INT DEFAULT 24,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for hash chain queries
CREATE INDEX IF NOT EXISTS idx_audit_sequence ON org_audit_logs(org_id, sequence_num DESC);
```

#### Phase 2: Audit Engine (produce ~400 lines)

**File: `lib/audit/audit-engine.ts`**

- `logAuditEvent(orgId, event)` → writes event with hash chain: `hash = SHA256(prev_hash + event_json + sequence_num)`
- `verifyAuditChain(orgId, startSeq?, endSeq?)` → validates hash chain integrity, returns {valid: boolean, brokenAt?: number}
- `searchAuditLogs(orgId, filters)` → full-text search with filters: user, action, entity_type, date range, severity
- `getAuditStats(orgId, period)` → event counts by type, top actors, busiest hours
- `exportAuditLogs(orgId, filters, format)` → generates CSV/JSON/PDF export
- `getAuditTimeline(orgId, entityType, entityId)` → all events for a specific entity
- `getRetentionConfig(orgId)` → returns retention settings
- `setRetentionConfig(orgId, config)` → update retention

**File: `lib/audit/hash-utils.ts`**

- `computeHash(prevHash, eventJson, sequenceNum)` → SHA256 hash
- `verifyHash(event)` → checks single event hash
- `buildHashChain(events)` → recomputes chain for a set of events

**File: `trigger/audit-maintenance.ts`**
Monthly cron: archives old audit logs per retention config, verifies hash chain integrity, alerts on tampering.

#### Phase 3: Audit Trail UI (produce ~500 lines)

**File: `components/audit/audit-trail-viewer.tsx`** — Client component
Full-featured log viewer:

- Filter bar: date range, user (searchable dropdown), action type, entity type, severity
- Log table: timestamp, user, action, entity, details (expandable JSON), hash status icon
- Real-time stream toggle (SSE/polling)
- Pagination with "load more"

**File: `components/audit/audit-analytics.tsx`** — Client component
Charts: events per day (bar), top actors (horizontal bar), action type distribution (pie), busiest hours (24-grid).

**File: `components/audit/chain-integrity.tsx`** — Client component
Integrity verification panel: "Verify Chain" button, progress indicator, result (green checkmark or red alert with broken link details). Last verification timestamp.

**File: `components/audit/audit-export.tsx`** — Client component
Export wizard: select filters, date range, format (CSV/JSON/PDF). Shows estimated record count. "Export" button → job status tracking → download link when ready.

**File: `app/app/audit/page.tsx`** — REPLACE or enhance existing
Tabs: Event Log, Analytics, Chain Integrity, Export, Settings (retention config).

### Output Required

8+ files. Hash chain must use real SHA-256. Export must support CSV and JSON at minimum. Dark-mode Tailwind.

---

## Implementation Priority

1. **P16** — Cross-map (high value: saves orgs 30-50% duplicate work)
2. **P17** — Task management (most-used daily feature)
3. **P23** — Dashboard builder (first thing users see)
4. **P25** — Audit trail (compliance requirement for SOC 2 / ISO 27001)
5. **P20** — Policy lifecycle (critical for regulated industries)
6. **P24** — Integrations (enterprise sales enabler)
7. **P18** — Trial intelligence (revenue impact)
8. **P19** — Permissions (enterprise security requirement)
9. **P21** — Document retention (compliance requirement)
10. **P22** — Org settings (polish/UX)

---

## Verification After All Prompts Complete

```bash
# 1. Typecheck
npx tsc --noEmit --project tsconfig.typecheck.json 2>&1 | grep -v ".next/"

# 2. Count new code
git diff --stat HEAD~1

# 3. File count
find app components lib trigger supabase/migrations -name "*.ts" -o -name "*.tsx" -o -name "*.sql" | wc -l

# 4. Push
git add -A && git commit -m "feat: V4 Prompts 16-25" && git push origin main
```
