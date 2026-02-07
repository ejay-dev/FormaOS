-- =========================================================
-- CARE OPERATIONS MODULES
-- Staff Credentials, Visits/Service Delivery, Enhanced Incidents
-- =========================================================

-- =========================================================
-- 1. STAFF CREDENTIALS / COMPLIANCE TRACKING
-- =========================================================
-- Track staff qualifications, checks, and expiry dates

CREATE TABLE IF NOT EXISTS public.org_staff_credentials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Credential details
    credential_type text NOT NULL, -- 'wwcc', 'police_check', 'ndis_screening', 'first_aid', 'cpr', 'manual_handling', 'medication_cert', 'drivers_license', 'vaccination', 'other'
    credential_name text NOT NULL,
    credential_number text,
    issuing_authority text,

    -- Dates
    issue_date date,
    expiry_date date,
    verified_at timestamptz,
    verified_by uuid REFERENCES auth.users(id),

    -- Status
    status text NOT NULL DEFAULT 'pending', -- 'pending', 'verified', 'expired', 'expiring_soon'

    -- Attachments
    document_url text,
    notes text,

    -- Metadata
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),

    UNIQUE(organization_id, user_id, credential_type, credential_number)
);

-- Indexes for staff credentials
CREATE INDEX IF NOT EXISTS idx_staff_credentials_org ON public.org_staff_credentials(organization_id);
CREATE INDEX IF NOT EXISTS idx_staff_credentials_user ON public.org_staff_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_credentials_expiry ON public.org_staff_credentials(expiry_date);
CREATE INDEX IF NOT EXISTS idx_staff_credentials_status ON public.org_staff_credentials(organization_id, status);

-- RLS for staff credentials
ALTER TABLE public.org_staff_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_credentials_org_isolation" ON public.org_staff_credentials
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM public.org_members WHERE user_id = auth.uid()
        )
    );

-- =========================================================
-- 2. VISITS / SERVICE DELIVERY LOGS
-- =========================================================
-- More comprehensive than org_shifts for service delivery tracking

CREATE TABLE IF NOT EXISTS public.org_visits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Linked entities
    client_id uuid REFERENCES public.org_patients(id) ON DELETE SET NULL,
    staff_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Visit details
    visit_type text NOT NULL DEFAULT 'service', -- 'service', 'assessment', 'review', 'support', 'transport', 'community', 'other'
    service_category text, -- 'personal_care', 'domestic', 'community_access', 'therapy', 'nursing', 'respite', etc.

    -- Scheduling
    scheduled_start timestamptz NOT NULL,
    scheduled_end timestamptz,
    actual_start timestamptz,
    actual_end timestamptz,

    -- Status
    status text NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled', 'missed', 'rescheduled'
    cancellation_reason text,

    -- Notes and outcomes
    notes text,
    outcomes text,
    goals_worked_on text[], -- Array of goal IDs or descriptions

    -- Billing/funding (optional)
    billable boolean DEFAULT true,
    funding_source text, -- 'ndis', 'chsp', 'private', 'other'
    service_code text,

    -- Location
    location_type text, -- 'client_home', 'facility', 'community', 'telehealth'
    address text,

    -- Metadata
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- Indexes for visits
CREATE INDEX IF NOT EXISTS idx_visits_org ON public.org_visits(organization_id);
CREATE INDEX IF NOT EXISTS idx_visits_client ON public.org_visits(client_id);
CREATE INDEX IF NOT EXISTS idx_visits_staff ON public.org_visits(staff_id);
CREATE INDEX IF NOT EXISTS idx_visits_scheduled ON public.org_visits(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_visits_status ON public.org_visits(organization_id, status);

-- RLS for visits
ALTER TABLE public.org_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "visits_org_isolation" ON public.org_visits
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM public.org_members WHERE user_id = auth.uid()
        )
    );

-- =========================================================
-- 3. ENHANCED INCIDENTS (extend existing org_incidents)
-- =========================================================
-- Add columns to support incident workflow and follow-up

