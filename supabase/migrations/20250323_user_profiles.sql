create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  full_name text,
  phone text,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'user_profiles'
  ) then
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'user_profiles'
        and column_name = 'organization_id'
    ) then
      alter table public.user_profiles add column organization_id uuid;
    end if;
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'user_profiles'
        and column_name = 'org_id'
    ) then
      update public.user_profiles
        set organization_id = org_id
        where organization_id is null;
    end if;
    if not exists (
      select 1 from pg_constraint
      where conname = 'user_profiles_organization_id_fkey'
    ) then
      alter table public.user_profiles
        add constraint user_profiles_organization_id_fkey
        foreign key (organization_id)
        references public.organizations (id) on delete cascade;
    end if;
  end if;
end $$;

create index if not exists user_profiles_org_user_idx
  on public.user_profiles (organization_id, user_id);

alter table public.user_profiles enable row level security;

drop policy if exists "user_profiles_select" on public.user_profiles;
create policy "user_profiles_select"
  on public.user_profiles
  for select
  using (
    user_id = auth.uid()
  );

drop policy if exists "user_profiles_insert" on public.user_profiles;
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'org_members'
      and column_name = 'organization_id'
  ) then
    execute $policy$
      create policy "user_profiles_insert"
        on public.user_profiles
        for insert
        with check (
          user_id = auth.uid()
          and exists (
            select 1
            from public.org_members m
            where m.user_id = auth.uid()
              and m.organization_id = user_profiles.organization_id
          )
        )
    $policy$;
  elsif exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'org_members'
      and column_name = 'org_id'
  ) then
    execute $policy$
      create policy "user_profiles_insert"
        on public.user_profiles
        for insert
        with check (
          user_id = auth.uid()
          and exists (
            select 1
            from public.org_members m
            where m.user_id = auth.uid()
              and m.org_id = user_profiles.organization_id
          )
        )
    $policy$;
  end if;
end $$;

drop policy if exists "user_profiles_update" on public.user_profiles;
create policy "user_profiles_update"
  on public.user_profiles
  for update
  using (
    user_id = auth.uid()
  );
