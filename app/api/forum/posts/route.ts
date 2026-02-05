import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const categoryId = searchParams.get('category_id')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // Fetch posts with categories
    let query = supabase
      .from('forum_posts')
      .select('*, category:forum_categories(name, slug, icon)')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }
    
    const { data: posts, error } = await query
    
    if (error) {
      console.error('Error fetching posts:', error)
      return NextResponse.json([])
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json([])
    }

    // Fetch user data separately
    const userIds = [...new Set(posts.map(p => p.user_id))]
    
    const [profilesResult, statsResult] = await Promise.all([
      supabase.from('user_profiles').select('id, email, display_name').in('id', userIds),
      supabase.from('forum_user_stats').select('user_id, rank, points').in('user_id', userIds)
    ])

    // Create lookup maps
    const profilesMap = new Map(profilesResult.data?.map(p => [p.id, p]) || [])
    const statsMap = new Map(statsResult.data?.map(s => [s.user_id, s]) || [])

    // Merge data
    const enrichedPosts = posts.map(post => ({
      ...post,
      author: profilesMap.get(post.user_id) || { id: post.user_id, email: 'Unknown' },
      author_stats: [statsMap.get(post.user_id) || { rank: 'Matros', points: 0 }]
    }))
    
    return NextResponse.json(enrichedPosts)
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { title, content, category_id } = body
    
    if (!title || !content || !category_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    const { data: post, error } = await supabase
      .from('forum_posts')
      .insert({
        user_id: user.id,
        category_id,
        title,
        content,
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}
