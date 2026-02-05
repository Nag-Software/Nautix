import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'

export async function GET(request: NextRequest) {
  // Check if user is admin
  const adminStatus = await isAdmin()
  if (!adminStatus) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || 'month'

  const supabase = await createClient()

  // Get all users with their created_at timestamps
  const { data: users } = await supabase.rpc('get_all_users_with_stats')

  if (!users || users.length === 0) {
    return NextResponse.json([])
  }

  // Group users by period
  const now = new Date()
  const groupedData: Record<string, number> = {}

  // Initialize data structure based on period
  if (period === 'week') {
    // Last 7 days
    const dayNames = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag']
    for (let i = 6; i >= 0; i--) {
      const dayDate = new Date(now)
      dayDate.setDate(dayDate.getDate() - i)
      const dayName = dayNames[dayDate.getDay()]
      const dayKey = `${dayName.slice(0, 3)} ${dayDate.getDate()}/${dayDate.getMonth() + 1}`
      groupedData[dayKey] = 0
    }
  } else if (period === 'month') {
    // Last 12 months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Des']
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      groupedData[monthNames[monthDate.getMonth()]] = 0
    }
  } else {
    // Last 5 years
    for (let i = 4; i >= 0; i--) {
      groupedData[(now.getFullYear() - i).toString()] = 0
    }
  }

  // Count users in each period
  users.forEach((user: any) => {
    const createdAt = new Date(user.created_at)
    let key: string | null = null

    if (period === 'week') {
      const dayNames = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag']
      const daysDiff = Math.floor((now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000))
      if (daysDiff < 7) {
        const dayName = dayNames[createdAt.getDay()]
        key = `${dayName.slice(0, 3)} ${createdAt.getDate()}/${createdAt.getMonth() + 1}`
      }
    } else if (period === 'month') {
      const monthsDiff = (now.getFullYear() - createdAt.getFullYear()) * 12 + (now.getMonth() - createdAt.getMonth())
      if (monthsDiff < 12) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Des']
        key = monthNames[createdAt.getMonth()]
      }
    } else {
      const yearsDiff = now.getFullYear() - createdAt.getFullYear()
      if (yearsDiff < 5) {
        key = createdAt.getFullYear().toString()
      }
    }

    if (key && groupedData[key] !== undefined) {
      groupedData[key]++
    }
  })

  // Convert to array with cumulative totals
  const entries = Object.entries(groupedData)
  let cumulative = 0
  const result = entries.map(([period, count]) => {
    cumulative += count
    return {
      period,
      users: cumulative,
    }
  })

  return NextResponse.json(result)
}
