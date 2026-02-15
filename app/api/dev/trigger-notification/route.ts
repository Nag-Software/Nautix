import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const targetUserId = body.target_user_id || body.user_id || user.id
    const postId = body.post_id || null
    const commentId = body.comment_id || null
    const postTitle = body.post_title || body.title || null

    const { data, error } = await supabase.from('notifications').insert({
      user_id: targetUserId,
      actor_id: user.id,
      type: body.type || 'comment',
      post_id: postId,
      comment_id: commentId,
      post_title: postTitle,
      read: false
    }).select().single()

    if (error) {
      console.error('Error inserting test notification:', error)
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('Trigger notification error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, message: 'POST to this endpoint to create a test notification (authenticated).' })
}
