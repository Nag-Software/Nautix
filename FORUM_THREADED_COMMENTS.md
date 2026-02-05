# Forum Threaded Comments - Ny Implementasjon

## Oversikt

Den nye kommenteringsfunksjonen har blitt oppgradert med:

1. **Drawer-basert visning** - Innlegg åpnes nå i en drawer (sheet) fra høyre side i stedet for en dialog
2. **Tree-style kommentarer** - Kommentarer kan nå svares på, og vises i en trådet struktur
3. **Kollapserbare tråder** - Lange kommentartråder kan kollapses for bedre oversikt
4. **Forbedret UX** - Bedre indikasjon på nesting og enklere å følge samtaler

## Oppsett

### 1. Database Migration

Kjør følgende SQL-skript i Supabase SQL Editor:

```bash
supabase/threaded_comments_migration.sql
```

Dette vil:
- Legge til `parent_comment_id` kolonne for å koble svar til kommentarer
- Legge til `depth` kolonne for å spore nesting-nivå
- Legge til `reply_count` kolonne for å telle antall svar
- Opprette triggere for automatisk oppdatering av antall svar
- Opprette en rekursiv funksjon for å hente kommentartrær

### 2. Nye Komponenter

#### ForumPostDrawer
Erstatter den gamle `ForumPostDetail` dialog-komponenten.

**Endringer i app/forum/page.tsx:**
```tsx
// Gammel import
import { ForumPostDetail } from "@/components/forum-post-detail"

// Ny import
import { ForumPostDrawer } from "@/components/forum-post-drawer"

// Gammel bruk
<ForumPostDetail 
  postId={selectedPostId}
  open={selectedPostId !== null}
  onClose={() => setSelectedPostId(null)}
  // ...
/>

// Ny bruk
<ForumPostDrawer 
  postId={selectedPostId}
  open={selectedPostId !== null}
  onClose={() => setSelectedPostId(null)}
  // ...
/>
```

#### ThreadedComment
Ny komponent som håndterer visning av kommentarer i tree-struktur.

**Funksjoner:**
- Viser kommentarer med indentasjon basert på nesting-nivå
- Kollapser/ekspander lange kommentartråder
- Inline svar-funksjonalitet
- Visuell indikasjon på dybde med border-styling
- Maksimalt 5 nivåer nesting (kan konfigureres)

## Brukerveiledning

### Slik kommenterer du på et innlegg:

1. Klikk på et foruminnlegg for å åpne det i drawer
2. Skriv kommentaren din i feltet nederst
3. Klikk "Kommenter" (+5 poeng)

### Slik svarer du på en kommentar:

1. Finn kommentaren du vil svare på
2. Klikk "Svar"-knappen under kommentaren
3. Skriv svaret ditt i feltet som vises
4. Klikk "Send svar"

### Slik kollapser du lange tråder:

- Klikk på pil-ikonet (^) øverst på en kommentar med svar
- Kommentaren og alle svar vil kollapses
- Klikk igjen for å ekspandere

## Tekniske Detaljer

### Database Struktur

```sql
forum_comments {
  id: UUID
  post_id: UUID
  user_id: UUID
  content: TEXT
  parent_comment_id: UUID (nullable) -- NY
  depth: INTEGER (default 0)         -- NY
  reply_count: INTEGER (default 0)   -- NY
  like_count: INTEGER
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

### API Endringer

**GET /api/forum/posts/[id]/comments**
- Returnerer nå også `parent_comment_id`, `depth`, og `reply_count`
- Kommentarer sorteres fortsatt etter `created_at`
- Frontend bygger tre-strukturen

**POST /api/forum/posts/[id]/comments**
- Aksepterer nå `parent_comment_id` i request body
- Kalkulerer automatisk `depth` basert på forelder-kommentar
- Oppdaterer `reply_count` via database trigger

### Komponent Arkitektur

```
ForumPostDrawer
├── Sheet (drawer fra høyre)
│   ├── Post Header (kategori, tittel, forfatter)
│   ├── Post Content (innholdet)
│   ├── Post Stats (visninger, likes, kommentarer)
│   ├── New Comment Form
│   └── Comments Section
│       └── ThreadedComment (rekursiv)
│           ├── Comment Header
│           ├── Comment Content
│           ├── Comment Actions (like, svar)
│           ├── Reply Form (når aktiv)
│           └── Nested Replies (rekursiv)
```

### Styling

- **Indentasjon**: `ml-4 sm:ml-6 md:ml-8` per nesting-nivå
- **Visuelle indikatorer**: Border-left på nestede kommentarer
- **Responsive**: Mindre indentasjon på mobile enheter
- **Collapse state**: Viser antall skjulte svar

## Fordeler med den nye implementasjonen

1. **Bedre samtaleflyt** - Lettere å følge diskusjoner med trådet struktur
2. **Mer plass** - Drawer tar hele høyden og gir mer leseplass
3. **Mindre scrolling** - Kollapserbare tråder reduserer unødvendig scrolling
4. **Mobilvennlig** - Drawer funker godt på mobile enheter
5. **Skalerbart** - Støtter dype samtaler uten å bli uoversiktlig

## Migrering fra gammel versjon

Den gamle `ForumPostDetail` komponenten er fortsatt tilgjengelig hvis du vil bytte tilbake:

1. Reverter endringene i `app/forum/page.tsx`
2. Bruk `ForumPostDetail` i stedet for `ForumPostDrawer`
3. Kommentarene vil vises flat (uten nesting) som før

**NB:** Nye kommentarer med `parent_comment_id` vil fortsatt lagres, men vil ikke vises trådet i den gamle komponenten.

## Videre Utvikling

Mulige forbedringer:
- [ ] Notifikasjoner når noen svarer på din kommentar
- [ ] "Gå til toppnivå"-knapp for dype tråder
- [ ] Highlight ny kommentarer siden sist besøk
- [ ] Mulighet til å redigere/slette egne kommentarer
- [ ] @-mentions for å tagge andre brukere
- [ ] Poeng-system for svar på kommentarer

## Støtte

Ved spørsmål eller problemer, sjekk:
- Database tabeller er oppdatert med migration
- API returnerer de nye feltene (`parent_comment_id`, `depth`, `reply_count`)
- Komponentene er riktig importert i forum page
