-- Post Views Tracking for Forum
-- Track when post authors last viewed their posts to show unread comment counts

-- Create table to track when authors last viewed their posts
CREATE TABLE IF NOT EXISTS forum_post_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_forum_post_views_post ON forum_post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_post_views_user ON forum_post_views(user_id);

-- RLS Policies
ALTER TABLE forum_post_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own post views" ON forum_post_views;
CREATE POLICY "Users can view own post views" ON forum_post_views
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own post views" ON forum_post_views;
CREATE POLICY "Users can update own post views" ON forum_post_views
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own post views" ON forum_post_views;
CREATE POLICY "Users can insert own post views" ON forum_post_views
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to update or insert last viewed timestamp
CREATE OR REPLACE FUNCTION update_post_view(p_post_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO forum_post_views (post_id, user_id, last_viewed_at)
  VALUES (p_post_id, auth.uid(), NOW())
  ON CONFLICT (post_id, user_id)
  DO UPDATE SET last_viewed_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread comment count for a post
CREATE OR REPLACE FUNCTION get_unread_comment_count(p_post_id UUID, p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_last_viewed TIMESTAMP WITH TIME ZONE;
  v_unread_count INTEGER;
BEGIN
  -- Get last viewed timestamp
  SELECT last_viewed_at INTO v_last_viewed
  FROM forum_post_views
  WHERE post_id = p_post_id AND user_id = p_user_id;
  
  -- If never viewed, count all comments
  IF v_last_viewed IS NULL THEN
    SELECT COUNT(*) INTO v_unread_count
    FROM forum_comments
    WHERE post_id = p_post_id;
  ELSE
    -- Count comments created after last view
    SELECT COUNT(*) INTO v_unread_count
    FROM forum_comments
    WHERE post_id = p_post_id 
    AND created_at > v_last_viewed
    AND user_id != p_user_id; -- Don't count user's own comments
  END IF;
  
  RETURN COALESCE(v_unread_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
