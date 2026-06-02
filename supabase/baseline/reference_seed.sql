-- =====================================================================
-- FormaOS — reference / catalog seed for fresh environments
-- =====================================================================
-- Global, non-tenant reference data captured from prod (2026-06-02).
-- Contains NO tenant rows and NO PII — only product catalog config that a
-- fresh DB needs to be functional (plans, modules). Pair this with
-- prod_schema_baseline.sql via scripts/provision-local-db.sh.
--
-- Idempotent (ON CONFLICT DO NOTHING) so it is safe to re-run.
--
-- NOTE: the larger compliance/care/RBAC catalogs (compliance_controls,
-- framework_controls, care_*_templates, rbac_*) are NOT included here — see
-- docs/operations/db-baseline-and-provisioning.md for how to extend the seed
-- safely (explicit per-table data dump, never a blanket --exclude).
-- =====================================================================

-- billing_plans (org_subscriptions.plan_code FK target)
INSERT INTO public.billing_plans (code, name, price_cents, interval, max_users, features, is_active) VALUES
  ('free',    'Free',    0,     'month', 5,    '{"modules":["compliance","crm"],"storage_gb":1}'::jsonb, true),
  ('starter', 'Starter', 9900,  'month', 25,   '{"modules":["compliance","crm","documents","reporting"],"storage_gb":10}'::jsonb, true),
  ('pro',     'Pro',     24900, 'month', NULL, '{"modules":["compliance","crm","documents","reporting","rostering","service_delivery","billing"],"storage_gb":100}'::jsonb, true)
ON CONFLICT (code) DO NOTHING;

-- plans (newer plan catalog used by entitlements / pricing)
INSERT INTO public.plans (id, key, name, price_cents, currency, features, created_at) VALUES
  ('2e15a15d-0651-4b7b-9746-62a6b284fd0f', 'basic',      'Starter',    15900, 'aud', '["Core compliance engine","Tasks and evidence management","Audit logs","Standard reporting"]'::jsonb, '2026-01-10T04:28:35.973338+00:00'),
  ('ad0e3d87-405d-42a2-a8e6-cd01479f0526', 'pro',        'Pro',        23900, 'aud', '["Everything in Starter","Advanced reporting","Governance controls","Operational dashboards","Workflow automation"]'::jsonb, '2026-01-10T04:28:35.973338+00:00'),
  ('ce48a857-d6ce-4b8d-95d0-a0b135857f50', 'enterprise', 'Enterprise', NULL,  'aud', '["White-glove onboarding","Custom compliance frameworks","Org-wide deployment","Dedicated support"]'::jsonb, '2026-01-10T04:28:35.973338+00:00'),
  ('0d549574-0e51-4050-aa5f-5d59d36d15fd', 'starter',    'Starter',    39900, 'usd', '{"reports":true,"team_limit":15,"audit_export":true,"framework_evaluations":true}'::jsonb, '2026-03-31T05:25:08.625414+00:00')
ON CONFLICT (id) DO NOTHING;

-- app_modules (module registry)
INSERT INTO public.app_modules (code, name, description, is_active) VALUES
  ('admin',            'Admin',            'Users, roles, org settings.', true),
  ('billing',          'Billing',          'Invoices, claims exports, payment tracking.', true),
  ('compliance',       'Compliance',       'Policies, registers, audits, tasks, incidents, complaints.', true),
  ('crm',              'Client CRM',       'Clients/participants, contacts, notes, documents.', true),
  ('documents',        'Documents',        'File storage, templates, e-sign workflows (later).', true),
  ('reporting',        'Reporting',        'Dashboards, KPIs, exports.', true),
  ('rostering',        'Rostering',        'Shifts, availability, time tracking.', true),
  ('service_delivery', 'Service Delivery', 'Sessions, progress notes, outcomes, case notes.', true)
ON CONFLICT (code) DO NOTHING;
