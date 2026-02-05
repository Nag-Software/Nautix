# Nautix Forum Setup

## Overview
The Nautix Forum is a fully functional community forum with categories, posts, comments, and a points-based ranking system with nautical ranks.

## Features

### 1. Categories
- Pre-configured categories for different topics (Generelt, Vedlikehold, Utstyr, etc.)
- Category filtering
- Post count per category

### 2. Ranking System
Users earn points through participation and advance through nautical ranks:

| Rank | Icon | Points Required |
|------|------|----------------|
| Matros | ⚓ | 0-99 |
| Styrmann | 🎖️ | 100-499 |
| Overstyrrmann | ⭐ | 500-1499 |
| Kaptein | 👑 | 1500-4999 |
| Skipsreder | 🏆 | 5000+ |

### 3. Points System
- Create a post: **+10 points**
- Create a comment: **+5 points**
- Receive a like on post: **+2 points**
- Receive a like on comment: **+1 point**

### 4. Forum Features
- ✅ Create, edit, and delete posts
- ✅ Comment on posts
- ✅ Like posts and comments
- ✅ View count tracking
- ✅ Pin posts (for admins in future)
- ✅ Responsive design
- ✅ Real-time updates

## Database Setup

### Step 1: Run the Forum Schema
Execute the forum schema SQL files in your Supabase SQL Editor:

1. First, create user profiles table:
```bash
# Location: supabase/user_profiles.sql
```

2. user_profiles` - User display names and info
- `Then, create forum tables:
```bash
# Location: supabase/forum_schema.sql
```

This will create:
- `forum_categories` - Forum categories
- `forum_posts` - User posts
- `forum_comments` - Comments on posts
- `forum_post_likes` - Post likes
- `forum_comment_likes` - Comment likes
- `forum_user_stats` - User points and ranks

### Step 2: Verify Tables
Check that all tables are created with proper RLS policies:

```sql
-- Verify tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'forum_%';

-- Verify default categories
SELECT * FROM forum_categories;
```

## API Endpoints

### Categories
- `GET /api/forum/categories` - Get all categories

### Posts
- `GET /api/forum/posts` - Get all posts (with optional `category_id` query param)
- `POST /api/forum/posts` - Create a new post
- `GET /api/forum/posts/[id]` - Get a specific post
- `PATCH /api/forum/posts/[id]` - Update a post
- `DELETE /api/forum/posts/[id]` - Delete a post
- `POST /api/forum/posts/[id]/like` - Toggle like on a post

### Comments
- `GET /api/forum/posts/[id]/comments` - Get comments for a post
- `POST /api/forum/posts/[id]/comments` - Create a comment
- `POST /api/forum/comments/[id]/like` - Toggle like on a comment

### User Stats
- `GET /api/forum/user-stats?user_id=[id]` - Get user statistics

## Components

### Forum Page (`app/forum/page.tsx`)
Main forum page with categories and posts list.

### Components
- `ForumCategories` - Category selection grid
- `ForumPostsList` - List of forum posts
- `ForumPostDetail` - Post detail dialog with comments
- `CreatePostDialog` - Dialog for creating new posts
- `RankBadge` - Display user rank badges
- `ForumLeaderboard` - Leaderboard and points info

## Usage

### For Users

1. **Navigate to Forum**: Click on "Forum" in the sidebar
2. **Browse Categories**: Select a category to filter posts
3. **Create Post**: Click "Nytt innlegg" button
4. **View Post**: Click on any post to read details and comments
5. **Comment**: Add comments to posts to earn points
6. **Like**: Click thumbs up to like posts or comments

### For Developers

#### Accessing Forum Data
```typescript
// Get all posts
const response = await fetch('/api/forum/posts')
const posts = await response.json()

// Get posts for specific category
const response = await fetch('/api/forum/posts?category_id=CATEGORY_UUID')
const posts = await response.json()

// Create new post
const response = await fetch('/api/forum/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'My Post Title',
    content: 'Post content',
    category_id: 'CATEGORY_UUID'
  })
})
```

#### Working with Supabase Directly
```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// Get posts with user stats
const { data: posts } = await supabase
  .from('forum_posts')
  .select(`
    *,
    category:forum_categories(name, slug, icon),
    author:auth.users!forum_posts_user_id_fkey(id, email),
    author_stats:forum_user_stats(rank, points)
  `)
  .order('created_at', { ascending: false })
```

## Future Enhancements

- [ ] Search functionality
- [ ] Post editing UI
- [ ] Admin moderation tools
- [ ] User profiles with post history
- [ ] Notifications for replies
- [ ] Rich text editor
- [ ] Image uploads
- [ ] Post tags/labels
- [ ] Best answer marking
- [ ] Report functionality

## Troubleshooting

### Posts not appearing
- Check RLS policies are enabled
- Verify user is authenticated
- Check browser console for errors

### Points not updating
- Verify triggers are created in database
- Check `forum_user_stats` table
- Run the schema SQL again if needed

### Categories empty
- Run the default categories insert:
```sql
INSERT INTO forum_categories (name, description, slug, icon) VALUES
  ('Generelt', 'Generelle diskusjoner om båtliv', 'generelt', '💬')
ON CONFLICT (slug) DO NOTHING;
```

## Security

All tables use Row Level Security (RLS):
- Anyone can read posts, comments, and categories
- Only authenticated users can create content
- Users can only edit/delete their own posts and comments
- Likes are tracked per user to prevent duplicates

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify Supabase connection
3. Check RLS policies in Supabase dashboard
4. Review SQL schema setup
