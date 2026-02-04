-- DEBUGGING SCRIPT FOR ADMIN ACCESS
-- Run these queries one by one to diagnose and fix the issue

-- Step 1: Check if admin_users table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'admin_users'
) AS table_exists;

-- Step 2: Check current user (you should be logged in)
SELECT auth.uid() as my_user_id;

-- Step 3: Find your user in auth.users
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC
LIMIT 5;

-- Step 4: Check if you're already an admin
SELECT * FROM admin_users;

-- Step 5: Add yourself as admin (REPLACE 'your-email@example.com' with your actual email)
-- First, get your user ID:
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Replace with your actual email
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'your-email@example.com';
  
  IF v_user_id IS NOT NULL THEN
    -- Insert into admin_users
    INSERT INTO admin_users (user_id, notes)
    VALUES (v_user_id, 'First admin - added via debug script')
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'Admin access granted to user: %', v_user_id;
  ELSE
    RAISE NOTICE 'User not found with that email';
  END IF;
END $$;

-- Step 6: Verify admin was added
SELECT 
  au.user_id,
  au.granted_at,
  au.notes,
  u.email
FROM admin_users au
JOIN auth.users u ON u.id = au.user_id;

-- Step 7: Test the is_admin function
SELECT is_admin(auth.uid()) as am_i_admin;

-- QUICK FIX: If table doesn't exist, create it quickly:
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;
CREATE POLICY "Admins can view admin users"
  ON admin_users FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

DROP POLICY IF EXISTS "Admins can grant admin status" ON admin_users;
CREATE POLICY "Admins can grant admin status"
  ON admin_users FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );

DROP POLICY IF EXISTS "Admins can revoke admin status" ON admin_users;
CREATE POLICY "Admins can revoke admin status"
  ON admin_users FOR DELETE
  USING (
    auth.uid() IN (SELECT user_id FROM admin_users)
  );
