"use client"

import { Heart, Waves, Sparkles, Coffee } from "lucide-react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function GavePage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-background via-background to-muted/20">
          <main className="flex flex-1 flex-col gap-8 p-4 md:gap-12 md:p-8">
            <div className="mx-auto w-full max-w-4xl space-y-8">
              
              {/* Hero Header */}
              <div className="text-center space-y-4 animate-in pt-4 fade-in slide-in-from-bottom-4 duration-700">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Støtt Nautix
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Hjelp meg å holde Nautix gratis for alle båteiere
                </p>
              </div>

              {/* Main Content Card */}
              <Card className="border-2 overflow-hidden p-0 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                <CardContent className="p-0">
                  
                  {/* Profile Section with Modern Layout */}
                  <div className="grid md:grid-cols-2 gap-0">
                    {/* Image Side */}
                    <div className="relative h-64 md:h-auto min-h-[400px] bg-muted">
                      <Image
                        src="/casper.jpg"
                        alt="Casper Nag"
                        fill
                        className="object-cover"
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:bg-gradient-to-r" />
                      <div className="absolute bottom-6 left-6 right-6 text-white md:hidden">
                        <h2 className="text-2xl font-bold mb-1">Casper Nag</h2>
                        <p className="text-sm text-white/90">Utvikler av Nautix</p>
                      </div>
                    </div>
                    
                    {/* Text Side */}
                    <div className="p-8 md:p-10 space-y-6">
                      <div className="hidden md:block">
                        <h2 className="text-2xl font-bold mb-2">Casper Nag</h2>
                        <p className="text-muted-foreground flex items-center gap-2">
                          <Waves className="h-4 w-4" />
                          Utvikler av Nautix
                        </p>
                      </div>
                      
                      <p className="text-base leading-relaxed">
                        Jeg bor i seilbåt til daglig, og Nautix er født ut av egne behov og 
                        erfaringer med båtvedlikehold og den praktiske hverdagen på sjøen.
                      </p>
                      
                      <p className="text-base leading-relaxed">
                        Tjenesten er <span className="font-semibold text-primary">gratis å bruke</span> fordi 
                        jeg mener gode teknologiske hjelpemidler skal være tilgjengelig for alle.
                      </p>
                      
                      <div className="pt-4 border-t">
                        <div className="flex items-start gap-3">
                          <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Hva koster det?</p>
                            <p className="text-sm text-muted-foreground">
                              Servere, databaser, AI-tjenester og kontinuerlig utvikling. 
                              Som en-manns-prosjekt dekker jeg dette selv.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Why Support Section */}
                  <div className="bg-muted/40 p-8 md:p-10 space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="rounded-full bg-primary/10 p-3 shrink-0">
                        <Coffee className="h-6 w-6 text-primary" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold">Din gave betyr alt</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          Hver krone går direkte til å holde Nautix flytende og gjøre den bedre 
                          for alle båteiere. Du bidrar ikke bare økonomisk – du viser at dette 
                          prosjektet har verdi og gir meg motivasjon til å fortsette utviklingen.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Vipps QR Section */}
                  <div className="p-8 md:p-10 space-y-6 text-center">
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold">Gi via Vipps</h3>
                      <p className="text-muted-foreground">
                        Skann QR-koden med Vipps-appen din
                      </p>
                    </div>
                    
                    <div className="flex justify-center py-4">
                      <div className="relative rounded-2xl border-2 border-primary/20 bg-white p-6 shadow-xl hover:shadow-2xl transition-shadow">
                        <Image
                          src="/vipps.png"
                          alt="Vipps QR-kode"
                          width={280}
                          height={280}
                          className="rounded-xl"
                          priority
                        />
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground italic">
                      Alle beløp mottas med stor takknemlighet – stort eller smått! 🙏
                    </p>
                  </div>

                  {/* Thank You Footer */}
                  <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-8 md:p-10 text-center space-y-3">
                    <Heart className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-lg font-semibold">
                      Tusen takk for at du er med på denne reisen! ⛵
                    </p>
                    <p className="text-muted-foreground max-w-xl mx-auto">
                      Sammen holder vi Nautix flytende og gjør båtlivet enklere for alle.
                    </p>
                    <p className="text-sm font-medium pt-4">
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
