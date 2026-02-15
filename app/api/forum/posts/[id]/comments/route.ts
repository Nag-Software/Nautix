import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    
    const { data: comments, error } = await supabase
      .from('forum_comments')
      .select('*')
      .eq('post_id', id)
      .order('created_at', { ascending: true })
    
    if (error) throw error

    if (!comments || comments.length === 0) {
      return NextResponse.json([])
    }

    // Fetch user data separately
    const userIds = [...new Set(comments.map(c => c.user_id))]
    
    const [profilesResult, statsResult] = await Promise.all([
      supabase.from('user_profiles').select('id, email, display_name').in('id', userIds),
      supabase.from('forum_user_stats').select('user_id, rank, points').in('user_id', userIds)
    ])

    // Create lookup maps
    const profilesMap = new Map(profilesResult.data?.map(p => [p.id, p]) || [])
    const statsMap = new Map(statsResult.data?.map(s => [s.user_id, s]) || [])

    // Merge data - include parent_comment_id, depth, and reply_count for tree structure
    const enrichedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      like_count: comment.like_count,
      reply_count: comment.reply_count || 0,
      depth: comment.depth || 0,
      parent_comment_id: comment.parent_comment_id || null,
      created_at: comment.created_at,
      author: profilesMap.get(comment.user_id) || { id: comment.user_id, email: 'Unknown' },
      author_stats: [statsMap.get(comment.user_id) || { rank: 'Matros', points: 0 }],
    }))
    
    return NextResponse.json(enrichedComments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

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
    
    const body = await request.json()
    const { content, parent_comment_id } = body
    
    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }
    
    // Insert comment - depth and reply_count will be handled by database triggers
    const { data: comment, error } = await supabase
      .from('forum_comments')
      .insert({
        post_id: id,
        user_id: user.id,
        content,
        parent_comment_id: parent_comment_id || null,
      })
      .select()
      .single()
    
    if (error) throw error

    // Notifications are created via DB trigger `notify_on_comment` to ensure
    // consistent notification creation regardless of insertion path.
    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
