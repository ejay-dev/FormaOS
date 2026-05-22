-- Customer Success Metrics Tracking
-- Track key onboarding milestone timestamps for customer success analysis

-- Add customer success milestone columns to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS first_evidence_upload_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS first_task_completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS first_compliance_score_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS first_report_generated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS first_team_invite_at TIMESTAMP WITH TIME ZONE;

-- Add comments for documentation
COMMENT ON COLUMN organizations.first_evidence_upload_at IS 'Timestamp when the organization uploaded their first evidence document';
COMMENT ON COLUMN organizations.first_task_completed_at IS 'Timestamp when the organization completed their first compliance task';
COMMENT ON COLUMN organizations.first_compliance_score_at IS 'Timestamp when the organization received their first compliance score';
COMMENT ON COLUMN organizations.first_report_generated_at IS 'Timestamp when the organization generated their first compliance report';
COMMENT ON COLUMN organizations.first_team_invite_at IS 'Timestamp when the organization sent their first team invitation';

-- Create function to update first_evidence_upload_at
CREATE OR REPLACE FUNCTION update_first_evidence_upload()
RETURNS TRIGGER AS $$
BEGIN
  -- Fail-safe: log metrics but never block user actions
  BEGIN
    UPDATE organizations
    SET first_evidence_upload_at = NOW()
    WHERE id = NEW.organization_id
      AND first_evidence_upload_at IS NULL;
  EXCEPTION WHEN OTHERS THEN
    -- Silent fail: metrics are nice-to-have, not critical
    RAISE WARNING 'Failed to record first evidence upload metric: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update first_task_completed_at
CREATE OR REPLACE FUNCTION update_first_task_completed()
RETURNS TRIGGER AS $$
BEGIN
  -- Fail-safe: log metrics but never block user actions
  BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
      UPDATE organizations
      SET first_task_completed_at = NOW()
      WHERE id = NEW.organization_id
        AND first_task_completed_at IS NULL;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to record first task completion metric: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update first_report_generated_at
CREATE OR REPLACE FUNCTION update_first_report_generated()
RETURNS TRIGGER AS $$
BEGIN
  -- Fail-safe: log metrics but never block user actions
  BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
      UPDATE organizations
      SET first_report_generated_at = NOW()
      WHERE id = NEW.organization_id
        AND first_report_generated_at IS NULL;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to record first report generation metric: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update first_team_invite_at
CREATE OR REPLACE FUNCTION update_first_team_invite()
RETURNS TRIGGER AS $$
DECLARE
  org_id UUID;
BEGIN
  -- Fail-safe: log metrics but never block user actions
  BEGIN
    SELECT organization_id INTO org_id
    FROM org_members
    WHERE user_id = (SELECT invited_by FROM team_invitations WHERE id = NEW.id);

    IF org_id IS NOT NULL THEN
      UPDATE organizations
      SET first_team_invite_at = NOW()
      WHERE id = org_id
        AND first_team_invite_at IS NULL;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to record first team invite metric: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_first_evidence_upload ON evidence;
CREATE TRIGGER trigger_first_evidence_upload
  AFTER INSERT ON evidence
  FOR EACH ROW
  EXECUTE FUNCTION update_first_evidence_upload();

DROP TRIGGER IF EXISTS trigger_first_task_completed ON tasks;
CREATE TRIGGER trigger_first_task_completed
  AFTER INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_first_task_completed();

DROP TRIGGER IF EXISTS trigger_first_report_generated ON automation_runs;
CREATE TRIGGER trigger_first_report_generated
  AFTER INSERT OR UPDATE ON automation_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_first_report_generated();

DROP TRIGGER IF EXISTS trigger_first_team_invite ON team_invitations;
CREATE TRIGGER trigger_first_team_invite
  AFTER INSERT ON team_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_first_team_invite();
