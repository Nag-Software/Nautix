-- QUICK ADMIN SETUP
-- This bypasses RLS to add the first admin user

-- STEP 1: Find your email and user ID
SELECT id, email FROM auth.users ORDER BY created_at DESC;

-- STEP 2: Copy the UUID from above and paste it below
-- Replace 'PASTE-YOUR-USER-ID-HERE' with the actual UUID

-- First, disable RLS temporarily to insert first admin
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- Insert your user as admin
INSERT INTO admin_users (user_id, notes)
VALUES ('PASTE-YOUR-USER-ID-HERE', 'First admin user')
ON CONFLICT (user_id) DO NOTHING;

-- Re-enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Verify it worked
SELECT * FROM admin_users;

-- ALTERNATIVE: If you know your email, use this instead:
-- (Uncomment and replace the email)
/*
INSERT INTO admin_users (user_id, notes)
SELECT id, 'First admin user'
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (user_id) DO NOTHING;
*/
