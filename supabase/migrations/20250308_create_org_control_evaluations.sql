create table if not exists public.org_control_evaluations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  control_type text not null,
  control_key text not null,
  required boolean not null default true,
  status text not null,
  last_evaluated_at timestamptz not null default now(),
  details jsonb
);

alter table public.org_control_evaluations
  add column if not exists organization_id uuid,
  add column if not exists control_type text,
  add column if not exists control_key text,
  add column if not exists required boolean default true,
  add column if not exists status text,
  add column if not exists last_evaluated_at timestamptz default now(),
  add column if not exists details jsonb,
  add column if not exists framework_id uuid,
  add column if not exists compliance_score integer,
  add column if not exists total_controls integer,
  add column if not exists satisfied_controls integer,
  add column if not exists missing_controls integer,
  add column if not exists missing_control_codes text[],
  add column if not exists partial_control_codes text[],
  add column if not exists evaluated_by uuid,
  add column if not exists snapshot_hash text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists evaluated_at timestamptz;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'org_control_evaluations'
      and column_name in ('organization_id', 'control_type', 'control_key')
    group by table_schema, table_name
    having count(*) = 3
  ) then
    create unique index if not exists org_control_evaluations_org_control_key
      on public.org_control_evaluations (organization_id, control_type, control_key);
  end if;
end
$$;
