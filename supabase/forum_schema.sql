-- Forum Schema for Nautix
-- Categories, Posts, Comments, and User Stats with Point System

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Forum Categories
CREATE TABLE IF NOT EXISTS forum_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  slug VARCHAR(100) UNIQUE NOT NULL,
  icon VARCHAR(50),
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum Posts
CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum Comments
CREATE TABLE IF NOT EXISTS forum_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum Post Likes
CREATE TABLE IF NOT EXISTS forum_post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Forum Comment Likes
CREATE TABLE IF NOT EXISTS forum_comment_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES forum_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Forum User Stats (Points and Ranks)
CREATE TABLE IF NOT EXISTS forum_user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  rank VARCHAR(50) DEFAULT 'Matros',
  posts_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  likes_received INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_forum_posts_category ON forum_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_user ON forum_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created ON forum_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_comments_post ON forum_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_comments_user ON forum_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_post_likes_post ON forum_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_comment_likes_comment ON forum_comment_likes(comment_id);

-- Row Level Security
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_user_stats ENABLE ROW LEVEL SECURITY;

-- Policies for forum_categories (everyone can read)
DROP POLICY IF EXISTS "Anyone can view categories" ON forum_categories;
CREATE POLICY "Anyone can view categories" ON forum_categories
  FOR SELECT USING (true);

-- Policies for forum_posts
DROP POLICY IF EXISTS "Anyone can view posts" ON forum_posts;
CREATE POLICY "Anyone can view posts" ON forum_posts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create posts" ON forum_posts;
CREATE POLICY "Authenticated users can create posts" ON forum_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own posts" ON forum_posts;
CREATE POLICY "Users can update own posts" ON forum_posts
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own posts" ON forum_posts;
CREATE POLICY "Users can delete own posts" ON forum_posts
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for forum_comments
DROP POLICY IF EXISTS "Anyone can view comments" ON forum_comments;
CREATE POLICY "Anyone can view comments" ON forum_comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON forum_comments;
CREATE POLICY "Authenticated users can create comments" ON forum_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON forum_comments;
CREATE POLICY "Users can update own comments" ON forum_comments
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON forum_comments;
CREATE POLICY "Users can delete own comments" ON forum_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for forum_post_likes
DROP POLICY IF EXISTS "Anyone can view post likes" ON forum_post_likes;
CREATE POLICY "Anyone can view post likes" ON forum_post_likes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can like posts" ON forum_post_likes;
CREATE POLICY "Authenticated users can like posts" ON forum_post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike posts" ON forum_post_likes;
CREATE POLICY "Users can unlike posts" ON forum_post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for forum_comment_likes
DROP POLICY IF EXISTS "Anyone can view comment likes" ON forum_comment_likes;
CREATE POLICY "Anyone can view comment likes" ON forum_comment_likes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can like comments" ON forum_comment_likes;
CREATE POLICY "Authenticated users can like comments" ON forum_comment_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike comments" ON forum_comment_likes;
CREATE POLICY "Users can unlike comments" ON forum_comment_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for forum_user_stats
DROP POLICY IF EXISTS "Anyone can view user stats" ON forum_user_stats;
CREATE POLICY "Anyone can view user stats" ON forum_user_stats
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own stats" ON forum_user_stats;
CREATE POLICY "Users can update own stats" ON forum_user_stats
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert user stats" ON forum_user_stats;
CREATE POLICY "System can insert user stats" ON forum_user_stats
  FOR INSERT WITH CHECK (true);

-- Function to calculate rank based on points
CREATE OR REPLACE FUNCTION calculate_forum_rank(points INTEGER)
RETURNS VARCHAR(50) AS $$
BEGIN
  CASE
    WHEN points < 100 THEN RETURN 'Matros';
    WHEN points < 500 THEN RETURN 'Styrmann';
    WHEN points < 1500 THEN RETURN 'Overstyrrmann';
    WHEN points < 5000 THEN RETURN 'Kaptein';
    ELSE RETURN 'Skipsreder';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to update user stats and points
CREATE OR REPLACE FUNCTION update_forum_user_stats()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
  points_to_add INTEGER := 0;
