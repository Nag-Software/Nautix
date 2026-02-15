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
    
    // Mark the post as viewed by calling the RPC function
    const { error } = await supabase.rpc('update_post_view', { p_post_id: id })
    
    if (error) {
      console.error('Error marking post as read:', error)
      return NextResponse.json(
        { error: 'Failed to mark post as read' },
        { status: 500 }
      )
    }

    // Also mark any persistent notifications for this post as read for the current user
    try {
      const { error: notifErr } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('post_id', id)
        .eq('user_id', user.id)

      if (notifErr) {
        console.error('Error marking notifications read for post:', notifErr)
        // don't fail the request because of notification update; just log
      }
    } catch (e) {
      console.error('Unexpected error updating notifications:', e)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking post as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark post as read' },
      { status: 500 }
    )
  }
}
