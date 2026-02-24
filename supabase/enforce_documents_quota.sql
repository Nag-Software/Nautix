-- Prevent inserts into documents and document_links when user's documents quota is reached
-- Uses `user_profiles.plan` to determine limits.
-- Mapping:
--  - matros -> 15 documents
--  - maskinist -> 30 documents
--  - kaptein / others -> unlimited (0)

CREATE OR REPLACE FUNCTION public.check_documents_quota()
RETURNS TRIGGER AS $$
DECLARE
  current_count INT;
  user_plan TEXT;
  docs_limit INT := 0;
BEGIN
  -- Count existing documents + links for the user
  SELECT (
    COALESCE((SELECT COUNT(*) FROM documents WHERE user_id = NEW.user_id), 0)
    + COALESCE((SELECT COUNT(*) FROM document_links WHERE user_id = NEW.user_id), 0)
  ) INTO current_count;

  -- Get stored plan (if any)
  SELECT plan INTO user_plan FROM user_profiles WHERE id = NEW.user_id;

  IF user_plan IS NULL THEN
    RAISE EXCEPTION 'subscription_required: user has no active plan';
  END IF;

  IF lower(user_plan) LIKE '%matros%' THEN
    docs_limit := 15;
  ELSIF lower(user_plan) LIKE '%maskinist%' THEN
    docs_limit := 30;
  ELSE
    docs_limit := 0; -- unlimited for kaptein or others
  END IF;

  IF docs_limit > 0 AND current_count >= docs_limit THEN
    RAISE EXCEPTION 'documents_quota_exceeded: user has % items (limit %)', current_count, docs_limit;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach triggers for both tables
DROP TRIGGER IF EXISTS enforce_documents_quota_trigger ON public.documents;
CREATE TRIGGER enforce_documents_quota_trigger
BEFORE INSERT ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.check_documents_quota();

DROP TRIGGER IF EXISTS enforce_document_links_quota_trigger ON public.document_links;
CREATE TRIGGER enforce_document_links_quota_trigger
BEFORE INSERT ON public.document_links
FOR EACH ROW EXECUTE FUNCTION public.check_documents_quota();
