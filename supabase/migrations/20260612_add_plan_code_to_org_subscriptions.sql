-- Add plan_code column to org_subscriptions with FK to plans.key
-- This column is used by legacy billing logic (toLegacyPlanCode mapping)
-- plan_key: basic, pro, enterprise
-- plan_code: starter, pro, enterprise (legacy mapping: basic → starter)

-- 1. Add the column if it doesn't exist
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'org_subscriptions'
      and column_name = 'plan_code'
  ) then
    alter table public.org_subscriptions
      add column plan_code text;
  end if;
end $$;

-- 2. Backfill plan_code from plan_key (basic → starter, others stay the same)
update public.org_subscriptions
  set plan_code = case
    when plan_key = 'basic' then 'starter'
    else plan_key
  end
where plan_code is null;

-- 3. Ensure the plans table has the legacy 'starter' key for the FK
insert into public.plans (key, name, price_cents, currency, features)
values (
  'starter',
  'Starter',
  39900,
  'usd',
  '{"audit_export": true, "reports": true, "framework_evaluations": true, "team_limit": 15}'
)
on conflict (key) do nothing;

-- 4. Add FK constraint if it doesn't exist
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'org_subscriptions_plan_code_fkey'
  ) then
    alter table public.org_subscriptions
      add constraint org_subscriptions_plan_code_fkey
      foreign key (plan_code)
      references public.plans (key);
  end if;
end $$;
