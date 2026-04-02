-- Care Goals & Goal Progress Tracking
-- Migration: 20260402_care_goals.sql

-- Goals linked to care plans
CREATE TABLE IF NOT EXISTS org_care_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  care_plan_id UUID NOT NULL REFERENCES org_care_plans(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES org_patients(id) ON DELETE SET NULL,
  goal_text TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'independence'
    CHECK (category IN ('daily_living','social','health','employment','education','community','independence','safety')),
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started','in_progress','achieved','partially_achieved','discontinued')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  measurement_method TEXT,
  baseline_value TEXT,
  target_value TEXT,
  current_value TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Goal progress entries
CREATE TABLE IF NOT EXISTS org_goal_progress_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES org_care_goals(id) ON DELETE CASCADE,
  org_id UUID NOT NULL,
  recorded_by UUID,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  value TEXT,
  notes TEXT,
  evidence_ids JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Visit enhancements
ALTER TABLE org_visits ADD COLUMN IF NOT EXISTS recurrence_rule JSONB;
ALTER TABLE org_visits ADD COLUMN IF NOT EXISTS recurrence_parent_id UUID REFERENCES org_visits(id);
ALTER TABLE org_visits ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE org_visits ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE org_visits ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE org_visits ADD COLUMN IF NOT EXISTS actual_start_time TIMESTAMPTZ;
ALTER TABLE org_visits ADD COLUMN IF NOT EXISTS actual_end_time TIMESTAMPTZ;
ALTER TABLE org_visits ADD COLUMN IF NOT EXISTS travel_time_minutes INTEGER;

-- Medication tracking
CREATE TABLE IF NOT EXISTS org_medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES org_patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  route TEXT DEFAULT 'oral'
    CHECK (route IN ('oral','topical','injection','inhaled','sublingual','other')),
  prescribed_by TEXT,
  start_date DATE,
  end_date DATE,
  instructions TEXT,
  precautions TEXT,
  is_prn BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','completed','discontinued','on_hold')),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS org_medication_administrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES org_medications(id) ON DELETE CASCADE,
  org_id UUID NOT NULL,
  participant_id UUID NOT NULL,
  administered_by UUID,
  administered_at TIMESTAMPTZ DEFAULT now(),
  dose_given TEXT,
  status TEXT NOT NULL DEFAULT 'given'
    CHECK (status IN ('given','withheld','refused','self_administered')),
  notes TEXT,
  witness_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- NDIS Claiming
CREATE TABLE IF NOT EXISTS org_ndis_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES org_patients(id) ON DELETE CASCADE,
  visit_id UUID REFERENCES org_visits(id),
  care_plan_id UUID REFERENCES org_care_plans(id),
  support_category TEXT NOT NULL CHECK (support_category IN ('core','capacity_building','capital')),
  support_item_number TEXT NOT NULL,
  support_item_name TEXT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  total_amount NUMERIC(10,2) NOT NULL,
  claim_type TEXT NOT NULL DEFAULT 'standard'
    CHECK (claim_type IN ('standard','cancellation','travel','non_face_to_face')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','ready','submitted','paid','rejected')),
  claimed_at TIMESTAMPTZ,
  payment_reference TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS org_ndis_price_guide (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  effective_date DATE NOT NULL,
  support_item_number TEXT NOT NULL,
  support_item_name TEXT NOT NULL,
  unit TEXT,
  price_national NUMERIC(10,2),
  price_remote NUMERIC(10,2),
  price_very_remote NUMERIC(10,2),
  category TEXT,
  registration_group TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_care_goals_plan ON org_care_goals(care_plan_id);
CREATE INDEX IF NOT EXISTS idx_care_goals_participant ON org_care_goals(participant_id);
CREATE INDEX IF NOT EXISTS idx_care_goals_status ON org_care_goals(status);
CREATE INDEX IF NOT EXISTS idx_goal_progress_goal ON org_goal_progress_entries(goal_id);
CREATE INDEX IF NOT EXISTS idx_medications_participant ON org_medications(participant_id, status);
CREATE INDEX IF NOT EXISTS idx_med_admin_time ON org_medication_administrations(medication_id, administered_at);
CREATE INDEX IF NOT EXISTS idx_ndis_line_items_org ON org_ndis_line_items(org_id, status);
CREATE INDEX IF NOT EXISTS idx_ndis_line_items_participant ON org_ndis_line_items(participant_id);
CREATE INDEX IF NOT EXISTS idx_visits_worker_date ON org_visits(assigned_to, scheduled_date);

-- RLS
ALTER TABLE org_care_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_goal_progress_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_medication_administrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_ndis_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_ndis_price_guide ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_care_goals_org_isolation" ON org_care_goals
  FOR ALL USING (org_id = (current_setting('app.current_org_id', true))::uuid);

CREATE POLICY "org_goal_progress_org_isolation" ON org_goal_progress_entries
  FOR ALL USING (org_id = (current_setting('app.current_org_id', true))::uuid);

CREATE POLICY "org_medications_org_isolation" ON org_medications
  FOR ALL USING (org_id = (current_setting('app.current_org_id', true))::uuid);

CREATE POLICY "org_med_admin_org_isolation" ON org_medication_administrations
  FOR ALL USING (org_id = (current_setting('app.current_org_id', true))::uuid);

CREATE POLICY "org_ndis_line_items_org_isolation" ON org_ndis_line_items
  FOR ALL USING (org_id = (current_setting('app.current_org_id', true))::uuid);

CREATE POLICY "org_ndis_price_guide_read" ON org_ndis_price_guide
  FOR SELECT USING (true);

-- Auto-update timestamps
CREATE TRIGGER care_goals_updated_at
  BEFORE UPDATE ON org_care_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER medications_updated_at
  BEFORE UPDATE ON org_medications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