BEGIN
  -- Determine which user's stats to update and how many points
  IF TG_TABLE_NAME = 'forum_posts' THEN
    IF TG_OP = 'INSERT' THEN
      target_user_id := NEW.user_id;
      points_to_add := 10; -- Points for creating a post
      
      -- Insert or update user stats
      INSERT INTO forum_user_stats (user_id, points, posts_count)
      VALUES (target_user_id, points_to_add, 1)
      ON CONFLICT (user_id) DO UPDATE
      SET points = forum_user_stats.points + points_to_add,
          posts_count = forum_user_stats.posts_count + 1,
          rank = calculate_forum_rank(forum_user_stats.points + points_to_add),
          updated_at = NOW();
      
      -- Update category post count
      UPDATE forum_categories 
      SET post_count = post_count + 1 
      WHERE id = NEW.category_id;
    
    ELSIF TG_OP = 'DELETE' THEN
      -- Decrease category post count
      UPDATE forum_categories 
      SET post_count = GREATEST(0, post_count - 1)
      WHERE id = OLD.category_id;
      
      -- Decrease user posts count and points
      UPDATE forum_user_stats
      SET points = GREATEST(0, points - 10),
          posts_count = GREATEST(0, posts_count - 1),
          rank = calculate_forum_rank(GREATEST(0, points - 10)),
          updated_at = NOW()
      WHERE user_id = OLD.user_id;
    
    ELSIF TG_OP = 'UPDATE' THEN
      -- If category changed, update both old and new category counts
      IF OLD.category_id != NEW.category_id THEN
        UPDATE forum_categories 
        SET post_count = GREATEST(0, post_count - 1)
        WHERE id = OLD.category_id;
        
        UPDATE forum_categories 
        SET post_count = post_count + 1 
        WHERE id = NEW.category_id;
      END IF;
    END IF;
    
  ELSIF TG_TABLE_NAME = 'forum_comments' THEN
    IF TG_OP = 'INSERT' THEN
      target_user_id := NEW.user_id;
      points_to_add := 5; -- Points for creating a comment
      
      -- Insert or update user stats
      INSERT INTO forum_user_stats (user_id, points, comments_count)
      VALUES (target_user_id, points_to_add, 1)
      ON CONFLICT (user_id) DO UPDATE
      SET points = forum_user_stats.points + points_to_add,
          comments_count = forum_user_stats.comments_count + 1,
          rank = calculate_forum_rank(forum_user_stats.points + points_to_add),
          updated_at = NOW();
      
      -- Update post comment count
      UPDATE forum_posts 
      SET comment_count = comment_count + 1 
      WHERE id = NEW.post_id;
      
    ELSIF TG_OP = 'DELETE' THEN
      -- Decrease user comments count and points when comment is deleted
      UPDATE forum_user_stats
      SET points = GREATEST(0, points - 5),
          comments_count = GREATEST(0, comments_count - 1),
          rank = calculate_forum_rank(GREATEST(0, points - 5)),
          updated_at = NOW()
      WHERE user_id = OLD.user_id;
      
      -- Update post comment count
      UPDATE forum_posts 
      SET comment_count = GREATEST(0, comment_count - 1)
      WHERE id = OLD.post_id;
    END IF;
    
  ELSIF TG_TABLE_NAME = 'forum_post_likes' THEN
    IF TG_OP = 'INSERT' THEN
      -- Get the post author
      SELECT user_id INTO target_user_id FROM forum_posts WHERE id = NEW.post_id;
      points_to_add := 2; -- Points for receiving a like on post
      
      -- Update post like count
      UPDATE forum_posts 
      SET like_count = like_count + 1 
      WHERE id = NEW.post_id;
      
      -- Update author's stats
      INSERT INTO forum_user_stats (user_id, points, likes_received)
      VALUES (target_user_id, points_to_add, 1)
      ON CONFLICT (user_id) DO UPDATE
      SET points = forum_user_stats.points + points_to_add,
          likes_received = forum_user_stats.likes_received + 1,
          rank = calculate_forum_rank(forum_user_stats.points + points_to_add),
          updated_at = NOW();
          
    ELSIF TG_OP = 'DELETE' THEN
      -- Get the post author
      SELECT user_id INTO target_user_id FROM forum_posts WHERE id = OLD.post_id;
      
      -- Update post like count
      UPDATE forum_posts 
      SET like_count = GREATEST(0, like_count - 1)
      WHERE id = OLD.post_id;
      
      -- Update author's stats
      UPDATE forum_user_stats
      SET points = GREATEST(0, points - 2),
          likes_received = GREATEST(0, likes_received - 1),
          rank = calculate_forum_rank(GREATEST(0, points - 2)),
          updated_at = NOW()
      WHERE user_id = target_user_id;
    END IF;
    
  ELSIF TG_TABLE_NAME = 'forum_comment_likes' THEN
    IF TG_OP = 'INSERT' THEN
      -- Get the comment author
      SELECT user_id INTO target_user_id FROM forum_comments WHERE id = NEW.comment_id;
      points_to_add := 1; -- Points for receiving a like on comment
      
      -- Update comment like count
      UPDATE forum_comments 
      SET like_count = like_count + 1 
      WHERE id = NEW.comment_id;
      
      -- Update author's stats
      INSERT INTO forum_user_stats (user_id, points, likes_received)
      VALUES (target_user_id, points_to_add, 1)
      ON CONFLICT (user_id) DO UPDATE
      SET points = forum_user_stats.points + points_to_add,
          likes_received = forum_user_stats.likes_received + 1,
          rank = calculate_forum_rank(forum_user_stats.points + points_to_add),
          updated_at = NOW();
          
    ELSIF TG_OP = 'DELETE' THEN
      -- Get the comment author
      SELECT user_id INTO target_user_id FROM forum_comments WHERE id = OLD.comment_id;
      
      -- Update comment like count
      UPDATE forum_comments 
      SET like_count = GREATEST(0, like_count - 1)
      WHERE id = OLD.comment_id;
      
      -- Update author's stats
      UPDATE forum_user_stats
      SET points = GREATEST(0, points - 1),
          likes_received = GREATEST(0, likes_received - 1),
          rank = calculate_forum_rank(GREATEST(0, points - 1)),
          updated_at = NOW()
      WHERE user_id = target_user_id;
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS forum_posts_stats_trigger ON forum_posts;
CREATE TRIGGER forum_posts_stats_trigger
  AFTER INSERT OR DELETE OR UPDATE ON forum_posts
  FOR EACH ROW EXECUTE FUNCTION update_forum_user_stats();

