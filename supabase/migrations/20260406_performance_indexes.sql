-- =====================================================
-- PERFORMANCE OPTIMIZATION - DATABASE INDEXES
-- =====================================================
-- Migration Date: 2026-04-06
-- Priority: HIGH - Performance
--
-- Purpose: Add missing indexes for time-series queries and lookups
-- that are currently causing slow queries.
--
-- Impact: Improves query performance for:
-- - Audit log exports (time-range queries)
-- - Control lookups by framework
-- - Evidence queries by patient/entity
-- - Task queries by status and date
-- - Workflow execution history
-- =====================================================

BEGIN;

-- =====================================================
-- AUDIT & LOGGING INDEXES
-- =====================================================

-- org_audit_events: Time-series queries for audit exports
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'org_audit_events'
  ) THEN
    -- Index for time-range queries within an organization
    CREATE INDEX IF NOT EXISTS idx_org_audit_events_org_created
      ON public.org_audit_events(organization_id, created_at DESC);

    -- Index for action type filtering
    CREATE INDEX IF NOT EXISTS idx_org_audit_events_action_type
      ON public.org_audit_events(organization_id, action_type, created_at DESC);

    -- Index for actor lookups
    CREATE INDEX IF NOT EXISTS idx_org_audit_events_actor
      ON public.org_audit_events(organization_id, actor_user_id, created_at DESC);
  END IF;
END
$$;

-- org_audit_logs: Legacy audit log table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'org_audit_logs'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_org_audit_logs_org_created
      ON public.org_audit_logs(organization_id, created_at DESC);

    -- Only create domain/action index if columns exist
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'org_audit_logs'
      AND column_name = 'domain'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'org_audit_logs'
      AND column_name = 'action'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_org_audit_logs_domain_action
        ON public.org_audit_logs(organization_id, domain, action, created_at DESC);
    END IF;

    -- Fallback: create action-only index if action exists but domain doesn't
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'org_audit_logs'
      AND column_name = 'action'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'org_audit_logs'
      AND column_name = 'domain'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_org_audit_logs_action
        ON public.org_audit_logs(organization_id, action, created_at DESC);
    END IF;
  END IF;
END
$$;

-- =====================================================
-- COMPLIANCE ENGINE INDEXES
-- =====================================================

-- compliance_controls: Framework control lookups
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'compliance_controls'
  ) THEN
    -- Composite index for framework + code lookups
    CREATE INDEX IF NOT EXISTS idx_compliance_controls_framework_code
      ON public.compliance_controls(framework_id, code);

    -- Index for category filtering (only if column exists)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'compliance_controls'
      AND column_name = 'category'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_compliance_controls_category
        ON public.compliance_controls(framework_id, category);
    END IF;

    -- Index for risk level filtering (only if columns exist)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'compliance_controls'
      AND column_name = 'risk_level'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'compliance_controls'
      AND column_name = 'is_mandatory'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_compliance_controls_risk
        ON public.compliance_controls(framework_id, risk_level, is_mandatory);
    END IF;
  END IF;
END
$$;

-- org_control_evaluations: Fast evaluation lookups
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'org_control_evaluations'
  ) THEN
    -- Status filtering for dashboards (only if columns exist)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'org_control_evaluations'
      AND column_name = 'status'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'org_control_evaluations'
      AND column_name = 'last_evaluated_at'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_org_control_eval_status
        ON public.org_control_evaluations(organization_id, status, last_evaluated_at DESC);
    END IF;

    -- Framework-specific queries (only if control_type exists)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'org_control_evaluations'
      AND column_name = 'control_type'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_org_control_eval_framework
        ON public.org_control_evaluations(organization_id, control_type)
        WHERE control_type LIKE 'framework_%';
    END IF;
  END IF;
END
$$;

-- control_evidence: Evidence to control linking
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'control_evidence'
  ) THEN
    -- Index for control evidence lookups
    CREATE INDEX IF NOT EXISTS idx_control_evidence_control
      ON public.control_evidence(organization_id, control_id, status);

    -- Index for evidence control reverse lookup
    CREATE INDEX IF NOT EXISTS idx_control_evidence_evidence
      ON public.control_evidence(organization_id, evidence_id, status);
  END IF;
