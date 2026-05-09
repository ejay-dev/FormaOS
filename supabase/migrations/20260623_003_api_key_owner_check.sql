-- =========================================================
-- High-14 — Auto-revoke API keys when their creator loses admin
-- =========================================================
-- Background:
--   API keys are minted by an admin/owner (enforced at the route level).
--   Once minted, the key keeps working with its granted scopes regardless
--   of what happens to the user who created it. If that admin is later
--   demoted to 'member' or removed from the org, the key still grants the
--   same access — a defense-in-depth gap flagged by the audit (High-14).
--
-- Fix:
--   Two AFTER triggers that revoke a user's still-active API keys when:
--     1. They are demoted from admin/owner to a lower role.
--     2. They are removed from org_members entirely.
--
--   Revocation is "soft" (sets revoked_at) so audit history is preserved
--   and validateApiKey continues to reject the key with HTTP 401. The
--   trigger only ever flips revoked_at from NULL to NOW(); existing
--   revocations are never overwritten.
-- =========================================================

create or replace function _fos_revoke_api_keys_for_demoted_admin()
returns trigger
language plpgsql
security definer
as $$
begin
  -- We only care about role transitions OUT of admin/owner. New rows are
  -- handled by org_members.delete (covered by the second trigger) or
  -- org_members.insert (no key existed before insert, no-op here).
  if (
    tg_op = 'UPDATE'
    and old.role in ('admin', 'owner')
    and new.role not in ('admin', 'owner')
  ) then
    update public.api_keys
       set revoked_at = now(),
           updated_at = now()
     where created_by = old.user_id
       and org_id = old.organization_id
       and revoked_at is null;
  end if;
  return new;
end;
$$;

create or replace function _fos_revoke_api_keys_for_removed_member()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.api_keys
     set revoked_at = now(),
         updated_at = now()
   where created_by = old.user_id
     and org_id = old.organization_id
     and revoked_at is null;
  return old;
end;
$$;

drop trigger if exists fos_demote_revokes_api_keys on public.org_members;
create trigger fos_demote_revokes_api_keys
  after update on public.org_members
  for each row
  execute function _fos_revoke_api_keys_for_demoted_admin();

drop trigger if exists fos_remove_revokes_api_keys on public.org_members;
create trigger fos_remove_revokes_api_keys
  after delete on public.org_members
  for each row
  execute function _fos_revoke_api_keys_for_removed_member();
