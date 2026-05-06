-- =============================================================
-- Migration 007: Employee Onboarding Tracking
-- =============================================================
--
-- Adds employee_onboarded_at to org_members so we have a
-- server-side record of when each invited staff member
-- completed the onboarding wizard.
--
-- Auth user_metadata (employee_onboarded: true) acts as the
-- fast-path check on page load; this column is the durable
-- audit record.
-- =============================================================

ALTER TABLE org_members
  ADD COLUMN IF NOT EXISTS employee_onboarded_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN org_members.employee_onboarded_at IS
  'Timestamp of when this member completed the employee onboarding wizard. NULL means not yet completed.';

-- Index speeds up "has this user completed onboarding?" query
CREATE INDEX IF NOT EXISTS idx_org_members_employee_onboarded_at
  ON org_members (user_id, employee_onboarded_at)
  WHERE employee_onboarded_at IS NOT NULL;
