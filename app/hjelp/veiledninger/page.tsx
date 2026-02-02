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

export default function VeiledningerPage() {
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
                  <BreadcrumbPage>Veiledninger</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6 max-w-4xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Veiledninger</h1>
        <p className="text-muted-foreground">
          Praktiske guider for norske båtfolk
        </p>
      </div>

      <div className="space-y-6">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Bruk av KI-assistenten</h2>
          
          <div className="space-y-4">
            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="font-medium">Hvordan stille gode spørsmål</h3>
              <p className="text-sm text-muted-foreground">
                KI-assistenten forstår norsk og responderer best på klare, spesifikke spørsmål. 
                Inkluder gjerne detaljer om båt og motor for best mulige svar.
              </p>
              <div className="bg-muted rounded p-3 space-y-2">
                <p className="text-sm font-medium">✅ Gode eksempler:</p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>"Hvordan sjekker jeg impelleren på min Yamaha F115?"</li>
                  <li>"Hva bør jeg gjøre for å vinterklar gjøre en innenbords diesel?"</li>
                  <li>"Hvor ofte skal jeg skifte olje på en påhengsmotor?"</li>
                </ul>
              </div>
              <div className="bg-muted rounded p-3 space-y-2">
                <p className="text-sm font-medium">❌ Mindre gode eksempler:</p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>"Motor?" (for vagt)</li>
                  <li>"Hjelp!!" (ikke spesifikt nok)</li>
                </ul>
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="font-medium">Tema KI-assistenten kan hjelpe med</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">⚙️ Motorvedlikehold</p>
                  <p className="text-xs text-muted-foreground">Service, impeller, olje, drivstoff, kjølesystem</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">❄️ Vinteropplag</p>
                  <p className="text-xs text-muted-foreground">Klargjøring, lagring, batterier, frostbeskyttelse</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">🌊 Sesongstart</p>
                  <p className="text-xs text-muted-foreground">Sjekklister, istandsetting, sjøsetting</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">🔧 Feilsøking</p>
                  <p className="text-xs text-muted-foreground">Motorproblemer, elektrisk, hydraulikk</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">🎨 Bunn og maling</p>
                  <p className="text-xs text-muted-foreground">Antifouling, polering, rustbeskyttelse</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">⚡ Elektrisk</p>
                  <p className="text-xs text-muted-foreground">Batterier, lading, sikringer, kabeldimensjoner</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Vedlikeholdslogg</h2>
          
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-medium">Slik registrerer du vedlikehold</h3>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="font-medium text-foreground">1.</span>
                <span>Gå til <strong>Vedlikehold → Logg</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="font-medium text-foreground">2.</span>
                <span>Klikk på "Nytt vedlikehold" eller tilsvarende knapp</span>
              </li>
              <li className="flex gap-3">
                <span className="font-medium text-foreground">3.</span>
                <span>Fyll ut: type arbeid, dato, timertall, beskrivelse</span>
              </li>
              <li className="flex gap-3">
                <span className="font-medium text-foreground">4.</span>
                <span>Last gjerne opp bilder av arbeidet</span>
              </li>
              <li className="flex gap-3">
                <span className="font-medium text-foreground">5.</span>
                <span>Legg ved kvitteringer hvis aktuelt</span>
              </li>
            </ol>
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-medium">Hva bør logges?</h3>
            <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside ml-2">
              <li>All service og motorvedlikehold</li>
              <li>Oljeskift, impellerskift, oljefilter</li>
              <li>Maling og bunn arbeid</li>
              <li>Reparasjoner og utskiftninger</li>
              <li>Installasjon av nytt utstyr</li>
              <li>Påfyll av væske (olje, kjølevæske, servo)</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Påminnelser</h2>
          
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-medium">Anbefalte påminnelser for norske forhold</h3>
            <div className="space-y-3">
              <div className="bg-muted rounded p-3 space-y-1">
                <p className="text-sm font-medium">🌸 Vår (Mars-April)</p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc list-inside">
                  <li>Årlig motorservice</li>
                  <li>Sjekk batterier og lading</li>
                  <li>Test elektrisk utstyr</li>
                  <li>Maling av bunn (antifouling)</li>
                </ul>
              </div>
              <div className="bg-muted rounded p-3 space-y-1">
                <p className="text-sm font-medium">☀️ Sesong (Mai-September)</p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc list-inside">
                  <li>Timersbasert service (hver 100. time)</li>
                  <li>Sjekk impeller ved langturer</li>
                  <li>Kontroll av slitasjedeler</li>
                </ul>
              </div>
              <div className="bg-muted rounded p-3 space-y-1">
                <p className="text-sm font-medium">🍂 Høst (September-Oktober)</p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc list-inside">
                  <li>Klargjøring for vinter</li>
                  <li>Tømming av vannsystemer</li>
                  <li>Konservering av motor</li>
                </ul>
              </div>
              <div className="bg-muted rounded p-3 space-y-1">
                <p className="text-sm font-medium">❄️ Vinter (November-Februar)</p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc list-inside">
                  <li>Lading av batterier (månedlig)</li>
                  <li>Kontroll av presenning/overnavn</li>
                  <li>Planlegging av vårservice</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Dokumenter</h2>
          
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-medium">Viktige dokumenter å lagre</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium">📘 Manualer</p>
                <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc list-inside">
                  <li>Båthåndbok</li>
                  <li>Motormanual</li>
                  <li>Utstyrsmanualer (ekkolodd, radar, etc.)</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">🧾 Kvitteringer</p>
                <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc list-inside">
                  <li>Kjøpskvittering for båt</li>
                  <li>Servicekvitteringer</li>
                  <li>Kvitteringer på deler og utstyr</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">🛡️ Forsikring</p>
                <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc list-inside">
                  <li>Forsikringsbevis</li>
                  <li>Vilkår og betingelser</li>
                  <li>Skadehistorikk</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">📋 Annet</p>
                <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc list-inside">
                  <li>Garantipapirer</li>
                  <li>Registerbevis</li>
                  <li>CE-merking</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-primary/10 rounded-lg p-6 space-y-3">
          <h2 className="text-xl font-semibold">💡 Beste praksis</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2">
              <span>✓</span>
              <span>Loggfør <strong>alt</strong> vedlikehold, også små jobber</span>
            </li>
            <li className="flex gap-2">
              <span>✓</span>
              <span>Ta bilder før, under og etter arbeid</span>
            </li>
            <li className="flex gap-2">
              <span>✓</span>
              <span>Oppdater timertall regelmessig</span>
            </li>
            <li className="flex gap-2">
              <span>✓</span>
              <span>Sett påminnelser basert på norsk sesong</span>
            </li>
            <li className="flex gap-2">
              <span>✓</span>
              <span>Bruk KI-assistenten aktivt - still spørsmål underveis</span>
            </li>
            <li className="flex gap-2">
              <span>✓</span>
              <span>Lagre alle dokumenter digitalt for sikker oppbevaring</span>
            </li>
          </ul>
        </section>
      </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
