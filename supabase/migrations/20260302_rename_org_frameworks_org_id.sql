-- ==========================================================================
-- Rename org_frameworks.org_id → organization_id
-- ==========================================================================
-- Aligns org_frameworks with the rest of the schema where all tables
-- use organization_id as the FK column name.
-- ==========================================================================

-- 1. Rename the column
ALTER TABLE public.org_frameworks
  RENAME COLUMN org_id TO organization_id;

-- 2. Recreate the primary key constraint (column is part of PK)
ALTER TABLE public.org_frameworks
  DROP CONSTRAINT IF EXISTS org_frameworks_pkey;
ALTER TABLE public.org_frameworks
  ADD PRIMARY KEY (organization_id, framework_slug);

-- 3. Recreate index with new column name
DROP INDEX IF EXISTS org_frameworks_org_id_idx;
CREATE INDEX IF NOT EXISTS idx_org_frameworks_organization_id
  ON public.org_frameworks (organization_id);

-- 4. Update RLS policies to use new column name
DROP POLICY IF EXISTS "org_frameworks_select" ON public.org_frameworks;
CREATE POLICY "org_frameworks_select"
  ON public.org_frameworks
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.org_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "org_frameworks_manage" ON public.org_frameworks;
CREATE POLICY "org_frameworks_manage"
  ON public.org_frameworks
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.org_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM public.org_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );
