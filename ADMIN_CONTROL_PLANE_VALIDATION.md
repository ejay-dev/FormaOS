## Admin Control Plane Validation (2026-02-21)

### Live verification run (post-migration)

- Date: 2026-02-21
- Supabase project verified: `bvfniosswcvuyfaaicze.supabase.co`
- Local app runtime used for end-to-end checks: `http://localhost:3001` (wired to live Supabase)

DB/object checks (live):
- `feature_flags`, `marketing_config`, `system_settings`, `admin_jobs`, `audit_log` all queryable with service-role key.
- Anon client cannot mutate control-plane tables:
  - anon `INSERT` on `feature_flags` fails with RLS violation.
  - anon `UPDATE/DELETE` on protected tables affects `0` rows.
- `audit_log` immutability confirmed:
  - service-role `UPDATE` blocked: `audit_log records are immutable`
  - service-role `DELETE` blocked: `audit_log records are immutable`

Runtime security checks (live):
- Runtime payload shape is scoped to public client needs only:
  - keys: `version`, `streamVersion`, `lastUpdateAt`, `evaluationMode`, `environment`, `ops`, `marketing`, `featureFlags`
  - no `audit`, `systemSettings`, or `integrations` leakage.
- Private flag visibility:
  - public probe flag appears in runtime payload.
  - private probe flag (`is_public=false`) does **not** appear.

API auth checks (live local app):
- `GET /api/admin/control-plane` unauthenticated -> `403`
- `POST /api/admin/control-plane` unauthenticated -> `403`
- `GET /api/admin/control-plane/stream` unauthenticated -> `403`

SSE checks (live local app + live Supabase):
- Runtime stream update propagation after DB write: **~928ms** (post hardening).
- Runtime heartbeat observed (`event: ping`).
- Runtime stream reconnect smoke test after forced disconnect succeeded.
- Browser reconnect-backoff probe (forced stream failures) showed increasing delays:
  - attempt deltas ~`1020ms`, `2170ms`, `4453ms`.

Cross-page live update checks (marketing, no refresh):
- Open pages: `/` and `/product` concurrently.
- `maintenance_mode` toggle propagated to both pages in **~1041ms**.
- `read_only_mode` banner propagated to both pages.
- `expensive_effects_enabled=false` removed heavy visual grain on both pages.

Production deployment note:
- On current production domains:
  - `https://app.formaos.com.au/api/health` -> `200`
  - `https://app.formaos.com.au/api/runtime/control-plane` -> `404`
  - `https://app.formaos.com.au/api/admin/control-plane` -> `404`
  - `https://app.formaos.com.au/api/runtime/control-plane/stream` -> `404`
- This indicates control-plane routes are not yet deployed on the currently live build, so direct production-route SSE validation is blocked until deploy.

### Automated checks run in this workspace

- `npm run type-check` ✅
- `npm run build` ✅
- `npm test -- tests/admin/control-plane-access.test.ts tests/admin/control-plane-stream-access.test.ts tests/admin/control-plane-stream-live.test.ts tests/runtime/control-plane-stream-live.test.ts __tests__/lib/control-plane-flags.test.ts` ✅

What these tests prove:
- non-founder mutation attempts are rejected (`/api/admin/control-plane` POST).
- non-founder admin stream access is rejected (`/api/admin/control-plane/stream`).
- runtime + admin SSE streams push an updated payload within ~1.2s when stream version changes.

### Repeatable local validation plan (real Supabase env required)

1. Start app:
   - `npm run dev`
2. Open these routes in two tabs each (marketing + app):
   - marketing: `/`, `/product`
   - app shell: `/app` and any app page (for example `/app/people`)
3. Confirm dev debug indicator appears (dev only) and shows:
   - `last_update`
   - stream `connected/disconnected`
   - `evaluated_mode`
4. Apply DB updates in Supabase SQL editor:

```sql
-- feature_flags
update public.feature_flags
set enabled = true, kill_switch = false, rollout_percentage = 100, updated_at = now()
where environment = 'production'
  and flag_key = 'marketing_new_hero'
  and scope_type = 'global'
  and scope_id is null;

insert into public.feature_flags (
  environment, flag_key, scope_type, scope_id, enabled, kill_switch, rollout_percentage, variants, default_variant, is_public
)
select
  'production', 'marketing_new_hero', 'global', null, true, false, 100, '{"control":50,"variant":50}'::jsonb, 'control', true
where not exists (
  select 1 from public.feature_flags
  where environment = 'production'
    and flag_key = 'marketing_new_hero'
    and scope_type = 'global'
    and scope_id is null
);

-- marketing_config
insert into public.marketing_config (environment, section, config_key, value)
values ('production', 'home.hero', 'headline_primary', '"Live headline update"')
on conflict (environment, section, config_key)
do update set value = excluded.value, updated_at = now();

-- system_settings
insert into public.system_settings (environment, category, setting_key, value)
values ('production', 'ops', 'maintenance_mode', '{"enabled": true}'::jsonb)
on conflict (environment, category, setting_key)
do update set value = excluded.value, updated_at = now();
```

5. Without refresh, verify updates propagate in 1-2s:
   - marketing pages react to headline/effects changes
   - app shell shows ops guard changes
6. SSE endpoint checks:
   - runtime stream: `GET /api/runtime/control-plane/stream`
   - admin stream: `GET /api/admin/control-plane/stream`
   - expect new `data:` event within 1-2s after DB update.

### Preview validation plan

Repeat the same on preview URL with `environment=preview` records:
- preview runtime stream: `GET <preview>/api/runtime/control-plane/stream?environment=preview`
- preview admin stream: `GET <preview>/api/admin/control-plane/stream?environment=preview`
- preview routes: `<preview>/` and `<preview>/product`, plus app route(s).

### Security / RLS sanity checks

Run in Supabase SQL editor:

```sql
-- audit_log immutability (must error)
update public.audit_log set event_type = 'tamper' where id = (select id from public.audit_log limit 1);
delete from public.audit_log where id = (select id from public.audit_log limit 1);

-- policies present and service-role only on control-plane tables
select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('feature_flags','marketing_config','system_settings','admin_jobs','audit_log')
order by tablename, policyname;
```

### Current workspace blocker

- This workspace has placeholder Supabase env values in `.env.local`, so DB-backed insert/update replay cannot be executed here without real project credentials.
