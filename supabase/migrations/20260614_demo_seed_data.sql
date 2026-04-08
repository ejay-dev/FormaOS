-- Demo mode seed data support
-- Adds is_demo flag to org_tasks and org_policies
-- Adds demo_data_active flag to organizations

-- 1. Add is_demo to org_tasks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'org_tasks' AND column_name = 'is_demo'
  ) THEN
    ALTER TABLE org_tasks ADD COLUMN is_demo boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- 2. Add is_demo to org_policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'org_policies' AND column_name = 'is_demo'
  ) THEN
    ALTER TABLE org_policies ADD COLUMN is_demo boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- 3. Add demo_data_active to organizations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'demo_data_active'
  ) THEN
    ALTER TABLE organizations ADD COLUMN demo_data_active boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- 4. Create index for efficient demo data cleanup
CREATE INDEX IF NOT EXISTS idx_org_tasks_is_demo
  ON org_tasks (organization_id) WHERE is_demo = true;

CREATE INDEX IF NOT EXISTS idx_org_policies_is_demo
  ON org_policies (organization_id) WHERE is_demo = true;
