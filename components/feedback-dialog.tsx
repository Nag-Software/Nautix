"use client"

import * as React from "react"
import { useState } from "react"
import { Send, Star } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface FeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [feedback, setFeedback] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      return
    }

    setIsSubmitting(true)
    setSubmitStatus("idle")

    try {
      const supabase = createClient()
      
      // Hent brukerinfo (valgfritt for feedback)
      const { data: { user } } = await supabase.auth.getUser()

      // Lagre feedback i Supabase
      const { error } = await supabase
        .from('feedback')
        .insert({
          user_id: user?.id || null,
          user_email: user?.email || null,
          rating: rating,
          message: feedback || null
        })

      if (error) {
        console.error('Error submitting feedback:', error)
        setSubmitStatus("error")
        return
      }
      
      setSubmitStatus("success")
      setTimeout(() => {
        setRating(0)
        setFeedback("")
        setSubmitStatus("idle")
        onOpenChange(false)
      }, 1500)
    } catch (error) {
      console.error('Error:', error)
      setSubmitStatus("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Gi tilbakemelding</DialogTitle>
          <DialogDescription>
            Vi setter pris på din tilbakemelding! Hjelp oss å forbedre Nautix.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            <div className="grid gap-3">
              <Label>Vurdering</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= (hoveredRating || rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm text-muted-foreground">
                  Du har gitt {rating} {rating === 1 ? "stjerne" : "stjerner"}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="feedback">Tilbakemelding (valgfritt)</Label>
              <Textarea
                id="feedback"
                placeholder="Fortell oss hva du synes..."
                className="min-h-[120px]"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>
            {submitStatus === "success" && (
              <p className="text-sm text-green-600 dark:text-green-400">
                Takk for tilbakemeldingen! Dette hjelper oss å bli bedre.
              </p>
            )}
            {submitStatus === "error" && (
              <p className="text-sm text-red-600 dark:text-red-400">
                Noe gikk galt. Vennligst prøv igjen.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={isSubmitting || rating === 0}>
              <Send className="mr-2 h-4 w-4" />
              {isSubmitting ? "Sender..." : "Send"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
