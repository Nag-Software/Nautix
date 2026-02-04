"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export interface MaintenanceLog {
  id: string
  title: string
  description?: string
  category: string
  type: string
  date: string
  cost?: number
  performed_by?: string
  hours_spent?: number
  parts_used?: string
  status: string
  priority?: string
  location?: string
  notes?: string
}

interface MaintenanceLogDialogProps {
  onSuccess?: () => void
  editData?: MaintenanceLog
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function MaintenanceLogDialog({ onSuccess, editData, open: controlledOpen, onOpenChange }: MaintenanceLogDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Use controlled open if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen
  const [formData, setFormData] = useState({
    title: editData?.title || "",
    description: editData?.description || "",
    category: editData?.category || "motor",
    type: editData?.type || "service",
    date: editData?.date || new Date().toISOString().split("T")[0],
    cost: editData?.cost?.toString() || "",
    performed_by: editData?.performed_by || "",
    hours_spent: editData?.hours_spent?.toString() || "",
    parts_used: editData?.parts_used || "",
    status: editData?.status || "completed",
    priority: editData?.priority || "medium",
    location: editData?.location || "",
    notes: editData?.notes || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Du må være logget inn")
        return
      }

      const logData = {
        title: formData.title,
        description: formData.description || null,
        category: formData.category,
        type: formData.type,
        date: formData.date,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        performed_by: formData.performed_by || null,
        hours_spent: formData.hours_spent ? parseFloat(formData.hours_spent) : null,
        parts_used: formData.parts_used || null,
        status: formData.status,
        priority: formData.priority,
        location: formData.location || null,
        notes: formData.notes || null,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      }

      if (editData) {
        // Update existing log
        const { error } = await supabase
          .from("maintenance_log")
          .update(logData)
          .eq("id", editData.id)

        if (error) throw error
        toast.success("Vedlikeholdsoppføring oppdatert")
      } else {
        // Create new log
        const { error } = await supabase
          .from("maintenance_log")
          .insert([logData])

        if (error) throw error
        toast.success("Vedlikeholdsoppføring lagt til")
      }

      setOpen(false)
      if (onSuccess) onSuccess()
      
      // Reset form if creating new
      if (!editData) {
        setFormData({
          title: "",
          description: "",
          category: "motor",
          type: "service",
          date: new Date().toISOString().split("T")[0],
          cost: "",
          performed_by: "",
          hours_spent: "",
          parts_used: "",
          status: "completed",
          priority: "medium",
          location: "",
          notes: "",
        })
      }
    } catch (error) {
      console.error("Error saving maintenance log:", error)
      toast.error("Kunne ikke lagre oppføringen")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!editData && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Ny oppføring
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editData ? "Rediger vedlikeholdsoppføring" : "Legg til vedlikeholdsoppføring"}
          </DialogTitle>
          <DialogDescription>
            Dokumenter reparasjoner, service, skader og annet vedlikehold av båten.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Tittel *</Label>
              <Input
                id="title"
                placeholder="F.eks. Oljeskift motor"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            {/* Category and Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Kategori *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="motor">Motor</SelectItem>
                    <SelectItem value="skrog">Skrog</SelectItem>
                    <SelectItem value="elektrisitet">Elektrisitet</SelectItem>
                    <SelectItem value="rigg">Rigg & Seil</SelectItem>
                    <SelectItem value="navigasjon">Navigasjon</SelectItem>
                    <SelectItem value="sikkerhet">Sikkerhet</SelectItem>
                    <SelectItem value="interiør">Interiør</SelectItem>
                    <SelectItem value="annet">Annet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="reparasjon">Reparasjon</SelectItem>
                    <SelectItem value="skade">Skade</SelectItem>
                    <SelectItem value="oppgradering">Oppgradering</SelectItem>
                    <SelectItem value="inspeksjon">Inspeksjon</SelectItem>
                    <SelectItem value="rengjøring">Rengjøring</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Dato *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">Fullført</SelectItem>
                    <SelectItem value="in-progress">Pågående</SelectItem>
                    <SelectItem value="pending">Planlagt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Priority and Cost */}
            <div className="grid grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <Label htmlFor="cost">Kostnad (kr)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                />
              </div>
            </div>

            {/* Performed by and Hours */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="performed_by">Utført av</Label>
                <Input
                  id="performed_by"
                  placeholder="F.eks. navn på verksted eller person"
                  value={formData.performed_by}
                  onChange={(e) => setFormData({ ...formData, performed_by: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hours_spent">Timer brukt</Label>
                <Input
                  id="hours_spent"
                  type="number"
                  step="0.5"
                  placeholder="0"
                  value={formData.hours_spent}
                  onChange={(e) => setFormData({ ...formData, hours_spent: e.target.value })}
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Sted</Label>
              <Input
                id="location"
                placeholder="F.eks. Marina Service Oslo"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            {/* Parts Used */}
            <div className="space-y-2">
              <Label htmlFor="parts_used">Deler brukt</Label>
              <Textarea
                id="parts_used"
                placeholder="F.eks. Motorolje 5W-30, oljefilter, drivstoffilter"
                value={formData.parts_used}
                onChange={(e) => setFormData({ ...formData, parts_used: e.target.value })}
                rows={2}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Beskrivelse</Label>
              <Textarea
                id="description"
                placeholder="Detaljert beskrivelse av arbeidet som ble utført"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notater</Label>
              <Textarea
                id="notes"
                placeholder="Ekstra notater, observasjoner eller tips for fremtiden"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editData ? "Oppdater" : "Legg til"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
