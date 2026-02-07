-- Sync user_profiles.display_name with user_metadata.full_name
-- This ensures the forum displays the correct name from profile settings

-- Update the handle_new_user function to use full_name from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'display_name',
      SPLIT_PART(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to sync profile when user metadata is updated
CREATE OR REPLACE FUNCTION public.handle_user_metadata_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user_profiles when user metadata changes
  UPDATE public.user_profiles
  SET 
    display_name = COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'display_name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    email = NEW.email,
    updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Create trigger for user metadata updates
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (
    OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data
    OR OLD.email IS DISTINCT FROM NEW.email
  )
  EXECUTE FUNCTION public.handle_user_metadata_update();

-- Backfill/sync existing users with current metadata
UPDATE user_profiles up
SET 
  display_name = COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'display_name',
    SPLIT_PART(au.email, '@', 1)
  ),
  email = au.email,
  updated_at = NOW()
FROM auth.users au
WHERE up.id = au.id;
