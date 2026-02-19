-- Fix trust packet security vulnerability
-- Remove public row policy and add token-validated RPC function

-- Drop the existing public read policy
DROP POLICY IF EXISTS "Valid tokens are publicly readable" ON trust_packets;

-- Create a secure RPC function to retrieve trust packet by token
CREATE OR REPLACE FUNCTION get_trust_packet_by_token(p_token TEXT)
RETURNS TABLE (
  id UUID,
  org_id UUID,
  packet_data JSONB,
  expires_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  view_count INTEGER,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Validate token format
  IF p_token IS NULL OR LENGTH(p_token) < 10 THEN
    RAISE EXCEPTION 'invalid_token';
  END IF;

  -- Return packet data only if token is valid, not expired, and not revoked
  RETURN QUERY
  SELECT
    tp.id,
    tp.org_id,
    tp.packet_data,
    tp.expires_at,
    tp.viewed_at,
    tp.view_count,
    tp.revoked_at,
    tp.created_at
  FROM trust_packets tp
  WHERE tp.token = p_token
    AND tp.expires_at > NOW()
    AND tp.revoked_at IS NULL;

  -- Update view count and viewed_at timestamp
  UPDATE trust_packets
  SET 
    view_count = view_count + 1,
    viewed_at = CASE WHEN viewed_at IS NULL THEN NOW() ELSE viewed_at END
  WHERE token = p_token
    AND expires_at > NOW()
    AND revoked_at IS NULL;
    
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Grant execute to anonymous (needed for share links) and authenticated users
GRANT EXECUTE ON FUNCTION get_trust_packet_by_token(TEXT) TO anon, authenticated;

-- Add comment explaining the security model
COMMENT ON FUNCTION get_trust_packet_by_token(TEXT) IS 
'Securely retrieves trust packet data by token. Uses SECURITY DEFINER with search_path set for safety. Only returns non-expired, non-revoked packets.';
