"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RankBadge } from "./forum-rank-badge"
import { Trophy } from "lucide-react"

interface UserStats {
  user_id: string
  points: number
  rank: string
  posts_count: number
  comments_count: number
  likes_received: number
}

export function ForumLeaderboard() {
  const [topUsers, setTopUsers] = useState<UserStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTopUsers()
  }, [])

  const fetchTopUsers = async () => {
    try {
      // This would need a special endpoint to get top users
      // For now, we'll show a placeholder
      setLoading(false)
    } catch (error) {
      console.error("Error fetching leaderboard:", error)
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
          Toppliste
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 sm:space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-xs sm:text-sm">Rangnivåer</h4>
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <RankBadge rank="Matros" />
                <span className="text-muted-foreground text-xs">0-99p</span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <RankBadge rank="Styrmann" />
                <span className="text-muted-foreground text-xs">100-499p</span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <RankBadge rank="Overstyrrmann" />
                <span className="text-muted-foreground text-xs">500-1499p</span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <RankBadge rank="Kaptein" />
                <span className="text-muted-foreground text-xs">1500-4999p</span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <RankBadge rank="Skipsreder" />
                <span className="text-muted-foreground text-xs">5000p+</span>
              </div>
            </div>
          </div>

          <div className="pt-3 sm:pt-4 border-t">
            <h4 className="font-medium text-xs sm:text-sm mb-2">Opptjen poeng</h4>
            <div className="space-y-1 text-xs sm:text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Nytt innlegg</span>
                <span className="text-green-600 font-medium">+10p</span>
              </div>
              <div className="flex justify-between">
                <span>Ny kommentar</span>
                <span className="text-green-600 font-medium">+5p</span>
              </div>
              <div className="flex justify-between">
                <span>Like på innlegg</span>
                <span className="text-green-600 font-medium">+2p</span>
              </div>
              <div className="flex justify-between">
                <span>Like på kommentar</span>
                <span className="text-green-600 font-medium">+1p</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
