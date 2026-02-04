-- Admin Setup for Nautix
-- This file adds admin functionality to the database

-- Create admin_users table to track admin status
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Enable RLS on admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Simple policy: Users can only view their own admin status (no recursion)
CREATE POLICY "View own admin status"
  ON admin_users FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can insert new admins (using function to avoid recursion)
CREATE POLICY "Admin can grant admin status"
  ON admin_users FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- Admins can delete admins (using function to avoid recursion)
CREATE POLICY "Admin can revoke admin status"
  ON admin_users FOR DELETE
  USING (is_admin(auth.uid()));

-- Create admin-only policies for all tables to allow admins to view all data

-- Boats - Admin can view all
CREATE POLICY "Admins can view all boats"
  ON boats FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- Engines - Admin can view all
CREATE POLICY "Admins can view all engines"
  ON engines FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- Equipment - Admin can view all
CREATE POLICY "Admins can view all equipment"
  ON equipment FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- Documents - Admin can view all
CREATE POLICY "Admins can view all documents"
  ON documents FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- Document links - Admin can view all
CREATE POLICY "Admins can view all document links"
  ON document_links FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- Maintenance logs - Admin can view all
CREATE POLICY "Admins can view all maintenance logs"
  ON maintenance_log FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- Reminders - Admin can view all
CREATE POLICY "Admins can view all reminders"
  ON reminders FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- Support tickets - Admin can view all
CREATE POLICY "Admins can view all support tickets"
  ON support_tickets FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

CREATE POLICY "Admins can update all support tickets"
  ON support_tickets FOR UPDATE
  USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- Feedback - Admin can view all
CREATE POLICY "Admins can view all feedback"
  ON feedback FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- Conversations - Admin can view all
CREATE POLICY "Admins can view all conversations"
  ON conversations FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- Messages - Admin can view all
CREATE POLICY "Admins can view all messages"
  ON messages FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

-- Create indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);

-- Create a function to check if a user is an admin
-- SECURITY DEFINER bypasses RLS to avoid recursion
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create a function to get user count (admin only)
CREATE OR REPLACE FUNCTION get_user_count()
RETURNS INTEGER AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Check if caller is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  -- Count users from auth.users
  SELECT COUNT(*)::INTEGER INTO user_count FROM auth.users;
  
  RETURN user_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for admin analytics
CREATE OR REPLACE VIEW admin_analytics AS
SELECT
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM boats) as total_boats,
  (SELECT COUNT(*) FROM engines) as total_engines,
  (SELECT COUNT(*) FROM equipment) as total_equipment,
  (SELECT COUNT(*) FROM documents) as total_documents,
  (SELECT COUNT(*) FROM maintenance_log) as total_maintenance_logs,
  (SELECT COUNT(*) FROM reminders) as total_reminders,
  (SELECT COUNT(*) FROM support_tickets WHERE status = 'open') as open_tickets,
  (SELECT AVG(rating)::DECIMAL(3,2) FROM feedback) as average_rating,
  (SELECT COUNT(*) FROM conversations) as total_conversations,
  (SELECT COUNT(*) FROM messages) as total_messages;

-- Grant access to admin_analytics view for admins only
ALTER VIEW admin_analytics OWNER TO postgres;
GRANT SELECT ON admin_analytics TO authenticated;

COMMENT ON TABLE admin_users IS 'Tracks which users have admin privileges';
COMMENT ON FUNCTION is_admin IS 'Returns true if the given user_id has admin privileges';
COMMENT ON VIEW admin_analytics IS 'Aggregate statistics for admin dashboard';

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

-- ============================================
-- IMPORTANT: ADD YOUR FIRST ADMIN USER
-- ============================================
-- After running this script, you need to add your first admin user.
-- Run ONE of these commands:

-- Option 1: If you know your email
-- INSERT INTO admin_users (user_id, notes)
-- SELECT id, 'First admin user'
-- FROM auth.users
-- WHERE email = 'your-email@example.com';

-- Option 2: If you know your user ID
-- INSERT INTO admin_users (user_id, notes)
-- VALUES ('your-user-id-uuid-here', 'First admin user');

-- Option 3: Find all users and pick one
-- SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;
-- Then use Option 1 or 2 above with the correct email/ID

-- To verify admin was added:
-- SELECT au.*, u.email FROM admin_users au JOIN auth.users u ON u.id = au.user_id;
