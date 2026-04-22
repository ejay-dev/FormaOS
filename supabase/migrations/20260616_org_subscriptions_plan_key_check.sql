-- Constrain org_subscriptions.plan_key to the canonical PlanKey catalog
-- (lib/plans.ts). Prevents typos or stale migrations from silently
-- inserting plan keys that don't exist in the app code.
--
-- If a legacy/stale row violates the constraint, we surface the bad value
-- before attaching the constraint rather than silently rewriting data.

do $$
declare
  bad_count integer;
begin
  select count(*) into bad_count
  from public.org_subscriptions
  where plan_key is not null
    and plan_key not in ('basic', 'pro', 'enterprise');

  if bad_count > 0 then
    raise exception
      'Cannot add plan_key CHECK constraint: % row(s) have plan_key not in (basic, pro, enterprise). Reconcile those rows before re-running.',
      bad_count;
  end if;
end
$$;

alter table public.org_subscriptions
  drop constraint if exists org_subscriptions_plan_key_check;

alter table public.org_subscriptions
  add constraint org_subscriptions_plan_key_check
  check (plan_key in ('basic', 'pro', 'enterprise'));
