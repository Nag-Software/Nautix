import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: categories, error } = await supabase
      .from('forum_categories')
      .select('*')
      .order('name')
    
    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json([])
    }
    
    return NextResponse.json(categories || [])
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json([])
  }
}
