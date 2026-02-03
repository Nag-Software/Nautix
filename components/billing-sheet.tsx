"use client"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Sparkles, Check, Info } from "lucide-react"

interface BillingSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BillingSheet({ open, onOpenChange }: BillingSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Abonnement & Fakturering</SheetTitle>
          <SheetDescription>
            Administrer ditt abonnement og betalingsinformasjon
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 px-6">
          {/* Current Plan */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4" />
              <span>Nåværende plan</span>
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Gratis Beta</h3>
                  <p className="text-sm text-muted-foreground">
                    Full tilgang under beta-perioden
                  </p>
                </div>
                <Badge variant="secondary">Aktiv</Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Ubegrenset båtinformasjon</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>AI-assistent (AI04)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Vedlikeholdslogg & påminnelser</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Dokumentlagring</span>
                </div>
              </div>
            </div>
          </div>

          {/* Coming Soon */}
          <div className="rounded-lg border border-dashed p-6 text-center space-y-3">
            <div className="mx-auto w-fit rounded-full bg-muted p-3">
              <CreditCard className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">Abonnementer kommer snart</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Vi jobber med å lansere premium-planer med ekstra funksjoner
              </p>
            </div>
          </div>

          {/* Info */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Beta-periode
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Under beta-perioden er alle funksjoner gratis. Vi vil varsle deg i god tid før eventuelle prisplaner introduseres.
                </p>
              </div>
            </div>
          </div>

          {/* Future Plans Preview */}
          <div className="space-y-4">
            <div className="text-sm font-semibold text-muted-foreground">
              Kommende planer (foreløpig)
            </div>

            <div className="space-y-3">
              <div className="rounded-lg border p-4 opacity-60">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Pro</h4>
                  <Badge variant="outline">Kommer snart</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Avansert analyse, flere båter, prioritert support
                </p>
              </div>

              <div className="rounded-lg border p-4 opacity-60">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Enterprise</h4>
                  <Badge variant="outline">Kommer snart</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  For båtklubber og profesjonelle aktører
                </p>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
