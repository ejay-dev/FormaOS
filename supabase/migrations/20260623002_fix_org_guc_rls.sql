-- =========================================================
-- Blocker 3 — Replace unset-GUC RLS with org_members join
-- =========================================================
-- 14 policies across 4 migrations relied on
--     current_setting('app.current_org_id', true)::uuid
-- but no production code path ever calls
--     set_config('app.current_org_id', ...)
-- — so the GUC defaulted to NULL and the comparisons evaluated to
-- NULL, which RLS treats as "deny". Effectively these tables were
-- closed to authenticated users (only the service role could see
-- rows) and the org-isolation guarantees were illusory.
--
-- This migration:
--   1. Drops the 14 broken policies.
--   2. Recreates symmetrical policies (select / insert with check /
--      update using+with check / delete using) using the canonical
--      `org_id in (select organization_id from org_members where
--      user_id = auth.uid())` pattern that the rest of the codebase
--      already uses (see migrations 20260115, 20260206, etc.).
--
-- Invariants preserved:
--   - Service role still bypasses RLS for cross-org admin/audit
--     paths.
--   - Anonymous (logged-out) requests see zero rows.
--   - A logged-in user sees only rows where they have an
--     `org_members` membership matching `org_id`.
-- =========================================================

-- Helper function: apply the four symmetrical org_members policies.
-- Defined locally so the body is reviewable in one place; dropped
-- at the end of the migration to avoid leaking helper functions.
create or replace function _fos_b3_apply_org_member_policies(
  _table text,
  _org_col text default 'org_id'
) returns void as $$
declare
  _q text;
begin
  -- Drop the new symmetrical policy names if a re-run lands on a DB
  -- that has already had this migration applied (idempotency).
  execute format('drop policy if exists %I on %I',
                 _table || '_select', _table);
  execute format('drop policy if exists %I on %I',
                 _table || '_insert', _table);
  execute format('drop policy if exists %I on %I',
                 _table || '_update', _table);
  execute format('drop policy if exists %I on %I',
                 _table || '_delete', _table);

  _q := format(
    '%I in (select organization_id from org_members where user_id = auth.uid())',
    _org_col);

  execute format(
    'create policy %I on %I for select to authenticated using (%s)',
    _table || '_select', _table, _q);
  execute format(
    'create policy %I on %I for insert to authenticated with check (%s)',
    _table || '_insert', _table, _q);
  execute format(
    'create policy %I on %I for update to authenticated using (%s) with check (%s)',
    _table || '_update', _table, _q, _q);
  execute format(
    'create policy %I on %I for delete to authenticated using (%s)',
    _table || '_delete', _table, _q);
end;
$$ language plpgsql;

-- ---------------------------------------------------------
-- 20260402_auditor_portal.sql
-- ---------------------------------------------------------
drop policy if exists "auditor_tokens_org" on auditor_access_tokens;
drop policy if exists "auditor_activity_org" on auditor_activity_log;
select _fos_b3_apply_org_member_policies('auditor_access_tokens');
select _fos_b3_apply_org_member_policies('auditor_activity_log');

-- ---------------------------------------------------------
-- 20260402_search_index.sql
-- ---------------------------------------------------------
drop policy if exists "search_index_org" on search_index;
drop policy if exists "search_history_org" on search_history;
drop policy if exists "saved_searches_org" on saved_searches;
drop policy if exists "recent_items_org" on recent_items;
select _fos_b3_apply_org_member_policies('search_index');
select _fos_b3_apply_org_member_policies('search_history');
select _fos_b3_apply_org_member_policies('saved_searches');
select _fos_b3_apply_org_member_policies('recent_items');

-- ---------------------------------------------------------
-- 20260402_care_goals.sql
-- ---------------------------------------------------------
drop policy if exists "org_care_goals_org_isolation" on org_care_goals;
drop policy if exists "org_goal_progress_org_isolation"
  on org_goal_progress_entries;
drop policy if exists "org_medications_org_isolation" on org_medications;
drop policy if exists "org_med_admin_org_isolation"
  on org_medication_administrations;
drop policy if exists "org_ndis_line_items_org_isolation"
  on org_ndis_line_items;
select _fos_b3_apply_org_member_policies('org_care_goals');
select _fos_b3_apply_org_member_policies('org_goal_progress_entries');
select _fos_b3_apply_org_member_policies('org_medications');
select _fos_b3_apply_org_member_policies('org_medication_administrations');
select _fos_b3_apply_org_member_policies('org_ndis_line_items');

-- ---------------------------------------------------------
-- 20260402_analytics_snapshots.sql
-- ---------------------------------------------------------
drop policy if exists "snapshots_org_isolation" on org_analytics_snapshots;
drop policy if exists "saved_reports_org_isolation" on org_saved_reports;
drop policy if exists "report_generations_org_isolation"
  on org_report_generations;
select _fos_b3_apply_org_member_policies('org_analytics_snapshots');
select _fos_b3_apply_org_member_policies('org_saved_reports');
select _fos_b3_apply_org_member_policies('org_report_generations');

-- ---------------------------------------------------------
-- Cleanup
-- ---------------------------------------------------------
drop function _fos_b3_apply_org_member_policies(text, text);