END
$$;

-- =====================================================
-- EVIDENCE & TASKS INDEXES
-- =====================================================

-- org_evidence: Evidence queries
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'org_evidence'
  ) THEN
    -- Time-series queries (basic - should always work)
    CREATE INDEX IF NOT EXISTS idx_org_evidence_org_created
      ON public.org_evidence(organization_id, created_at DESC);

    -- Patient evidence queries (only if patient_id exists)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'org_evidence'
      AND column_name = 'patient_id'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_org_evidence_patient
        ON public.org_evidence(organization_id, patient_id, created_at DESC)
        WHERE patient_id IS NOT NULL;
    END IF;

    -- Entity evidence queries (only if entity_id exists)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'org_evidence'
      AND column_name = 'entity_id'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_org_evidence_entity
        ON public.org_evidence(organization_id, entity_id, created_at DESC)
        WHERE entity_id IS NOT NULL;
    END IF;

    -- Status filtering (only if both columns exist)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'org_evidence'
      AND column_name = 'status'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'org_evidence'
      AND column_name = 'verification_status'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_org_evidence_status
        ON public.org_evidence(organization_id, status, verification_status);
    END IF;
  END IF;
END
$$;

-- org_tasks: Task queries
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'org_tasks'
  ) THEN
    -- Time-series queries (basic - should always work)
    CREATE INDEX IF NOT EXISTS idx_org_tasks_org_created
      ON public.org_tasks(organization_id, created_at DESC);

    -- Patient task queries (only if patient_id exists)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'org_tasks'
      AND column_name = 'patient_id'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_org_tasks_patient
        ON public.org_tasks(organization_id, patient_id, created_at DESC)
        WHERE patient_id IS NOT NULL;
    END IF;

    -- Status + due date queries (only if both columns exist)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'org_tasks'
      AND column_name = 'status'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'org_tasks'
      AND column_name = 'due_date'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_org_tasks_status_due
        ON public.org_tasks(organization_id, status, due_date)
        WHERE status != 'completed';
    END IF;

    -- Assignee queries (only if assigned_to and status exist)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'org_tasks'
      AND column_name = 'assigned_to'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'org_tasks'
      AND column_name = 'status'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_org_tasks_assigned
        ON public.org_tasks(organization_id, assigned_to, status)
        WHERE assigned_to IS NOT NULL;
    END IF;
  END IF;
END
$$;

-- =====================================================
-- HEALTHCARE/PATIENT INDEXES
-- =====================================================

-- org_patients: Patient lookups
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'org_patients'
  ) THEN
    -- External ID lookup (for integrations)
    CREATE INDEX IF NOT EXISTS idx_org_patients_external_id
      ON public.org_patients(organization_id, external_id)
      WHERE external_id IS NOT NULL;

    -- Care status filtering
    CREATE INDEX IF NOT EXISTS idx_org_patients_care_status
      ON public.org_patients(organization_id, care_status);

    -- Risk level filtering
    CREATE INDEX IF NOT EXISTS idx_org_patients_risk
      ON public.org_patients(organization_id, risk_level)
      WHERE risk_level IN ('high', 'critical');

    -- Emergency flag filtering
    CREATE INDEX IF NOT EXISTS idx_org_patients_emergency
      ON public.org_patients(organization_id, emergency_flag)
      WHERE emergency_flag = true;
  END IF;
END
$$;

-- org_progress_notes: Time-series note queries
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'org_progress_notes'
  ) THEN
    -- Patient note history (already exists but confirming)
    CREATE INDEX IF NOT EXISTS idx_org_progress_notes_patient
      ON public.org_progress_notes(organization_id, patient_id, created_at DESC);

    -- Staff notes lookup
    CREATE INDEX IF NOT EXISTS idx_org_progress_notes_staff
      ON public.org_progress_notes(organization_id, staff_user_id, created_at DESC);

    -- Status tag filtering
    CREATE INDEX IF NOT EXISTS idx_org_progress_notes_status
      ON public.org_progress_notes(organization_id, status_tag, created_at DESC)
      WHERE status_tag IN ('incident', 'risk');
  END IF;
