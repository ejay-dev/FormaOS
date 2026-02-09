-- Security Hardening Migration
-- Fixes overly permissive RLS policies

-- =========================================================
-- Fix enterprise_export_jobs service role policy
-- Restrict service role updates to org-scoped operations
-- =========================================================

DROP POLICY IF EXISTS "enterprise_export_service_update" ON public.enterprise_export_jobs;
CREATE POLICY "enterprise_export_service_update" ON public.enterprise_export_jobs
  FOR UPDATE
  USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.organization_id = enterprise_export_jobs.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.organization_id = enterprise_export_jobs.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

-- =========================================================
-- Add audit logging for sensitive operations
-- =========================================================

-- Security audit log table
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  organization_id uuid REFERENCES public.organizations(id),
  ip_address inet,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Index for querying
CREATE INDEX IF NOT EXISTS security_audit_log_org_idx 
  ON public.security_audit_log(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS security_audit_log_user_idx 
  ON public.security_audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS security_audit_log_type_idx 
  ON public.security_audit_log(event_type, created_at DESC);

-- RLS for security audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only org owners and admins can read audit logs
CREATE POLICY "security_audit_log_select" ON public.security_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members om
      WHERE om.organization_id = security_audit_log.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
    OR auth.role() = 'service_role'
  );

-- Only service role can insert (via backend)
CREATE POLICY "security_audit_log_insert" ON public.security_audit_log
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- =========================================================
-- Session security: Add session tracking
-- =========================================================

CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token_hash text NOT NULL,
  ip_address inet,
  user_agent text,
  device_fingerprint text,
  last_active_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_sessions_user_idx 
  ON public.user_sessions(user_id, expires_at);
CREATE INDEX IF NOT EXISTS user_sessions_token_hash_idx 
  ON public.user_sessions(session_token_hash);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY "user_sessions_select" ON public.user_sessions
  FOR SELECT
  USING (user_id = auth.uid() OR auth.role() = 'service_role');

-- Service role manages sessions
CREATE POLICY "user_sessions_manage" ON public.user_sessions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =========================================================
-- MFA enforcement tracking
-- =========================================================

-- Add mfa_enforced column to org_members for role-based MFA
ALTER TABLE public.org_members 
ADD COLUMN IF NOT EXISTS mfa_required boolean DEFAULT false;

-- Update MFA requirement for privileged roles
UPDATE public.org_members 
SET mfa_required = true 
WHERE role IN ('owner', 'admin', 'OWNER', 'COMPLIANCE_OFFICER', 'MANAGER');

-- Add trigger to auto-set mfa_required on role change
CREATE OR REPLACE FUNCTION public.set_mfa_required_on_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IN ('owner', 'admin', 'OWNER', 'COMPLIANCE_OFFICER', 'MANAGER') THEN
    NEW.mfa_required := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_mfa_required ON public.org_members;
CREATE TRIGGER trigger_set_mfa_required
  BEFORE INSERT OR UPDATE OF role ON public.org_members
  FOR EACH ROW
  EXECUTE FUNCTION public.set_mfa_required_on_role();

-- =========================================================
-- Password history for preventing reuse
-- =========================================================

CREATE TABLE IF NOT EXISTS public.password_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS password_history_user_idx 
  ON public.password_history(user_id, created_at DESC);

ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;

-- Only service role can access password history
CREATE POLICY "password_history_service" ON public.password_history
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =========================================================
-- API rate limit tracking (persistent)
-- =========================================================

CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL, -- user_id, ip, api_key
  endpoint text NOT NULL,
  request_count integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  blocked_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rate_limit_log_identifier_idx 
  ON public.rate_limit_log(identifier, endpoint, window_start);

-- Cleanup old rate limit logs (keep 7 days)
CREATE INDEX IF NOT EXISTS rate_limit_log_created_idx 
  ON public.rate_limit_log(created_at);

ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;

-- Only service role can access rate limit log
CREATE POLICY "rate_limit_log_service" ON public.rate_limit_log
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
