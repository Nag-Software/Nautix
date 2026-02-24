-- Add trial flags to user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS trial_used boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz;

-- Update comment
COMMENT ON COLUMN user_profiles.trial_used IS 'Whether the user has used the free trial (prevents multiple trials)';
COMMENT ON COLUMN user_profiles.trial_started_at IS 'Timestamp when trial was started';
