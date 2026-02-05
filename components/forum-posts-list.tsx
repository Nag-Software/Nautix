"use client"

import { formatDistanceToNow } from "date-fns"
import { nb } from "date-fns/locale"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageCircle, ThumbsUp, Eye, Pin } from "lucide-react"
import { RankBadge } from "./forum-rank-badge"
import Link from "next/link"

interface Post {
  id: string
  title: string
  content: string
  view_count: number
  like_count: number
  comment_count: number
  is_pinned: boolean
  created_at: string
  category: {
    name: string
    slug: string
    icon: string
  }
  author: {
    id: string
    email: string
    display_name?: string
  }
  author_stats: {
    rank: string
    points: number
  }[]
}

interface ForumPostsListProps {
  posts: Post[]
  onPostClick: (postId: string) => void
}

export function ForumPostsList({ posts, onPostClick }: ForumPostsListProps) {
  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 sm:py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Ingen innlegg funnet. Vær den første til å starte en diskusjon!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      {posts.map((post) => {
        const authorStats = post.author_stats?.[0] || { rank: 'Matros', points: 0 }
        const displayName = post.author.display_name || post.author.email.split('@')[0]
        
        return (
          <Card
            key={post.id}
            className="cursor-pointer transition-all hover:shadow-md active:scale-[0.98] gap-3 py-5"
            onClick={() => onPostClick(post.id)}
          >
            <CardHeader className="">
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-1.5 min-w-0">
                  {/* Pinned badge - only on mobile/tablet */}
                  {post.is_pinned && (
                    <Badge variant="default" className="gap-1 text-xs h-5 px-2 lg:hidden">
                      <Pin className="h-3 w-3" />
                      <span className="hidden sm:inline">Festet</span>
                    </Badge>
                  )}
                  
                  {/* Title */}
                  <h3 className="text-sm sm:text-base font-semibold leading-tight hover:text-primary transition-colors line-clamp-2 pr-1">
                    {post.title}
                  </h3>
                  
                  {/* Preview */}
                  <p className="text-xs text-muted-foreground line-clamp-2 sm:line-clamp-2">
                    {post.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 250)}
                    {post.content.replace(/<[^>]*>/g, '').length > 100 ? '...' : ''}
                  </p>
                </div>
                
                {/* Category icon - top right on mobile */}
                <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
                  <div className="text-2xl sm:text-xl">{post.category.icon}</div>
                  {post.is_pinned && (
                    <Badge variant="default" className="gap-1 text-xs h-5 px-2 hidden lg:flex">
                      <Pin className="h-3 w-3" />
                      Festet
                    </Badge>
                  )}
                  <Badge variant="outline" className="gap-1 text-xs h-5 px-2 hidden sm:flex">
                    {post.category.name}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="">
              {/* Compact single row layout */}
              <div className="flex items-center justify-between gap-2 text-xs">
                {/* Author info */}
                <div className="flex items-center gap-1.5 text-muted-foreground min-w-0 flex-shrink">
                  <RankBadge rank={authorStats.rank} />
                  <span className="font-medium truncate max-w-[100px] sm:max-w-none">{displayName}</span>
                </div>
                
                {/* Stats - compact */}
                <div className="flex items-center gap-2 sm:gap-3 text-muted-foreground flex-shrink-0">
                  <div className="flex items-center gap-0.5">
                    <Eye className="h-3 w-3" />
                    <span className="hidden sm:inline">{post.view_count}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <ThumbsUp className="h-3 w-3" />
                    <span>{post.like_count}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <MessageCircle className="h-3 w-3" />
                    <span>{post.comment_count}</span>
                  </div>
                  <span className="text-muted-foreground whitespace-nowrap hidden sm:inline">
                    {formatDistanceToNow(new Date(post.created_at), {
                      addSuffix: true,
                      locale: nb,
                    }).replace('omtrent ', '')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
