-- Search index tables for unified global search
-- Migration: 20260402_search_index.sql

-- Enable pg_trgm for fuzzy search
create extension if not exists pg_trgm;

-- Unified search index
create table if not exists search_index (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  entity_type text not null check (entity_type in (
    'task', 'evidence', 'control', 'policy', 'form', 'participant',
    'incident', 'member', 'care_plan', 'report', 'certificate'
  )),
  entity_id uuid not null,
  title text not null default '',
  body text not null default '',
  metadata jsonb default '{}',
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(body, '')), 'B')
  ) stored,
  last_indexed_at timestamptz default now(),
  created_at timestamptz default now(),
  unique(org_id, entity_type, entity_id)
);

create index idx_search_index_vector on search_index using gin(search_vector);
create index idx_search_index_trigram on search_index using gin(title gin_trgm_ops);
create index idx_search_index_org on search_index(org_id);
create index idx_search_index_type on search_index(org_id, entity_type);

alter table search_index enable row level security;
create policy "search_index_org" on search_index for all
  using (org_id = (current_setting('app.current_org_id', true))::uuid);

-- Search history
create table if not exists search_history (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null,
  query text not null,
  result_count int default 0,
  clicked_result_id uuid,
  clicked_result_type text,
  searched_at timestamptz default now()
);

create index idx_search_history_user on search_history(org_id, user_id, searched_at desc);
alter table search_history enable row level security;
create policy "search_history_org" on search_history for all
  using (org_id = (current_setting('app.current_org_id', true))::uuid);

-- Saved searches
create table if not exists saved_searches (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null,
  name text not null,
  query text not null,
  filters jsonb default '{}',
  created_at timestamptz default now()
);

create index idx_saved_searches_user on saved_searches(org_id, user_id);
alter table saved_searches enable row level security;
create policy "saved_searches_org" on saved_searches for all
  using (org_id = (current_setting('app.current_org_id', true))::uuid);

-- Recent items
create table if not exists recent_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null,
  entity_type text not null,
  entity_id uuid not null,
  entity_title text not null default '',
  accessed_at timestamptz default now()
);

create index idx_recent_items_user on recent_items(org_id, user_id, accessed_at desc);
alter table recent_items enable row level security;
create policy "recent_items_org" on recent_items for all
  using (org_id = (current_setting('app.current_org_id', true))::uuid);

-- Full-text search RPC
create or replace function search_entities(
  p_org_id uuid,
  p_query text,
  p_entity_types text[] default null,
  p_limit int default 20,
  p_offset int default 0
)
returns table (
  entity_type text,
  entity_id uuid,
  title text,
  snippet text,
  rank real,
  metadata jsonb
)
language sql stable
as $$
  select
    si.entity_type,
    si.entity_id,
    si.title,
    ts_headline('english', si.body, websearch_to_tsquery('english', p_query),
      'MaxWords=40, MinWords=20, StartSel=<mark>, StopSel=</mark>') as snippet,
    ts_rank(si.search_vector, websearch_to_tsquery('english', p_query)) as rank,
    si.metadata
  from search_index si
  where si.org_id = p_org_id
    and si.search_vector @@ websearch_to_tsquery('english', p_query)
    and (p_entity_types is null or si.entity_type = any(p_entity_types))
  order by rank desc
  limit p_limit
  offset p_offset;
$$;
