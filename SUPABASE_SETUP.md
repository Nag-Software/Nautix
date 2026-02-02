# Nautix - Båtadministrasjonssystem

## Supabase Oppsett

### 1. Opprett Supabase Prosjekt
1. Gå til [supabase.com](https://supabase.com)
2. Opprett en ny konto eller logg inn
3. Opprett et nytt prosjekt

### 2. Kjør Database Schema
1. Gå til SQL Editor i Supabase Dashboard
2. Åpne filen `supabase/schema.sql` i dette prosjektet
3. Kopier hele SQL-koden
4. Lim inn i Supabase SQL Editor
5. Klikk "Run" for å kjøre scriptet

Dette vil opprette:
- **boats** tabell - for båtinformasjon
- **engines** tabell - for motordetaljer
- **equipment** tabell - for utstyr og tilbehør
- **documents** tabell - for dokumenter
- **boat-documents** storage bucket - for filopplasting
- Row Level Security (RLS) policies - for datasikkerhet

### 3. Konfigurer Environment Variables
1. I Supabase Dashboard, gå til Settings > API
2. Kopier "Project URL" og "anon public" nøkkelen
3. Oppdater `.env.local` filen:

```bash
NEXT_PUBLIC_SUPABASE_URL=din_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=din_anon_key
```

### 4. Autentisering (Valgfritt men anbefalt)
For å aktivere brukerautentisering:
1. Gå til Authentication i Supabase Dashboard
2. Aktiver Email provider (eller andre providers du ønsker)
3. Konfigurer Email Templates hvis ønskelig

## Funksjonalitet

### Min Båt
1. **Båtinformasjon** (`/min-bat/informasjon`)
   - Lagre grunnleggende båtinfo
   - Automatisk lagring til Supabase
   - Validering og feilhåndtering

2. **Motordetaljer** (`/min-bat/motor`)
   - Komplett motorinformasjon
   - Knyttet til båt
   - Inkluderer notater og serviceinfo

3. **Utstyr & Tilbehør** (`/min-bat/utstyr`)
   - Full CRUD funksjonalitet
   - Status tracking (aktiv, trenger service, utløpt)
   - Modal for legg til/rediger
   - Slett med bekreftelse
   - Kategorisering og statistikk

4. **Dokumenter** (`/min-bat/dokumenter`)
   - Filopplasting til Supabase Storage
   - Dokumenthåndtering
   - Utløpsdato tracking
   - Last ned dokumenter

### Vedlikehold
1. **Logg** (`/vedlikehold/logg`)
   - Vedlikeholdshistorikk
   - Statistikk

2. **Påminnelser** (`/vedlikehold/paminnelser`)
   - Vedlikeholdspåminnelser
   - Prioritering

## Teknologi Stack
- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Autentisering**: Supabase Auth

## Kom i gang

1. Install dependencies:
```bash
pnpm install
```

2. Konfigurer environment variables (se over)

3. Kjør utviklingsserver:
```bash
pnpm dev
```

4. Åpne [http://localhost:3000](http://localhost:3000)

## Database Schema

### boats
- Grunnleggende båtinformasjon
- Knyttet til user_id

### engines
- Motordetaljer
- Knyttet til boat_id og user_id

### equipment
- Utstyrsliste
- Status tracking
- Knyttet til boat_id og user_id

### documents
- Dokumentmetadata
- Filer lagres i Supabase Storage
- Knyttet til boat_id og user_id

## Sikkerhet
- Row Level Security (RLS) aktivert på alle tabeller
- Brukere kan kun se/redigere sin egen data
- Storage policies begrenser tilgang til egne filer
