-- Usage analytics: event tracking, summaries, engagement scoring

CREATE TABLE IF NOT EXISTS org_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  user_id UUID,
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usage_org_time ON org_usage_events(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_event ON org_usage_events(event_type, event_name);

CREATE TABLE IF NOT EXISTS org_usage_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  active_users INT DEFAULT 0,
  total_events INT DEFAULT 0,
  feature_usage JSONB DEFAULT '{}',
  engagement_score NUMERIC(5,2) DEFAULT 0,
  UNIQUE(org_id, period_start, period_type)
);

CREATE INDEX IF NOT EXISTS idx_usage_summaries_org ON org_usage_summaries(org_id, period_type, period_start DESC);

-- RLS
ALTER TABLE org_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_usage_summaries ENABLE ROW LEVEL SECURITY;

-- Admin-only access (service role bypasses RLS)
DO $$ BEGIN
  DROP POLICY IF EXISTS "usage_events_admin" ON org_usage_events;
  CREATE POLICY "usage_events_admin" ON org_usage_events FOR SELECT USING (false);
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "usage_summaries_admin" ON org_usage_summaries;
  CREATE POLICY "usage_summaries_admin" ON org_usage_summaries FOR SELECT USING (false);
END $$;
