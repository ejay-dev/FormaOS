alter table public.org_subscriptions
  add column if not exists price_id text;

create index if not exists org_subscriptions_price_id_idx
  on public.org_subscriptions (price_id);
