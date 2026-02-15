-- Trigger to create a notification when a new comment is added
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS trigger AS $$
DECLARE
  v_post_author UUID;
  v_post_title VARCHAR;
BEGIN
  SELECT user_id, title INTO v_post_author, v_post_title FROM forum_posts WHERE id = NEW.post_id;

  -- If no post found or the commenter is the author, do nothing
  IF v_post_author IS NULL OR v_post_author = NEW.user_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO notifications (user_id, actor_id, type, post_id, comment_id, post_title, read, created_at)
  VALUES (v_post_author, NEW.user_id, 'comment', NEW.post_id, NEW.id, v_post_title, false, NOW());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_on_comment ON forum_comments;
CREATE TRIGGER trigger_notify_on_comment
  AFTER INSERT ON forum_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_comment();
