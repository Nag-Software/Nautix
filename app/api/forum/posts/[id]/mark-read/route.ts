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
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking post as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark post as read' },
      { status: 500 }
    )
  }
}
