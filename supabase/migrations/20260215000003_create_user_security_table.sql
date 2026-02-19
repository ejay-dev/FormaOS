-- Create user_security table for MFA and security settings
-- This table stores per-user security configuration including 2FA secrets

CREATE TABLE IF NOT EXISTS public.user_security (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Two-factor authentication
  two_factor_enabled BOOLEAN DEFAULT FALSE NOT NULL,
  two_factor_secret TEXT, -- TODO: Encrypt this value at rest
  two_factor_enabled_at TIMESTAMPTZ,
  backup_codes TEXT[], -- Stored as hashed values using PBKDF2
  
  -- SSO configuration
  sso_enabled BOOLEAN DEFAULT FALSE,
  sso_provider TEXT,
  
  -- Session security
  session_timeout INTEGER DEFAULT 60, -- minutes
  ip_whitelist TEXT[],
  
  -- Password policy
  require_strong_password BOOLEAN DEFAULT TRUE,
  password_expiry_days INTEGER,
  last_password_change TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_security ENABLE ROW LEVEL SECURITY;

-- Users can only read and update their own security settings
CREATE POLICY "Users can view own security settings"
  ON public.user_security
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own security settings"
  ON public.user_security
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own security settings"
  ON public.user_security
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Service role can manage all settings (for admin operations)
CREATE POLICY "Service role can manage all security settings"
  ON public.user_security
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_security_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_security_updated_at
  BEFORE UPDATE ON public.user_security
  FOR EACH ROW
  EXECUTE FUNCTION update_user_security_updated_at();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_security_user_id ON public.user_security(user_id);
CREATE INDEX IF NOT EXISTS idx_user_security_two_factor_enabled ON public.user_security(user_id, two_factor_enabled)
  WHERE two_factor_enabled = TRUE;

-- Add comments
COMMENT ON TABLE public.user_security IS 'Per-user security configuration including MFA, SSO, and session settings';
COMMENT ON COLUMN public.user_security.two_factor_secret IS 'TOTP secret - TODO: Encrypt at rest';
COMMENT ON COLUMN public.user_security.backup_codes IS 'Hashed backup codes using PBKDF2';
