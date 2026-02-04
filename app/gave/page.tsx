"use client"

import { Heart } from "lucide-react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function GavePage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="mx-auto grid w-full max-w-3xl gap-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Heart className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Gi en gave</h1>
              <p className="text-muted-foreground">
                Støtt utviklingen av Nautix
              </p>
            </div>
          </div>

          {/* Main content */}
          <Card>
            <CardHeader>
              <CardTitle>Tusen takk for at du vurderer å gi!</CardTitle>
              <CardDescription>
                Din støtte gjør en reell forskjell
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile section */}
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="flex-shrink-0">
                  <Image
                    src="/casper.jpg"
                    alt="Casper Nag"
                    width={200}
                    height={200}
                    className="rounded-lg object-cover"
                  />
                </div>
                <div className="space-y-4 flex-1">
                  <p className="text-base leading-relaxed">
                    Jeg heter Casper Nag og har utviklet Nautix. Jeg bor i seilbåt til daglig. 
                    Nautix er født ut av egne behov og erfaringer med båtvedlikehold og den praktiske 
                    hverdagen på sjøen.
                  </p>
                  <p className="text-base leading-relaxed">
                    Tjenesten er gratis å bruke fordi jeg mener gode teknologiske hjelpemidler
                    skal være tilgjengelig for alle, uavhengig av lommebok.
                  </p>
                </div>
              </div>
              
              {/* Story continuation */}
              <div className="space-y-4">
                <p className="text-base leading-relaxed">
                  Drift av Nautix koster penger – servere, databaser, AI-tjenester og kontinuerlig 
                  utvikling. Som en-manns-prosjekt dekker jeg dette selv, men enhver støtte hjelper 
                  meg å holde tjenesten stabil og videreutvikle funksjonalitet som kommer alle til gode.
                </p>
              </div>

              {/* Appreciation section */}
              <div className="rounded-lg bg-muted p-6 space-y-3">
                <div className="flex items-start gap-3">
                  <Heart className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Din gave betyr mer enn du tror</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Hver krone du bidrar med går direkte til å holde Nautix flytende og gjøre 
                      den bedre for alle båteiere. Du bidrar ikke bare økonomisk – du viser at 
                      dette prosjektet har verdi og gir meg motivasjon til å fortsette utviklingen.
                    </p>
                  </div>
                </div>
              </div>

              {/* QR Code section */}
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">Gi via Vipps</h3>
                  <p className="text-sm text-muted-foreground">
                    Skann QR-koden med Vipps-appen din
                  </p>
                </div>
                
                <div className="flex justify-center">
                  <div className="relative rounded-lg border bg-card p-6 shadow-sm">
                    <Image
                      src="/vipps.png"
                      alt="Vipps QR-kode"
                      width={300}
                      height={300}
                      className="rounded-md"
                      priority
                    />
                  </div>
                </div>

                <p className="text-center text-sm text-muted-foreground italic">
                  Alle beløp mottas med stor takknemlighet – stort eller smått! 🙏
                </p>
              </div>

              {/* Thank you message */}
              <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-6 text-center space-y-2">
                <p className="font-medium text-lg">
                  Tusen takk for at du er med på denne reisen! ⛵
                </p>
                <p className="text-sm text-muted-foreground">
                  Sammen holder vi Nautix flytende og gjør båtlivet enklere for alle.
                </p>
                <p className="text-sm font-medium mt-4">
                  – Casper Nag
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
