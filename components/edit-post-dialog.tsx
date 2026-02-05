"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

interface Category {
  id: string
  name: string
  slug: string
  icon: string
}

interface EditPostDialogProps {
  postId: string | null
  open: boolean
  onClose: () => void
  categories: Category[]
  onPostUpdated: () => void
}

export function EditPostDialog({
  postId,
  open,
  onClose,
  categories,
  onPostUpdated,
}: EditPostDialogProps) {
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [categoryId, setCategoryId] = useState("")

  useEffect(() => {
    if (open && postId) {
      fetchPost()
    }
  }, [open, postId])

  const fetchPost = async () => {
    if (!postId) return
    try {
      const response = await fetch(`/api/forum/posts/${postId}`)
      const data = await response.json()
      setTitle(data.title)
      setContent(data.content)
      setCategoryId(data.category_id)
    } catch (error) {
      console.error("Error fetching post:", error)
      toast.error("Kunne ikke laste innlegg")
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

    try {
      const response = await fetch(`/api/forum/posts/${postId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          category_id: categoryId,
        }),
      })

      if (!response.ok) throw new Error("Failed to update post")

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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[800px] max-h-[85vh] sm:max-h-[90vh] p-0">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <DialogHeader className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4">
            <DialogTitle className="text-lg sm:text-xl">Rediger innlegg</DialogTitle>
            <DialogDescription className="text-sm">
              Oppdater ditt innlegg
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-4 sm:px-6">
            <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title" className="text-sm">Tittel</Label>
                <Input
                  id="edit-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Skriv en fengende tittel..."
                  required
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category" className="text-sm">Kategori</Label>
                <Select value={categoryId} onValueChange={setCategoryId} required>
                  <SelectTrigger id="edit-category" className="h-9 sm:h-10">
                    <SelectValue placeholder="Velg kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id} className="text-sm">
                        {category.icon} {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Innhold</Label>
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  placeholder="Skriv innholdet her..."
                />
              </div>
            </div>
          </div>
          <DialogFooter className="px-4 pb-4 pt-3 sm:px-6 sm:pb-6 sm:pt-4 border-t bg-muted/50">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="h-9 text-sm">
              Avbryt
            </Button>
            <Button type="submit" disabled={loading} className="h-9 text-sm">
              {loading ? "Oppdaterer..." : "Oppdater innlegg"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
