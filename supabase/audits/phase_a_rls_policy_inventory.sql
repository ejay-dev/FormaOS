-- Phase A (read-only): RLS policy inventory
-- Safe to run in Supabase SQL editor. Contains SELECTs only.

-- 1) Public tables with RLS enabled and policy count
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  COUNT(p.polname) AS policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policy p ON p.polrelid = c.oid
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
GROUP BY n.nspname, c.relname, c.relrowsecurity
ORDER BY c.relrowsecurity DESC, c.relname;

-- 2) Full policy list with operation and role scope
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
ORDER BY tablename, policyname;

-- 3) RLS-enabled tables that currently have zero policies
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policy p ON p.polrelid = c.oid
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity = true
GROUP BY n.nspname, c.relname
HAVING COUNT(p.polname) = 0
ORDER BY c.relname;
