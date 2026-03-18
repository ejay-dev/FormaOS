-- Phase A (read-only): weak policy pattern scan
-- Safe to run in Supabase SQL editor. Contains SELECTs only.

-- 1) Policies matching broad authenticated-access patterns
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    COALESCE(qual, '') ILIKE '%auth.uid() IS NOT NULL%'
    OR COALESCE(with_check, '') ILIKE '%auth.uid() IS NOT NULL%'
    OR COALESCE(qual, '') ILIKE '%TO authenticated%'
    OR COALESCE(with_check, '') ILIKE '%TO authenticated%'
  )
ORDER BY tablename, policyname;

-- 2) Candidate tenant tables with broad SELECT policy and organization_id column
WITH broad_select_policies AS (
  SELECT
    p.schemaname,
    p.tablename,
    p.policyname,
    p.qual
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND p.cmd IN ('SELECT', 'ALL')
    AND COALESCE(p.qual, '') ILIKE '%auth.uid() IS NOT NULL%'
),
org_tables AS (
  SELECT table_schema AS schemaname, table_name AS tablename
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND column_name = 'organization_id'
)
SELECT
  b.schemaname,
  b.tablename,
  b.policyname,
  b.qual
FROM broad_select_policies b
JOIN org_tables o
  ON o.schemaname = b.schemaname
 AND o.tablename = b.tablename
ORDER BY b.tablename, b.policyname;

-- 3) Quick per-table policy summary for review
SELECT
  tablename,
  COUNT(*) AS policy_count,
  SUM(CASE WHEN cmd IN ('SELECT', 'ALL') THEN 1 ELSE 0 END) AS read_policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
