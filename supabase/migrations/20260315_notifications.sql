-- =========================================================
-- Notifications, Delivery Preferences, Digests, Activity Feed
-- =========================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'notification_event_type'
  ) THEN
    CREATE TYPE public.notification_event_type AS ENUM (
      'task.assigned',
      'task.due_soon',
      'task.overdue',
      'task.completed',
      'evidence.review_requested',
      'evidence.approved',
      'evidence.rejected',
      'certificate.expiring_30d',
      'certificate.expiring_7d',
      'certificate.expired',
      'compliance.score_dropped',
      'compliance.score_improved',
      'compliance.gap_detected',
      'member.joined',
      'member.removed',
      'member.role_changed',
      'workflow.approval_requested',
      'workflow.completed',
      'workflow.failed',
      'incident.created',
      'incident.escalated',
      'incident.resolved',
      'system.maintenance',
      'system.release',
      'system.security_alert',
      'report.ready',
      'export.completed',
      'export.failed'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'notification_channel_type'
  ) THEN
    CREATE TYPE public.notification_channel_type AS ENUM (
      'in_app',
      'email',
      'slack',
      'teams'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'notification_digest_frequency'
  ) THEN
    CREATE TYPE public.notification_digest_frequency AS ENUM (
      'instant',
      'hourly',
      'daily',
      'weekly',
      'never'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'notification_priority'
  ) THEN
    CREATE TYPE public.notification_priority AS ENUM (
      'critical',
      'high',
      'normal',
      'low'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.notification_event_type NOT NULL,
  title text NOT NULL,
  body text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  priority public.notification_priority NOT NULL DEFAULT 'normal',
  dedupe_key text,
  read_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  channel public.notification_channel_type NOT NULL,
  event_type public.notification_event_type NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  digest_frequency public.notification_digest_frequency NOT NULL DEFAULT 'instant',
  quiet_hours jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (user_id, org_id, channel, event_type)
);

CREATE TABLE IF NOT EXISTS public.notification_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  channel_type public.notification_channel_type NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (user_id, org_id, channel_type)
);

CREATE TABLE IF NOT EXISTS public.activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  actor_name text,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  resource_name text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.notification_digest_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  frequency public.notification_digest_frequency NOT NULL,
  scheduled_for timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  sent_at timestamptz,
  UNIQUE (notification_id, frequency)
);

CREATE TABLE IF NOT EXISTS public.notification_digest_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  frequency public.notification_digest_frequency NOT NULL,
  digest_key text NOT NULL,
  notification_count integer NOT NULL DEFAULT 0,
  sent_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (user_id, digest_key)
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read_at
  ON public.notifications(user_id, read_at);

CREATE INDEX IF NOT EXISTS idx_notifications_org_created_at
  ON public.notifications(org_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_type
  ON public.notifications(user_id, type);

CREATE INDEX IF NOT EXISTS idx_notifications_user_archived_created
  ON public.notifications(user_id, archived_at, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_dedupe_key
  ON public.notifications(user_id, org_id, dedupe_key)
  WHERE dedupe_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notification_preferences_lookup
  ON public.notification_preferences(user_id, org_id, event_type, channel);

CREATE INDEX IF NOT EXISTS idx_notification_channels_lookup
  ON public.notification_channels(user_id, org_id, channel_type);

CREATE INDEX IF NOT EXISTS idx_activity_feed_org_created_at
  ON public.activity_feed(org_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_feed_actor_created_at
  ON public.activity_feed(actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_feed_resource_lookup
  ON public.activity_feed(org_id, resource_type, resource_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_digest_queue_pending
  ON public.notification_digest_queue(status, frequency, scheduled_for);

CREATE INDEX IF NOT EXISTS idx_notification_digest_history_sent_at
  ON public.notification_digest_history(user_id, frequency, sent_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_digest_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_digest_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
CREATE POLICY notifications_select_own
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
CREATE POLICY notifications_update_own
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS notification_preferences_manage_own ON public.notification_preferences;
CREATE POLICY notification_preferences_manage_own
  ON public.notification_preferences
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.org_members m
      WHERE m.organization_id = notification_preferences.org_id
        AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.org_members m
      WHERE m.organization_id = notification_preferences.org_id
        AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS notification_channels_manage_own ON public.notification_channels;
CREATE POLICY notification_channels_manage_own
  ON public.notification_channels
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.org_members m
      WHERE m.organization_id = notification_channels.org_id
        AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.org_members m
      WHERE m.organization_id = notification_channels.org_id
        AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS activity_feed_select_org_member ON public.activity_feed;
CREATE POLICY activity_feed_select_org_member
  ON public.activity_feed
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.org_members m
      WHERE m.organization_id = activity_feed.org_id
        AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS notification_digest_queue_block_clients ON public.notification_digest_queue;
CREATE POLICY notification_digest_queue_block_clients
  ON public.notification_digest_queue
  FOR SELECT
  TO authenticated
  USING (false);

DROP POLICY IF EXISTS notification_digest_history_block_clients ON public.notification_digest_history;
CREATE POLICY notification_digest_history_block_clients
  ON public.notification_digest_history
  FOR SELECT
  TO authenticated
  USING (false);

ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.activity_feed REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_feed;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;
END $$;
