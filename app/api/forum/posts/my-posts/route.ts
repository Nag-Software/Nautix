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

    return NextResponse.json(posts || [])
  } catch (error) {
    console.error('Error fetching user posts:', error)
    return NextResponse.json([])
  }
}
