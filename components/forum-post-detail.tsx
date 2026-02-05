"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { nb } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

interface Comment {
  id: string
  content: string
  like_count: number
  created_at: string
  author: {
    id: string
    email: string
  }
  author_stats: {
    rank: string
    points: number
  }[]
}

interface ForumPostDetailProps {
  postId: string | null
  open: boolean
  onClose: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function ForumPostDetail({ postId, open, onClose, onEdit, onDelete }: ForumPostDetailProps) {
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
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
      const data = await response.json()
      setPost(data)
    } catch (error) {
      console.error("Error fetching post:", error)
    }
  }

  const fetchComments = async () => {
    if (!postId) return
    try {
      const response = await fetch(`/api/forum/posts/${postId}/comments`)
      const data = await response.json()
      setComments(data)
    } catch (error) {
      console.error("Error fetching comments:", error)
    }
  }

  const handleLikePost = async () => {
    if (!postId) return
    try {
      const response = await fetch(`/api/forum/posts/${postId}/like`, {
        method: "POST",
      })
      const data = await response.json()
      setLikedPost(data.liked)
      fetchPost() // Refresh to get updated like count
    } catch (error) {
      console.error("Error liking post:", error)
    }
  }

  const handleLikeComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/forum/comments/${commentId}/like`, {
        method: "POST",
      })
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
      
      fetchComments() // Refresh to get updated like count
    } catch (error) {
      console.error("Error liking comment:", error)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Strip HTML tags to check if there's actual content
    const strippedContent = newComment.replace(/<[^>]*>/g, '').trim()
    if (!postId || !strippedContent) return

    setLoading(true)
    try {
      await fetch(`/api/forum/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newComment }),
      })

      setNewComment("")
      toast.success("Kommentar lagt til!")
      fetchComments()
      fetchPost() // Refresh to update comment count
    } catch (error) {
      console.error("Error posting comment:", error)
      toast.error("Kunne ikke legge til kommentar. Prøv igjen.")
    } finally {
      setLoading(false)
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
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Laster...</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const authorStats = post.author_stats?.[0] || { rank: 'Matros', points: 0 }
  const emailPrefix = post.author.email.split('@')[0]

  return (
    <>
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[900px] max-h-[90vh] sm:max-h-[95vh] p-0 gap-0">
        <div className="flex flex-col max-h-[90vh] sm:max-h-[95vh]">
          {/* Header - Fixed */}
          <DialogHeader className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4 border-b">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="gap-1 text-xs h-5">
                {post.category.icon} <span className="hidden sm:inline">{post.category.name}</span>
              </Badge>
            </div>
            <DialogTitle className="text-xl sm:text-2xl pr-8">{post.title}</DialogTitle>
            <DialogDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 text-xs sm:text-sm">
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
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6">
            <div className="space-y-4 sm:space-y-6 py-4 sm:py-6">
              {/* Post Content */}
              <div 
                className="prose prose-sm dark:prose-invert max-w-none text-sm sm:text-base"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Post Stats and Actions */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2 border-t">
                <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span>{post.view_count}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-1 h-7 sm:h-8 px-2 sm:px-3 ${likedPost ? "text-primary" : ""}`}
                    onClick={handleLikePost}
                  >
                    <ThumbsUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span>{post.like_count}</span>
                  </Button>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span>{post.comment_count}</span>
                  </div>
                </div>
                {currentUserId && currentUserId === post.user_id && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 h-7 sm:h-8 text-xs sm:text-sm"
                      onClick={handleEditPost}
                    >
                      <Pencil className="h-3 w-3" />
                      <span className="hidden sm:inline">Rediger</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 h-7 sm:h-8 text-xs sm:text-sm text-destructive hover:text-destructive"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 className="h-3 w-3" />
                      <span className="hidden sm:inline">Slett</span>
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              {/* Comments */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="font-semibold text-base sm:text-lg">
                  Kommentarer ({comments.length})
                </h3>

                <form onSubmit={handleSubmitComment} className="space-y-2 sm:space-y-3">
                  <RichTextEditor
                    content={newComment}
                    onChange={setNewComment}
                    placeholder="Skriv en kommentar... (+5 poeng)"
                  />
                  <Button 
                    type="submit" 
                    disabled={loading || !newComment.replace(/<[^>]*>/g, '').trim()} 
                    className="gap-2 h-9 w-full sm:w-auto text-sm"
                  >
                    <Send className="h-4 w-4" />
                    {loading ? "Sender..." : "Kommenter"}
                  </Button>
                </form>

                <div className="space-y-3 sm:space-y-4">
                  {comments.map((comment) => {
                    const commentAuthorStats = comment.author_stats?.[0] || { rank: 'Matros', points: 0 }
                    const commentEmailPrefix = comment.author.email.split('@')[0]
                    
                    return (
                      <div key={comment.id} className="rounded-lg border p-3 sm:p-4 space-y-2 sm:space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                            <RankBadge rank={commentAuthorStats.rank} />
                            <span className="font-medium text-xs sm:text-sm truncate">{commentEmailPrefix}</span>
                            <span className="text-xs text-muted-foreground hidden sm:inline">
                              {formatDistanceToNow(new Date(comment.created_at), {
                                addSuffix: true,
                                locale: nb,
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground sm:hidden">
                          {formatDistanceToNow(new Date(comment.created_at), {
                            addSuffix: true,
                            locale: nb,
                          })}
                        </div>
                        <div 
                          className="text-xs sm:text-sm prose prose-sm dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: comment.content }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`gap-1 h-7 px-2 ${likedComments.has(comment.id) ? "text-primary" : ""}`}
                          onClick={() => handleLikeComment(comment.id)}
                        >
                          <ThumbsUp className="h-3 w-3" />
                          <span className="text-xs">{comment.like_count}</span>
                        </Button>
                      </div>
                    )
                  })}

                  {comments.length === 0 && (
                    <p className="text-center text-xs sm:text-sm text-muted-foreground py-6 sm:py-8">
                      Ingen kommentarer ennå. Vær den første til å kommentere!
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

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
