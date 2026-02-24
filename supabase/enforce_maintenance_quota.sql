-- Prevent inserts into maintenance_log when user's maintenance log quota is reached
-- This uses the `plan` column on `user_profiles` to determine limits.
-- Mapping:
--  - matros -> 15 logs
--  - maskinist -> 30 logs
--  - kaptein / others -> unlimited (0)

CREATE OR REPLACE FUNCTION public.check_maintenance_quota()
RETURNS TRIGGER AS $$
DECLARE
  current_count INT;
  user_plan TEXT;
  logs_limit INT := 0;
BEGIN
  -- Count existing logs for the user
  SELECT COUNT(*) INTO current_count FROM maintenance_log WHERE user_id = NEW.user_id;

  -- Get stored plan (if any)
  SELECT plan INTO user_plan FROM user_profiles WHERE id = NEW.user_id;

  IF user_plan IS NULL THEN
    RAISE EXCEPTION 'subscription_required: user has no active plan';
  END IF;

  IF lower(user_plan) LIKE '%matros%' THEN
    logs_limit := 15;
  ELSIF lower(user_plan) LIKE '%maskinist%' THEN
    logs_limit := 30;
  ELSE
    logs_limit := 0; -- unlimited for kaptein or others
  END IF;

  IF logs_limit > 0 AND current_count >= logs_limit THEN
    RAISE EXCEPTION 'maintenance_log_quota_exceeded: user has % logs (limit %)', current_count, logs_limit;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger
DROP TRIGGER IF EXISTS enforce_maintenance_quota_trigger ON public.maintenance_log;
CREATE TRIGGER enforce_maintenance_quota_trigger
BEFORE INSERT ON public.maintenance_log
FOR EACH ROW EXECUTE FUNCTION public.check_maintenance_quota();
