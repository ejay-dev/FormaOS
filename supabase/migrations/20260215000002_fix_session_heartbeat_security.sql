-- Fix session heartbeat security vulnerability
-- Remove p_user_id parameter and derive from auth.uid() to prevent forgery

-- Drop the existing vulnerable function
DROP FUNCTION IF EXISTS update_session_heartbeat(TEXT, UUID);

-- Create a secure version that derives user_id from auth.uid()
CREATE OR REPLACE FUNCTION update_session_heartbeat(p_session_id TEXT)
RETURNS void AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Derive user_id from authenticated session
  v_user_id := auth.uid();
  
  -- Reject if not authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required';
  END IF;

  -- Validate session_id format
  IF p_session_id IS NULL OR LENGTH(p_session_id) < 10 THEN
    RAISE EXCEPTION 'invalid_session_id';
  END IF;

  -- Update existing session
  UPDATE public.active_sessions
  SET last_seen_at = now()
  WHERE session_id = p_session_id
    AND user_id = v_user_id
    AND revoked_at IS NULL;
    
  -- If no rows updated, insert new session
  IF NOT FOUND THEN
    INSERT INTO public.active_sessions (session_id, user_id)
    VALUES (p_session_id, v_user_id)
    ON CONFLICT (session_id) DO UPDATE
    SET last_seen_at = now()
    WHERE active_sessions.user_id = v_user_id; -- Only update if user matches
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION update_session_heartbeat(TEXT) TO authenticated;

-- Add comment explaining the security fix
COMMENT ON FUNCTION update_session_heartbeat(TEXT) IS 
'Securely updates session heartbeat using auth.uid() to prevent forgery. Uses SECURITY DEFINER with safe search_path.';
