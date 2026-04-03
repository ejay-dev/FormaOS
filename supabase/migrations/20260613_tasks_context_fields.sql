-- ==========================================================================
-- Migration: Add compliance context fields to org_tasks
--
-- Adds framework_slug and control_ref so tasks can be linked back to
-- the compliance framework and specific control that generated them.
-- Both columns are optional (nullable) to preserve backwards compatibility.
-- ==========================================================================

ALTER TABLE public.org_tasks
  ADD COLUMN IF NOT EXISTS framework_slug text,
  ADD COLUMN IF NOT EXISTS control_ref    text;

COMMENT ON COLUMN public.org_tasks.framework_slug IS
  'Slug of the compliance framework this task belongs to (e.g. "soc2", "iso27001").';

COMMENT ON COLUMN public.org_tasks.control_ref IS
  'Specific control identifier within the framework (e.g. "CC6.1", "A.9.1.1").';

-- Index for filtering tasks by framework
CREATE INDEX IF NOT EXISTS idx_org_tasks_framework_slug
  ON public.org_tasks (organization_id, framework_slug)
  WHERE framework_slug IS NOT NULL;
