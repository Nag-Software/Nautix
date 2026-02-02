"use client"

import { useState, useEffect } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sparkles, Loader2, Calendar, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface AiReminderDialogProps {
  maintenanceLogId: string
  maintenanceTitle: string
  maintenanceCategory: string
  maintenanceType: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface AiSuggestion {
  nextServiceDate: string
  intervalDays: number
  priority: string
  reason: string
}

export function AiReminderDialog({
  maintenanceLogId,
  maintenanceTitle,
  maintenanceCategory,
  maintenanceType,
  open,
  onOpenChange,
}: AiReminderDialogProps) {
  const [loading, setLoading] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null)
  const [loadingSuggestion, setLoadingSuggestion] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
    priority: "medium",
    category: maintenanceCategory,
  })

  const getAiSuggestion = async () => {
    setLoadingSuggestion(true)
    try {
      const response = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "maintenance_reminder",
          maintenanceTitle,
          maintenanceCategory,
          maintenanceType,
        }),
      })

      const data = await response.json()
      if (data.suggestion) {
        setAiSuggestion(data.suggestion)
        
        // Pre-fill form with AI suggestion
        setFormData({
          title: `${maintenanceTitle} - neste service`,
          description: data.suggestion.reason,
          due_date: data.suggestion.nextServiceDate,
          priority: data.suggestion.priority,
          category: maintenanceCategory,
        })
      }
    } catch (error) {
      console.error("Error getting AI suggestion:", error)
      toast.error("Kunne ikke hente AI-forslag")
    } finally {
      setLoadingSuggestion(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Du må være logget inn")
        return
      }

      const { error } = await supabase.from("reminders").insert([
        {
          user_id: user.id,
          maintenance_log_id: maintenanceLogId,
          title: formData.title,
          description: formData.description,
          due_date: formData.due_date,
          priority: formData.priority,
          category: formData.category,
          completed: false,
          ai_suggested: !!aiSuggestion,
        },
      ])

      if (error) throw error

      toast.success("Påminnelse opprettet")
      onOpenChange(false)
      
      // Reset
      setAiSuggestion(null)
      setFormData({
        title: "",
        description: "",
        due_date: "",
        priority: "medium",
        category: maintenanceCategory,
      })
    } catch (error) {
      console.error("Error creating reminder:", error)
      toast.error("Kunne ikke opprette påminnelse")
    } finally {
      setLoading(false)
    }
  }

  // Load AI suggestion when dialog opens
  useEffect(() => {
    if (open && !aiSuggestion) {
      getAiSuggestion()
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Opprett påminnelse med AI
          </DialogTitle>
          <DialogDescription>
            AI foreslår når neste vedlikehold bør utføres basert på "{maintenanceTitle}"
          </DialogDescription>
        </DialogHeader>

        {loadingSuggestion ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            <p className="text-sm text-muted-foreground">Analyserer vedlikeholdsdata...</p>
          </div>
        ) : aiSuggestion ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* AI Suggestion Card */}
            <div className="rounded-lg border border-purple-200 bg-purple-50 dark:bg-purple-950/20 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Sparkles className="h-5 w-5 text-purple-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-1">AI Anbefaling</h4>
                  <p className="text-sm text-muted-foreground">{aiSuggestion.reason}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-purple-200 dark:border-purple-800">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Neste service</p>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(aiSuggestion.nextServiceDate).toLocaleDateString("nb-NO", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Prioritet</p>
                  <Badge
                    variant={
                      aiSuggestion.priority === "high"
                        ? "destructive"
                        : aiSuggestion.priority === "medium"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {aiSuggestion.priority === "high"
                      ? "Høy"
                      : aiSuggestion.priority === "medium"
                      ? "Middels"
                      : "Lav"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tittel *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beskrivelse</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="due_date">Forfallsdato *</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Prioritet</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Lav</SelectItem>
                      <SelectItem value="medium">Middels</SelectItem>
                      <SelectItem value="high">Høy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Avbryt
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Sparkles className="mr-2 h-4 w-4" />
                Opprett påminnelse
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Kunne ikke generere forslag</p>
            <Button onClick={getAiSuggestion} variant="outline" size="sm">
              Prøv igjen
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
