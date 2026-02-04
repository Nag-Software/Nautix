# Quick Start: Assigning Admin Users in Supabase

## Step-by-Step Guide

### 1. Run the Admin Setup SQL

First, you need to create the admin infrastructure in your database:

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Select your Nautix project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the entire content from `/supabase/admin_setup.sql`
6. Click **Run** or press `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac)

This creates:
- `admin_users` table
- Admin access policies
- Helper functions
- Analytics views

### 2. Find the User ID

In the same SQL Editor, run this query to find the user you want to make admin:

```sql
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;
```

Copy the `id` (UUID) of the user you want to make admin.

### 3. Make the User an Admin

Run this query, replacing `YOUR-USER-UUID-HERE` with the actual user ID:

```sql
INSERT INTO admin_users (user_id, notes)
VALUES ('YOUR-USER-UUID-HERE', 'First admin user - full system access');
```

Example:
```sql
INSERT INTO admin_users (user_id, notes)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Primary admin');
```

### 4. Verify Admin Access

Check that the admin was added successfully:

```sql
SELECT 
  au.user_id,
  u.email,
  au.granted_at,
  au.notes
FROM admin_users au
JOIN auth.users u ON u.id = au.user_id;
```

### 5. Test the Admin Panel

1. Log out of Nautix (if currently logged in)
2. Log in with the admin user account
3. Navigate to: `https://yourdomain.com/sjefen`
4. You should see the full admin dashboard!

## Quick Commands Reference

### Add Admin
```sql
INSERT INTO admin_users (user_id, notes)
VALUES ('user-uuid-here', 'Description of admin');
```

### Remove Admin
```sql
DELETE FROM admin_users 
WHERE user_id = 'user-uuid-here';
```

### List All Admins
```sql
SELECT 
  au.*,
  u.email
FROM admin_users au
JOIN auth.users u ON u.id = au.user_id;
```

### Check if Specific User is Admin
```sql
SELECT is_admin('user-uuid-here');
-- Returns: true or false
```

## Important Notes

⚠️ **Security**:
- Keep admin access restricted to trusted users only
- Admin users have full access to all user data
- All admin actions should be monitored

💡 **Tips**:
- Always add a descriptive note when creating admins
- Test admin access after adding
- Keep at least 2 admins to avoid lockout

## After First Admin Setup

Once you have one admin user:
1. Log in to the admin panel at `/sjefen`
2. Go to the **Brukere** (Users) tab
3. Use the GUI to manage future admin assignments
4. Click "Gi Admin" next to any user to promote them

## Troubleshooting

**Can't access `/sjefen`**
- Verify user is in `admin_users` table
- Clear browser cache and cookies
- Log out and log back in

**"Unauthorized" error**
- Check that `admin_setup.sql` was run completely
- Verify RLS policies are enabled
- Check Supabase logs for errors

**No users showing in admin panel**
- Verify you're using the correct Supabase project
- Check that users actually exist in `auth.users`
- Ensure Service Role Key is set (if needed)

## Need Help?

See the full documentation in `ADMIN_SETUP.md` for detailed information about:
- Admin panel features
- Security configuration  
- Database schema
- Advanced troubleshooting
