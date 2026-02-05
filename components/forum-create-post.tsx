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
  SheetTrigger,
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
import { Plus, Loader2 } from "lucide-react"

interface Category {
  id: string
  name: string
  slug: string
  icon: string
}

interface CreatePostDialogProps {
  categories: Category[]
  onPostCreated: () => void
}

export function CreatePostDialog({ categories, onPostCreated }: CreatePostDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [categoryId, setCategoryId] = useState("")

  // Reset state when drawer closes
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setTitle("")
        setContent("")
        setCategoryId("")
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!title.trim()) {
      toast.error("Tittelen kan ikke være tom")
      return
    }

    if (!categoryId) {
      toast.error("Velg en kategori")
      return
    }

    const strippedContent = content.replace(/<[^>]*>/g, '').trim()
    if (!strippedContent) {
      toast.error("Innholdet kan ikke være tomt")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/forum/posts", {
        method: "POST",
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
        throw new Error(errorData.error || 'Failed to create post')
      }

      setOpen(false)
      toast.success("Innlegg opprettet!")
      onPostCreated()
    } catch (error) {
      console.error("Error creating post:", error)
      toast.error("Kunne ikke opprette innlegg. Prøv igjen.")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setOpen(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="gap-2 h-9">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nytt innlegg</span>
          <span className="sm:hidden">Ny</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="px-4 pt-6 pb-4 sm:px-6 border-b">
          <SheetTitle>Opprett nytt innlegg</SheetTitle>
          <SheetDescription>
            Del dine tanker, spørsmål eller erfaringer med fellesskapet (+10 poeng)
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Select 
                  value={categoryId} 
                  onValueChange={setCategoryId} 
                  required
                  disabled={loading}
                >
                  <SelectTrigger id="category">
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
                <Label htmlFor="title">Tittel</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Skriv en beskrivende tittel..."
                  required
                  maxLength={255}
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Innhold</Label>
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  placeholder="Skriv ditt innlegg her... Bruk verktøylinjen for formatering."
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
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Oppretter...
                </>
              ) : (
                "Publiser"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
