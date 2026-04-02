-- Evidence freshness columns and function
-- Migration: 20260402_evidence_freshness.sql

-- Add freshness columns to evidence table
do $$ begin
  alter table org_evidence add column if not exists valid_from date;
  alter table org_evidence add column if not exists valid_until date;
  alter table org_evidence add column if not exists review_cycle_days integer;
  alter table org_evidence add column if not exists last_reviewed_at timestamptz;
  alter table org_evidence add column if not exists reviewed_by uuid;
  alter table org_evidence add column if not exists freshness_status text default 'current'
    check (freshness_status in ('current', 'expiring_soon', 'expired', 'needs_review'));
exception when others then null;
end $$;

create index if not exists idx_evidence_freshness on org_evidence(organization_id, freshness_status);

-- Function to recalculate freshness for all evidence in an org
create or replace function update_evidence_freshness(p_org_id uuid)
returns int
language plpgsql
as $$
declare
  updated_count int := 0;
begin
  -- Mark expired
  update org_evidence
  set freshness_status = 'expired'
  where organization_id = p_org_id
    and valid_until is not null
    and valid_until < current_date
    and freshness_status != 'expired';
  get diagnostics updated_count = row_count;

  -- Mark expiring soon (within 30 days)
  update org_evidence
  set freshness_status = 'expiring_soon'
  where organization_id = p_org_id
    and valid_until is not null
    and valid_until >= current_date
    and valid_until <= current_date + interval '30 days'
    and freshness_status not in ('expired');

  -- Mark needs review (review cycle exceeded)
  update org_evidence
  set freshness_status = 'needs_review'
  where organization_id = p_org_id
    and review_cycle_days is not null
    and last_reviewed_at is not null
    and last_reviewed_at + (review_cycle_days || ' days')::interval < now()
    and freshness_status not in ('expired', 'expiring_soon');

  -- Mark current (valid and not needing review)
  update org_evidence
  set freshness_status = 'current'
  where organization_id = p_org_id
    and (valid_until is null or valid_until > current_date + interval '30 days')
    and (review_cycle_days is null or last_reviewed_at is null or
         last_reviewed_at + (review_cycle_days || ' days')::interval >= now())
    and freshness_status != 'current';

  return updated_count;
end;
$$;
