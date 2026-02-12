-- Trust Packets: Secure shareable compliance snapshots
-- Enables enterprise sales friction reduction via self-service due diligence

CREATE TABLE IF NOT EXISTS trust_packets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  generated_by UUID NOT NULL REFERENCES auth.users(id),
  recipient_email TEXT,
  note TEXT,
  packet_data JSONB NOT NULL DEFAULT '{}',
  expires_at TIMESTAMPTZ NOT NULL,
  viewed_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_trust_packets_token ON trust_packets(token);
CREATE INDEX IF NOT EXISTS idx_trust_packets_org_id ON trust_packets(org_id);
CREATE INDEX IF NOT EXISTS idx_trust_packets_expires_at ON trust_packets(expires_at);

-- RLS policies
ALTER TABLE trust_packets ENABLE ROW LEVEL SECURITY;

-- Org members with owner/admin role can manage trust packets
CREATE POLICY "Org admins can manage trust packets"
  ON trust_packets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = trust_packets.org_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('owner', 'admin')
    )
  );

-- Public read access for valid, non-expired, non-revoked tokens
-- This enables the share link functionality
CREATE POLICY "Valid tokens are publicly readable"
  ON trust_packets
  FOR SELECT
  USING (
    expires_at > NOW()
    AND revoked_at IS NULL
  );

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_trust_packets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trust_packets_updated_at
  BEFORE UPDATE ON trust_packets
  FOR EACH ROW
  EXECUTE FUNCTION update_trust_packets_updated_at();