ALTER TABLE public.org_incidents
    ADD COLUMN IF NOT EXISTS incident_type text DEFAULT 'general', -- 'injury', 'medication_error', 'behavioral', 'abuse', 'neglect', 'property', 'complaint', 'near_miss', 'other'
    ADD COLUMN IF NOT EXISTS location text,
    ADD COLUMN IF NOT EXISTS witnesses text[],
    ADD COLUMN IF NOT EXISTS immediate_actions text,
    ADD COLUMN IF NOT EXISTS notifications_sent text[], -- ['ndis_commission', 'police', 'family', 'management']
    ADD COLUMN IF NOT EXISTS follow_up_required boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS follow_up_due_date date,
    ADD COLUMN IF NOT EXISTS follow_up_completed_at timestamptz,
    ADD COLUMN IF NOT EXISTS root_cause text,
    ADD COLUMN IF NOT EXISTS preventive_measures text,
    ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- =========================================================
-- 4. CARE PLANS (basic structure)
-- =========================================================

CREATE TABLE IF NOT EXISTS public.org_care_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES public.org_patients(id) ON DELETE CASCADE,

    -- Plan details
    plan_type text NOT NULL DEFAULT 'support', -- 'support', 'ndis', 'chsp', 'clinical', 'behavioral'
    title text NOT NULL,
    description text,

    -- Dates
    start_date date NOT NULL,
    end_date date,
    review_date date,

    -- Status
    status text NOT NULL DEFAULT 'active', -- 'draft', 'active', 'under_review', 'expired', 'archived'

    -- Content (flexible JSON for different plan types)
    goals jsonb DEFAULT '[]'::jsonb, -- Array of goals with progress
    supports jsonb DEFAULT '[]'::jsonb, -- Array of support items

    -- Approvals
    approved_by uuid REFERENCES auth.users(id),
    approved_at timestamptz,
    client_consented boolean DEFAULT false,
    consent_date date,

    -- Metadata
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- Indexes for care plans
CREATE INDEX IF NOT EXISTS idx_care_plans_org ON public.org_care_plans(organization_id);
CREATE INDEX IF NOT EXISTS idx_care_plans_client ON public.org_care_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_care_plans_status ON public.org_care_plans(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_care_plans_review ON public.org_care_plans(review_date);

-- RLS for care plans
ALTER TABLE public.org_care_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "care_plans_org_isolation" ON public.org_care_plans
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM public.org_members WHERE user_id = auth.uid()
        )
    );

-- =========================================================
-- 5. ENHANCED PATIENTS/PARTICIPANTS
-- =========================================================
-- Add fields for NDIS/Healthcare specific data

ALTER TABLE public.org_patients
    ADD COLUMN IF NOT EXISTS preferred_name text,
    ADD COLUMN IF NOT EXISTS gender text,
    ADD COLUMN IF NOT EXISTS phone text,
    ADD COLUMN IF NOT EXISTS email text,
    ADD COLUMN IF NOT EXISTS address text,
    ADD COLUMN IF NOT EXISTS emergency_contact_name text,
    ADD COLUMN IF NOT EXISTS emergency_contact_phone text,
    ADD COLUMN IF NOT EXISTS emergency_contact_relationship text,
    ADD COLUMN IF NOT EXISTS primary_diagnosis text,
    ADD COLUMN IF NOT EXISTS ndis_number text,
    ADD COLUMN IF NOT EXISTS funding_type text, -- 'ndis', 'chsp', 'private', 'dva', 'other'
    ADD COLUMN IF NOT EXISTS plan_start_date date,
    ADD COLUMN IF NOT EXISTS plan_end_date date,
    ADD COLUMN IF NOT EXISTS primary_staff_id uuid REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS service_types text[], -- Array of service types client receives
    ADD COLUMN IF NOT EXISTS communication_needs text,
    ADD COLUMN IF NOT EXISTS cultural_considerations text,
    ADD COLUMN IF NOT EXISTS allergies text[],
    ADD COLUMN IF NOT EXISTS medications_summary text;

-- =========================================================
-- 6. TRIGGER FOR UPDATED_AT
-- =========================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_staff_credentials_updated_at ON public.org_staff_credentials;
CREATE TRIGGER update_staff_credentials_updated_at
    BEFORE UPDATE ON public.org_staff_credentials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_visits_updated_at ON public.org_visits;
CREATE TRIGGER update_visits_updated_at
    BEFORE UPDATE ON public.org_visits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_care_plans_updated_at ON public.org_care_plans;
CREATE TRIGGER update_care_plans_updated_at
    BEFORE UPDATE ON public.org_care_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_incidents_updated_at ON public.org_incidents;
CREATE TRIGGER update_incidents_updated_at
    BEFORE UPDATE ON public.org_incidents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
