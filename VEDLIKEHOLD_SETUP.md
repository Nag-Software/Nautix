# Vedlikeholdslogg & Påminnelser - Oppsettguide

## 📋 Oversikt

Dette systemet gir deg full kontroll over båtens vedlikehold med:
- Detaljert vedlikeholdslogg for alle reparasjoner og service
- AI-drevne påminnelser for fremtidig vedlikehold
- Automatisk kostnads- og tidsstatistikk
- Søk og filtrering på tvers av alle oppføringer

## 🚀 Komme i gang

### 1. Database-oppsett (VIKTIG!)

Før du kan bruke vedlikeholdssystemet må du opprette databasetabellene i Supabase:

1. Åpne Supabase Dashboard: https://supabase.com/dashboard
2. Velg ditt prosjekt
3. Gå til **SQL Editor** i sidemenyen
4. Åpne filen `supabase/schema.sql` fra prosjektet
5. Kopier alt innhold fra linje 188 til slutten (maintenance_log og reminders tabeller)
6. Lim inn i SQL Editor og kjør scriptet
7. Verifiser at tabellene er opprettet under **Table Editor**

### 2. Verifiser at tabellene er opprettet

Du skal nå ha disse nye tabellene:
- `maintenance_log` - Lagrer alle vedlikeholdsoppføringer
- `reminders` - Lagrer påminnelser

### 3. Test systemet

1. Start utviklingsserveren: `pnpm dev`
2. Logg inn i applikasjonen
3. Naviger til **Vedlikehold → Logg**
4. Klikk "Ny oppføring" for å legge til din første vedlikeholdsoppføring

## 📚 Hvordan bruke systemet

### Vedlikeholdslogg

**Legg til oppføring:**
1. Klikk "Ny oppføring"
2. Fyll ut skjemaet (tittel, kategori, type, dato er påkrevd)
3. Legg til valgfrie detaljer:
   - Kostnad i kr
   - Timer brukt
   - Hvem som utførte arbeidet
   - Deler som ble brukt
   - Notater
4. Klikk "Legg til"

**Kategorier:**
- Motor
- Skrog
- Elektrisitet
- Rigg & Seil
- Navigasjon
- Sikkerhet
- Interiør
- Annet

**Typer:**
- Service
- Reparasjon
- Skade
- Oppgradering
- Inspeksjon
- Rengjøring

### AI-Påminnelser

**Opprett smart påminnelse fra vedlikehold:**
1. Finn vedlikeholdsoppføringen i tabellen
2. Klikk "⋮" (tre prikker) på raden
3. Velg "Opprett påminnelse med AI"
4. AI analyserer vedlikeholdstypen og foreslår:
   - Når neste service bør utføres
   - Prioritet (lav/middels/høy)
   - Begrunnelse for anbefalingen
5. Juster forslaget om nødvendig
6. Klikk "Opprett påminnelse"

**AI-anbefalinger basert på:**
- **Motorolje**: 6-12 måneder eller 50-100 timer
- **Anoder**: 12 måneder
- **Antifouling**: 12 måneder (sesongbasert)
- **Impeller**: 12-24 måneder
- **Drivstoffilter**: 12 måneder eller 100 timer
- **Batterier**: 3 måneder (kontroll)
- **Sikkerhetsutstyr**: 12 måneder

### Se påminnelser

1. Naviger til **Vedlikehold → Påminnelser**
2. Se aktive påminnelser sortert etter forfallsdato
3. Marker som fullført når arbeidet er gjort
4. AI-genererte påminnelser er merket med "✨ AI-forslag"

## 🎯 Beste praksis

1. **Logg alt vedlikehold** - Jo mer du logger, jo bedre AI-anbefalinger får du
2. **Bruk konsistente kategorier** - Dette gjør det lettere å søke og filtrere
3. **Legg til kostnader** - Hold oversikt over vedlikeholdsbudsjett
4. **Noter timer** - Nyttig for å planlegge fremtidig vedlikehold
5. **Dokumenter deler** - Vet nøyaktig hvilke deler som er brukt
6. **Bruk AI-påminnelser** - La AI hjelpe deg å holde båten i god stand

## 🔍 Søk og filtrering

**Søkefelt:**
- Søker i tittel, beskrivelse, og deler brukt
- Sanntidsoppdatering mens du skriver

**Filtre:**
- Kategori (motor, skrog, etc.)
- Type (service, reparasjon, etc.)
- Kombineres for presist resultat

**Statistikk:**
- Total kostnad (oppdateres automatisk)
- Totale timer brukt
- Antall oppføringer
- Filtrert visning

## 🐛 Feilsøking

### "Tabellen finnes ikke" feil
- Du har ikke kjørt database-migreringen ennå
- Følg steg 1 under "Komme i gang"

### "Kunne ikke laste data" feil
- Sjekk at du er logget inn
- Verifiser Supabase-tilkobling i `.env.local`
- Sjekk at RLS policies er aktivert

### AI-forslag fungerer ikke
- Sjekk at `OPENAI_API_KEY` er satt i `.env.local`
- Verifiser at API-nøkkelen har tilgang

## 💡 Tips

- Bruk "noter"-feltet for spesielle observasjoner
- Tag vedlikehold med sted (f.eks. "Marina Oslo")
- Legg til "utført av" for å holde oversikt over verksteder
- Eksporter data jevnlig (kommende funksjon)

## 📞 Hjelp

Ved problemer, sjekk:
1. Console i nettleseren (F12 → Console)
2. Supabase logs i dashboard
3. At alle miljøvariabler er satt

---

**Laget med 💙 for båteiere som bryr seg om vedlikehold**
