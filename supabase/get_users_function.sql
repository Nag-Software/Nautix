-- Create function to get all users with stats (admin only)
CREATE OR REPLACE FUNCTION get_all_users_with_stats()
RETURNS TABLE (
  id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  boat_count BIGINT,
  conversation_count BIGINT,
  is_admin BOOLEAN
) AS $$
BEGIN
  -- Check if caller is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.email::TEXT,
    u.created_at,
    u.last_sign_in_at,
    COALESCE(b.boat_count, 0) as boat_count,
    COALESCE(c.conversation_count, 0) as conversation_count,
    EXISTS(SELECT 1 FROM admin_users au WHERE au.user_id = u.id) as is_admin
  FROM auth.users u
  LEFT JOIN (
    SELECT user_id, COUNT(*) as boat_count
    FROM boats
    GROUP BY user_id
  ) b ON b.user_id = u.id
  LEFT JOIN (
    SELECT user_id, COUNT(*) as conversation_count
    FROM conversations
    GROUP BY user_id
  ) c ON c.user_id = u.id
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION get_all_users_with_stats IS 'Returns all users with their stats - admin only';
