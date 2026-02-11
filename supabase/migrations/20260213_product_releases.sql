-- Product Releases: Version tracking and release lifecycle management
-- Supports enterprise release versioning, feature freeze, and controlled upgrades

do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'product_releases'
  ) then
    create table public.product_releases (
      id uuid primary key default gen_random_uuid(),
      version_code text not null unique,
      release_name text not null,
      release_status text not null default 'draft'
        check (release_status in ('draft', 'stable', 'deprecated', 'archived')),
      release_date timestamptz,
      release_notes text,
      feature_flags jsonb not null default '{}'::jsonb,
      schema_version text,
      ui_version text,
      compatibility_min_version text,
      is_locked boolean not null default false,
      created_by uuid,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  end if;
end $$;

-- RLS: service_role only (accessed via admin client)
alter table public.product_releases enable row level security;

drop policy if exists "product_releases_admin" on public.product_releases;
create policy "product_releases_admin" on public.product_releases
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Indexes
create index if not exists product_releases_status_idx
  on public.product_releases (release_status);
create index if not exists product_releases_version_idx
  on public.product_releases (version_code);

-- Seed: FormaOS Sovereign v1.0.0 (initial locked enterprise release)
insert into public.product_releases (
  version_code, release_name, release_status, release_date,
  release_notes, feature_flags, schema_version, ui_version,
  compatibility_min_version, is_locked
) values (
  '1.0.0',
  'Sovereign',
  'stable',
  now(),
  'Initial enterprise release of FormaOS. Full compliance operating system with controls, evidence, policies, tasks, vault, audits, reports, registers, and team management.',
  '{"controls": true, "evidence": true, "policies": true, "tasks": true, "vault": true, "audits": true, "reports": true, "registers": true, "team": true, "billing": true}'::jsonb,
  '20260213',
  '1.0.0',
  '1.0.0',
  true
) on conflict (version_code) do nothing;
