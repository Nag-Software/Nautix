-- Migration: Add threaded comment support
-- This adds the ability for comments to be replies to other comments

-- Add parent_comment_id column to forum_comments
ALTER TABLE forum_comments 
ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES forum_comments(id) ON DELETE CASCADE;

-- Add depth column to track nesting level (for UI optimization)
ALTER TABLE forum_comments 
ADD COLUMN IF NOT EXISTS depth INTEGER DEFAULT 0;

-- Add reply_count column to track number of direct replies
ALTER TABLE forum_comments 
ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0;

-- Create index for better performance when fetching replies
CREATE INDEX IF NOT EXISTS idx_forum_comments_parent ON forum_comments(parent_comment_id);

-- Function to update reply count and depth when a new reply is added
CREATE OR REPLACE FUNCTION update_comment_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_comment_id IS NOT NULL THEN
    -- Increment reply count on parent comment
    UPDATE forum_comments
    SET reply_count = reply_count + 1
    WHERE id = NEW.parent_comment_id;
    
    -- Set depth based on parent's depth (this runs AFTER insert, so NEW.id exists)
    UPDATE forum_comments
    SET depth = COALESCE((
      SELECT depth + 1
      FROM forum_comments
      WHERE id = NEW.parent_comment_id
    ), 1)
    WHERE id = NEW.id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_comment_id IS NOT NULL THEN
    -- Decrement reply count on parent comment
    UPDATE forum_comments
    SET reply_count = GREATEST(reply_count - 1, 0)
    WHERE id = OLD.parent_comment_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for reply count
DROP TRIGGER IF EXISTS trigger_update_comment_reply_count ON forum_comments;
CREATE TRIGGER trigger_update_comment_reply_count
  AFTER INSERT OR DELETE ON forum_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_reply_count();

-- Create a function to get all replies for a comment (recursive)
CREATE OR REPLACE FUNCTION get_comment_tree(comment_id UUID)
RETURNS TABLE (
  id UUID,
  post_id UUID,
  user_id UUID,
  content TEXT,
  parent_comment_id UUID,
  depth INTEGER,
  like_count INTEGER,
  reply_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE comment_tree AS (
    -- Base case: the target comment
    SELECT 
      c.id,
      c.post_id,
      c.user_id,
      c.content,
      c.parent_comment_id,
      c.depth,
      c.like_count,
      c.reply_count,
      c.created_at,
      c.updated_at
    FROM forum_comments c
    WHERE c.id = comment_id
    
    UNION ALL
    
    -- Recursive case: all child comments
    SELECT 
      c.id,
      c.post_id,
      c.user_id,
      c.content,
      c.parent_comment_id,
      c.depth,
      c.like_count,
      c.reply_count,
      c.created_at,
      c.updated_at
    FROM forum_comments c
    INNER JOIN comment_tree ct ON c.parent_comment_id = ct.id
  )
  SELECT * FROM comment_tree ORDER BY created_at ASC;
END;
$$ LANGUAGE plpgsql;
