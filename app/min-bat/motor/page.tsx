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
import { Textarea } from "@/components/ui/textarea"
import { Gauge, Save, Loader2, Sparkles, Check, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { AIInputWrapper } from "@/components/ai-input-wrapper"

interface EngineData {
  id?: string
  boat_id?: string
  manufacturer: string
  model: string
  horsepower: string
  year: string
  serial_number: string
  engine_type: string
  fuel_type: string
  tank_capacity_liters: string
  fuel_consumption_lph: string
  propeller: string
  oil_type: string
  notes: string
}

export default function MotorPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [engineData, setEngineData] = useState<EngineData>({
    manufacturer: "",
    model: "",
    horsepower: "",
    year: "",
    serial_number: "",
    engine_type: "",
    fuel_type: "",
    tank_capacity_liters: "",
    fuel_consumption_lph: "",
    propeller: "",
    oil_type: "",
    notes: "",
  })
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [autofillSuggestions, setAutofillSuggestions] = useState<Record<string, string> | null>(null)
  const [showAutofillPrompt, setShowAutofillPrompt] = useState(false)

  useEffect(() => {
    loadEngineData()
  }, [])

  const loadEngineData = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setMessage({ type: "error", text: "Du må være logget inn" })
        setLoading(false)
        return
      }

      // First get boat_id
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
        .from('engines')
        .select('*')
        .eq('user_id', user.id)
        .eq('boat_id', boat.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setEngineData({
          id: data.id,
          boat_id: data.boat_id,
          manufacturer: data.manufacturer || "",
          model: data.model || "",
          horsepower: data.horsepower?.toString() || "",
          year: data.year?.toString() || "",
          serial_number: data.serial_number || "",
          engine_type: data.engine_type || "",
          fuel_type: data.fuel_type || "",
          tank_capacity_liters: data.tank_capacity_liters?.toString() || "",
          fuel_consumption_lph: data.fuel_consumption_lph?.toString() || "",
          propeller: data.propeller || "",
          oil_type: data.oil_type || "",
          notes: data.notes || "",
        })
      } else {
        // No data exists, create empty form with boat_id
        setEngineData({
          boat_id: boat.id,
          manufacturer: "",
          model: "",
          horsepower: "",
          year: "",
          serial_number: "",
          engine_type: "",
          fuel_type: "",
          tank_capacity_liters: "",
          fuel_consumption_lph: "",
          propeller: "",
          oil_type: "",
          notes: "",
        })
      }
    } catch (error) {
      console.error('Error loading engine data:', error)
      setMessage({ type: "error", text: "Kunne ikke laste motordetaljer" })
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

      if (!engineData.boat_id) {
        setMessage({ type: "error", text: "Båt ID mangler" })
        return
      }

      const payload = {
        user_id: user.id,
        boat_id: engineData.boat_id,
        manufacturer: engineData.manufacturer || null,
        model: engineData.model || null,
        horsepower: engineData.horsepower ? parseInt(engineData.horsepower) : null,
        year: engineData.year ? parseInt(engineData.year) : null,
        serial_number: engineData.serial_number || null,
        engine_type: engineData.engine_type || null,
        fuel_type: engineData.fuel_type || null,
        tank_capacity_liters: engineData.tank_capacity_liters ? parseInt(engineData.tank_capacity_liters) : null,
        fuel_consumption_lph: engineData.fuel_consumption_lph ? parseFloat(engineData.fuel_consumption_lph) : null,
        propeller: engineData.propeller || null,
        oil_type: engineData.oil_type || null,
        notes: engineData.notes || null,
        updated_at: new Date().toISOString(),
      }

      if (engineData.id) {
        const { error } = await supabase
          .from('engines')
          .update(payload)
          .eq('id', engineData.id)

        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('engines')
          .insert([payload])
          .select()
          .single()

        if (error) throw error
        if (data) {
          setEngineData({ ...engineData, id: data.id })
        }
      }

      setMessage({ type: "success", text: "Motordetaljer lagret!" })
    } catch (error) {
      console.error('Error saving engine data:', error)
      setMessage({ type: "error", text: "Kunne ikke lagre motordetaljer" })
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof EngineData, value: string) => {
    setEngineData({ ...engineData, [field]: value })
  }

  const handleAutofillSuggestions = (suggestions: Record<string, string>) => {
    setAutofillSuggestions(suggestions)
    setShowAutofillPrompt(true)
  }

  const applyAutofill = () => {
    if (autofillSuggestions) {
      setEngineData({
        ...engineData,
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
    setMessage(null)
    setEngineData({
      ...engineData,
      manufacturer: "",
      model: "",
      horsepower: "",
      year: "",
      serial_number: "",
      engine_type: "",
      fuel_type: "",
      tank_capacity_liters: "",
      fuel_consumption_lph: "",
      propeller: "",
      oil_type: "",
      notes: "",
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
                  <BreadcrumbPage>Motordetaljer</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center px-4 py-6 sm:px-6 md:px-8 lg:px-12">
          <div className="w-full max-w-5xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-3">
                <Gauge className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Motordetaljer</h1>
                <p className="text-muted-foreground">
                  Informasjon om båtens motor og fremdriftssystem
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
                        Motorinformasjon funnet
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Basert på <span className="font-medium text-foreground">{engineData.manufacturer} {engineData.model}</span> foreslår AI å fylle ut:
                      </p>
                    </div>
                    <div className="space-y-1.5 rounded-md bg-muted/50 p-3">
                      {Object.entries(autofillSuggestions).map(([key, value]) => {
                        const labels: Record<string, string> = {
                          horsepower: 'Hestekrefter',
                          year: 'Årsmodell',
                          engine_type: 'Motortype',
                          fuel_type: 'Drivstofftype',
                          fuel_consumption_lph: 'Forbruk',
                          oil_type: 'Oljetype'
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
                  <Label htmlFor="engine-manufacturer">Motorprodusent</Label>
                  <AIInputWrapper
                    id="engine-manufacturer" 
                    field="manufacturer"
                    placeholder="F.eks: Yamaha" 
                    value={engineData.manufacturer}
                    onValueChange={(value) => handleChange('manufacturer', value)}
                    triggerFields={{
                      manufacturer: engineData.manufacturer,
                      model: engineData.model
                    }}
                    enableAutofill={true}
                    currentData={engineData}
                    onAutofillSuggestions={handleAutofillSuggestions}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="engine-model">Motormodell</Label>
                  <AIInputWrapper
                    id="engine-model" 
                    field="model"
                    placeholder="F.eks: F115 AETL" 
                    value={engineData.model}
                    onValueChange={(value) => handleChange('model', value)}
                    triggerFields={{
                      manufacturer: engineData.manufacturer,
                      model: engineData.model
                    }}
                    enableAutofill={true}
                    currentData={engineData}
                    onAutofillSuggestions={handleAutofillSuggestions}
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="horsepower">Hestekrefter (HK)</Label>
                  <Input 
                    id="horsepower" 
                    type="number" 
                    placeholder="F.eks: 115" 
                    value={engineData.horsepower}
                    onChange={(e) => handleChange('horsepower', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="engine-year">Årsmodell</Label>
                  <Input 
                    id="engine-year" 
                    type="number" 
                    placeholder="F.eks: 2021" 
                    value={engineData.year}
                    onChange={(e) => handleChange('year', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serial-number">Serienummer</Label>
                  <Input 
                    id="serial-number" 
                    placeholder="F.eks: 6C1-L-123456" 
                    value={engineData.serial_number}
                    onChange={(e) => handleChange('serial_number', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="engine-type">Motortype</Label>
                  <Input 
                    id="engine-type" 
                    placeholder="F.eks: 4-takt påhengsmotor" 
                    value={engineData.engine_type}
                    onChange={(e) => handleChange('engine_type', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fuel-type">Drivstofftype</Label>
                  <Input 
                    id="fuel-type" 
                    placeholder="F.eks: Bensin" 
                    value={engineData.fuel_type}
                    onChange={(e) => handleChange('fuel_type', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tank-capacity">Tankvolum (liter)</Label>
                  <Input 
                    id="tank-capacity" 
                    type="number" 
                    placeholder="F.eks: 80" 
                    value={engineData.tank_capacity_liters}
                    onChange={(e) => handleChange('tank_capacity_liters', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fuel-consumption">Forbruk (l/time ved cruise)</Label>
                  <Input 
                    id="fuel-consumption" 
                    type="number" 
                    step="0.1" 
                    placeholder="F.eks: 12.5" 
                    value={engineData.fuel_consumption_lph}
                    onChange={(e) => handleChange('fuel_consumption_lph', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="propeller">Propell</Label>
                  <Input 
                    id="propeller" 
                    placeholder="F.eks: 13 7/8 x 17" 
                    value={engineData.propeller}
                    onChange={(e) => handleChange('propeller', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="oil-type">Oljetype</Label>
                  <Input 
                    id="oil-type" 
                    placeholder="F.eks: 10W-40" 
                    value={engineData.oil_type}
                    onChange={(e) => handleChange('oil_type', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notater</Label>
                <Textarea 
                  id="notes" 
                  placeholder="Ekstra informasjon om motor, servicehistorikk, etc."
                  className="min-h-[100px]"
                  value={engineData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                />
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
                      Lagre motordetaljer
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
