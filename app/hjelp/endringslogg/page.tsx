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

export default function EndringsloggPage() {
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
                  <BreadcrumbPage>Endringslogg</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6 max-w-4xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Endringslogg</h1>
        <p className="text-muted-foreground">
          Oversikt over oppdateringer og nye funksjoner i Nautix
        </p>
      </div>

      <div className="space-y-6">
        {/* Versjon 1.0.0 - Lansering */}
        <section className="border-l-4 border-primary pl-6 space-y-3">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold">Versjon 1.0.0</h2>
            <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
              Lansering
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Februar 2026</p>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium text-sm">🎉 Nye funksjoner</h3>
              <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside ml-2">
                <li><strong>KI-assistent</strong> - Intelligent chatbot for båtvedlikehold og råd</li>
                <li><strong>Båtinformasjon</strong> - Registrer og administrer båtdetaljer</li>
                <li><strong>Motordetaljer</strong> - Hold oversikt over motor og service</li>
                <li><strong>Utstyr & Tilbehør</strong> - Katalogiser alt utstyr på båten</li>
                <li><strong>Dokumentlagring</strong> - Sikker lagring av manualer og kvitteringer</li>
                <li><strong>Vedlikeholdslogg</strong> - Detaljert historikk over alt vedlikehold</li>
                <li><strong>Påminnelser</strong> - Automatiske varsler for service og vedlikehold</li>
                <li><strong>Mørk modus</strong> - Øyevennlig visning for bruk i båten</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-sm">🇳🇴 Tilpasset norske forhold</h3>
              <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside ml-2">
                <li>Norsk språk i hele applikasjonen</li>
                <li>Sesongbaserte påminnelser for norsk klima</li>
                <li>KI som forstår norske båttyper og merker</li>
                <li>Vinteropplag- og sesongstartveiledning</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-sm">🔒 Sikkerhet</h3>
              <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside ml-2">
                <li>Sikker autentisering med Supabase</li>
                <li>Kryptert lagring av dokumenter</li>
                <li>Personvern i henhold til GDPR</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Kommende funksjoner */}
        <section className="border-l-4 border-muted pl-6 space-y-3">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold">Kommende funksjoner</h2>
            <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded">
              Planlagt
            </span>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium text-sm">📱 Mobilapp</h3>
              <p className="text-sm text-muted-foreground">
                Native iOS og Android app for enkel tilgang fra båten
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-sm">👥 Deling og samarbeid</h3>
              <p className="text-sm text-muted-foreground">
                Inviter familiemedlemmer eller mannskap til å samarbeide om båtvedlikehold
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-sm">📊 Statistikk og rapporter</h3>
              <p className="text-sm text-muted-foreground">
                Oversikt over kostnader, drivstofforbruk og vedlikeholdshistorikk
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-sm">🗺️ Turlogg</h3>
              <p className="text-sm text-muted-foreground">
                Registrer turer med GPS-sporing og notater fra sjøen
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-sm">🛒 Integrasjoner</h3>
              <p className="text-sm text-muted-foreground">
                Direkte kobling til deleleverandører og verksteder
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-sm">🔔 Avanserte varsler</h3>
              <p className="text-sm text-muted-foreground">
                Push-varsler til mobil, e-post og SMS for viktige påminnelser
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-sm">📷 Bildegjenkjenning</h3>
              <p className="text-sm text-muted-foreground">
                KI-drevet analyse av bilder for feilsøking og diagnose
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-sm">🌊 Værvarsel</h3>
              <p className="text-sm text-muted-foreground">
                Integrert værmelding og havvarsel for din båtplass
              </p>
            </div>
          </div>
        </section>

        {/* Tilbakemeldinger */}
        <section className="bg-muted rounded-lg p-6 space-y-3">
          <h2 className="text-xl font-semibold">💬 Har du forslag?</h2>
          <p className="text-sm text-muted-foreground">
            Vi ønsker tilbakemeldinger fra norske båtfolk! Hvis du har ideer til nye funksjoner 
            eller forbedringer, bruk "Tilbakemelding"-knappen i menyen til venstre.
          </p>
          <p className="text-sm text-muted-foreground">
            Nautix utvikles aktivt, og din input hjelper oss med å lage den beste digitale 
            båtassistenten for norske forhold.
          </p>
        </section>
      </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
