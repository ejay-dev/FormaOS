alter table public.organizations add column if not exists plan_key text;
alter table public.organizations add column if not exists plan_selected_at timestamptz;
alter table public.organizations add column if not exists industry text;
alter table public.organizations add column if not exists team_size text;
alter table public.organizations add column if not exists frameworks text[];
alter table public.organizations add column if not exists onboarding_completed boolean not null default false;
alter table public.organizations add column if not exists onboarding_completed_at timestamptz;
