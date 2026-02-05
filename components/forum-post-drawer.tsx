"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { nb } from "date-fns/locale"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { RankBadge } from "./forum-rank-badge"
import { RichTextEditor } from "./rich-text-editor"
import { ThreadedComment, ThreadedCommentData } from "./threaded-comment"
import { ThumbsUp, MessageCircle, Eye, Send, Pencil, Trash2 } from "lucide-react"

interface Post {
  id: string
  title: string
  content: string
  user_id: string
  view_count: number
  like_count: number
  comment_count: number
  created_at: string
  category: {
    name: string
    icon: string
  }
  author: {
    id: string
    email: string
  }
  author_stats: {
    rank: string
    points: number
  }[]
}

interface ForumPostDrawerProps {
  postId: string | null
  open: boolean
  onClose: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function ForumPostDrawer({ postId, open, onClose, onEdit, onDelete }: ForumPostDrawerProps) {
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<ThreadedCommentData[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [likedPost, setLikedPost] = useState(false)
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set())
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (postId && open) {
      fetchPost()
      fetchComments()
      fetchCurrentUser()
    }
  }, [postId, open])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/user')
      if (response.ok) {
        const data = await response.json()
        setCurrentUserId(data.user?.id || null)
      }
    } catch (error) {
      console.error("Error fetching current user:", error)
    }
  }

  const fetchPost = async () => {
    if (!postId) return
    try {
      const response = await fetch(`/api/forum/posts/${postId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch post')
      }
      const data = await response.json()
      setPost(data)
    } catch (error) {
      console.error("Error fetching post:", error)
      toast.error("Kunne ikke laste innlegg")
    }
  }

  const fetchComments = async () => {
    if (!postId) return
    try {
      const response = await fetch(`/api/forum/posts/${postId}/comments`)
      if (!response.ok) {
        throw new Error('Failed to fetch comments')
      }
      const data = await response.json()
      
      // Build comment tree structure
      const commentTree = buildCommentTree(data)
      setComments(commentTree)
    } catch (error) {
      console.error("Error fetching comments:", error)
      toast.error("Kunne ikke laste kommentarer")
    }
  }

  // Build a tree structure from flat comment list
  const buildCommentTree = (flatComments: any[]): ThreadedCommentData[] => {
    const commentMap = new Map<string, ThreadedCommentData>()
    const rootComments: ThreadedCommentData[] = []

    // First pass: create map of all comments
    flatComments.forEach((comment) => {
      commentMap.set(comment.id, {
        ...comment,
        replies: [],
      })
    })

    // Second pass: build tree structure
    flatComments.forEach((comment) => {
      const commentNode = commentMap.get(comment.id)!
      
      if (comment.parent_comment_id) {
        const parent = commentMap.get(comment.parent_comment_id)
        if (parent) {
          parent.replies!.push(commentNode)
        }
      } else {
        rootComments.push(commentNode)
      }
    })

    return rootComments
  }

  const handleLikePost = async () => {
    if (!postId) return
    try {
      const response = await fetch(`/api/forum/posts/${postId}/like`, {
        method: "POST",
      })
      if (!response.ok) {
        throw new Error('Failed to like post')
      }
      const data = await response.json()
      setLikedPost(data.liked)
      fetchPost()
    } catch (error) {
      console.error("Error liking post:", error)
      toast.error("Kunne ikke like innlegg")
    }
  }

  const handleLikeComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/forum/comments/${commentId}/like`, {
        method: "POST",
      })
      if (!response.ok) {
        throw new Error('Failed to like comment')
      }
      const data = await response.json()
      
      setLikedComments((prev) => {
        const newSet = new Set(prev)
        if (data.liked) {
          newSet.add(commentId)
        } else {
          newSet.delete(commentId)
        }
        return newSet
      })
      
      fetchComments()
    } catch (error) {
      console.error("Error liking comment:", error)
      toast.error("Kunne ikke like kommentar")
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const strippedContent = newComment.replace(/<[^>]*>/g, '').trim()
    if (!postId || !strippedContent) return

    setLoading(true)
    try {
      const response = await fetch(`/api/forum/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newComment }),
      })

      if (!response.ok) {
        throw new Error('Failed to post comment')
      }

      setNewComment("")
      toast.success("Kommentar lagt til!")
      fetchComments()
      fetchPost()
    } catch (error) {
      console.error("Error posting comment:", error)
      toast.error("Kunne ikke legge til kommentar. Prøv igjen.")
    } finally {
      setLoading(false)
    }
  }

  const handleReply = async (parentId: string, content: string) => {
    if (!postId) return

    try {
      const response = await fetch(`/api/forum/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          content,
          parent_comment_id: parentId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to post reply')
      }

      toast.success("Svar lagt til!")
      fetchComments()
      fetchPost()
    } catch (error) {
      console.error("Error posting reply:", error)
      toast.error("Kunne ikke legge til svar. Prøv igjen.")
      throw error
    }
  }

  const handleDeletePost = async () => {
    if (!postId) return
    
    setDeleting(true)
    try {
      const response = await fetch(`/api/forum/posts/${postId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete post")

      toast.success("Innlegg slettet!")
      setDeleteDialogOpen(false)
      onClose()
      if (onDelete) onDelete()
    } catch (error) {
      console.error("Error deleting post:", error)
      toast.error("Kunne ikke slette innlegg. Prøv igjen.")
    } finally {
      setDeleting(false)
    }
  }

  const handleEditPost = () => {
    onClose()
    if (onEdit) onEdit()
  }

  if (!post) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full sm:max-w-2xl lg:max-w-3xl overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Laster...</p>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  const authorStats = post.author_stats?.[0] || { rank: 'Matros', points: 0 }
  const emailPrefix = post.author.email.split('@')[0]
  const topLevelComments = comments.filter(c => !c.parent_comment_id)

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent 
          side="right" 
          className="w-full sm:max-w-2xl lg:max-w-3xl p-0 flex flex-col overflow-y-auto"
        >
          {/* Header - Fixed */}
          <SheetHeader className="px-4 pt-6 pb-4 sm:px-6 border-b space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="gap-1 text-xs">
                {post.category.icon} {post.category.name}
              </Badge>
            </div>
            <SheetTitle className="text-xl sm:text-2xl text-left">
              {post.title}
            </SheetTitle>
            <SheetDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 text-left">
              <div className="flex items-center gap-1">
                <RankBadge rank={authorStats.rank} />
                <span className="font-medium text-foreground">{emailPrefix}</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <span>
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                  locale: nb,
                })}
              </span>
            </SheetDescription>
          </SheetHeader>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6">
            <div className="space-y-4 sm:space-y-6 py-4 sm:py-6">
              {/* Post Content */}
              <div 
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Post Stats and Actions */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2 border-t">
                <div className="flex items-center gap-3 sm:gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{post.view_count}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-1 ${likedPost ? "text-primary" : ""}`}
                    onClick={handleLikePost}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span>{post.like_count}</span>
                  </Button>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    <span>{post.comment_count}</span>
                  </div>
                </div>
                {currentUserId && currentUserId === post.user_id && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={handleEditPost}
                    >
                      <Pencil className="h-3 w-3" />
                      Rediger
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-destructive hover:text-destructive"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 className="h-3 w-3" />
                      Slett
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              {/* Comments Section */}
              <div className="space-y-4 pb-5">
                <h3 className="font-semibold text-lg">
                  Kommentarer ({post.comment_count})
                </h3>

                {/* New Comment Form */}
                <form onSubmit={handleSubmitComment} className="space-y-3">
                  <RichTextEditor
                    content={newComment}
                    onChange={setNewComment}
                    placeholder="Skriv en kommentar... (+5 poeng)"
                  />
                  <Button 
                    type="submit" 
                    disabled={loading || !newComment.replace(/<[^>]*>/g, '').trim()} 
                    className="gap-2 w-full sm:w-auto"
                  >
                    <Send className="h-4 w-4" />
                    {loading ? "Sender..." : "Kommenter"}
                  </Button>
                </form>

                {/* Threaded Comments */}
                <div className="space-y-3">
                  {topLevelComments.map((comment) => (
                    <ThreadedComment
                      key={comment.id}
                      comment={comment}
                      currentUserId={currentUserId}
                      likedComments={likedComments}
                      onLike={handleLikeComment}
                      onReply={handleReply}
                    />
                  ))}

                  {topLevelComments.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-8">
                      Ingen kommentarer ennå. Vær den første til å kommentere!
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bekreft sletting</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette dette innlegget? Denne handlingen kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePost}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Sletter..." : "Slett"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
