import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('user_id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }
    
    const { data: stats, error } = await supabase
      .from('forum_user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error) {
      // If no stats exist, return default stats
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          user_id: userId,
          points: 0,
          rank: 'Matros',
          posts_count: 0,
          comments_count: 0,
          likes_received: 0,
        })
      }
      throw error
    }
    
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    )
  }
}
