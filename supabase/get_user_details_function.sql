-- Create function to get detailed user data (admin only)
CREATE OR REPLACE FUNCTION get_user_details(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Check if caller is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  SELECT json_build_object(
    'user', (
      SELECT json_build_object(
        'id', u.id,
        'email', u.email,
        'created_at', u.created_at,
        'last_seen_at', COALESCE(up.last_seen_at, u.last_sign_in_at, u.created_at)
      )
      FROM auth.users u
      LEFT JOIN user_profiles up ON up.id = u.id
      WHERE u.id = target_user_id
    ),
    'boats', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', b.id,
          'name', b.name,
          'type', b.type,
          'manufacturer', b.manufacturer,
          'model', b.model,
          'year', b.year,
          'created_at', b.created_at
        )
      ), '[]'::json)
      FROM boats b
      WHERE b.user_id = target_user_id
    ),
    'conversations', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', c.id,
          'title', c.title,
          'created_at', c.created_at,
          'updated_at', c.updated_at,
          'archived', c.archived,
          'message_count', (
            SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id
          ),
          'messages', (
            SELECT COALESCE(json_agg(
              json_build_object(
                'id', m.id,
                'content', m.content,
                'role', m.role,
                'created_at', m.created_at
              )
              ORDER BY m.created_at ASC
            ), '[]'::json)
            FROM messages m
            WHERE m.conversation_id = c.id
          )
        )
        ORDER BY c.updated_at DESC
      ), '[]'::json)
      FROM conversations c
      WHERE c.user_id = target_user_id
    ),
    'documents', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', d.id,
          'name', d.name,
          'type', d.type,
          'file_path', d.file_path,
          'file_size', d.file_size,
          'upload_date', d.upload_date,
          'expiry_date', d.expiry_date,
          'status', d.status,
          'boat_name', b.name
        )
        ORDER BY d.upload_date DESC
      ), '[]'::json)
      FROM documents d
      LEFT JOIN boats b ON b.id = d.boat_id
      WHERE d.user_id = target_user_id
    ),
    'maintenance_logs', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', m.id,
          'title', m.title,
          'description', m.description,
          'category', m.category,
          'type', m.type,
          'date', m.date,
          'cost', m.cost,
          'status', m.status,
          'boat_name', b.name
        )
        ORDER BY m.date DESC
      ), '[]'::json)
      FROM maintenance_log m
      LEFT JOIN boats b ON b.id = m.boat_id
      WHERE m.user_id = target_user_id
    ),
    'reminders', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', r.id,
          'title', r.title,
          'description', r.description,
          'due_date', r.due_date,
          'priority', r.priority,
          'category', r.category,
          'completed', r.completed,
          'boat_name', b.name
        )
        ORDER BY r.due_date ASC
      ), '[]'::json)
      FROM reminders r
      LEFT JOIN boats b ON b.id = r.boat_id
      WHERE r.user_id = target_user_id
    ),
    'equipment', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', e.id,
          'name', e.name,
          'category', e.category,
          'status', e.status,
          'expiry_date', e.expiry_date,
          'cost', e.cost,
          'boat_name', b.name
        )
        ORDER BY e.created_at DESC
      ), '[]'::json)
      FROM equipment e
      LEFT JOIN boats b ON b.id = e.boat_id
      WHERE e.user_id = target_user_id
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION get_user_details IS 'Returns detailed user data including all boats, conversations, documents, etc - admin only';
