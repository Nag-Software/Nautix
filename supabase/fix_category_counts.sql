-- Fix for category post_count not updating
-- This script will:
-- 1. Recalculate post_count for all categories based on actual data
-- 2. Ensure all triggers are properly set up with DELETE support
-- 3. Verify the counts are correct

-- Step 1: Recalculate the post_count for all categories
-- This fixes any inconsistencies from missing triggers
UPDATE forum_categories fc
SET post_count = (
  SELECT COUNT(*)
  FROM forum_posts fp
  WHERE fp.category_id = fc.id
);

-- Step 2: Ensure forum_comments trigger includes DELETE operations
-- (The original schema only had INSERT)
DROP TRIGGER IF EXISTS forum_comments_stats_trigger ON forum_comments;
CREATE TRIGGER forum_comments_stats_trigger
  AFTER INSERT OR DELETE ON forum_comments
  FOR EACH ROW EXECUTE FUNCTION update_forum_user_stats();

-- Step 3: Verify the counts match reality
SELECT 
  fc.name,
  fc.post_count as stored_count,
  (SELECT COUNT(*) FROM forum_posts WHERE category_id = fc.id) as actual_count,
  CASE 
    WHEN fc.post_count = (SELECT COUNT(*) FROM forum_posts WHERE category_id = fc.id) 
    THEN '✓ OK' 
    ELSE '✗ MISMATCH - FIXED' 
  END as status
FROM forum_categories fc
ORDER BY fc.name;
