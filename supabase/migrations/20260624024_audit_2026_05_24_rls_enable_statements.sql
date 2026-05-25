-- Audit 2026-05-24 — make the static RLS scanner happy.
--
-- The live `pg_tables.rowsecurity` flag confirms RLS is enabled on all 16
-- tables the static scanner flagged in the 2026-05-24 audit. The scanner
-- (scripts/check-supabase-rls-contracts.mjs) finds RLS by grepping for
-- `ALTER TABLE … ENABLE ROW LEVEL SECURITY` in migration files; these
-- tables had RLS enabled outside of a tracked migration (likely an early
-- Supabase dashboard action), so the static scan kept failing.
--
-- This migration adds idempotent ALTER TABLE statements so the migration
-- history matches the live database state and the static scanner stops
-- producing false-positive failures.

ALTER TABLE public.api_alert_config       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_scans       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_preferences      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_metadata          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_responses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_compliance_status  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_generations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_templates       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_analyses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_tasks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_configs        ENABLE ROW LEVEL SECURITY;
