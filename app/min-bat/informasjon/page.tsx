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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Ship, Save, Loader2, X, Check, Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { AIInputWrapper } from "@/components/ai-input-wrapper"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


interface BoatData {
  id?: string
  name: string
  type: string
  manufacturer: string
  model: string
  year: string
  registration_number: string
  length_meters: string
  width_meters: string
  weight_kg: string
  hull_material: string
  hull_color: string
}

export default function BatInformasjonPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [boatData, setBoatData] = useState<BoatData>({
    name: "",
    type: "",
    manufacturer: "",
    model: "",
    year: "",
    registration_number: "",
    length_meters: "",
    width_meters: "",
    weight_kg: "",
    hull_material: "",
    hull_color: "",
  })
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [suggestion, setSuggestion] = useState<{
    field: keyof BoatData
    originalValue: string
    suggestedValue: string
  } | null>(null)
  const [autofillSuggestions, setAutofillSuggestions] = useState<Record<string, string> | null>(null)
  const [showAutofillPrompt, setShowAutofillPrompt] = useState(false)

  useEffect(() => {
    loadBoatData()
  }, [])

  const loadBoatData = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setMessage({ type: "error", text: "Du må være logget inn" })
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('boats')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Supabase error details:', { 
          message: error.message, 
          code: error.code, 
          details: error.details,
          hint: error.hint 
        })
        throw error
      }

      if (data) {
        setBoatData({
          id: data.id,
          name: data.name || "",
          type: data.type || "",
          manufacturer: data.manufacturer || "",
          model: data.model || "",
          year: data.year?.toString() || "",
          registration_number: data.registration_number || "",
          length_meters: data.length_meters?.toString() || "",
          width_meters: data.width_meters?.toString() || "",
          weight_kg: data.weight_kg?.toString() || "",
          hull_material: data.hull_material || "",
          hull_color: data.hull_color || "",
        })
      }
    } catch (error: any) {
      console.error('Error loading boat data:', error)
      const errorMessage = error?.message || 'Ukjent feil'
      setMessage({ type: "error", text: `Kunne ikke laste båtinformasjon: ${errorMessage}` })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setMessage({ type: "error", text: "Du må være logget inn" })
        return
      }

      const payload = {
        user_id: user.id,
        name: boatData.name || null,
        type: boatData.type || null,
        manufacturer: boatData.manufacturer || null,
        model: boatData.model || null,
        year: boatData.year ? parseInt(boatData.year) : null,
        registration_number: boatData.registration_number || null,
        length_meters: boatData.length_meters ? parseFloat(boatData.length_meters) : null,
        width_meters: boatData.width_meters ? parseFloat(boatData.width_meters) : null,
        weight_kg: boatData.weight_kg ? parseInt(boatData.weight_kg) : null,
        hull_material: boatData.hull_material || null,
        hull_color: boatData.hull_color || null,
        updated_at: new Date().toISOString(),
      }

      if (boatData.id) {
        // Update existing boat
        const { error } = await supabase
          .from('boats')
          .update(payload)
          .eq('id', boatData.id)

        if (error) throw error
      } else {
        // Insert new boat
        const { data, error } = await supabase
          .from('boats')
          .insert([payload])
          .select()
          .single()

        if (error) throw error
        if (data) {
          setBoatData({ ...boatData, id: data.id })
        }
      }

      setMessage({ type: "success", text: "Båtinformasjon lagret!" })
    } catch (error) {
      console.error('Error saving boat data:', error)
      setMessage({ type: "error", text: "Kunne ikke lagre båtinformasjon" })
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof BoatData, value: string) => {
    setBoatData({ ...boatData, [field]: value })
  }

  const checkForSuggestions = async (field: keyof BoatData, value: string) => {
    // Only check for specific fields
    const fieldsToCheck: (keyof BoatData)[] = ['manufacturer', 'model', 'hull_material']
    if (!fieldsToCheck.includes(field) || !value || value.length < 2) {
      return
    }

    try {
      const response = await fetch('/api/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ field, value }),
      })

      const data = await response.json()

      if (data.suggestion) {
        setSuggestion({
          field,
          originalValue: value,
          suggestedValue: data.suggestion,
        })
      }
    } catch (error) {
      console.error('Error checking suggestions:', error)
    }
  }

  const acceptSuggestion = () => {
    if (suggestion) {
      setBoatData({ ...boatData, [suggestion.field]: suggestion.suggestedValue })
      setSuggestion(null)
    }
  }

  const rejectSuggestion = () => {
    setSuggestion(null)
  }

  const handleAutofillSuggestions = (suggestions: Record<string, string>) => {
    setAutofillSuggestions(suggestions)
    setShowAutofillPrompt(true)
  }

  const applyAutofill = () => {
    if (autofillSuggestions) {
      setBoatData({
        ...boatData,
        ...autofillSuggestions
      })
      setShowAutofillPrompt(false)
      setAutofillSuggestions(null)
      setMessage({ type: "success", text: "AI-forslag ble fylt inn!" })
    }
  }

  const rejectAutofill = () => {
    setShowAutofillPrompt(false)
    setAutofillSuggestions(null)
  }

  const handleReset = () => {
    setShowAutofillPrompt(false)
    setAutofillSuggestions(null)
    setSuggestion(null)
    setMessage(null)
    setBoatData({
      ...boatData,
      name: "",
      type: "",
      manufacturer: "",
      model: "",
      year: "",
      registration_number: "",
      length_meters: "",
      width_meters: "",
      weight_kg: "",
      hull_material: "",
      hull_color: "",
    })
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
                  <BreadcrumbPage>Båtinformasjon</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center px-4 py-6 sm:px-6 md:px-8 lg:px-12">
          <div className="w-full max-w-3xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-3">
                <Ship className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Båtinformasjon</h1>
                <p className="text-muted-foreground">
                  Grunnleggende informasjon om båten din
                </p>
              </div>
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

            {showAutofillPrompt && autofillSuggestions && (
              <div className="rounded-lg border border-border bg-card p-5 shadow-sm animate-in fade-in-50 slide-in-from-top-2 duration-300">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-primary/10 p-2.5">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">
                        Båtinformasjon funnet
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Basert på <span className="font-medium text-foreground">{boatData.manufacturer} {boatData.model}</span> foreslår AI å fylle ut:
                      </p>
                    </div>
                    <div className="space-y-1.5 rounded-md bg-muted/50 p-3">
                      {Object.entries(autofillSuggestions).map(([key, value]) => {
                        const labels: Record<string, string> = {
                          length_meters: 'Lengde (m)',
                          width_meters: 'Bredde (m)',
                          weight_kg: 'Vekt (kg)',
                          hull_material: 'Skrogmateriale',
                          year: 'Årsmodell'
                        }
                        return (
                          <div key={key} className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">
                              {labels[key]}
                            </span>
                            <span className="font-medium text-foreground">{value}</span>
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={applyAutofill}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Bruk forslagene
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={rejectAutofill}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Avvis
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-lg border p-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="boat-name">Båtnavn</Label>
                  <Input 
                    id="boat-name" 
                    placeholder="F.eks: Havørn" 
                    value={boatData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="boat-type">Båttype</Label>
                  <Select value={boatData.type} onValueChange={(value) => handleChange('type', value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Velg båttype" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Båttyper</SelectLabel>
                        <SelectItem value="Motorbåt">Motorbåt</SelectItem>
                        <SelectItem value="Seilbåt">Seilbåt</SelectItem>
                        <SelectItem value="RIB">RIB</SelectItem>
                        <SelectItem value="Fiskefartøy">Fiskefartøy</SelectItem>
                        <SelectItem value="Annet">Annet</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Produsent</Label>
                  <AIInputWrapper
                    id="manufacturer" 
                    field="manufacturer"
                    placeholder="F.eks: Nordkapp" 
                    value={boatData.manufacturer}
                    onValueChange={(value) => handleChange('manufacturer', value)}
                    triggerFields={{
                      manufacturer: boatData.manufacturer,
                      model: boatData.model
                    }}
                    enableAutofill={true}
                    autofillType="boat"
                    currentData={boatData}
                    onAutofillSuggestions={handleAutofillSuggestions}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Modell</Label>
                  <AIInputWrapper
                    id="model" 
                    field="model"
                    placeholder="F.eks: 60 Cabin" 
                    value={boatData.model}
                    onValueChange={(value) => handleChange('model', value)}
                    triggerFields={{
                      manufacturer: boatData.manufacturer,
                      model: boatData.model
                    }}
                    enableAutofill={true}
                    autofillType="boat"
                    currentData={boatData}
                    onAutofillSuggestions={handleAutofillSuggestions}
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="year">Årsmodell</Label>
                  <Input 
                    id="year" 
                    type="number" 
                    placeholder="F.eks: 2020" 
                    value={boatData.year}
                    onChange={(e) => handleChange('year', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registration">Registreringsnummer</Label>
                  <Input 
                    id="registration" 
                    placeholder="F.eks: NO-12345" 
                    value={boatData.registration_number}
                    onChange={(e) => handleChange('registration_number', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="length">Lengde (m)</Label>
                  <Input 
                    id="length" 
                    type="number" 
                    step="0.1" 
                    placeholder="F.eks: 33" 
                    value={boatData.length_meters}
                    onChange={(e) => handleChange('length_meters', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="width">Bredde (meter)</Label>
                  <Input 
                    id="width" 
                    type="number" 
                    step="0.1" 
                    placeholder="F.eks: 2.4" 
                    value={boatData.width_meters}
                    onChange={(e) => handleChange('width_meters', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Vekt (kg)</Label>
                  <Input 
                    id="weight" 
                    type="number" 
                    placeholder="F.eks: 1200" 
                    value={boatData.weight_kg}
                    onChange={(e) => handleChange('weight_kg', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hull-material">Skrogmateriale</Label>
                  <div>
                    <Select value={boatData.hull_material} onValueChange={(value) => handleChange('hull_material', value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Velg båttype" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Skrogmateriale</SelectLabel>
                        <SelectItem value="glassfiber">Glassfiber</SelectItem>
                        <SelectItem value="aluminium">Aluminium</SelectItem>
                        <SelectItem value="tre">Tre</SelectItem>
                        <SelectItem value="stål">Plast</SelectItem>
                        <SelectItem value="annet">Annet</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hull-color">Skrogfarge</Label>
                  <Input 
                    id="hull-color" 
                    placeholder="F.eks: Hvit" 
                    value={boatData.hull_color}
                    onChange={(e) => handleChange('hull_color', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline"
                  onClick={handleReset}
                  disabled={saving}
                >
                  Tilbakestill
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Lagrer...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Lagre informasjon
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
