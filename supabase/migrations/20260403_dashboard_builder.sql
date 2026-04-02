-- Dashboard Builder: Layouts, Widgets, User Dashboard Configs
-- Migration: 20260403_dashboard_builder.sql

-- User-specific dashboard layouts
CREATE TABLE IF NOT EXISTS dashboard_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Dashboard',
  is_default BOOLEAN NOT NULL DEFAULT false,
  widgets JSONB NOT NULL DEFAULT '[]', -- [{widgetKey, x, y, w, h, config}]
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_user ON dashboard_layouts(user_id, org_id);

-- Widget registry (available widgets)
CREATE TABLE IF NOT EXISTS dashboard_widget_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- compliance, tasks, analytics, care, incidents, admin
  min_width INTEGER NOT NULL DEFAULT 1,
  min_height INTEGER NOT NULL DEFAULT 1,
  default_width INTEGER NOT NULL DEFAULT 2,
  default_height INTEGER NOT NULL DEFAULT 2,
  required_plan TEXT DEFAULT 'starter', -- starter, pro, enterprise
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed built-in widgets
INSERT INTO dashboard_widget_registry (widget_key, name, description, category, min_width, min_height, default_width, default_height, required_plan) VALUES
  ('compliance_score', 'Compliance Score', 'Overall compliance posture gauge', 'compliance', 1, 1, 2, 2, 'starter'),
  ('framework_progress', 'Framework Progress', 'Progress bars per active framework', 'compliance', 2, 1, 3, 2, 'starter'),
  ('control_status', 'Control Status', 'Breakdown of control statuses', 'compliance', 1, 1, 2, 2, 'starter'),
  ('evidence_freshness', 'Evidence Freshness', 'Stale vs fresh evidence breakdown', 'compliance', 1, 1, 2, 2, 'starter'),
  ('task_summary', 'Task Summary', 'Task breakdown by status', 'tasks', 1, 1, 2, 2, 'starter'),
  ('overdue_tasks', 'Overdue Tasks', 'List of overdue and at-risk tasks', 'tasks', 2, 1, 3, 2, 'starter'),
  ('my_tasks', 'My Tasks', 'Tasks assigned to current user', 'tasks', 2, 1, 3, 3, 'starter'),
  ('incidents_open', 'Open Incidents', 'Active incident summary', 'incidents', 1, 1, 2, 2, 'starter'),
  ('care_plan_status', 'Care Plan Status', 'Care plan progress overview', 'care', 2, 1, 3, 2, 'pro'),
  ('recent_activity', 'Recent Activity', 'Latest org-wide activity feed', 'analytics', 2, 2, 3, 3, 'starter'),
  ('team_activity', 'Team Activity', 'Activity heatmap by team member', 'analytics', 2, 1, 3, 2, 'pro'),
  ('churn_risk', 'Churn Risk', 'Organization churn risk indicator', 'admin', 1, 1, 2, 2, 'enterprise'),
  ('trial_funnel', 'Trial Funnel', 'Trial conversion pipeline', 'admin', 2, 2, 3, 3, 'enterprise'),
  ('policy_compliance', 'Policy Compliance', 'Policy acknowledgment rates', 'compliance', 2, 1, 3, 2, 'pro'),
  ('upcoming_reviews', 'Upcoming Reviews', 'Policies and controls due for review', 'compliance', 2, 1, 3, 2, 'starter')
ON CONFLICT (widget_key) DO NOTHING;

-- RLS
ALTER TABLE dashboard_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widget_registry ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
DROP POLICY IF EXISTS "dashboard_layouts_owner" ON dashboard_layouts;
CREATE POLICY "dashboard_layouts_owner" ON dashboard_layouts FOR ALL
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "widget_registry_read" ON dashboard_widget_registry;
CREATE POLICY "widget_registry_read" ON dashboard_widget_registry FOR SELECT
  USING (true); -- All authenticated users can read the registry
END $$;
