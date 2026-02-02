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

export default function KomIGangPage() {
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
                  <BreadcrumbPage>Kom i gang</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6 max-w-4xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Kom i gang med Nautix</h1>
        <p className="text-muted-foreground">
          En trinnvis guide for å sette opp din digitale båtassistent
        </p>
      </div>

      <div className="space-y-6">
        <section className="space-y-4">
          <div className="border-l-4 border-primary pl-4 space-y-2">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">1</span>
              Registrer båtinformasjon
            </h2>
            <p className="text-muted-foreground">
              Gå til <strong>Min båt → Båtinformasjon</strong> og legg inn grunnleggende opplysninger:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
              <li>Båttype og modell</li>
              <li>Årsmodell</li>
              <li>Registreringsnummer</li>
              <li>Lengde og bredde</li>
            </ul>
            <p className="text-sm text-muted-foreground italic">
              Tips: Dette hjelper KI-assistenten med å gi deg mer presise råd.
            </p>
          </div>

          <div className="border-l-4 border-primary pl-4 space-y-2">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">2</span>
              Legg til motordetaljer
            </h2>
            <p className="text-muted-foreground">
              Under <strong>Min båt → Motordetaljer</strong> registrerer du:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
              <li>Motormerke og modell (f.eks. Yamaha F150)</li>
              <li>Serienummer</li>
              <li>Hestekrefter</li>
              <li>Drivstofftype</li>
              <li>Siste service og timertall</li>
            </ul>
          </div>

          <div className="border-l-4 border-primary pl-4 space-y-2">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">3</span>
              Last opp dokumenter
            </h2>
            <p className="text-muted-foreground">
              Samle viktige dokumenter under <strong>Min båt → Dokumenter</strong>:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
              <li>Brukermanualer for båt og motor</li>
              <li>Kvitteringer fra kjøp og service</li>
              <li>Forsikringspapirer</li>
              <li>Garantidokumenter</li>
            </ul>
            <p className="text-sm text-muted-foreground italic">
              Tips: Skann eller ta bilder av papirdokumenter for sikker lagring.
            </p>
          </div>

          <div className="border-l-4 border-primary pl-4 space-y-2">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">4</span>
              Sett opp påminnelser
            </h2>
            <p className="text-muted-foreground">
              Gå til <strong>Vedlikehold → Påminnelser</strong> og opprett varsler for:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
              <li>Årlig motorservice (f.eks. hver vår)</li>
              <li>Forsikringsfornyelse</li>
              <li>Batterilading om vinteren</li>
              <li>Antifouling før sesongstart</li>
              <li>Impellerskift (hvert 2. år eller oftere)</li>
            </ul>
          </div>

          <div className="border-l-4 border-primary pl-4 space-y-2">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm">5</span>
              Prøv KI-assistenten
            </h2>
            <p className="text-muted-foreground">
              Nå er du klar til å bruke KI-assistenten! Prøv å stille et spørsmål:
            </p>
            <div className="bg-muted rounded-lg p-4 space-y-2 mt-2">
              <p className="font-medium text-sm">Eksempel på første spørsmål:</p>
              <div className="bg-background rounded p-3 text-sm">
                "Hva bør jeg sjekke før jeg tar båten ut for første gang i år?"
              </div>
            </div>
          </div>
        </section>

        <section className="bg-muted rounded-lg p-6 space-y-3">
          <h2 className="text-xl font-semibold">💡 Nyttige tips</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span>•</span>
              <span>Loggfør alt vedlikehold i <strong>Vedlikeholdsloggen</strong> - dette gir deg full historikk og øker videresalgsverdien</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Ta bilder av arbeid du gjør - dokumentasjon er gull verdt</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Still KI-assistenten spørsmål underveis - den er til for å hjelpe deg</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Hold timertallet på motoren oppdatert for presise servicepåminnelser</span>
            </li>
          </ul>
        </section>
      </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
