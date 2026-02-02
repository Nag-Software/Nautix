"use client"

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Anchor, Plus, Compass, CheckCircle2, AlertCircle, Loader2, Pencil, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

interface Equipment {
  id?: string
  name: string
  category: string
  status: "active" | "needs-service" | "expired"
  expiry_date?: string
  purchase_date?: string
  cost?: string
  notes?: string
}

export default function UtstyrPage() {
  const [loading, setLoading] = useState(true)
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<Equipment | null>(null)
  const [formData, setFormData] = useState<Equipment>({
    name: "",
    category: "",
    status: "active",
    expiry_date: "",
    purchase_date: "",
    cost: "",
    notes: "",
  })
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    loadEquipment()
  }, [])

  const loadEquipment = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setMessage({ type: "error", text: "Du må være logget inn" })
        setLoading(false)
        return
      }

      const { data: boat } = await supabase
        .from('boats')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!boat) {
        setMessage({ type: "error", text: "Du må først registrere båtinformasjon" })
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .eq('boat_id', boat.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setEquipment(data || [])
    } catch (error) {
      console.error('Error loading equipment:', error)
      setMessage({ type: "error", text: "Kunne ikke laste utstyr" })
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingItem(null)
    setFormData({
      name: "",
      category: "",
      status: "active",
      expiry_date: "",
      purchase_date: "",
      cost: "",
      notes: "",
    })
    setShowDialog(true)
  }

  const handleEdit = (item: Equipment) => {
    setEditingItem(item)
    setFormData({
      ...item,
      expiry_date: item.expiry_date || "",
      purchase_date: item.purchase_date || "",
      cost: item.cost?.toString() || "",
      notes: item.notes || "",
    })
    setShowDialog(true)
  }

  const handleSave = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setMessage({ type: "error", text: "Du må være logget inn" })
        return
      }

      const { data: boat } = await supabase
        .from('boats')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!boat) {
        setMessage({ type: "error", text: "Båt ID mangler" })
        return
      }

      const payload = {
        boat_id: boat.id,
        user_id: user.id,
        name: formData.name,
        category: formData.category,
        status: formData.status,
        expiry_date: formData.expiry_date || null,
        purchase_date: formData.purchase_date || null,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        notes: formData.notes || null,
      }

      if (editingItem?.id) {
        const { error } = await supabase
          .from('equipment')
          .update(payload)
          .eq('id', editingItem.id)

        if (error) throw error
        setMessage({ type: "success", text: "Utstyr oppdatert!" })
      } else {
        const { error } = await supabase
          .from('equipment')
          .insert([payload])

        if (error) throw error
        setMessage({ type: "success", text: "Utstyr lagt til!" })
      }

      setShowDialog(false)
      loadEquipment()
    } catch (error) {
      console.error('Error saving equipment:', error)
      setMessage({ type: "error", text: "Kunne ikke lagre utstyr" })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Er du sikker på at du vil slette dette utstyret?")) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', id)

      if (error) throw error
      setMessage({ type: "success", text: "Utstyr slettet!" })
      loadEquipment()
    } catch (error) {
      console.error('Error deleting equipment:', error)
      setMessage({ type: "error", text: "Kunne ikke slette utstyr" })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
            <CheckCircle2 className="h-3 w-3" />
            Aktiv
          </Badge>
        )
      case "needs-service":
        return (
          <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
            <AlertCircle className="h-3 w-3" />
            Trenger service
          </Badge>
        )
      case "expired":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Utløpt
          </Badge>
        )
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Navigasjon":
        return Compass
      case "Sikkerhet":
        return AlertCircle
      default:
        return Anchor
    }
  }

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Min båt
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Utstyr & Tilbehør</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center px-4 py-6 sm:px-6 md:px-8 lg:px-12">
          <div className="w-full max-w-5xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-3">
                  <Anchor className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Utstyr & Tilbehør</h1>
                  <p className="text-muted-foreground">
                    Oversikt over alt utstyr og tilbehør om bord
                  </p>
                </div>
              </div>
              <Button onClick={handleAdd}>
                <Plus className="mr-2 h-4 w-4" />
                Legg til utstyr
              </Button>
            </div>

            {message && (
              <div className={`rounded-lg p-4 ${
                message.type === "success" 
                  ? "bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-100" 
                  : "bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-100"
              }`}>
                {message.text}
              </div>
            )}

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Aktivt utstyr
                </div>
                <div className="mt-2 text-2xl font-bold">
                  {equipment.filter(e => e.status === "active").length}
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  Trenger service
                </div>
                <div className="mt-2 text-2xl font-bold text-yellow-600">
                  {equipment.filter(e => e.status === "needs-service").length}
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  Utløpt
                </div>
                <div className="mt-2 text-2xl font-bold text-red-600">
                  {equipment.filter(e => e.status === "expired").length}
                </div>
              </div>
            </div>

            {/* Equipment List */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Utstyrsliste</h2>
              {equipment.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Ingen utstyr registrert ennå. Klikk "Legg til utstyr" for å komme i gang.
                </div>
              ) : (
                equipment.map((item) => {
                  const Icon = getCategoryIcon(item.category)
                  return (
                    <div key={item.id} className="rounded-lg border p-4 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-1 rounded-full bg-primary/10 p-2">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold">{item.name}</h3>
                              {getStatusBadge(item.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Kategori: {item.category}
                            </p>
                            {item.expiry_date && (
                              <p className="text-xs text-muted-foreground">
                                Utløpsdato: {new Date(item.expiry_date).toLocaleDateString('nb-NO')}
                              </p>
                            )}
                            {item.notes && (
                              <p className="text-xs text-muted-foreground mt-2">
                                {item.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(item.id!)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </main>

        {/* Add/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Rediger utstyr" : "Legg til nytt utstyr"}</DialogTitle>
              <DialogDescription>
                Fyll inn informasjon om utstyret
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Navn *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="F.eks: VHF Radio"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Kategori *</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="F.eks: Navigasjon"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="active">Aktiv</option>
                    <option value="needs-service">Trenger service</option>
                    <option value="expired">Utløpt</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchase_date">Kjøpsdato</Label>
                  <Input
                    id="purchase_date"
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiry_date">Utløpsdato</Label>
                  <Input
                    id="expiry_date"
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Kostnad (kr)</Label>
                <Input
                  id="cost"
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notater</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ekstra informasjon..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Avbryt
              </Button>
              <Button onClick={handleSave} disabled={!formData.name || !formData.category}>
                Lagre
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
