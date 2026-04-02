-- Prompt 13: Investigation, CAPA, and Regulatory Notification tables
-- Depends on: org_incidents existing table

-- Investigation management
CREATE TABLE IF NOT EXISTS org_investigations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  incident_id UUID NOT NULL REFERENCES org_incidents(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned','in_progress','findings_ready','review','closed')),
  lead_investigator_id UUID REFERENCES profiles(id),
  team_member_ids JSONB DEFAULT '[]',
  assigned_at TIMESTAMPTZ DEFAULT now(),
  due_date DATE,
  findings TEXT,
  root_cause TEXT,
  contributing_factors JSONB DEFAULT '[]',
  methodology TEXT CHECK (methodology IN ('5_whys','fishbone','timeline_analysis','barrier_analysis')),
  evidence_ids JSONB DEFAULT '[]',
  interviews JSONB DEFAULT '[]',
  recommendations TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_investigations_org ON org_investigations(organization_id);
CREATE INDEX idx_investigations_incident ON org_investigations(incident_id);
CREATE INDEX idx_investigations_status ON org_investigations(status);

ALTER TABLE org_investigations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_investigations_org_isolation" ON org_investigations
  USING (organization_id IN (SELECT organization_id FROM org_memberships WHERE user_id = auth.uid()));

-- CAPA (Corrective and Preventive Action) items
CREATE TABLE IF NOT EXISTS org_capa_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  incident_id UUID REFERENCES org_incidents(id) ON DELETE SET NULL,
  investigation_id UUID REFERENCES org_investigations(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('corrective','preventive')),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES profiles(id),
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','implemented','verified','closed')),
  verification_method TEXT,
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  effectiveness_check_date DATE,
  effectiveness_status TEXT DEFAULT 'pending' CHECK (effectiveness_status IN ('pending','effective','ineffective','needs_revision')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical','high','medium','low')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_capa_org ON org_capa_items(organization_id);
CREATE INDEX idx_capa_status ON org_capa_items(status);
CREATE INDEX idx_capa_incident ON org_capa_items(incident_id);
CREATE INDEX idx_capa_assigned ON org_capa_items(assigned_to);

ALTER TABLE org_capa_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_capa_items_org_isolation" ON org_capa_items
  USING (organization_id IN (SELECT organization_id FROM org_memberships WHERE user_id = auth.uid()));

-- Regulatory notifications (NDIS SIRS, etc.)
CREATE TABLE IF NOT EXISTS org_regulatory_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  incident_id UUID NOT NULL REFERENCES org_incidents(id) ON DELETE CASCADE,
  regulation TEXT NOT NULL CHECK (regulation IN ('ndis_sirs','state_health','aged_care_quality','workplace_safety','custom')),
  notification_type TEXT NOT NULL CHECK (notification_type IN ('immediate','5_day','final')),
  due_date DATE NOT NULL,
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES profiles(id),
  reference_number TEXT,
  status TEXT NOT NULL DEFAULT 'required' CHECK (status IN ('required','draft','submitted','acknowledged','overdue')),
  body_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reg_notifications_org ON org_regulatory_notifications(organization_id);
CREATE INDEX idx_reg_notifications_incident ON org_regulatory_notifications(incident_id);
CREATE INDEX idx_reg_notifications_status ON org_regulatory_notifications(status);

ALTER TABLE org_regulatory_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_regulatory_notifications_org_isolation" ON org_regulatory_notifications
  USING (organization_id IN (SELECT organization_id FROM org_memberships WHERE user_id = auth.uid()));
