-- ─────────────────────────────────────────────────────────────────
-- Upgrade your founder org to Enterprise tier (Option B — internal comp)
-- ─────────────────────────────────────────────────────────────────
-- HOW TO RUN:
--   1. Supabase Dashboard → SQL Editor → New query
--   2. Paste this entire file
--   3. Click Run
--
-- WHAT IT DOES:
--   - Bumps organizations.plan_key to 'enterprise'
--   - Sets org_subscriptions.plan_key='enterprise', status='active',
--     current_period_end ten years out (so the billing gate stops firing
--     for non-founder admins / non-owners in that org).
--     plan_code stays 'pro' because the org_subscriptions.plan_code FK
--     points at billing_plans.code, which only contains 'free', 'starter',
--     'pro' in this DB — there is no 'enterprise' row to point at.
--   - Replaces all org_entitlements rows for the org with the full
--     enterprise feature set. Keys mirror lib/billing/entitlements.ts
--     EntitlementKey union exactly (the runtime checks against those
--     keys, not the older optimistic list).
--   - No Stripe charge — internal use only.
--
-- IDEMPOTENT — safe to re-run.
-- ─────────────────────────────────────────────────────────────────

do $$
declare
  founder_email text := 'ejazhussaini313@gmail.com';  -- ← first entry from FOUNDER_EMAILS
  founder_uid uuid;
  target_org uuid;
begin
  select id into founder_uid
    from auth.users
   where lower(email) = lower(founder_email)
   limit 1;
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

  -- 1. Bump the org's plan label
  update organizations
     set plan_key = 'enterprise'
   where id = target_org;

  -- 2. Bump (or create) the subscription row.
  --    Keep plan_code='pro' to satisfy the FK to billing_plans.code;
  --    plan_key is the authoritative plan label and the billing gate
  --    only cares about status.
  update org_subscriptions
     set plan_key = 'enterprise',
         plan_code = 'pro',
         status = 'active',
         current_period_end = now() + interval '10 years',
         trial_expires_at = null,
         trial_ends_at = null,
         payment_failures = 0,
         grace_period_end = null,
         payment_failed_at = null,
         updated_at = now()
   where organization_id = target_org;

  insert into org_subscriptions (
    organization_id, org_id,
    plan_key, plan_code,
    status,
    current_period_end,
    updated_at
  )
  select
    target_org, target_org,
    'enterprise', 'pro',
    'active',
    now() + interval '10 years',
    now()
  where not exists (
    select 1 from org_subscriptions where organization_id = target_org
  );

  -- 3. Reseed entitlements with the enterprise set. The real column is
  --    `feature_key` (not `key`) and the keys MUST match
  --    lib/billing/entitlements.ts EntitlementKey union — gates compare
  --    against those exact strings.
  delete from org_entitlements where organization_id = target_org;

  insert into org_entitlements (organization_id, feature_key, enabled, limit_value, created_at, updated_at)
  select target_org, k, true, null, now(), now()
  from (values
    ('audit_export'),
    ('reports'),
    ('framework_evaluations'),
    ('certifications'),
    ('team_limit'),               -- limit_value=null → unlimited seats
    ('ai_assistant'),
    ('capa_management'),
    ('custom_reports'),
    ('form_analytics'),
    ('workflow_automation'),
    ('sso_saml'),
    ('directory_sync'),
    ('retention_governance')
  ) as t(k);

  raise notice 'Done. Org % is now enterprise with % entitlements active.',
    target_org,
    (select count(*) from org_entitlements where organization_id = target_org and enabled);
end $$;

-- Verify (optional — run separately to inspect)
-- select organization_id, plan_key, plan_code, status, current_period_end
--   from org_subscriptions
--   where organization_id = (
--     select organization_id from org_members
--      where user_id = (select id from auth.users
--                        where lower(email) = lower('ejazhussaini313@gmail.com'))
--      order by created_at asc limit 1
--   );
--
-- select feature_key, enabled, limit_value
--   from org_entitlements
--   where organization_id = (
--     select organization_id from org_members
--      where user_id = (select id from auth.users
--                        where lower(email) = lower('ejazhussaini313@gmail.com'))
--      order by created_at asc limit 1
--   )
--   order by feature_key;
