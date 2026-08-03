-- Raise the statement timeout for the tenant-isolation probe.
--
-- The probe sweeps ~141 org-scoped tables across up to 5 roles in a single
-- call. On a loaded production database that exceeds the default
-- statement_timeout — observed failing twice consecutively immediately after a
-- deploy with "canceling statement due to statement timeout", while a direct
-- query confirmed isolation was in fact intact.
--
-- A gate that fails spuriously gets ignored, which is precisely the failure
-- this probe exists to prevent: the previous RLS gate was green throughout a
-- live cross-tenant leak, and nobody questioned it.
--
-- SET on the function is scoped to its own execution. It does not change the
-- role default or the database default.
--
-- Note: 20260803003, which creates the function, already carries this setting
-- inline, so a from-scratch replay produces the same result and this migration
-- is a no-op there. It exists because the change was applied to production
-- separately, and the repo should record what actually happened rather than
-- only the tidied-up version.

ALTER FUNCTION public._audit_tenant_isolation_probe()
  SET statement_timeout = '180s';