END
$$;

-- org_incidents: Incident queries
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'org_incidents'
  ) THEN
    -- Patient incident history (already exists but confirming)
    CREATE INDEX IF NOT EXISTS idx_org_incidents_patient
      ON public.org_incidents(organization_id, patient_id, occurred_at DESC);

    -- Severity filtering
    CREATE INDEX IF NOT EXISTS idx_org_incidents_severity
      ON public.org_incidents(organization_id, severity, status, occurred_at DESC);

    -- Open incidents
    CREATE INDEX IF NOT EXISTS idx_org_incidents_open
      ON public.org_incidents(organization_id, status, occurred_at DESC)
      WHERE status = 'open';
  END IF;
END
$$;

-- =====================================================
-- WORKFLOW INDEXES
-- =====================================================

-- org_workflows: Workflow lookups
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'org_workflows'
  ) THEN
    -- Trigger type lookups (already exists but confirming)
    CREATE INDEX IF NOT EXISTS idx_org_workflows_trigger
      ON public.org_workflows(organization_id, trigger)
      WHERE enabled = true;

    -- Enabled workflows
    CREATE INDEX IF NOT EXISTS idx_org_workflows_enabled
      ON public.org_workflows(organization_id, enabled);
  END IF;
END
$$;

-- org_workflow_executions: Execution history
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'org_workflow_executions'
  ) THEN
    -- Workflow execution history (already exists but confirming)
    CREATE INDEX IF NOT EXISTS idx_org_workflow_exec_workflow
      ON public.org_workflow_executions(workflow_id, executed_at DESC);

    -- Recent executions by time
    CREATE INDEX IF NOT EXISTS idx_org_workflow_exec_time
      ON public.org_workflow_executions(organization_id, executed_at DESC);

    -- Failed executions
    CREATE INDEX IF NOT EXISTS idx_org_workflow_exec_failed
      ON public.org_workflow_executions(organization_id, status, executed_at DESC)
      WHERE status = 'failed';
  END IF;
END
$$;

-- =====================================================
-- SUBSCRIPTION & BILLING INDEXES
-- =====================================================

-- org_subscriptions: Fast subscription lookups
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'org_subscriptions'
  ) THEN
    -- Stripe customer lookup (already exists via price_id but adding customer)
    CREATE INDEX IF NOT EXISTS idx_org_subscriptions_stripe_customer
      ON public.org_subscriptions(stripe_customer_id)
      WHERE stripe_customer_id IS NOT NULL;

    -- Trial expiration queries (already exists but confirming)
    CREATE INDEX IF NOT EXISTS idx_org_subscriptions_trial_expires
      ON public.org_subscriptions(trial_expires_at)
      WHERE status = 'trialing' AND trial_expires_at IS NOT NULL;

    -- Active subscriptions
    CREATE INDEX IF NOT EXISTS idx_org_subscriptions_active
      ON public.org_subscriptions(status, current_period_end)
      WHERE status IN ('active', 'trialing');
  END IF;
END
$$;

-- =====================================================
-- TEAM & INVITATIONS INDEXES
-- =====================================================

-- team_invitations: Invitation lookups
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'team_invitations'
  ) THEN
    -- Token lookup (already exists but confirming)
    CREATE INDEX IF NOT EXISTS idx_team_invitations_token
      ON public.team_invitations(token)
      WHERE status = 'pending';

    -- Email lookup for duplicate checking
    CREATE INDEX IF NOT EXISTS idx_team_invitations_email
      ON public.team_invitations(organization_id, email, status);

    -- Expiration cleanup (already exists but confirming)
    CREATE INDEX IF NOT EXISTS idx_team_invitations_expires
      ON public.team_invitations(expires_at)
      WHERE status = 'pending';
  END IF;
END
$$;

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify indexes were created:
--
-- -- List all indexes on org tables
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
--   AND tablename LIKE 'org_%'
-- ORDER BY tablename, indexname;
--
-- -- Check index usage statistics
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan as times_used,
--   idx_tup_read as tuples_read,
--   idx_tup_fetch as tuples_fetched
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;
-- =====================================================