DROP TRIGGER IF EXISTS forum_comments_stats_trigger ON forum_comments;
CREATE TRIGGER forum_comments_stats_trigger
  AFTER INSERT OR DELETE ON forum_comments
  FOR EACH ROW EXECUTE FUNCTION update_forum_user_stats();

DROP TRIGGER IF EXISTS forum_post_likes_stats_trigger ON forum_post_likes;
CREATE TRIGGER forum_post_likes_stats_trigger
  AFTER INSERT OR DELETE ON forum_post_likes
  FOR EACH ROW EXECUTE FUNCTION update_forum_user_stats();

DROP TRIGGER IF EXISTS forum_comment_likes_stats_trigger ON forum_comment_likes;
CREATE TRIGGER forum_comment_likes_stats_trigger
  AFTER INSERT OR DELETE ON forum_comment_likes
  FOR EACH ROW EXECUTE FUNCTION update_forum_user_stats();

-- Insert default categories
INSERT INTO forum_categories (name, description, slug, icon) VALUES
  ('Generelt', 'Generelle diskusjoner om båtliv', 'generelt', '💬'),
  ('Vedlikehold', 'Spørsmål og tips om båtvedlikehold', 'vedlikehold', '🔧'),
  ('Utstyr', 'Diskusjoner om utstyr og tilbehør', 'utstyr', '⚓'),
  ('Navigasjon', 'Tips og triks for navigasjon', 'navigasjon', '🧭'),
  ('Motor', 'Alt om motorer og tekniske spørsmål', 'motor', '⚙️'),
  ('Reiser', 'Del dine båtturer og reisetips', 'reiser', '🗺️')
ON CONFLICT (slug) DO NOTHING;

-- Function to increment post views
CREATE OR REPLACE FUNCTION increment_post_views(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE forum_posts
  SET view_count = view_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
