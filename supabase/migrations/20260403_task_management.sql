-- Task Management: dependencies, recurrence, comments, time tracking

-- 1. Task dependencies
CREATE TABLE IF NOT EXISTS task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL,
  depends_on_task_id UUID NOT NULL,
  dependency_type TEXT NOT NULL DEFAULT 'blocks' CHECK (dependency_type IN ('blocks', 'related')),
  UNIQUE(task_id, depends_on_task_id)
);

-- 2. Recurring tasks
CREATE TABLE IF NOT EXISTS task_recurrence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  template_task_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annual')),
  day_of_week INT,
  day_of_month INT,
  assignee_id UUID,
  priority TEXT DEFAULT 'medium',
  labels TEXT[] DEFAULT '{}',
  next_due TIMESTAMPTZ NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Task comments
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL,
  user_id UUID NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- 4. Time tracking
CREATE TABLE IF NOT EXISTS task_time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL,
  user_id UUID NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_minutes INT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_task_deps_task ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_deps_depends ON task_dependencies(depends_on_task_id);
CREATE INDEX IF NOT EXISTS idx_task_recurrence_org ON task_recurrence(org_id, active);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id, created_at);
CREATE INDEX IF NOT EXISTS idx_task_time_task ON task_time_entries(task_id);

-- RLS
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_recurrence ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_time_entries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "task_deps_org_access" ON task_dependencies;
  CREATE POLICY "task_deps_org_access" ON task_dependencies FOR ALL USING (
    task_id IN (SELECT id FROM org_tasks WHERE organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid()))
  );
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "task_recurrence_org_access" ON task_recurrence;
  CREATE POLICY "task_recurrence_org_access" ON task_recurrence FOR ALL USING (
    org_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
  );
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "task_comments_org_access" ON task_comments;
  CREATE POLICY "task_comments_org_access" ON task_comments FOR ALL USING (
    task_id IN (SELECT id FROM org_tasks WHERE organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid()))
  );
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "task_time_org_access" ON task_time_entries;
  CREATE POLICY "task_time_org_access" ON task_time_entries FOR ALL USING (
    task_id IN (SELECT id FROM org_tasks WHERE organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid()))
  );
END $$;
