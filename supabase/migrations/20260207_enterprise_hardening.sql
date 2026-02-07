-- =========================================================
-- Enterprise Hardening Database Migration
-- =========================================================
-- Tables for billing reconciliation and enterprise export jobs

-- =========================================================
-- Billing Reconciliation Log
-- =========================================================
-- Tracks discrepancies found between local and Stripe data
CREATE TABLE IF NOT EXISTS public.billing_reconciliation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  checked_at timestamptz DEFAULT now(),
  discrepancy_type text NOT NULL,
  local_value jsonb,
  stripe_value jsonb,
  auto_fixed boolean DEFAULT false,
  fixed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Index for querying by org and date
CREATE INDEX IF NOT EXISTS idx_billing_reconciliation_org
  ON billing_reconciliation_log(organization_id, checked_at DESC);

-- Index for unfixed discrepancies
CREATE INDEX IF NOT EXISTS idx_billing_reconciliation_unfixed
  ON billing_reconciliation_log(auto_fixed)
  WHERE auto_fixed = false;

-- RLS for billing_reconciliation_log (admin only)
ALTER TABLE public.billing_reconciliation_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "billing_reconciliation_admin" ON public.billing_reconciliation_log;
CREATE POLICY "billing_reconciliation_admin" ON public.billing_reconciliation_log
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.organization_id = billing_reconciliation_log.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'owner'
    )
  );

-- =========================================================
-- Enterprise Export Jobs
-- =========================================================
-- Tracks full organization data export jobs
CREATE TABLE IF NOT EXISTS public.enterprise_export_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  progress integer DEFAULT 0,
  options jsonb NOT NULL DEFAULT '{}',
  file_url text,
  file_size bigint,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  CONSTRAINT valid_progress CHECK (progress >= 0 AND progress <= 100)
);

-- Index for querying by org
CREATE INDEX IF NOT EXISTS idx_enterprise_export_org
  ON enterprise_export_jobs(organization_id, created_at DESC);

-- Index for pending/processing jobs
CREATE INDEX IF NOT EXISTS idx_enterprise_export_active
  ON enterprise_export_jobs(status)
  WHERE status IN ('pending', 'processing');

-- RLS for enterprise_export_jobs (owner only)
ALTER TABLE public.enterprise_export_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "enterprise_export_owner_select" ON public.enterprise_export_jobs;
CREATE POLICY "enterprise_export_owner_select" ON public.enterprise_export_jobs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.organization_id = enterprise_export_jobs.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'owner'
    )
  );

DROP POLICY IF EXISTS "enterprise_export_owner_insert" ON public.enterprise_export_jobs;
CREATE POLICY "enterprise_export_owner_insert" ON public.enterprise_export_jobs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.organization_id = enterprise_export_jobs.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'owner'
    )
  );

-- Service role can update (for background processing)
DROP POLICY IF EXISTS "enterprise_export_service_update" ON public.enterprise_export_jobs;
CREATE POLICY "enterprise_export_service_update" ON public.enterprise_export_jobs
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- =========================================================
-- Add payment_failures column to org_subscriptions if not exists
-- =========================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'org_subscriptions'
    AND column_name = 'payment_failures'
  ) THEN
    ALTER TABLE org_subscriptions ADD COLUMN payment_failures integer DEFAULT 0;
  END IF;
END $$;

-- Add grace_period_end column for payment failure handling
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'org_subscriptions'
    AND column_name = 'grace_period_end'
  ) THEN
    ALTER TABLE org_subscriptions ADD COLUMN grace_period_end timestamptz;
  END IF;
END $$;

-- =========================================================
-- Comments for documentation
-- =========================================================
COMMENT ON TABLE billing_reconciliation_log IS
  'Tracks discrepancies found between local subscription state and Stripe';

COMMENT ON TABLE enterprise_export_jobs IS
  'Tracks full organization data export jobs for enterprise portability';

COMMENT ON COLUMN billing_reconciliation_log.discrepancy_type IS
  'Type: status_mismatch, plan_mismatch, period_end_mismatch, missing_stripe_subscription, orphaned_local_subscription, entitlement_drift';

COMMENT ON COLUMN enterprise_export_jobs.options IS
  'Export options: includeCompliance, includeEvidence, includeAuditLogs, includeCareOps, includeTeam';
