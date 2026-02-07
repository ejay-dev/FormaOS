-- =========================================================
-- ENTERPRISE UPGRADE MIGRATION
-- Customer Health Scores, Compliance Deadlines, Trial Engagement
-- =========================================================

-- =========================================================
-- 1. CUSTOMER HEALTH SCORES
-- Cached health scores recalculated daily for org analytics
-- =========================================================

CREATE TABLE IF NOT EXISTS public.org_health_scores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Health metrics
    score integer NOT NULL CHECK (score >= 0 AND score <= 100),
    status text NOT NULL CHECK (status IN ('healthy', 'warning', 'at_risk', 'critical')),

    -- Detailed factor breakdown (JSON for flexibility)
    factors jsonb NOT NULL DEFAULT '{
        "login_frequency": {"score": 0, "max": 25, "description": ""},
        "feature_adoption": {"score": 0, "max": 25, "description": ""},
        "compliance_trend": {"score": 0, "max": 25, "description": ""},
        "automation_usage": {"score": 0, "max": 15, "description": ""},
        "overdue_penalty": {"score": 0, "max": 10, "description": ""}
    }'::jsonb,

    -- Alerts and recommendations
    alerts jsonb NOT NULL DEFAULT '[]'::jsonb,
    recommended_actions jsonb NOT NULL DEFAULT '[]'::jsonb,

    -- Activity tracking
    last_login_at timestamptz,
    features_used text[] DEFAULT '{}',

    -- Timestamps
    calculated_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    UNIQUE(organization_id)
);

-- Indexes for health scores
CREATE INDEX IF NOT EXISTS idx_health_scores_status ON public.org_health_scores(status);
CREATE INDEX IF NOT EXISTS idx_health_scores_score ON public.org_health_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_health_scores_calculated ON public.org_health_scores(calculated_at);

-- RLS for health scores
ALTER TABLE public.org_health_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "health_scores_org_isolation" ON public.org_health_scores
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM public.org_members WHERE user_id = auth.uid()
        )
    );

-- =========================================================
-- 2. COMPLIANCE DEADLINES
-- Track upcoming audit dates, renewals, reviews
-- =========================================================

CREATE TABLE IF NOT EXISTS public.org_compliance_deadlines (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Deadline details
    title text NOT NULL,
    description text,
    framework_slug text, -- Optional link to framework

    -- Dates
    due_date date NOT NULL,
    reminder_date date, -- When to start reminding

    -- Classification
    deadline_type text NOT NULL CHECK (deadline_type IN ('audit', 'renewal', 'review', 'submission', 'certification', 'other')),
    priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'due_soon', 'overdue', 'completed', 'cancelled')),

    -- Ownership
    assigned_to uuid REFERENCES auth.users(id),
    completed_by uuid REFERENCES auth.users(id),
    completed_at timestamptz,

    -- Notes
    notes text,

    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- Indexes for deadlines
CREATE INDEX IF NOT EXISTS idx_deadlines_org ON public.org_compliance_deadlines(organization_id);
CREATE INDEX IF NOT EXISTS idx_deadlines_due ON public.org_compliance_deadlines(due_date);
CREATE INDEX IF NOT EXISTS idx_deadlines_org_due ON public.org_compliance_deadlines(organization_id, due_date);
CREATE INDEX IF NOT EXISTS idx_deadlines_status ON public.org_compliance_deadlines(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_deadlines_framework ON public.org_compliance_deadlines(framework_slug) WHERE framework_slug IS NOT NULL;

-- RLS for deadlines
ALTER TABLE public.org_compliance_deadlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deadlines_org_isolation" ON public.org_compliance_deadlines
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM public.org_members WHERE user_id = auth.uid()
        )
    );

-- =========================================================
-- 3. TRIAL ENGAGEMENT TRACKING
-- Track reminder emails sent and engagement state
-- =========================================================

CREATE TABLE IF NOT EXISTS public.org_trial_engagement (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Reminder tracking
    reminder_7day_sent boolean NOT NULL DEFAULT false,
    reminder_7day_sent_at timestamptz,
    reminder_3day_sent boolean NOT NULL DEFAULT false,
    reminder_3day_sent_at timestamptz,
    reminder_1day_sent boolean NOT NULL DEFAULT false,
    reminder_1day_sent_at timestamptz,

    -- Value recap
    value_recap_sent boolean NOT NULL DEFAULT false,
    value_recap_sent_at timestamptz,

    -- Engagement metrics (snapshot at trial end)
    trial_value_metrics jsonb DEFAULT '{
        "tasks_completed": 0,
        "evidence_uploaded": 0,
        "policies_created": 0,
        "team_members_added": 0,
        "frameworks_enabled": 0,
        "compliance_score_improvement": 0
    }'::jsonb,

    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    UNIQUE(organization_id)
);

-- Indexes for trial engagement
CREATE INDEX IF NOT EXISTS idx_trial_engagement_org ON public.org_trial_engagement(organization_id);

-- RLS for trial engagement
ALTER TABLE public.org_trial_engagement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trial_engagement_org_isolation" ON public.org_trial_engagement
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM public.org_members WHERE user_id = auth.uid()
        )
    );

-- =========================================================
-- 4. TRIGGERS FOR UPDATED_AT
-- =========================================================

-- Health scores trigger
DROP TRIGGER IF EXISTS update_health_scores_updated_at ON public.org_health_scores;
CREATE TRIGGER update_health_scores_updated_at
    BEFORE UPDATE ON public.org_health_scores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Deadlines trigger
DROP TRIGGER IF EXISTS update_deadlines_updated_at ON public.org_compliance_deadlines;
CREATE TRIGGER update_deadlines_updated_at
    BEFORE UPDATE ON public.org_compliance_deadlines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trial engagement trigger
DROP TRIGGER IF EXISTS update_trial_engagement_updated_at ON public.org_trial_engagement;
CREATE TRIGGER update_trial_engagement_updated_at
    BEFORE UPDATE ON public.org_trial_engagement
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- 5. COMMENTS FOR DOCUMENTATION
-- =========================================================

COMMENT ON TABLE public.org_health_scores IS 'Customer health scores for retention analytics - recalculated daily';
COMMENT ON TABLE public.org_compliance_deadlines IS 'Upcoming compliance deadlines including audits, renewals, and reviews';
COMMENT ON TABLE public.org_trial_engagement IS 'Trial engagement tracking for reminder emails and value metrics';

COMMENT ON COLUMN public.org_health_scores.status IS 'Health status: healthy (>=75), warning (>=50), at_risk (>=25), critical (<25)';
COMMENT ON COLUMN public.org_health_scores.factors IS 'Breakdown of health score factors with individual scores';
COMMENT ON COLUMN public.org_compliance_deadlines.deadline_type IS 'Type: audit, renewal, review, submission, certification, other';
COMMENT ON COLUMN public.org_trial_engagement.trial_value_metrics IS 'Snapshot of value delivered during trial period';
