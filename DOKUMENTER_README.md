# Dokumenter Funksjonalitet - Nautix

## Oversikt
Fullstendig dokumenthåndteringssystem for båtpapirer, forsikring, sertifikater og andre viktige dokumenter.

## Funksjoner

### ✅ Opplasting
- **Drag & drop** - Dra filer direkte inn i dialogen
- **Fil-velger** - Klikk for å velge fil fra datamaskinen
- **Støttede formater**: PDF, JPG, JPEG, PNG, DOC, DOCX
- **Metadata**: Navn, type, utløpsdato
- **Auto-navn**: Fyller automatisk navn fra filnavn

### ✅ Dokumenttyper
- Forsikring
- Registrering  
- Kontrakt
- Sertifikat
- Garanti
- Manual
- Kvittering
- Annet

### ✅ Status Tracking
- **Gyldig** (grønn) - Dokument er aktivt
- **Utløper snart** (gul) - Mindre enn 30 dager til utløp
- **Utløpt** (rød) - Utløpsdato passert

### ✅ Handlinger
- **Last ned** - Lagre dokument lokalt
- **Slett** - Fjern dokument (med bekreftelse)
- Automatisk oppdatering av liste etter endringer

### ✅ Statistikk
- Totalt antall dokumenter
- Antall gyldige dokumenter
- Antall som utløper snart

### ✅ Responsivt Design
- **Mobile-first** - Optimalisert for mobil
- Kompakte kort på mobil
- Større layout på desktop
- Tilpassede knapper og spacing

## Teknisk Implementasjon

### Database
```sql
-- documents tabell
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  boat_id UUID REFERENCES boats(id),
  user_id UUID REFERENCES auth.users(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  file_path VARCHAR(500),
  file_size INTEGER,
  upload_date TIMESTAMP,
  expiry_date DATE,
  status VARCHAR(50),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Storage
- **Bucket**: `documents` (private)
- **Path structure**: `{user_id}/{timestamp}.{ext}`
- **RLS Policies**: Kun eier kan se/laste opp/slette egne filer

### Frontend
- **Framework**: Next.js 15 (App Router)
- **State**: React useState + useEffect
- **Data fetching**: Supabase Client
- **UI Components**: shadcn/ui Dialog, Button, Badge, Input, Select

## Bruk

### 1. Last opp dokument
1. Klikk "Last opp dokument"
2. Dra fil inn i dialog ELLER klikk "Velg fil"
3. Fyll inn dokumentnavn
4. Velg type
5. (Valgfritt) Sett utløpsdato
6. Klikk "Last opp"

### 2. Last ned dokument
- Klikk "Last ned"-knappen på dokumentkortet
- Fil lastes ned til standard nedlastingsmappe

### 3. Slett dokument
- Klikk "Slett"-knappen på dokumentkortet
- Bekreft sletting i popup
- Dokument fjernes fra både storage og database

## Sikkerhet

### Row Level Security (RLS)
- Brukere kan kun se egne dokumenter
- Automatisk filtrering på `user_id`

### Storage Policies
- Opplasting: Kun til egen mappe (`{user_id}/`)
- Nedlasting: Kun egne filer
- Sletting: Kun egne filer

## Status Logikk

```typescript
// Automatisk beregning av status
if (!expiry_date) return "valid"

const daysUntilExpiry = (expiry_date - today) / (1000 * 60 * 60 * 24)

if (daysUntilExpiry < 0) return "expired"
if (daysUntilExpiry <= 30) return "expiring-soon"
return "valid"
```

## Fremtidige Forbedringer
- [ ] Fil-preview i dialog
- [ ] Bulk opplasting (flere filer samtidig)
- [ ] Filtre og søk i dokumentliste
- [ ] Sortering etter dato, navn, type
- [ ] Eksporter dokumentliste til CSV
- [ ] E-post varsel ved utløp
- [ ] Tagge dokumenter
- [ ] Deling av dokumenter
- [ ] Versjonering av dokumenter

## Feilsøking

### "Kunne ikke laste opp dokument"
- Sjekk at storage bucket "documents" eksisterer
- Verifiser storage policies er korrekt satt opp
- Kjør `supabase/storage.sql` på nytt

### "Kunne ikke laste ned dokument"
- Sjekk at filen eksisterer i storage
- Verifiser at du har tilgang til filen
- Sjekk browser konsoll for feilmeldinger

### Ingen dokumenter vises
- Sjekk at du er logget inn
- Verifiser at `user_id` matcher i database
- Sjekk RLS policies i Supabase Dashboard
