-- AI Chat conversations
CREATE TABLE IF NOT EXISTS ai_chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text DEFAULT 'New conversation',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

-- AI Chat messages
CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES ai_chat_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_chat_conversations_org ON ai_chat_conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_conversations_user ON ai_chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_conv ON ai_chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_created ON ai_chat_messages(conversation_id, created_at);

-- RLS
ALTER TABLE ai_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can see their own conversations in their org
CREATE POLICY ai_chat_conversations_select ON ai_chat_conversations
  FOR SELECT USING (
    user_id = auth.uid() AND
    organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
  );

CREATE POLICY ai_chat_conversations_insert ON ai_chat_conversations
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
  );

CREATE POLICY ai_chat_conversations_update ON ai_chat_conversations
  FOR UPDATE USING (
    user_id = auth.uid()
  );

-- Messages inherit access from conversation
CREATE POLICY ai_chat_messages_select ON ai_chat_messages
  FOR SELECT USING (
    conversation_id IN (SELECT id FROM ai_chat_conversations WHERE user_id = auth.uid())
  );

CREATE POLICY ai_chat_messages_insert ON ai_chat_messages
  FOR INSERT WITH CHECK (
    conversation_id IN (SELECT id FROM ai_chat_conversations WHERE user_id = auth.uid())
  );

-- Service role can always access (for API routes)
CREATE POLICY ai_chat_conversations_service ON ai_chat_conversations
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY ai_chat_messages_service ON ai_chat_messages
  FOR ALL USING (auth.role() = 'service_role');
