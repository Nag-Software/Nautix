-- FIX: Update RLS policy for admin_users to avoid infinite recursion

-- First, recreate the is_admin function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop ALL old policies
DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;
DROP POLICY IF EXISTS "Users can view their own admin status" ON admin_users;
DROP POLICY IF EXISTS "Admins can view all admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can grant admin status" ON admin_users;
DROP POLICY IF EXISTS "Admins can revoke admin status" ON admin_users;
DROP POLICY IF EXISTS "View own admin status" ON admin_users;
DROP POLICY IF EXISTS "Admin can grant admin status" ON admin_users;
DROP POLICY IF EXISTS "Admin can revoke admin status" ON admin_users;

-- Simple policy: Users can only view their own admin status
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

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'admin_users';
