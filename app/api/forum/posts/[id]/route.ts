import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    
    // Increment view count
    await supabase.rpc('increment_post_views', { post_id: id })
    
    const { data: post, error } = await supabase
      .from('forum_posts')
      .select('*, category:forum_categories(name, slug, icon)')
      .eq('id', id)
      .single()
    
    if (error) throw error

    // Fetch user data separately
    const [profileResult, statsResult] = await Promise.all([
      supabase.from('user_profiles').select('id, email, display_name').eq('id', post.user_id).single(),
      supabase.from('forum_user_stats').select('user_id, rank, points').eq('user_id', post.user_id).single()
    ])

    const enrichedPost = {
      ...post,
      author: profileResult.data || { id: post.user_id, email: 'Unknown' },
      author_stats: [statsResult.data || { rank: 'Matros', points: 0 }]
    }
    
    return NextResponse.json(enrichedPost)
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    )
  }
}

export async function PATCH(
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
    const { title, content, category_id } = body
    
    const updateData: any = { title, content, updated_at: new Date().toISOString() }
    if (category_id) {
      updateData.category_id = category_id
    }
    
    const { data: post, error } = await supabase
      .from('forum_posts')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json(post)
  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    
    const { error } = await supabase
      .from('forum_posts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    )
  }
}
