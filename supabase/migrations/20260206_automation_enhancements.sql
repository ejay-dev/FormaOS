-- Automation Engine Schema Enhancements
-- Adds fields to support automated workflow triggers and compliance scoring

-- Add automation tracking fields to org_evidence
ALTER TABLE org_evidence
ADD COLUMN IF NOT EXISTS renewal_task_created BOOLEAN DEFAULT FALSE;

-- Add automation tracking fields to org_policies
ALTER TABLE org_policies
ADD COLUMN IF NOT EXISTS review_task_created BOOLEAN DEFAULT FALSE;

-- Add automation tracking fields to org_tasks
ALTER TABLE org_tasks
ADD COLUMN IF NOT EXISTS escalation_sent BOOLEAN DEFAULT FALSE;

-- Add automation tracking fields to org_certifications
ALTER TABLE org_certifications
ADD COLUMN IF NOT EXISTS renewal_task_created BOOLEAN DEFAULT FALSE;

-- Ensure org_workflow_executions has organization_id for filtering
ALTER TABLE org_workflow_executions
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Add index for organization-based workflow execution queries
CREATE INDEX IF NOT EXISTS idx_workflow_executions_org_date
ON org_workflow_executions(organization_id, executed_at DESC);

-- Add index for compliance score queries
CREATE INDEX IF NOT EXISTS idx_control_evaluations_org_score
ON org_control_evaluations(organization_id, compliance_score DESC);

-- Add index for evidence expiry checks
CREATE INDEX IF NOT EXISTS idx_evidence_created_verified
ON org_evidence(organization_id, created_at)
WHERE verification_status = 'verified' AND renewal_task_created = FALSE;

-- Add index for policy review checks
CREATE INDEX IF NOT EXISTS idx_policies_last_updated
ON org_policies(organization_id, last_updated_at)
WHERE status IN ('published', 'approved') AND review_task_created = FALSE;

-- Add index for overdue task checks
CREATE INDEX IF NOT EXISTS idx_tasks_overdue
ON org_tasks(organization_id, due_date)
WHERE status = 'pending' AND escalation_sent = FALSE;

-- Create notification types enum if not exists
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'POLICY_CREATED',
    'POLICY_UPDATED',
    'POLICY_REVIEW_DUE',
    'EVIDENCE_LINKED',
    'EVIDENCE_EXPIRED',
    'TASK_CREATED',
    'TASK_COMPLETED',
    'TASK_RECURRING',
    'TASK_OVERDUE',
    'TASK_OVERDUE_ESCALATED',
    'TASK_GATE_BLOCKED',
    'SECURITY_ALERT',
    'CONTROL_FAILED',
    'CONTROL_INCOMPLETE',
    'RISK_SCORE_CHANGE',
    'CERTIFICATION_EXPIRING',
    'ONBOARDING_STARTED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Update org_notifications table to use enum if column exists
-- (This is safe if type column doesn't exist or already uses enum)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'org_notifications'
    AND column_name = 'type'
    AND data_type = 'text'
  ) THEN
    ALTER TABLE org_notifications
    ALTER COLUMN type TYPE notification_type USING type::notification_type;
  END IF;
END $$;

-- Add compliance score details JSONB column if not exists
ALTER TABLE org_control_evaluations
ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;

-- Update RLS policies for workflow executions to use organization_id
DROP POLICY IF EXISTS "Users can view workflow executions for their org" ON org_workflow_executions;
CREATE POLICY "Users can view workflow executions for their org"
  ON org_workflow_executions
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM org_members
      WHERE user_id = auth.uid()
    )
  );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON org_workflow_executions TO authenticated;
GRANT SELECT ON org_workflows TO authenticated;

-- Add helpful comments
COMMENT ON COLUMN org_evidence.renewal_task_created IS 'Tracks if a renewal task has been automatically created for expiring evidence';
COMMENT ON COLUMN org_policies.review_task_created IS 'Tracks if a review task has been automatically created for policy review cycle';
COMMENT ON COLUMN org_tasks.escalation_sent IS 'Tracks if overdue notification/escalation has been sent';
COMMENT ON COLUMN org_certifications.renewal_task_created IS 'Tracks if a renewal task has been automatically created for expiring certification';
COMMENT ON COLUMN org_control_evaluations.details IS 'Detailed compliance score breakdown including risk level, individual scores, and metrics';

-- Create function to reset automation tracking flags (for manual re-triggering)
CREATE OR REPLACE FUNCTION reset_automation_flags(entity_type TEXT, entity_id UUID)
RETURNS VOID AS $$
BEGIN
  CASE entity_type
    WHEN 'evidence' THEN
      UPDATE org_evidence SET renewal_task_created = FALSE WHERE id = entity_id;
    WHEN 'policy' THEN
      UPDATE org_policies SET review_task_created = FALSE WHERE id = entity_id;
    WHEN 'task' THEN
      UPDATE org_tasks SET escalation_sent = FALSE WHERE id = entity_id;
    WHEN 'certification' THEN
      UPDATE org_certifications SET renewal_task_created = FALSE WHERE id = entity_id;
    ELSE
      RAISE EXCEPTION 'Invalid entity type: %', entity_type;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on function
GRANT EXECUTE ON FUNCTION reset_automation_flags TO authenticated;
