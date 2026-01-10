create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  price_cents integer,
  currency text default 'usd',
  features jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.org_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  plan_key text not null,
  status text not null default 'pending',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  cancel_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id)
);

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'org_subscriptions'
  ) then
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'org_subscriptions'
        and column_name = 'organization_id'
    ) then
      alter table public.org_subscriptions add column organization_id uuid;
    end if;
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'org_subscriptions'
        and column_name = 'org_id'
    ) then
      update public.org_subscriptions
        set organization_id = org_id
        where organization_id is null;
    end if;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'org_subscriptions'
  ) then
    if not exists (
      select 1 from pg_constraint
      where conname = 'org_subscriptions_organization_id_fkey'
    ) then
      alter table public.org_subscriptions
        add constraint org_subscriptions_organization_id_fkey
        foreign key (organization_id)
        references public.organizations (id) on delete cascade;
    end if;
  end if;
end $$;

create unique index if not exists org_subscriptions_org_id_key
  on public.org_subscriptions (organization_id);

create table if not exists public.org_entitlements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  feature_key text not null,
  enabled boolean not null default false,
  limit_value integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, feature_key)
);

create table if not exists public.billing_events (
  id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

insert into public.plans (key, name, price_cents, currency, features)
values
  ('basic', 'Starter', 39900, 'usd', '{"audit_export": true, "reports": true, "framework_evaluations": true, "team_limit": 15}'),
  ('pro', 'Professional', 120000, 'usd', '{"audit_export": true, "reports": true, "framework_evaluations": true, "certifications": true, "team_limit": 75}'),
  ('enterprise', 'Enterprise', null, 'usd', '{"audit_export": true, "reports": true, "framework_evaluations": true, "certifications": true, "team_limit": null}')
on conflict (key) do nothing;

alter table public.plans enable row level security;
alter table public.org_subscriptions enable row level security;
alter table public.org_entitlements enable row level security;
alter table public.billing_events enable row level security;

create policy "plans_select" on public.plans
  for select
  using (true);

create policy "plans_admin" on public.plans
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "org_subscriptions_select" on public.org_subscriptions;
create policy "org_subscriptions_select" on public.org_subscriptions
  for select
  using (
    exists (
      select 1
      from public.org_members m
      where m.user_id = auth.uid()
        and m.organization_id = org_subscriptions.organization_id
    )
  );

drop policy if exists "org_subscriptions_admin" on public.org_subscriptions;
create policy "org_subscriptions_admin" on public.org_subscriptions
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "org_entitlements_select" on public.org_entitlements;
create policy "org_entitlements_select" on public.org_entitlements
  for select
  using (
    exists (
      select 1
      from public.org_members m
      where m.user_id = auth.uid()
        and m.organization_id = org_entitlements.organization_id
    )
  );

drop policy if exists "org_entitlements_admin" on public.org_entitlements;
create policy "org_entitlements_admin" on public.org_entitlements
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "billing_events_admin" on public.billing_events;
create policy "billing_events_admin" on public.billing_events
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
