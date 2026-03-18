-- Admin Control Plane foundation
-- Creates persisted configuration + operations tables for runtime control.

create extension if not exists pgcrypto;

create or replace function public.control_plane_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'feature_flags'
  ) then
    create table public.feature_flags (
      id uuid primary key default gen_random_uuid(),
      flag_key text not null,
      description text,
      environment text not null default 'production',
      scope_type text not null default 'global' check (scope_type in ('global', 'organization', 'user')),
      scope_id text,
      enabled boolean not null default false,
      kill_switch boolean not null default false,
      rollout_percentage integer not null default 100 check (rollout_percentage >= 0 and rollout_percentage <= 100),
      variants jsonb not null default '{}'::jsonb,
      default_variant text,
      start_at timestamptz,
      end_at timestamptz,
      is_public boolean not null default true,
      created_by uuid,
      updated_by uuid,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      constraint feature_flags_scope_consistency check (
        (scope_type = 'global' and scope_id is null)
        or (scope_type in ('organization', 'user') and scope_id is not null)
      ),
      constraint feature_flags_schedule_valid check (
        end_at is null or start_at is null or end_at > start_at
      )
    );

    create unique index feature_flags_unique_scope_idx
      on public.feature_flags (environment, flag_key, scope_type, coalesce(scope_id, ''));
    create index feature_flags_lookup_idx
      on public.feature_flags (environment, flag_key, scope_type, scope_id);
    create index feature_flags_updated_idx
      on public.feature_flags (updated_at desc);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'marketing_config'
  ) then
    create table public.marketing_config (
      id uuid primary key default gen_random_uuid(),
      environment text not null default 'production',
      section text not null,
      config_key text not null,
      value jsonb not null default '{}'::jsonb,
      description text,
      created_by uuid,
      updated_by uuid,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create unique index marketing_config_unique_key_idx
      on public.marketing_config (environment, section, config_key);
    create index marketing_config_section_idx
      on public.marketing_config (environment, section);
    create index marketing_config_updated_idx
      on public.marketing_config (updated_at desc);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'system_settings'
  ) then
    create table public.system_settings (
      id uuid primary key default gen_random_uuid(),
      environment text not null default 'production',
      category text not null,
      setting_key text not null,
      value jsonb not null default '{}'::jsonb,
      description text,
      created_by uuid,
      updated_by uuid,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create unique index system_settings_unique_key_idx
      on public.system_settings (environment, category, setting_key);
    create index system_settings_category_idx
      on public.system_settings (environment, category);
    create index system_settings_updated_idx
      on public.system_settings (updated_at desc);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'admin_jobs'
  ) then
    create table public.admin_jobs (
      id uuid primary key default gen_random_uuid(),
      job_type text not null,
      status text not null default 'queued' check (status in ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
      payload jsonb not null default '{}'::jsonb,
      progress integer not null default 0 check (progress >= 0 and progress <= 100),
      logs jsonb not null default '[]'::jsonb,
      result jsonb not null default '{}'::jsonb,
      error_message text,
      requested_by uuid,
      started_at timestamptz,
      completed_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create index admin_jobs_status_created_idx
      on public.admin_jobs (status, created_at desc);
    create index admin_jobs_type_created_idx
      on public.admin_jobs (job_type, created_at desc);
    create index admin_jobs_updated_idx
      on public.admin_jobs (updated_at desc);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'audit_log'
  ) then
    create table public.audit_log (
      id uuid primary key default gen_random_uuid(),
      actor_user_id uuid,
      event_type text not null,
      target_type text not null,
      target_id text,
      environment text not null default 'production',
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    );

    create index audit_log_created_idx
      on public.audit_log (created_at desc);
    create index audit_log_target_idx
      on public.audit_log (target_type, target_id, created_at desc);
    create index audit_log_actor_idx
      on public.audit_log (actor_user_id, created_at desc);
    create index audit_log_event_idx
      on public.audit_log (event_type, created_at desc);
  end if;
end $$;

-- Shared updated_at triggers
drop trigger if exists feature_flags_touch_updated_at on public.feature_flags;
create trigger feature_flags_touch_updated_at
before update on public.feature_flags
for each row execute function public.control_plane_touch_updated_at();

drop trigger if exists marketing_config_touch_updated_at on public.marketing_config;
create trigger marketing_config_touch_updated_at
before update on public.marketing_config
for each row execute function public.control_plane_touch_updated_at();

drop trigger if exists system_settings_touch_updated_at on public.system_settings;
create trigger system_settings_touch_updated_at
before update on public.system_settings
for each row execute function public.control_plane_touch_updated_at();

drop trigger if exists admin_jobs_touch_updated_at on public.admin_jobs;
create trigger admin_jobs_touch_updated_at
before update on public.admin_jobs
for each row execute function public.control_plane_touch_updated_at();

-- Immutable audit stream
create or replace function public.control_plane_prevent_audit_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_log records are immutable';
end;
$$;

drop trigger if exists audit_log_immutable on public.audit_log;
create trigger audit_log_immutable
before update or delete on public.audit_log
for each row execute function public.control_plane_prevent_audit_mutation();

-- RLS: only service role can access directly. All user access goes through founder-gated APIs.
alter table public.feature_flags enable row level security;
alter table public.marketing_config enable row level security;
alter table public.system_settings enable row level security;
alter table public.admin_jobs enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists feature_flags_service_only on public.feature_flags;
create policy feature_flags_service_only on public.feature_flags
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists marketing_config_service_only on public.marketing_config;
create policy marketing_config_service_only on public.marketing_config
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists system_settings_service_only on public.system_settings;
create policy system_settings_service_only on public.system_settings
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists admin_jobs_service_only on public.admin_jobs;
create policy admin_jobs_service_only on public.admin_jobs
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists audit_log_service_only on public.audit_log;
create policy audit_log_service_only on public.audit_log
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Realtime publication for control-plane tables.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.feature_flags;
    exception when duplicate_object then null;
    end;
    begin
      alter publication supabase_realtime add table public.marketing_config;
    exception when duplicate_object then null;
    end;
    begin
      alter publication supabase_realtime add table public.system_settings;
    exception when duplicate_object then null;
    end;
    begin
      alter publication supabase_realtime add table public.admin_jobs;
    exception when duplicate_object then null;
    end;
    begin
      alter publication supabase_realtime add table public.audit_log;
    exception when duplicate_object then null;
    end;
  end if;
end $$;

-- Runtime defaults for immediate use.
insert into public.system_settings (environment, category, setting_key, value, description)
select 'production', 'ops', 'maintenance_mode', '{"enabled": false}'::jsonb, 'Global maintenance gate'
where not exists (
  select 1 from public.system_settings
  where environment = 'production' and category = 'ops' and setting_key = 'maintenance_mode'
);

insert into public.system_settings (environment, category, setting_key, value, description)
select 'production', 'ops', 'read_only_mode', '{"enabled": false}'::jsonb, 'Global write lock for non-admin operations'
where not exists (
  select 1 from public.system_settings
  where environment = 'production' and category = 'ops' and setting_key = 'read_only_mode'
);

insert into public.system_settings (environment, category, setting_key, value, description)
select 'production', 'ops', 'emergency_lockdown', '{"enabled": false}'::jsonb, 'Emergency lock-down for customer surfaces'
where not exists (
  select 1 from public.system_settings
  where environment = 'production' and category = 'ops' and setting_key = 'emergency_lockdown'
);

insert into public.system_settings (environment, category, setting_key, value, description)
select 'production', 'ops', 'rate_limit_mode', '{"multiplier": 1}'::jsonb, 'Runtime multiplier for API throttling'
where not exists (
  select 1 from public.system_settings
  where environment = 'production' and category = 'ops' and setting_key = 'rate_limit_mode'
);

insert into public.system_settings (environment, category, setting_key, value, description)
select 'production', 'runtime', 'version', '{"value": "1"}'::jsonb, 'Control plane runtime version marker'
where not exists (
  select 1 from public.system_settings
  where environment = 'production' and category = 'runtime' and setting_key = 'version'
);

insert into public.marketing_config (environment, section, config_key, value, description)
select 'production', 'home.hero', 'badge_text', '"Enterprise Compliance OS"'::jsonb, 'Homepage hero badge'
where not exists (
  select 1 from public.marketing_config
  where environment = 'production' and section = 'home.hero' and config_key = 'badge_text'
);

insert into public.marketing_config (environment, section, config_key, value, description)
select 'production', 'home.hero', 'headline_primary', '"Operational Compliance,"'::jsonb, 'Homepage hero headline line 1'
where not exists (
  select 1 from public.marketing_config
  where environment = 'production' and section = 'home.hero' and config_key = 'headline_primary'
);

insert into public.marketing_config (environment, section, config_key, value, description)
select 'production', 'home.hero', 'headline_accent', '"Built for Real Organizations"'::jsonb, 'Homepage hero headline accent line'
where not exists (
  select 1 from public.marketing_config
  where environment = 'production' and section = 'home.hero' and config_key = 'headline_accent'
);

insert into public.marketing_config (environment, section, config_key, value, description)
select 'production', 'home.hero', 'subheadline', '"The operating system for governance, controls, evidence, and audit defense. Not a document repository. A system that enforces accountability."'::jsonb, 'Homepage hero subheadline'
where not exists (
  select 1 from public.marketing_config
  where environment = 'production' and section = 'home.hero' and config_key = 'subheadline'
);

insert into public.marketing_config (environment, section, config_key, value, description)
select 'production', 'home.hero', 'primary_cta_label', '"Start Free Trial"'::jsonb, 'Homepage hero primary CTA text'
where not exists (
  select 1 from public.marketing_config
  where environment = 'production' and section = 'home.hero' and config_key = 'primary_cta_label'
);

insert into public.marketing_config (environment, section, config_key, value, description)
select 'production', 'home.hero', 'primary_cta_href', '"/auth/signup?plan=pro"'::jsonb, 'Homepage hero primary CTA URL'
where not exists (
  select 1 from public.marketing_config
  where environment = 'production' and section = 'home.hero' and config_key = 'primary_cta_href'
);

insert into public.marketing_config (environment, section, config_key, value, description)
select 'production', 'home.hero', 'secondary_cta_label', '"Request Demo"'::jsonb, 'Homepage hero secondary CTA text'
where not exists (
  select 1 from public.marketing_config
  where environment = 'production' and section = 'home.hero' and config_key = 'secondary_cta_label'
);

insert into public.marketing_config (environment, section, config_key, value, description)
select 'production', 'home.hero', 'secondary_cta_href', '"/contact"'::jsonb, 'Homepage hero secondary CTA URL'
where not exists (
  select 1 from public.marketing_config
  where environment = 'production' and section = 'home.hero' and config_key = 'secondary_cta_href'
);

insert into public.marketing_config (environment, section, config_key, value, description)
select 'production', 'home.runtime', 'expensive_effects_enabled', 'true'::jsonb, 'Allow heavy 3D/motion effects'
where not exists (
  select 1 from public.marketing_config
  where environment = 'production' and section = 'home.runtime' and config_key = 'expensive_effects_enabled'
);

insert into public.marketing_config (environment, section, config_key, value, description)
select 'production', 'home.runtime', 'active_showcase_module', '"interactive_demo"'::jsonb, 'Currently active showcase module'
where not exists (
  select 1 from public.marketing_config
  where environment = 'production' and section = 'home.runtime' and config_key = 'active_showcase_module'
);

insert into public.marketing_config (environment, section, config_key, value, description)
select 'production', 'home.runtime', 'showcase_modules', '{"interactive_demo": true, "evidence_showcase": true, "task_showcase": true}'::jsonb, 'Enabled showcase modules'
where not exists (
  select 1 from public.marketing_config
  where environment = 'production' and section = 'home.runtime' and config_key = 'showcase_modules'
);

insert into public.marketing_config (environment, section, config_key, value, description)
select 'production', 'home.runtime', 'section_visibility', '{"value_proposition": true, "compliance_network": true, "interactive_demo": true, "scroll_story": true, "compliance_engine_demo": true, "capabilities_grid": true, "evidence_showcase": true, "industries": true, "task_showcase": true, "security": true, "outcome_proof": true, "objection_handling": true, "procurement_flow": true, "cta": true, "trust": true}'::jsonb, 'Homepage section visibility controls'
where not exists (
  select 1 from public.marketing_config
  where environment = 'production' and section = 'home.runtime' and config_key = 'section_visibility'
);

insert into public.marketing_config (environment, section, config_key, value, description)
select 'production', 'home.runtime', 'theme_variant', '"default"'::jsonb, 'Marketing theme variant'
where not exists (
  select 1 from public.marketing_config
  where environment = 'production' and section = 'home.runtime' and config_key = 'theme_variant'
);

insert into public.marketing_config (environment, section, config_key, value, description)
select 'production', 'home.runtime', 'background_variant', '"aurora"'::jsonb, 'Marketing background variant'
where not exists (
  select 1 from public.marketing_config
  where environment = 'production' and section = 'home.runtime' and config_key = 'background_variant'
);

insert into public.system_settings (environment, category, setting_key, value, description)
select 'production', 'integrations', 'google_drive', '{"enabled": true, "connection_status": "disconnected", "last_sync_at": null, "last_error": null, "error_logs": [], "scopes": ["drive.readonly", "drive.file"], "enabled_scopes": ["drive.readonly"], "retry_requested_at": null}'::jsonb, 'Google Drive integration control'
where not exists (
  select 1 from public.system_settings
  where environment = 'production' and category = 'integrations' and setting_key = 'google_drive'
);

insert into public.system_settings (environment, category, setting_key, value, description)
select 'production', 'integrations', 'google_calendar', '{"enabled": true, "connection_status": "disconnected", "last_sync_at": null, "last_error": null, "error_logs": [], "scopes": ["calendar.readonly", "calendar.events"], "enabled_scopes": ["calendar.readonly"], "retry_requested_at": null}'::jsonb, 'Google Calendar integration control'
where not exists (
  select 1 from public.system_settings
  where environment = 'production' and category = 'integrations' and setting_key = 'google_calendar'
);

insert into public.system_settings (environment, category, setting_key, value, description)
select 'production', 'integrations', 'google_gmail', '{"enabled": true, "connection_status": "disconnected", "last_sync_at": null, "last_error": null, "error_logs": [], "scopes": ["gmail.readonly", "gmail.modify"], "enabled_scopes": ["gmail.readonly"], "retry_requested_at": null}'::jsonb, 'Google Gmail integration control'
where not exists (
  select 1 from public.system_settings
  where environment = 'production' and category = 'integrations' and setting_key = 'google_gmail'
);

comment on table public.feature_flags is 'Runtime feature flag controls with scope + rollout + kill switch';
comment on table public.marketing_config is 'Live marketing and site presentation controls';
comment on table public.system_settings is 'Control-plane settings for ops, integrations, and runtime gates';
comment on table public.admin_jobs is 'Background automation jobs triggered from admin control plane';
comment on table public.audit_log is 'Immutable admin control-plane audit stream';
