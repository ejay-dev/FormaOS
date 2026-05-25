-- Audit 2026-05-26 — lock search_path on every SECURITY DEFINER
-- function in the public schema.
--
-- Background: a SECURITY DEFINER function with no `SET search_path`
-- lock will resolve unqualified identifiers via the *caller's*
-- search_path. An attacker who can `CREATE TEMP TABLE api_keys(...)`
-- and put `pg_temp` ahead of `public` in their session search_path
-- could trick the definer function into operating on attacker-owned
-- data. The CIS Postgres benchmark + Supabase's own advisor flag
-- this. Migrations 20260624014 and 20260624015 fixed the pattern in
-- their own functions, but ~8 historical definer functions still
-- lack the lock.
--
-- Strategy: enumerate the offenders dynamically and `ALTER FUNCTION
-- ... SET search_path = public, pg_temp` on each. This is the same
-- change Supabase's "search_path mutable" advisor recommends. The
-- migration is idempotent — re-running is a no-op once functions
-- are locked.

DO $$
DECLARE
  rec record;
  fixed_count integer := 0;
  signature text;
BEGIN
  FOR rec IN
    SELECT
      n.nspname AS schema_name,
      p.proname AS func_name,
      pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = TRUE                            -- SECURITY DEFINER
      AND NOT EXISTS (                                  -- no search_path SET
        SELECT 1
        FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) AS cfg(option)
        WHERE option LIKE 'search_path=%'
      )
  LOOP
    signature := format(
      '%I.%I(%s)',
      rec.schema_name,
      rec.func_name,
      rec.args
    );
    EXECUTE format(
      'ALTER FUNCTION %s SET search_path = public, pg_temp',
      signature
    );
    fixed_count := fixed_count + 1;
    RAISE NOTICE '[lock-search-path] locked %', signature;
  END LOOP;

  RAISE NOTICE '[lock-search-path] locked search_path on % function(s)', fixed_count;
END $$;

-- Post-condition: zero unlocked SECURITY DEFINER functions remain
-- in the public schema.
DO $$
DECLARE
  remaining integer;
  example text;
BEGIN
  SELECT COUNT(*), MIN(p.proname)
    INTO remaining, example
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public'
     AND p.prosecdef = TRUE
     AND NOT EXISTS (
       SELECT 1
       FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) AS cfg(option)
       WHERE option LIKE 'search_path=%'
     );

  IF remaining > 0 THEN
    RAISE EXCEPTION
      'lock-search-path: % SECURITY DEFINER function(s) still unlocked (e.g. %)',
      remaining, example;
  END IF;
END $$;
