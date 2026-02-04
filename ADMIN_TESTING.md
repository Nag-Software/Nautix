# Testing the Admin Panel - Quick Guide

## Prerequisites
1. Make sure your Supabase database is set up
2. Run the admin setup SQL (see ADMIN_QUICK_START.md)
3. Create your first admin user

## Steps to Test

### 1. Set Up Database
Run this SQL in Supabase SQL Editor:
```sql
-- Copy entire content from supabase/admin_setup.sql and run it
```

### 2. Create First Admin User
```sql
-- Find your user ID
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Make yourself admin (replace the UUID)
INSERT INTO admin_users (user_id, notes)
VALUES ('your-user-uuid-here', 'First admin - testing');
```

### 3. Access Admin Panel
1. Start the development server:
   ```bash
   pnpm dev
   ```

2. Log in to your account

3. Navigate to: `http://localhost:3000/sjefen`

4. You should see the admin dashboard with three tabs:
   - **Oversikt** - Dashboard with charts and statistics
   - **Brukere** - User management
   - **Support** - Support ticket management

### 4. Test Features

#### Dashboard (Oversikt tab)
✅ View total users, boats, tickets, and rating
✅ See user growth chart
✅ Check system overview bar chart
✅ View activity pie chart
✅ Review database statistics

#### User Management (Brukere tab)
✅ Search for users by email
✅ View user details (click "Detaljer")
✅ Grant admin access (click "Gi Admin")
✅ Revoke admin access (click "Fjern Admin")
✅ Delete users (click "Slett" - be careful!)

#### Support Tickets (Support tab)
✅ View all support tickets
✅ Update ticket status (open → in-progress → resolved → closed)
✅ See priority levels and creation dates

### 5. Security Tests

#### Test Non-Admin Access
1. Create a test user WITHOUT admin access
2. Try to access `/sjefen`
3. Should redirect to home page (/)

#### Test Middleware Protection
1. Log out
2. Try to access `/sjefen` directly
3. Should redirect to `/login`

## Common Issues

### "Cannot access /sjefen"
- Check that you're logged in
- Verify your user is in `admin_users` table
- Clear cookies and log in again

### "No data showing"
- Make sure you have some test data in the database
- Check Supabase connection
- Verify RLS policies are working

### Charts not rendering
- Check browser console for errors
- Ensure recharts is installed: `pnpm add recharts`
- Verify data is being fetched correctly

## Next Steps

Once testing is successful:
1. Deploy to production
2. Set up production admin users
3. Monitor admin activity
4. Configure backup admins

## Screenshots to Verify

You should see:
- 📊 Multiple colorful charts on the Oversikt tab
- 👥 A table of users on the Brukere tab
- 🎫 Support tickets table on the Support tab
- 🎨 Modern, clean UI with proper styling
- 📱 Responsive design on mobile

## Troubleshooting SQL

If you get errors, run these checks:
```sql
-- Check if admin_users table exists
SELECT * FROM admin_users;

-- Check if you're an admin
SELECT is_admin(auth.uid());

-- View all admin users
SELECT 
  au.user_id,
  u.email,
  au.granted_at
FROM admin_users au
JOIN auth.users u ON u.id = au.user_id;
```

Happy testing! 🚀
