-- Add last_seen_at to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_seen 
ON user_profiles(last_seen_at DESC);

-- Function to update last_seen_at
CREATE OR REPLACE FUNCTION update_last_seen(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles
  SET last_seen_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_last_seen(UUID) TO authenticated;

-- First ensure all users have a profile entry
INSERT INTO user_profiles (id, email, display_name)
SELECT 
  id, 
  email,
  COALESCE(raw_user_meta_data->>'display_name', SPLIT_PART(email, '@', 1)) as display_name
FROM auth.users
WHERE id NOT IN (SELECT id FROM user_profiles)
ON CONFLICT (id) DO NOTHING;

-- Then backfill existing users with their last_sign_in_at from auth.users
UPDATE user_profiles up
SET last_seen_at = COALESCE(u.last_sign_in_at, u.created_at)
FROM auth.users u
WHERE up.id = u.id;

COMMENT ON COLUMN user_profiles.last_seen_at IS 'Last time user was active on Nautix';
COMMENT ON FUNCTION update_last_seen IS 'Updates user last_seen_at timestamp';
