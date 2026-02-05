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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { User, Pencil, Trash2, Eye, ThumbsUp, MessageCircle } from "lucide-react"

interface Post {
  id: string
  title: string
  content: string
  view_count: number
  like_count: number
  comment_count: number
  created_at: string
  category: {
    name: string
    icon: string
  }
}

interface MyPostsDialogProps {
  onEditPost: (postId: string) => void
}

export function MyPostsDialog({ onEditPost }: MyPostsDialogProps) {
  const [open, setOpen] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [postToDelete, setPostToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (open) {
      fetchMyPosts()
    }
  }, [open])

  const fetchMyPosts = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/forum/posts/my-posts")
      const data = await response.json()
      
      if (Array.isArray(data)) {
        setPosts(data)
      } else {
        setPosts([])
      }
    } catch (error) {
      console.error("Error fetching my posts:", error)
      toast.error("Kunne ikke hente dine innlegg")
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (postId: string) => {
    setPostToDelete(postId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return
    
    setDeleting(true)
    try {
      const response = await fetch(`/api/forum/posts/${postToDelete}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete post")

      toast.success("Innlegg slettet!")
      fetchMyPosts()
      setDeleteDialogOpen(false)
      setPostToDelete(null)
    } catch (error) {
      console.error("Error deleting post:", error)
      toast.error("Kunne ikke slette innlegg. Prøv igjen.")
    } finally {
      setDeleting(false)
    }
  }

  const handleEdit = (postId: string) => {
    setOpen(false)
    onEditPost(postId)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2 h-9 text-sm">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Mine innlegg</span>
            <span className="sm:hidden">Mine</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[1000px] max-h-[85vh] sm:max-h-[90vh] p-0">
          <div className="flex flex-col max-h-[85vh] sm:max-h-[90vh]">
            <DialogHeader className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4 border-b">
              <DialogTitle className="text-lg sm:text-xl">Mine innlegg</DialogTitle>
              <DialogDescription className="text-sm">
                Administrer dine foruminnlegg
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
              {loading ? (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  Laster...
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  Du har ingen innlegg ennå.
                </div>
              ) : (
                <>
                  {/* Mobile: Card View */}
                  <div className="space-y-3 sm:hidden">
                    {posts.map((post) => (
                      <div key={post.id} className="rounded-lg border p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm line-clamp-2">{post.title}</h3>
                            <Badge variant="outline" className="gap-1 mt-1.5 text-xs h-5">
                              {post.category.icon} {post.category.name}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>{post.view_count}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            <span>{post.like_count}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            <span>{post.comment_count}</span>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(post.created_at), {
                            addSuffix: true,
                            locale: nb,
                          })}
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 h-7 flex-1 text-xs"
                            onClick={() => handleEdit(post.id)}
                          >
                            <Pencil className="h-3 w-3" />
                            Rediger
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 h-7 flex-1 text-xs text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(post.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                            Slett
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop: Table View */}
                  <div className="hidden sm:block rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tittel</TableHead>
                          <TableHead>Kategori</TableHead>
                          <TableHead className="text-center">Visninger</TableHead>
                          <TableHead className="text-center">Likes</TableHead>
                          <TableHead className="text-center">Kommentarer</TableHead>
                          <TableHead>Opprettet</TableHead>
                          <TableHead className="text-right">Handlinger</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {posts.map((post) => (
                          <TableRow key={post.id}>
                            <TableCell className="font-medium max-w-[300px]">
                              <div className="truncate">{post.title}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="gap-1">
                                {post.category.icon} {post.category.name}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Eye className="h-3 w-3 text-muted-foreground" />
                                <span>{post.view_count}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <ThumbsUp className="h-3 w-3 text-muted-foreground" />
                                <span>{post.like_count}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <MessageCircle className="h-3 w-3 text-muted-foreground" />
                                <span>{post.comment_count}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(post.created_at), {
                                addSuffix: true,
                                locale: nb,
                              })}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEdit(post.id)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteClick(post.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
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
              onClick={handleDeleteConfirm}
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
