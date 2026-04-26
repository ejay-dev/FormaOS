-- Ensure enterprise SSO schema exists in environments that missed the
-- original 20260212_223000_enterprise_sso_and_status.sql migration.
-- This migration is intentionally idempotent and only repairs the SSO table.

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'directory_sync_provider'
  ) then
    create type public.directory_sync_provider as enum (
      'azure-ad',
      'okta',
      'google-workspace'
    );
  end if;
end $$;

create table if not exists public.organization_sso (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  provider text not null default 'saml',
  enabled boolean not null default false,
  enforce_sso boolean not null default false,
  idp_metadata_xml text,
  idp_entity_id text,
  sso_url text,
  certificate text,
  logout_url text,
  allowed_domains text[] not null default '{}'::text[],
  jit_provisioning_enabled boolean not null default false,
  jit_default_role text not null default 'member',
  directory_sync_enabled boolean not null default false,
  directory_sync_provider public.directory_sync_provider,
  directory_sync_interval_minutes integer not null default 60,
  directory_sync_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organization_sso
  add column if not exists provider text not null default 'saml',
  add column if not exists enabled boolean not null default false,
  add column if not exists enforce_sso boolean not null default false,
  add column if not exists idp_metadata_xml text,
  add column if not exists idp_entity_id text,
  add column if not exists sso_url text,
  add column if not exists certificate text,
  add column if not exists logout_url text,
  add column if not exists allowed_domains text[] not null default '{}'::text[],
  add column if not exists jit_provisioning_enabled boolean not null default false,
  add column if not exists jit_default_role text not null default 'member',
  add column if not exists directory_sync_enabled boolean not null default false,
  add column if not exists directory_sync_provider public.directory_sync_provider,
  add column if not exists directory_sync_interval_minutes integer not null default 60,
  add column if not exists directory_sync_config jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.organization_sso enable row level security;

drop policy if exists organization_sso_select on public.organization_sso;
create policy organization_sso_select
  on public.organization_sso
  for select
  using (
    organization_id in (
      select organization_id
      from public.org_members
      where user_id = (select auth.uid())
        and role in ('owner', 'admin')
    )
  );

drop policy if exists organization_sso_upsert on public.organization_sso;
create policy organization_sso_upsert
  on public.organization_sso
  for insert
  with check (
    organization_id in (
      select organization_id
      from public.org_members
      where user_id = (select auth.uid())
        and role in ('owner', 'admin')
    )
  );

drop policy if exists organization_sso_update on public.organization_sso;
create policy organization_sso_update
  on public.organization_sso
  for update
  using (
    organization_id in (
      select organization_id
      from public.org_members
      where user_id = (select auth.uid())
        and role in ('owner', 'admin')
    )
  )
  with check (
    organization_id in (
      select organization_id
      from public.org_members
      where user_id = (select auth.uid())
        and role in ('owner', 'admin')
    )
  );

drop policy if exists organization_sso_service_role on public.organization_sso;
create policy organization_sso_service_role
  on public.organization_sso
  for all
  using ((select auth.role()) = 'service_role')
  with check ((select auth.role()) = 'service_role');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists organization_sso_updated_at on public.organization_sso;
create trigger organization_sso_updated_at
  before update on public.organization_sso
  for each row
  execute function public.set_updated_at();

create index if not exists organization_sso_enabled_idx
  on public.organization_sso (enabled);

create index if not exists organization_sso_domains_idx
  on public.organization_sso using gin (allowed_domains);
