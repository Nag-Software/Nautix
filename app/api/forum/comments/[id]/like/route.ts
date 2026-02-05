import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { id } = await params
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check if already liked
    const { data: existingLike } = await supabase
      .from('forum_comment_likes')
      .select('id')
      .eq('comment_id', id)
      .eq('user_id', user.id)
      .single()
    
    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('forum_comment_likes')
        .delete()
        .eq('comment_id', id)
        .eq('user_id', user.id)
      
      if (error) throw error
      
      return NextResponse.json({ liked: false })
    } else {
      // Like
      const { error } = await supabase
        .from('forum_comment_likes')
        .insert({
          comment_id: id,
          user_id: user.id,
        })
      
      if (error) throw error
      
      return NextResponse.json({ liked: true })
    }
  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    )
  }
}
