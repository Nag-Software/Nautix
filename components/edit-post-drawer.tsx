"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RichTextEditor } from "@/components/rich-text-editor"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"

interface Category {
  id: string
  name: string
  slug: string
  icon: string
}

interface EditPostDrawerProps {
  postId: string | null
  open: boolean
  onClose: () => void
  categories: Category[]
  onPostUpdated: () => void
}

export function EditPostDrawer({
  postId,
  open,
  onClose,
  categories,
  onPostUpdated,
}: EditPostDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [categoryId, setCategoryId] = useState("")

  // Reset state when drawer closes
  useEffect(() => {
    if (!open) {
      // Clear state after animation
      const timer = setTimeout(() => {
        setTitle("")
        setContent("")
        setCategoryId("")
        setFetching(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [open])

  // Fetch post when drawer opens
  useEffect(() => {
    if (open && postId) {
      fetchPost()
    }
  }, [open, postId])

  const fetchPost = async () => {
    if (!postId) return
    
    setFetching(true)
    try {
      const response = await fetch(`/api/forum/posts/${postId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch post')
      }
      
      const data = await response.json()
      
      // Validate that we got the expected data
      if (!data.title || !data.content) {
        throw new Error('Invalid post data received')
      }
      
      setTitle(data.title)
      setContent(data.content)
      setCategoryId(data.category_id)
    } catch (error) {
      console.error("Error fetching post:", error)
      toast.error("Kunne ikke laste innlegg for redigering")
      onClose()
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!postId) return
    
    setLoading(true)

    // Strip HTML tags to check if there's actual content
    const strippedContent = content.replace(/<[^>]*>/g, '').trim()
    if (!strippedContent) {
      toast.error("Innholdet kan ikke være tomt")
      setLoading(false)
      return
    }

    if (!title.trim()) {
      toast.error("Tittelen kan ikke være tom")
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/forum/posts/${postId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          content,
          category_id: categoryId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update post')
      }

      toast.success("Innlegg oppdatert!")
      onClose()
      onPostUpdated()
    } catch (error) {
      console.error("Error updating post:", error)
      toast.error("Kunne ikke oppdatere innlegg. Prøv igjen.")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col overflow-y-auto">
        <SheetHeader className="px-4 pt-6 pb-4 sm:px-6 border-b">
          <SheetTitle>Rediger innlegg</SheetTitle>
          <SheetDescription>
            Oppdater ditt innlegg
          </SheetDescription>
        </SheetHeader>

        {fetching ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm">Laster innlegg...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto px-4 sm:px-6">
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Tittel</Label>
                  <Input
                    id="edit-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Skriv en fengende tittel..."
                    required
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Kategori</Label>
                  <Select 
                    value={categoryId} 
                    onValueChange={setCategoryId} 
                    required
                    disabled={loading}
                  >
                    <SelectTrigger id="edit-category">
                      <SelectValue placeholder="Velg kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Innhold</Label>
                  <RichTextEditor
                    content={content}
                    onChange={setContent}
                    placeholder="Skriv innholdet her..."
                  />
                </div>
              </div>
            </div>
            
            <SheetFooter className="px-4 pb-4 pt-3 sm:px-6 border-t bg-muted/50">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose} 
                disabled={loading}
              >
                Avbryt
              </Button>
              <Button type="submit" disabled={loading || fetching}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Oppdaterer...
                  </>
                ) : (
                  "Oppdater innlegg"
                )}
              </Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  )
}
