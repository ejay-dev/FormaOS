create or replace function public.prevent_audit_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Audit records are immutable';
end;
$$;

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'org_audit_events'
  ) then
    drop trigger if exists org_audit_events_immutable on public.org_audit_events;
    create trigger org_audit_events_immutable
      before update or delete on public.org_audit_events
      for each row execute function public.prevent_audit_mutation();
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'org_audit_logs'
  ) then
    drop trigger if exists org_audit_logs_immutable on public.org_audit_logs;
    create trigger org_audit_logs_immutable
      before update or delete on public.org_audit_logs
      for each row execute function public.prevent_audit_mutation();
  end if;
end $$;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'org_tasks') then
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'org_tasks' and column_name = 'organization_id') then
      execute 'create index if not exists org_tasks_org_id_idx on public.org_tasks (organization_id)';
    end if;
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'org_tasks' and column_name = 'created_at') then
      execute 'create index if not exists org_tasks_created_at_idx on public.org_tasks (organization_id, created_at)';
    end if;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'org_evidence') then
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'org_evidence' and column_name = 'organization_id') then
      execute 'create index if not exists org_evidence_org_id_idx on public.org_evidence (organization_id)';
    end if;
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'org_evidence' and column_name = 'created_at') then
      execute 'create index if not exists org_evidence_created_at_idx on public.org_evidence (organization_id, created_at)';
    end if;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'org_control_evaluations') then
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'org_control_evaluations' and column_name = 'organization_id') then
      execute 'create index if not exists org_control_evaluations_org_id_idx on public.org_control_evaluations (organization_id)';
    end if;
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'org_control_evaluations' and column_name = 'last_evaluated_at') then
      execute 'create index if not exists org_control_evaluations_eval_idx on public.org_control_evaluations (organization_id, last_evaluated_at)';
    end if;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'org_audit_events') then
    execute 'create index if not exists org_audit_events_org_created_idx on public.org_audit_events (organization_id, created_at)';
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'org_audit_logs') then
    execute 'create index if not exists org_audit_logs_org_created_idx on public.org_audit_logs (organization_id, created_at)';
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'org_exports') then
    execute 'create index if not exists org_exports_org_created_idx on public.org_exports (organization_id, created_at)';
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'org_certifications') then
    execute 'create index if not exists org_certifications_org_created_idx on public.org_certifications (organization_id, created_at)';
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'org_compliance_blocks') then
    execute 'create index if not exists org_compliance_blocks_org_gate_idx on public.org_compliance_blocks (organization_id, gate_key)';
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'control_evidence') then
    execute 'create index if not exists control_evidence_org_control_idx on public.control_evidence (organization_id, control_id)';
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'control_tasks') then
    execute 'create index if not exists control_tasks_org_control_idx on public.control_tasks (organization_id, control_id)';
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'team_invitations') then
    execute 'create index if not exists team_invitations_org_status_idx on public.team_invitations (organization_id, status)';
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'org_members') then
    execute 'create index if not exists org_members_org_user_idx on public.org_members (organization_id, user_id)';
  end if;
end $$;
