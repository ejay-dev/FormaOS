-- Schema-drift resolution: forward-apply the columns + tables that the
-- 2026-05-22 audit's database-017 finding showed as missing in prod
-- despite having (apparently-failed) migration files already in the repo.
-- Verified missing in prod via Group 6 SQL pass before writing this file.
--
-- Items added here (all are forward-only, idempotent):
--   * user_profiles.plain_english_mode boolean DEFAULT true
--     (migration 20260615_add_plain_english_mode.sql in repo never landed)
--   * org_tasks.completed_at timestamptz
--     (referenced by /api/v1/compliance/summary and audit cron)
--   * org_policies.required boolean DEFAULT false
--     (referenced by control-evaluations action)
--   * public.api_keys + public.api_key_usage_log + RLS policies
--     (migration 20260315_api_keys.sql in repo never landed; lib/api-keys/
--     manager.ts code is dark on prod without these)
--
-- NOT included (need design judgement):
--   * notification_preferences.channel — the existing prod schema is a
--     single-row-per-user table with boolean flags; the older migration
--     20260315_notifications.sql declares a many-row-per-user normalised
--     table with a `channel` enum. Picking which is canonical needs a
--     product call; tracked as a follow-up.
--   * compliance_frameworks.title vs name, org_tasks.due_at vs due_date,
--     org_registers.organization_id vs org_id, org_frameworks.id,
--     integration_configs.provider, integration_sync_log.provider,
--     org_subscriptions.id — these are code-vs-schema renames, fixed in
--     a separate code PR rather than adding shadow columns.

BEGIN;

-- 1. user_profiles.plain_english_mode
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS plain_english_mode boolean NOT NULL DEFAULT true;

-- 2. org_tasks.completed_at — already has due_date; add completed_at so
-- queries like `select id, completed_at from org_tasks where status='completed'`
-- work. Code already populates this column where present.
ALTER TABLE public.org_tasks
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- 3. org_policies.required
ALTER TABLE public.org_policies
  ADD COLUMN IF NOT EXISTS required boolean NOT NULL DEFAULT false;

-- 4. public.api_keys + api_key_usage_log — replay of migration 20260315
-- which never reached prod. Body copied verbatim, IF NOT EXISTS guards.
CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  prefix text NOT NULL,
  scopes text[] NOT NULL DEFAULT '{}',
  rate_limit integer NOT NULL DEFAULT 120,
  last_used timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.api_key_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id uuid NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  scope text,
  method text NOT NULL,
  path text NOT NULL,
  status_code integer NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_org_id   ON public.api_keys(org_id);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_log_api_key_id
  ON public.api_key_usage_log(api_key_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_log_org_id
  ON public.api_key_usage_log(org_id, created_at DESC);

ALTER TABLE public.api_keys           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_key_usage_log  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "api_keys_org_members_select" ON public.api_keys;
CREATE POLICY "api_keys_org_members_select"
  ON public.api_keys
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.organization_id = api_keys.org_id
        AND om.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "api_keys_org_admins_manage" ON public.api_keys;
CREATE POLICY "api_keys_org_admins_manage"
  ON public.api_keys
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.organization_id = api_keys.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.organization_id = api_keys.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "api_key_usage_log_org_members_select" ON public.api_key_usage_log;
CREATE POLICY "api_key_usage_log_org_members_select"
  ON public.api_key_usage_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.organization_id = api_key_usage_log.org_id
        AND om.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "api_key_usage_log_service_insert" ON public.api_key_usage_log;
CREATE POLICY "api_key_usage_log_service_insert"
  ON public.api_key_usage_log
  FOR INSERT
  WITH CHECK (true);

COMMIT;
