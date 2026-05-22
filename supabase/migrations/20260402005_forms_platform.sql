-- =========================================================
-- FORMS PLATFORM
-- Migration: 20260402_forms_platform
-- Creates org_forms, org_form_submissions, org_form_templates
-- =========================================================

-- 1. org_forms table
create table if not exists public.org_forms (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  slug text not null,
  version integer not null default 1,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  fields jsonb not null default '[]'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  constraint org_forms_slug_org_unique unique (org_id, slug)
);

comment on table public.org_forms is 'Organization forms for data collection, assessments, and evidence gathering';

create index if not exists idx_org_forms_org_id on public.org_forms(org_id);
create index if not exists idx_org_forms_status on public.org_forms(org_id, status);
create index if not exists idx_org_forms_slug on public.org_forms(org_id, slug);
create index if not exists idx_org_forms_created on public.org_forms(org_id, created_at desc);

-- RLS
alter table public.org_forms enable row level security;

create policy "org_forms_select" on public.org_forms for select using (
  org_id in (select organization_id from public.org_members where user_id = auth.uid())
);

create policy "org_forms_insert" on public.org_forms for insert with check (
  org_id in (select organization_id from public.org_members where user_id = auth.uid())
);

create policy "org_forms_update" on public.org_forms for update using (
  org_id in (select organization_id from public.org_members where user_id = auth.uid())
);

create policy "org_forms_delete" on public.org_forms for delete using (
  org_id in (select organization_id from public.org_members where user_id = auth.uid())
);

-- 2. org_form_submissions table
create table if not exists public.org_form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.org_forms(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  submitted_by uuid,
  respondent_email text,
  respondent_name text,
  data jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'submitted' check (status in ('submitted', 'reviewed', 'approved', 'rejected')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_notes text,
  evidence_id uuid,
  created_at timestamptz not null default now()
);

comment on table public.org_form_submissions is 'Form submission responses with review workflow';

create index if not exists idx_org_form_submissions_form on public.org_form_submissions(form_id, created_at desc);
create index if not exists idx_org_form_submissions_org on public.org_form_submissions(org_id);
create index if not exists idx_org_form_submissions_status on public.org_form_submissions(form_id, status);
create index if not exists idx_org_form_submissions_submitted_by on public.org_form_submissions(submitted_by);
create index if not exists idx_org_form_submissions_data on public.org_form_submissions using gin (data);

-- RLS
alter table public.org_form_submissions enable row level security;

create policy "org_form_submissions_select" on public.org_form_submissions for select using (
  org_id in (select organization_id from public.org_members where user_id = auth.uid())
);

create policy "org_form_submissions_insert" on public.org_form_submissions for insert with check (
  org_id in (select organization_id from public.org_members where user_id = auth.uid())
  or
  -- Allow anonymous submissions for published forms with auth not required
  exists (
    select 1 from public.org_forms f
    where f.id = form_id
      and f.status = 'published'
      and (f.settings->>'requires_auth')::boolean is not true
  )
);

create policy "org_form_submissions_update" on public.org_form_submissions for update using (
  org_id in (select organization_id from public.org_members where user_id = auth.uid())
);

-- 3. org_form_templates table
create table if not exists public.org_form_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text not null default 'custom' check (category in ('compliance', 'risk', 'care', 'hr', 'security', 'custom')),
  industry text not null default 'general' check (industry in ('general', 'healthcare', 'ndis', 'fintech', 'saas')),
  fields jsonb not null default '[]'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  usage_count integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.org_form_templates is 'Pre-built form templates for common compliance use cases';

create index if not exists idx_org_form_templates_category on public.org_form_templates(category);
create index if not exists idx_org_form_templates_industry on public.org_form_templates(industry);

-- RLS: templates readable by all authenticated users
alter table public.org_form_templates enable row level security;

create policy "org_form_templates_select" on public.org_form_templates for select using (
  auth.uid() is not null
);

-- 4. Updated at trigger
create or replace function public.update_org_forms_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_org_forms_updated_at on public.org_forms;
create trigger trg_org_forms_updated_at
  before update on public.org_forms
  for each row execute function public.update_org_forms_updated_at();
