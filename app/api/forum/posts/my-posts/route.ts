import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Fetch user's posts with categories
    const { data: posts, error } = await supabase
      .from('forum_posts')
      .select('*, category:forum_categories(name, slug, icon)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching user posts:', error)
      return NextResponse.json([])
    }

    // For each post, get the unread comment count
    const postsWithUnread = await Promise.all(
      (posts || []).map(async (post) => {
        const { data: unreadCount } = await supabase
          .rpc('get_unread_comment_count', {
            p_post_id: post.id,
            p_user_id: user.id
          })
        
        return {
          ...post,
          unread_comment_count: unreadCount || 0
        }
      })
    )

    return NextResponse.json(postsWithUnread)
  } catch (error) {
    console.error('Error fetching user posts:', error)
    return NextResponse.json([])
  }
}
