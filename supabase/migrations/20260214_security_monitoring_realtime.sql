-- Enable realtime publication for security monitoring tables.
-- Safe additive migration; no auth or business-flow changes.

BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.security_events;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.security_alerts;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.active_sessions;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.user_activity;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END IF;
END
$$;

ALTER TABLE public.security_events REPLICA IDENTITY FULL;
ALTER TABLE public.security_alerts REPLICA IDENTITY FULL;
ALTER TABLE public.active_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.user_activity REPLICA IDENTITY FULL;

COMMIT;
