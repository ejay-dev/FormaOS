-- Security Monitoring & Live Activity Tables
-- Enterprise-grade security event logging, alerts, session tracking, and user activity

-- ============================================================================
-- 1. SECURITY_EVENTS: Comprehensive security event logging
-- ============================================================================

-- Drop and recreate to ensure clean state
DROP TABLE IF EXISTS public.security_events CASCADE;

CREATE TABLE public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Organization context (nullable for pre-auth events)
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Event classification
  type TEXT NOT NULL CHECK (type IN (
    'login_success', 'login_failure', 'login_mfa_required',
    'logout', 'session_expired', 'token_refresh',
    'password_change', 'email_change', 'mfa_enabled', 'mfa_disabled',
    'brute_force_detected', 'impossible_travel', 'new_device_login',
    'token_anomaly', 'fingerprint_mismatch', 'rate_limit_exceeded',
    'privilege_escalation_attempt', 'unauthorized_access_attempt',
    'admin_access', 'export_requested', 'bulk_delete',
    'suspicious_api_pattern', 'session_revoked'
  )),
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical')),
  
  -- Request context
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  
  -- Geo context (nullable, best-effort)
  geo_country TEXT,
  geo_region TEXT,
  geo_city TEXT,
  
  -- Request details
  request_path TEXT,
  request_method TEXT,
  status_code INTEGER,
  
  -- Additional metadata (detection rules output, error messages, etc.)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Length checks (anonymous constraints to avoid naming conflicts)
  CHECK (char_length(type) <= 100),
  CHECK (char_length(severity) <= 20)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_org_id ON public.security_events(org_id) WHERE org_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_security_events_type ON public.security_events(type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON public.security_events(ip_address) WHERE ip_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_security_events_high_severity ON public.security_events(severity, created_at DESC) 
  WHERE severity IN ('high', 'critical');

-- ============================================================================
-- 2. SECURITY_ALERTS: Actionable alerts from security events
-- ============================================================================

DROP TABLE IF EXISTS public.security_alerts CASCADE;

CREATE TABLE public.security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Link to originating event
  event_id UUID NOT NULL REFERENCES public.security_events(id) ON DELETE CASCADE,
  
  -- Alert lifecycle
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'false_positive')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Resolution tracking
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  
  -- Additional context
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_security_alerts_status ON public.security_alerts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_alerts_event_id ON public.security_alerts(event_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_security_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS security_alerts_updated_at ON public.security_alerts;
CREATE TRIGGER security_alerts_updated_at
  BEFORE UPDATE ON public.security_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_security_alerts_updated_at();

-- ============================================================================
-- 3. ACTIVE_SESSIONS: Real-time session tracking
-- ============================================================================

DROP TABLE IF EXISTS public.active_sessions CASCADE;

CREATE TABLE public.active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE, -- Supabase session ID
  
  -- User context
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Session lifecycle
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  
  -- Session context
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  
  -- Geo context (at session creation)
  geo_country TEXT,
  geo_region TEXT,
  geo_city TEXT,
  
  -- Metadata (device, browser, OS parsed from UA)
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON public.active_sessions(user_id, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_active_sessions_org_id ON public.active_sessions(org_id) WHERE org_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_active_sessions_last_seen ON public.active_sessions(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_active_sessions_active ON public.active_sessions(user_id, revoked_at) 
  WHERE revoked_at IS NULL;

-- ============================================================================
-- 4. USER_ACTIVITY: High-level user action tracking
-- ============================================================================

DROP TABLE IF EXISTS public.user_activity CASCADE;

CREATE TABLE public.user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- User context
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Activity details
  action TEXT NOT NULL, -- e.g., 'page_view', 'export', 'role_change', 'invite_sent', 'delete'
  entity_type TEXT, -- e.g., 'user', 'organization', 'control', 'framework'
  entity_id TEXT, -- ID of the entity acted upon
  route TEXT, -- URL path
  
  -- Additional context
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Length check (anonymous constraint)
  CHECK (char_length(action) <= 100)
);

CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON public.user_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_org_id ON public.user_activity(org_id) WHERE org_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_activity_action ON public.user_activity(action);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- SECURITY_EVENTS: Service role only (authorization handled in API layer)
DROP POLICY IF EXISTS security_events_service_role ON public.security_events;
CREATE POLICY security_events_service_role ON public.security_events
  AS RESTRICTIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS security_events_block_users ON public.security_events;
CREATE POLICY security_events_block_users ON public.security_events
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

-- SECURITY_ALERTS: Service role only (authorization handled in API layer)
DROP POLICY IF EXISTS security_alerts_service_role ON public.security_alerts;
CREATE POLICY security_alerts_service_role ON public.security_alerts
  AS RESTRICTIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS security_alerts_block_users ON public.security_alerts;
CREATE POLICY security_alerts_block_users ON public.security_alerts
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

-- ACTIVE_SESSIONS: Users can read their own sessions, service role for all
DROP POLICY IF EXISTS active_sessions_user_read ON public.active_sessions;
CREATE POLICY active_sessions_user_read ON public.active_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS active_sessions_service_role ON public.active_sessions;
CREATE POLICY active_sessions_service_role ON public.active_sessions
  AS RESTRICTIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS active_sessions_block_anon ON public.active_sessions;
CREATE POLICY active_sessions_block_anon ON public.active_sessions
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- USER_ACTIVITY: Users can read their own activity, service role for all
DROP POLICY IF EXISTS user_activity_user_read ON public.user_activity;
CREATE POLICY user_activity_user_read ON public.user_activity
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_activity_service_role ON public.user_activity;
CREATE POLICY user_activity_service_role ON public.user_activity
  AS RESTRICTIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS user_activity_block_anon ON public.user_activity;
CREATE POLICY user_activity_block_anon ON public.user_activity
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- ============================================================================
-- 6. DATA RETENTION: Auto-cleanup old events (90 days)
-- ============================================================================

-- Function to clean up old security data
CREATE OR REPLACE FUNCTION cleanup_old_security_data()
RETURNS void AS $$
BEGIN
  -- Delete old security events (and cascade to alerts)
  DELETE FROM public.security_events
  WHERE created_at < now() - INTERVAL '90 days';
  
  -- Delete old user activity
  DELETE FROM public.user_activity
  WHERE created_at < now() - INTERVAL '90 days';
  
  -- Delete old revoked sessions
  DELETE FROM public.active_sessions
  WHERE revoked_at IS NOT NULL
    AND revoked_at < now() - INTERVAL '30 days';
    
  -- Delete stale sessions (not seen in 7 days)
  DELETE FROM public.active_sessions
  WHERE revoked_at IS NULL
    AND last_seen_at < now() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION cleanup_old_security_data() TO service_role;

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- Function to create a security alert from an event
CREATE OR REPLACE FUNCTION create_security_alert(
  p_event_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_alert_id UUID;
BEGIN
  INSERT INTO public.security_alerts (event_id, notes)
  VALUES (p_event_id, p_notes)
  RETURNING id INTO v_alert_id;
  
  RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_security_alert(UUID, TEXT) TO service_role;

-- Function to update session heartbeat
CREATE OR REPLACE FUNCTION update_session_heartbeat(
  p_session_id TEXT,
  p_user_id UUID
)
RETURNS void AS $$
BEGIN
  UPDATE public.active_sessions
  SET last_seen_at = now()
  WHERE session_id = p_session_id
    AND user_id = p_user_id
    AND revoked_at IS NULL;
    
  -- If no rows updated, insert new session
  IF NOT FOUND THEN
    INSERT INTO public.active_sessions (session_id, user_id)
    VALUES (p_session_id, p_user_id)
    ON CONFLICT (session_id) DO UPDATE
    SET last_seen_at = now();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_session_heartbeat(TEXT, UUID) TO authenticated;

-- ============================================================================
-- DEPLOYMENT NOTE
-- ============================================================================
-- This migration creates:
-- - Security event logging (security_events)
-- - Alert management (security_alerts) 
-- - Session tracking (active_sessions)
-- - User activity logs (user_activity)
-- - RLS policies (founder-only access)
-- - Data retention helpers (90-day auto-cleanup)
--
-- Next steps:
-- 1. Deploy detection rules in application layer
-- 2. Wire up real-time subscriptions in admin dashboard
-- 3. Implement session heartbeat in client app
-- 4. Schedule cleanup_old_security_data() via cron
