"use client"

import * as React from "react"
import { useState } from "react"
import { Send } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SupportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SupportDialog({ open, onOpenChange }: SupportDialogProps) {
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus("idle")

    try {
      const supabase = createClient()
      
      // Hent brukerinfo
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setSubmitStatus("error")
        return
      }

      // Lagre support ticket i Supabase
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          user_email: user.email || '',
          subject: subject,
          message: message,
          status: 'open',
          priority: 'normal'
        })

      if (error) {
        console.error('Error submitting support ticket:', error)
        setSubmitStatus("error")
        return
      }
      
      setSubmitStatus("success")
      setTimeout(() => {
        setSubject("")
        setMessage("")
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
          <DialogTitle>Support</DialogTitle>
          <DialogDescription>
            Trenger du hjelp? Send oss en melding så svarer vi deg så snart som mulig.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="subject">Emne</Label>
              <Input
                id="subject"
                placeholder="Hva dreier henvendelsen seg om?"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Melding</Label>
              <Textarea
                id="message"
                placeholder="Beskriv ditt spørsmål eller problem..."
                className="min-h-[150px]"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>
            {submitStatus === "success" && (
              <p className="text-sm text-green-600 dark:text-green-400">
                Meldingen er sendt! Vi kommer tilbake til deg snart.
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
            <Button type="submit" disabled={isSubmitting}>
              <Send className="mr-2 h-4 w-4" />
              {isSubmitting ? "Sender..." : "Send"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
