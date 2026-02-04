# Admin Panel Setup Guide

## Oversikt

Admin-panelet er tilgjengelig på `/sjefen` og gir full kontroll over systemet, inkludert:

- **Dashboard**: Oversikt over all systemstatistikk med grafer og visualiseringer
- **Brukerstyring**: Administrer brukere, gi/fjern admin-rettigheter, slett brukere
- **Support**: Håndter support tickets og brukerhenvendelser

## Hvordan gi admin-tilgang i Supabase

Det er flere måter å gi en bruker admin-tilgang på:

### Metode 1: Via Supabase Dashboard (Anbefalt for første admin)

1. Logg inn på [Supabase Dashboard](https://supabase.com/dashboard)
2. Velg ditt prosjekt
3. Gå til **SQL Editor** i sidemenyen
4. Kjør først admin setup SQL:
   ```sql
   -- Kjør innholdet fra supabase/admin_setup.sql
   ```

5. Finn bruker-ID for brukeren du vil gi admin-tilgang:
   ```sql
   SELECT id, email FROM auth.users WHERE email = 'din-epost@example.com';
   ```

6. Legg til brukeren som admin:
   ```sql
   INSERT INTO admin_users (user_id, notes)
   VALUES ('bruker-uuid-her', 'Første admin bruker');
   ```

### Metode 2: Via Admin Panel (Når du allerede har én admin)

1. Logg inn som admin
2. Gå til `/sjefen`
3. Klikk på **Brukere**-fanen
4. Finn brukeren du vil gi admin-tilgang
5. Klikk på **Gi Admin**-knappen

### Metode 3: Via direkte database-tilgang

Hvis du har direkte tilgang til databasen (via psql eller annet verktøy):

```sql
-- Finn bruker-ID
SELECT id, email FROM auth.users;

-- Legg til som admin
INSERT INTO admin_users (user_id, granted_by, notes)
VALUES (
  'bruker-uuid-her',
  NULL,  -- eller ID til admin som gir tilgang
  'Admin bruker via manuell SQL'
);
```

## Fjerne admin-tilgang

### Via Admin Panel
1. Gå til `/sjefen` → **Brukere**
2. Klikk på **Fjern Admin** ved siden av brukeren

### Via SQL
```sql
DELETE FROM admin_users WHERE user_id = 'bruker-uuid-her';
```

## Sikkerhet

- Admin-panelet er beskyttet med middleware som sjekker admin-status
- Alle admin-operasjoner logges med `granted_by` feltet
- Row Level Security (RLS) policies sikrer at kun admins har tilgang til admin-data
- Alle sensitive operasjoner krever aktiv admin-sesjon

## Database Schema

### admin_users tabell
```sql
CREATE TABLE admin_users (
  user_id UUID PRIMARY KEY,           -- Bruker-ID fra auth.users
  granted_by UUID,                    -- Hvem som ga admin-tilgang
  granted_at TIMESTAMP,               -- Når admin-tilgang ble gitt
  notes TEXT                          -- Valgfrie notater
);
```

## Funksjoner i Admin Panel

### Dashboard
- **Nøkkelstatistikk**: Totalt brukere, båter, åpne tickets, gjennomsnittlig rating
- **Brukervekst**: Trendgraf over brukerutvikling
- **Systemoversikt**: Totalt per kategori (båter, motorer, utstyr, etc.)
- **Aktivitet**: Pie chart over brukeraktivitet
- **Kategori Fordeling**: Vedlikeholdsstatistikk per kategori

### Brukerstyring
- Søk og filtrer brukere
- Se detaljert brukerinformasjon
- Gi/fjern admin-rettigheter
- Slett brukere (permanent)
- Se båt- og samtale-statistikk per bruker

### Support
- Oversikt over alle support tickets
- Oppdater ticket-status (open → in-progress → resolved → closed)
- Se prioritet og opprettelsesdato
- Filtrer etter status

## Feilsøking

### "Unauthorized" når jeg prøver å åpne /sjefen
- Sjekk at brukeren er lagt til i `admin_users` tabellen
- Verifiser at SQL-funksjonen `is_admin()` fungerer korrekt
- Logg ut og inn igjen for å refreshe session

### Kan ikke se brukere i admin panel
- Sjekk at Supabase Service Role Key er korrekt konfigurert
- Verifiser at `auth.admin.listUsers()` har riktige permissions

### RLS errors
- Sjekk at alle policies fra `admin_setup.sql` er kjørt
- Verifiser at admin_users tabell har RLS enabled

## Utviklingsnotater

### Miljøvariabler
Sørg for at disse er satt:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Trengs for admin operations
```

### Testing
Test admin-funksjonalitet lokalt:
1. Kjør `npm run dev`
2. Opprett en test-bruker
3. Gi test-brukeren admin via SQL
4. Logg inn og verifiser tilgang til `/sjefen`

## Support

For spørsmål eller problemer med admin-panelet, kontakt systemadministrator.
