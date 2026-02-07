"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { nb } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { RichTextEditor } from "./rich-text-editor"
import { Heart, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ThreadedCommentData {
  id: string
  content: string
  like_count: number
  reply_count: number
  depth: number
  parent_comment_id: string | null
  created_at: string
  author: {
    id: string
    email: string
    display_name?: string
  }
  author_stats: {
    rank: string
    points: number
  }[]
  replies?: ThreadedCommentData[]
}

interface ThreadedCommentProps {
  comment: ThreadedCommentData
  currentUserId: string | null
  likedComments: Set<string>
  onLike: (commentId: string) => Promise<void>
  onReply: (parentId: string, content: string) => Promise<void>
  maxDepth?: number
}

export function ThreadedComment({
  comment,
  currentUserId,
  likedComments,
  onLike,
  onReply,
  maxDepth = 5,
}: ThreadedCommentProps) {
  const [isReplying, setIsReplying] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const commentAuthorStats = comment.author_stats?.[0] || { rank: 'Matros', points: 0 }
  const displayName = comment.author.display_name || comment.author.email.split('@')[0]
  const hasReplies = (comment.replies?.length ?? 0) > 0
  const canReply = comment.depth < maxDepth
  const isLiked = likedComments.has(comment.id)

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const strippedContent = replyContent.replace(/<[^>]*>/g, '').trim()
    if (!strippedContent) return

    setIsSubmitting(true)
    try {
      await onReply(comment.id, replyContent)
      setReplyContent("")
      setIsReplying(false)
    } catch (error) {
      console.error("Error posting reply:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get initials for avatar
  const initials = displayName.slice(0, 2).toUpperCase()

  // Rank colors for avatar
  const rankColors = {
    'Matros': 'bg-slate-500',
    'Styrmann': 'bg-blue-500',
    'Overstyrrmann': 'bg-purple-500',
    'Kaptein': 'bg-amber-500',
    'Skipsreder': 'bg-gradient-to-br from-amber-500 to-orange-600',
  }

  const avatarColor = rankColors[commentAuthorStats.rank as keyof typeof rankColors] || 'bg-slate-500'

  return (
    <div className={cn(
      "group relative",
      comment.depth > 0 && "ml-10"
    )}>
      {/* Vertical line for nested comments */}
      {comment.depth > 0 && (
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
      )}

      <div className="flex gap-3 py-3 relative">
        {/* Avatar */}
        <Avatar className={cn("h-10 w-10 flex-shrink-0", avatarColor)}>
          <AvatarFallback className="bg-transparent text-white font-semibold text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="font-semibold text-sm hover:underline cursor-pointer">
              {displayName}
            </span>
            <span className="text-xs text-muted-foreground font-normal">
              {commentAuthorStats.rank}
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground hover:underline cursor-pointer">
              {formatDistanceToNow(new Date(comment.created_at), {
                addSuffix: true,
                locale: nb,
              })}
            </span>
          </div>

          {/* Comment text */}
          <div 
            className="text-sm mt-0.5 prose prose-sm dark:prose-invert max-w-none prose-p:my-1"
            dangerouslySetInnerHTML={{ __html: comment.content }}
          />

          {/* Actions */}
          <div className="flex items-center gap-1 mt-2 -ml-2">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 gap-1.5 text-muted-foreground hover:text-primary transition-colors group/like",
                isLiked && "text-primary"
              )}
              onClick={() => onLike(comment.id)}
            >
              <Heart className={cn(
                "h-3.5 w-3.5 transition-all",
                isLiked && "fill-current"
              )} />
              {comment.like_count > 0 && (
                <span className="text-xs tabular-nums">{comment.like_count}</span>
              )}
            </Button>

            {canReply && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-muted-foreground hover:text-blue-500 transition-colors"
                onClick={() => setIsReplying(!isReplying)}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                {comment.reply_count > 0 && (
                  <span className="text-xs tabular-nums">{comment.reply_count}</span>
                )}
              </Button>
            )}
          </div>

          {/* Reply Form */}
          {isReplying && (
            <div className="mt-3 space-y-2">
              <RichTextEditor
                content={replyContent}
                onChange={setReplyContent}
                placeholder="Skriv et svar..."
              />
              <div className="flex items-center gap-2">
                <Button 
                  type="button"
                  size="sm"
                  disabled={isSubmitting || !replyContent.replace(/<[^>]*>/g, '').trim()}
                  onClick={handleSubmitReply}
                  className="h-8"
                >
                  {isSubmitting ? "Sender..." : "Svar"}
                </Button>
                <Button 
                  type="button" 
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsReplying(false)
                    setReplyContent("")
                  }}
                  className="h-8"
                >
                  Avbryt
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {hasReplies && (
        <div>
          {comment.replies!.map((reply) => (
            <ThreadedComment
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              likedComments={likedComments}
              onLike={onLike}
              onReply={onReply}
              maxDepth={maxDepth}
            />
          ))}
        </div>
      )}
    </div>
  )
}
