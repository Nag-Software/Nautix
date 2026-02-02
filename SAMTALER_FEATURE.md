# Samtaler Feature - Implementasjonsguide

## Oversikt
Jeg har implementert en ny "Samtaler" seksjon i sidebaren som gir brukerne mulighet til å administrere deres AI-samtaler med AI04.

## Implementerte komponenter

### 1. Database Schema (`supabase/schema.sql`)
Lagt til to nye tabeller:

- **conversations** - Lagrer samtaler
  - `id` - Unik identifikator
  - `user_id` - Tilhørende bruker
  - `title` - Samtale tittel
  - `archived` - Om samtalen er arkivert
  - `created_at` / `updated_at` - Tidsstempler

- **messages** - Lagrer meldinger i samtaler
  - `id` - Unik identifikator
  - `conversation_id` - Tilhørende samtale
  - `user_id` - Tilhørende bruker
  - `role` - 'user' eller 'assistant'
  - `content` - Meldingsinnhold
  - `created_at` - Tidsstempel

Begge tabeller har full Row Level Security (RLS) og indekser for optimal ytelse.

### 2. NavConversations Component (`components/nav-conversations.tsx`)
En minimalistisk, shadcn-basert komponent som viser:

**Funksjoner:**
- ✅ Liste over samtaler sortert etter sist oppdatert
- ✅ Aktiv samtale-markering
- ✅ Arkivering av samtaler
- ✅ Sletting av samtaler
- ✅ Ny samtale-knapp
- ✅ Toggle mellom aktive og arkiverte samtaler
- ✅ Realtime oppdateringer via Supabase subscriptions
- ✅ Responsiv dato-formattering (tid, i går, ukedag, dato)
- ✅ Hover-effekter for actions
- ✅ Dropdown meny for hver samtale

**UI/UX features:**
- Clean, minimalistisk design
- Smooth transitions og hover states
- Mobile-responsive
- Collapsible sidebar support
- Loading states
- Empty states (ingen samtaler/arkiverte)

### 3. Conversation Context (`contexts/conversation-context.tsx`)
Global state management for samtaler:

**API:**
- `activeConversationId` - ID for aktiv samtale
- `setActiveConversationId()` - Sett aktiv samtale
- `messages` - Array av meldinger
- `setMessages()` - Oppdater meldinger
- `addMessage()` - Legg til ny melding
- `clearMessages()` - Tøm meldinger
- `createNewConversation()` - Start ny samtale

### 4. Integrering i Sidebar (`components/app-sidebar.tsx`)
- Lagt til NavConversations øverst i sidebar content
- State management for aktiv samtale
- Callback handlers for samtale-interaksjoner

### 5. Layout Provider (`app/layout.tsx`)
- Wrappet app i ConversationProvider for global tilgang

## Neste steg for fullstendig integrasjon

### 1. Oppdater Database Schema
Gå til Supabase Dashboard → SQL Editor og kjør den oppdaterte `supabase/schema.sql` filen.
De nye tabellene (conversations og messages) er allerede lagt til nederst i filen.

### 2. Integrer med AI04 Component
For å koble samtalene til AI04-chatten, må du:

1. Oppdater `components/ai-04.tsx` til å bruke conversation context:
   ```tsx
   import { useConversation } from '@/contexts/conversation-context'
   
   const { activeConversationId, addMessage, messages } = useConversation()
   ```

2. Når bruker sender en melding:
   - Hvis `activeConversationId` er null, opprett ny samtale i databasen
   - Lagre både bruker- og AI-meldinger til messages-tabellen
   - Oppdater conversation.updated_at når nye meldinger legges til

3. Når bruker velger en eksisterende samtale:
   - Hent alle meldinger fra databasen for den samtalen
   - Vis dem i chat-grensesnittet

### 3. Auto-generering av Samtale Tittel
Du kan legge til logikk for å automatisk generere titler basert på:
- Første brukermelding (f.eks. første 50 tegn)
- AI-generert oppsummering av samtalen
- Tidspunkt for opprettelse

## Styling & Design
Alle komponenter bruker:
- shadcn/ui komponenter (Button, Dialog, DropdownMenu, etc.)
- Tailwind CSS
- Lucide React icons
- Konsistent med eksisterende Nautix design system
- Dark/light mode support via ThemeProvider

## Tekniske detaljer

### Realtime Subscriptions
NavConversations bruker Supabase realtime for å automatisk oppdatere listen når samtaler endres.

### Sikkerhet
- RLS policies sikrer at brukere kun ser egne samtaler
- Cascade delete på samtaler sletter automatisk tilhørende meldinger
- Authenticated users only

### Performance
- Optimaliserte database-indekser
- Lazy loading av meldinger (kun når samtale velges)
- Efficient re-rendering med React hooks

## Bruk

1. Klikk på "+" for å starte ny samtale
2. Klikk på en samtale for å åpne den
3. Hover over en samtale for å se "..." meny
4. Velg "Arkiver" for å arkivere eller "Slett" for å slette
5. Klikk "Vis arkiverte" for å se arkiverte samtaler
