-- Auditor portal and evidence freshness tables
-- Migration: 20260402_auditor_portal.sql

-- Auditor access tokens for external auditor read-only portal
create table if not exists auditor_access_tokens (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  auditor_name text not null,
  auditor_email text not null,
  auditor_company text,
  token_hash text not null unique,
  scopes jsonb default '{}',
  expires_at timestamptz not null,
  last_accessed_at timestamptz,
  access_count int default 0,
  created_by uuid not null,
  created_at timestamptz default now(),
  revoked_at timestamptz
);

create index idx_auditor_tokens_org on auditor_access_tokens(org_id);
create index idx_auditor_tokens_hash on auditor_access_tokens(token_hash);

alter table auditor_access_tokens enable row level security;
create policy "auditor_tokens_org" on auditor_access_tokens for all
  using (org_id = (current_setting('app.current_org_id', true))::uuid);

-- Auditor activity log
create table if not exists auditor_activity_log (
  id uuid primary key default gen_random_uuid(),
  token_id uuid not null references auditor_access_tokens(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  action text not null check (action in (
    'viewed_evidence', 'downloaded_evidence', 'viewed_control',
    'viewed_report', 'exported_data', 'viewed_dashboard'
  )),
  resource_type text,
  resource_id uuid,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

create index idx_auditor_activity_org on auditor_activity_log(org_id, created_at desc);
create index idx_auditor_activity_token on auditor_activity_log(token_id);

alter table auditor_activity_log enable row level security;
create policy "auditor_activity_org" on auditor_activity_log for all
  using (org_id = (current_setting('app.current_org_id', true))::uuid);
