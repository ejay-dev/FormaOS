-- Audit Trail Enhanced: Tamper-proof logging, hash chains, exports
-- Migration: 20260403_audit_trail_enhanced.sql

-- Add hash chain columns to existing audit_log table (or create if not exists)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_org ON audit_log(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_type, resource_id);

-- Hash chain for tamper detection
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS entry_hash TEXT;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS prev_hash TEXT;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS sequence_number BIGINT;

-- Audit export jobs
CREATE TABLE IF NOT EXISTS audit_export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  filters JSONB DEFAULT '{}',
  file_url TEXT,
  file_size_bytes BIGINT,
  created_by UUID NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_exports_org ON audit_export_jobs(org_id);

-- Audit retention configuration per org
CREATE TABLE IF NOT EXISTS audit_retention_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  retention_days INTEGER NOT NULL DEFAULT 365,
  archive_after_days INTEGER DEFAULT 730,
  immutable_period_days INTEGER NOT NULL DEFAULT 90, -- Cannot delete within this window
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_export_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_retention_config ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
DROP POLICY IF EXISTS "audit_log_org" ON audit_log;
CREATE POLICY "audit_log_org" ON audit_log FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
-- Audit logs are insert-only from service role; users can only read

DROP POLICY IF EXISTS "audit_exports_org" ON audit_export_jobs;
CREATE POLICY "audit_exports_org" ON audit_export_jobs FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "audit_retention_org" ON audit_retention_config;
CREATE POLICY "audit_retention_org" ON audit_retention_config FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
END $$;
