-- Document Retention: Policies, Legal Holds, Lifecycle Logging
-- Migration: 20260403_document_retention.sql

-- Retention policies per document category
CREATE TABLE IF NOT EXISTS retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  document_category TEXT NOT NULL, -- evidence, policy, incident_report, care_plan, audit_log, general
  retention_period_days INTEGER NOT NULL,
  action_on_expiry TEXT NOT NULL DEFAULT 'archive' CHECK (action_on_expiry IN ('archive', 'delete', 'review')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_retention_policies_org ON retention_policies(org_id);

-- Legal holds that freeze document deletion
CREATE TABLE IF NOT EXISTS legal_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'released')),
  created_by UUID NOT NULL,
  released_by UUID,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_legal_holds_org ON legal_holds(org_id);

-- Documents under legal hold
CREATE TABLE IF NOT EXISTS legal_hold_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  legal_hold_id UUID NOT NULL REFERENCES legal_holds(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- evidence, policy, incident_report, etc.
  document_id UUID NOT NULL,
  added_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(legal_hold_id, document_id)
);
CREATE INDEX IF NOT EXISTS idx_lhd_hold ON legal_hold_documents(legal_hold_id);

-- Lifecycle audit log for document actions
CREATE TABLE IF NOT EXISTS document_lifecycle_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_id UUID NOT NULL,
  action TEXT NOT NULL, -- created, updated, archived, deleted, hold_applied, hold_released, retention_extended
  performed_by UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_doc_lifecycle_org ON document_lifecycle_log(org_id);
CREATE INDEX IF NOT EXISTS idx_doc_lifecycle_doc ON document_lifecycle_log(document_id);

-- RLS
ALTER TABLE retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_hold_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_lifecycle_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
DROP POLICY IF EXISTS "retention_policies_org" ON retention_policies;
CREATE POLICY "retention_policies_org" ON retention_policies FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "legal_holds_org" ON legal_holds;
CREATE POLICY "legal_holds_org" ON legal_holds FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "legal_hold_docs_org" ON legal_hold_documents;
CREATE POLICY "legal_hold_docs_org" ON legal_hold_documents FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "doc_lifecycle_org" ON document_lifecycle_log;
CREATE POLICY "doc_lifecycle_org" ON document_lifecycle_log FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
END $$;
