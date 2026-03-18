create table if not exists public.marketing_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  organization text not null,
  industry text,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.marketing_leads enable row level security;

create policy "marketing_leads_insert"
  on public.marketing_leads
  for insert
  to public
  with check (true);
