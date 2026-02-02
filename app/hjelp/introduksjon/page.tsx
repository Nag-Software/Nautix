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

export default function IntroduksjonPage() {
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
                    Hjelp
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Introduksjon</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6 max-w-4xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Velkommen til Nautix</h1>
        <p className="text-muted-foreground">
          Din digitale båtassistent drevet av kunstig intelligens
        </p>
      </div>

      <div className="space-y-6">
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Hva er Nautix?</h2>
          <p className="text-muted-foreground leading-relaxed">
            Nautix er en moderne løsning utviklet spesielt for norske båteiere som ønsker å holde orden på båten sin. 
            Med KI-drevet assistanse får du hjelp til alt fra vedlikeholdslogg til påminnelser om service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Hovedfunksjoner</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border rounded-lg p-4 space-y-2">
              <h3 className="font-medium">🤖 KI-assistent</h3>
              <p className="text-sm text-muted-foreground">
                Still spørsmål og få ekspertveiledning om båtvedlikehold, tekniske spørsmål og mer. 
                KI-assistenten forstår norske forhold og båttyper.
              </p>
            </div>
            <div className="border rounded-lg p-4 space-y-2">
              <h3 className="font-medium">📋 Vedlikeholdslogg</h3>
              <p className="text-sm text-muted-foreground">
                Hold oversikt over alt vedlikehold, reparasjoner og service. 
                Dokumenter arbeid med bilder og notater.
              </p>
            </div>
            <div className="border rounded-lg p-4 space-y-2">
              <h3 className="font-medium">⏰ Påminnelser</h3>
              <p className="text-sm text-muted-foreground">
                Automatiske påminnelser om serviceinnervalder, forsikringsfornyelse, 
                batterilading og sesongklargjøring.
              </p>
            </div>
            <div className="border rounded-lg p-4 space-y-2">
              <h3 className="font-medium">📁 Dokumenter</h3>
              <p className="text-sm text-muted-foreground">
                Samle alle viktige dokumenter på ett sted - manualer, kvitteringer, 
                forsikringspapirer og mer.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Hvordan fungerer KI-assistenten?</h2>
          <p className="text-muted-foreground leading-relaxed">
            KI-assistenten er kjernen i Nautix. Du kan stille spørsmål på vanlig norsk, 
            akkurat som om du pratet med en erfaren båtmekaniker eller skipperkollega. 
            Assistenten kjenner til norske forhold, lovverk og vanlige båttyper langs kysten.
          </p>
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <p className="font-medium">Eksempler på spørsmål:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
              <li>"Hvordan vinterklar gjør jeg en Yamaha påhengsmotor?"</li>
              <li>"Når bør jeg bytte impeller på motoren?"</li>
              <li>"Hva trenger jeg å sjekke før sesongstart?"</li>
              <li>"Hvordan vedlikeholder jeg aluminiumsroret på båten?"</li>
            </ul>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Kom i gang</h2>
          <p className="text-muted-foreground leading-relaxed">
            Start med å legge inn grunnleggende informasjon om båten din under "Min båt". 
            Jo mer informasjon du legger inn, desto bedre kan KI-assistenten hjelpe deg med 
            skreddersydde råd og påminnelser.
          </p>
        </section>
      </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
