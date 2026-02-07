-- Fix RLS issue for forum_user_stats when users like posts/comments
-- The trigger function needs to run with elevated privileges to update
-- the stats of the post/comment author, not just the liker

-- Recreate the function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION update_forum_user_stats()
RETURNS TRIGGER 
SECURITY DEFINER  -- This allows the function to bypass RLS policies
SET search_path = public
AS $$
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
