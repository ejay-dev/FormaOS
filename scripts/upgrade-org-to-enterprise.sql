-- ─────────────────────────────────────────────────────────────────
-- Upgrade your founder org to Enterprise tier (Option B — internal comp)
-- ─────────────────────────────────────────────────────────────────
-- HOW TO RUN:
--   1. Supabase Dashboard → SQL Editor → New query
--   2. Paste this entire file
--   3. Click Run
--
-- WHAT IT DOES:
--   - Sets org_subscriptions.plan_key = 'enterprise', status = 'active'
--   - Replaces all org_entitlements rows for the org with the full
--     enterprise feature set (every gate flipped on)
--   - No Stripe charge — internal use only
--
-- IDEMPOTENT — safe to re-run.
-- ─────────────────────────────────────────────────────────────────

-- Resolve YOUR org id from FOUNDER_EMAILS — adjust the email if you need to.
-- Replace the email below with the FIRST entry from your FOUNDER_EMAILS env var.
do $$
declare
  founder_email text := 'ejazhussaini313@gmail.com';  -- ← change if different
  founder_uid uuid;
  target_org uuid;
begin
  select id into founder_uid from auth.users where lower(email) = lower(founder_email) limit 1;
  if founder_uid is null then
    raise exception 'No auth.users row for %', founder_email;
  end if;

  select organization_id into target_org
  from org_members
  where user_id = founder_uid
  order by created_at asc
  limit 1;
  if target_org is null then
    raise exception 'No org_members row for founder. Sign in to /app once first to bootstrap.';
  end if;

  raise notice 'Upgrading org % to enterprise', target_org;

  -- Bump subscription state
  update org_subscriptions
     set plan_key = 'enterprise',
         status = 'active',
         current_period_end = now() + interval '10 years',
         trial_expires_at = null,
         updated_at = now()
   where organization_id = target_org;

  -- Insert enterprise plan row if no subscription exists yet
  insert into org_subscriptions (organization_id, plan_key, status, updated_at, current_period_end)
  select target_org, 'enterprise', 'active', now(), now() + interval '10 years'
  where not exists (select 1 from org_subscriptions where organization_id = target_org);

  -- Wipe + reseed entitlements with the full enterprise set.
  -- The list mirrors lib/billing/entitlements.ts ENTITLEMENT_KEYS — every
  -- gate the runtime checks. Keeping this canonical list inline so the
  -- upgrade survives even if the TS file changes.
  delete from org_entitlements where organization_id = target_org;
  insert into org_entitlements (organization_id, key, enabled, source, updated_at)
  select target_org, k, true, 'manual_enterprise_comp', now()
  from (values
    ('sso'),
    ('saml_sso'),
    ('directory_sync'),
    ('scim'),
    ('custom_branding'),
    ('audit_log_retention_extended'),
    ('audit_export'),
    ('custom_reports'),
    ('framework_evaluation'),
    ('capa'),
    ('certifications'),
    ('ai_assistant'),
    ('ai_chat'),
    ('ai_reindex'),
    ('vault_versioning'),
    ('compliance_score_engine'),
    ('multi_site_governance'),
    ('webhook_integrations'),
    ('api_v1_full'),
    ('priority_support'),
    ('dedicated_csm'),
    ('sla_guarantee')
  ) as t(k);

  raise notice 'Done. Org % is now enterprise with % entitlements active.',
    target_org,
    (select count(*) from org_entitlements where organization_id = target_org and enabled);
end $$;

-- Verify (optional — run separately to inspect)
-- select organization_id, plan_key, status, current_period_end
--   from org_subscriptions
--   where organization_id = (select organization_id from org_members
--     where user_id = (select id from auth.users
--       where lower(email) = lower('ejazhussaini313@gmail.com'))
--     limit 1);
--
-- select key, enabled, source from org_entitlements
--   where organization_id = (select organization_id from org_members
--     where user_id = (select id from auth.users
--       where lower(email) = lower('ejazhussaini313@gmail.com'))
--     limit 1)
--   order by key;
