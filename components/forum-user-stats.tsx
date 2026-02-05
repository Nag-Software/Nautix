"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RankBadge } from "./forum-rank-badge"
import { createClient } from "@/lib/supabase/client"
import { Award, MessageSquare, ThumbsUp, FileText } from "lucide-react"

interface UserStats {
  user_id: string
  points: number
  rank: string
  posts_count: number
  comments_count: number
  likes_received: number
}

export function ForumUserStats() {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchUserStats()
  }, [])

  const fetchUserStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const response = await fetch(`/api/forum/user-stats?user_id=${user.id}`)
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Error fetching user stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground text-center">Laster...</p>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return null
  }

  const getNextRank = () => {
    switch (stats.rank) {
      case 'Matros':
        return { name: 'Styrmann', points: 100 }
      case 'Styrmann':
        return { name: 'Overstyrrmann', points: 500 }
      case 'Overstyrrmann':
        return { name: 'Kaptein', points: 1500 }
      case 'Kaptein':
        return { name: 'Skipsreder', points: 5000 }
      default:
        return null
    }
  }

  const nextRank = getNextRank()
  const progress = nextRank 
    ? ((stats.points / nextRank.points) * 100).toFixed(0)
    : 100

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <Award className="h-4 w-4" />
          Din statistikk
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium">Rang</span>
            <RankBadge rank={stats.rank} points={stats.points} showPoints />
          </div>
          
          {nextRank && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Neste: {nextRank.name}</span>
                <span>{stats.points}/{nextRank.points}p</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-2 border-t">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <FileText className="h-3 w-3" />
              <span className="text-xs">Innlegg</span>
            </div>
            <p className="text-base sm:text-lg font-semibold">{stats.posts_count}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              <span className="text-xs">Kommentarer</span>
            </div>
            <p className="text-base sm:text-lg font-semibold">{stats.comments_count}</p>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-muted-foreground">
              <ThumbsUp className="h-3 w-3" />
              <span className="text-xs">Likes mottatt</span>
            </div>
            <p className="text-base sm:text-lg font-semibold">{stats.likes_received}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
