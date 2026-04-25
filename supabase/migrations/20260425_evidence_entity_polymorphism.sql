-- =========================================================
-- System integration: evidence can attach to entities other
-- than `org_tasks` (e.g. incidents, staff credentials, care
-- plans). The base schema declared task_id NOT NULL; relax
-- it here, and add entity_type so consumers can disambiguate
-- what entity_id points at.
--
-- Idempotent.

do $$ begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'org_evidence'
      and column_name = 'task_id'
      and is_nullable = 'NO'
  ) then
    alter table public.org_evidence alter column task_id drop not null;
  end if;
exception when others then null;
end $$;

do $$ begin
  alter table public.org_evidence
    add column if not exists entity_type text;
exception when others then null;
end $$;

create index if not exists idx_org_evidence_entity
  on public.org_evidence (organization_id, entity_type, entity_id)
  where entity_id is not null;

comment on column public.org_evidence.entity_type is
  'Entity kind that entity_id refers to: incident, care_plan, staff_credential, ...';
