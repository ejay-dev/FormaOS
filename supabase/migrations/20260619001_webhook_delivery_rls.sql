-- Enable tenant-safe RLS for webhook delivery history.
--
-- Deliveries do not carry organization_id directly; they inherit tenancy from
-- webhook_configs. Keep user access read-only and let service-role workers
-- perform queue/delivery mutations.

BEGIN;

ALTER TABLE IF EXISTS public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.webhook_delivery_attempts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'webhook_deliveries'
  ) THEN
    DROP POLICY IF EXISTS webhook_deliveries_select ON public.webhook_deliveries;
    DROP POLICY IF EXISTS "webhook_deliveries_select" ON public.webhook_deliveries;
    DROP POLICY IF EXISTS webhook_deliveries_org_member_select ON public.webhook_deliveries;
    DROP POLICY IF EXISTS webhook_deliveries_service_role_all ON public.webhook_deliveries;
    DROP POLICY IF EXISTS "webhook_deliveries_org_isolation" ON public.webhook_deliveries;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'webhook_delivery_attempts'
  ) THEN
    DROP POLICY IF EXISTS webhook_delivery_attempts_org_member_select ON public.webhook_delivery_attempts;
    DROP POLICY IF EXISTS webhook_delivery_attempts_service_role_all ON public.webhook_delivery_attempts;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'webhook_deliveries'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'webhook_configs'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'webhook_configs'
      AND column_name = 'organization_id'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY webhook_deliveries_org_member_select
        ON public.webhook_deliveries
        FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1
            FROM public.webhook_configs wc
            WHERE wc.id = webhook_deliveries.webhook_id
              AND wc.organization_id IN (
                SELECT organization_id
                FROM public.current_user_org_ids()
              )
          )
        )
    $policy$;
  ELSIF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'webhook_deliveries'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'webhook_configs'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'webhook_configs'
      AND column_name = 'org_id'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY webhook_deliveries_org_member_select
        ON public.webhook_deliveries
        FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1
            FROM public.webhook_configs wc
            WHERE wc.id = webhook_deliveries.webhook_id
              AND wc.org_id IN (
                SELECT organization_id
                FROM public.current_user_org_ids()
              )
          )
        )
    $policy$;
  ELSE
    RAISE WARNING 'Skipping webhook_deliveries org-member policy: webhook_configs organization column was not found';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'webhook_deliveries'
  ) THEN
    CREATE POLICY webhook_deliveries_service_role_all
      ON public.webhook_deliveries
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'webhook_delivery_attempts'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'webhook_deliveries'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'webhook_configs'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'webhook_configs'
      AND column_name = 'organization_id'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY webhook_delivery_attempts_org_member_select
        ON public.webhook_delivery_attempts
        FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1
            FROM public.webhook_deliveries wd
            JOIN public.webhook_configs wc ON wc.id = wd.webhook_id
            WHERE wd.id = webhook_delivery_attempts.delivery_id
              AND wc.organization_id IN (
                SELECT organization_id
                FROM public.current_user_org_ids()
              )
          )
        )
    $policy$;
  ELSIF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'webhook_delivery_attempts'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'webhook_deliveries'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'webhook_configs'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'webhook_configs'
      AND column_name = 'org_id'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY webhook_delivery_attempts_org_member_select
        ON public.webhook_delivery_attempts
        FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1
            FROM public.webhook_deliveries wd
            JOIN public.webhook_configs wc ON wc.id = wd.webhook_id
            WHERE wd.id = webhook_delivery_attempts.delivery_id
              AND wc.org_id IN (
                SELECT organization_id
                FROM public.current_user_org_ids()
              )
          )
        )
    $policy$;
  ELSE
    RAISE WARNING 'Skipping webhook_delivery_attempts org-member policy: webhook_configs organization column was not found';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'webhook_delivery_attempts'
  ) THEN
    CREATE POLICY webhook_delivery_attempts_service_role_all
      ON public.webhook_delivery_attempts
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END
$$;

COMMIT;
