import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function validateUrl(url: string): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Nautix-Bot/1.0',
      },
    })

    clearTimeout(timeoutId)
    return response.ok
  } catch (error) {
    // If HEAD fails, try GET with timeout
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Nautix-Bot/1.0',
        },
      })

      clearTimeout(timeoutId)
      return response.ok
    } catch {
      return false
    }
  }
}

function shouldUseWebSearchForPrompt(prompt: string): boolean {
  const p = (prompt || '').toLowerCase()
  if (!p.trim()) return false

  // Trigger web search when user asks for verifiable facts, manuals, dimensions, part numbers, or sources.
  const keywords = [
    // Norwegian
    'manual',
    'brukermanual',
    'brukerhåndbok',
    'brukerhandbok',
    'håndbok',
    'handbok',
    'bruksanvisning',
    'servicemanual',
    'service manual',
    'verkstedmanual',
    'verksted',
    'dokument',
    'pdf',
    'last ned',
    'laste ned',
    'nedlasting',
    'sprengskisse',
    'dele',
    'delenummer',
    'parts',
    'part number',
    'spesifikasjon',
    'tekniske data',
    'datablad',
    'mål',
    'målene',
    'dimensjon',
    'dimensjoner',
    'vindskjerm',
    'windscreen',
    'tegning',
    'drawing',
    'diagram',
    'kilder',
    'lenke',
    'link',
    // English
    'spec',
    'specs',
    'dimensions',
    'datasheet',
    'owner\'s manual',
    'user manual',
    'service guide',
    'download',
  ]

  if (keywords.some((k) => p.includes(k))) return true

  // If the user explicitly asks to "find" something external, prefer web search.
  if (p.includes('finn') && (p.includes('på nett') || p.includes('på internett') || p.includes('online'))) return true
  if (p.includes('hvor finner') || p.includes('hvor kan jeg finne')) return true
  if (p.includes('hva sier') && (p.includes('manual') || p.includes('produsent'))) return true

  return false
}

function extractResponseText(response: any): string {
  if (typeof response?.output_text === 'string' && response.output_text.trim()) {
    return response.output_text.trim()
  }

  const messageItem = response?.output?.find((item: any) => item?.type === 'message')
  const contentItem = messageItem?.content?.find(
    (c: any) => c?.type === 'output_text' || c?.type === 'text'
  )
  const text = contentItem?.text
  return typeof text === 'string' ? text.trim() : ''
}

async function createWebSearchResponse(opts: {
  model: string
  messages: Array<{ role: string; content: string | any[] }>
  temperature?: number
  maxOutputTokens?: number
  searchContextSize?: 'low' | 'medium' | 'high'
}) {
  const {
    model,
    messages,
    temperature = 0.7,
    maxOutputTokens = 1500,
    searchContextSize = 'medium',
  } = opts

  // Use the Responses API + web search tool so the model can actually look up manuals/specs.
  return openai.responses.create({
    model,
    input: messages,
    tools: [
      {
        type: 'web_search_preview',
        search_context_size: searchContextSize,
      },
    ],
    temperature,
    max_output_tokens: maxOutputTokens,
  } as any)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      action,
      field,
      value,
      manufacturer,
      model,
      type,
      maintenanceTitle,
      maintenanceCategory,
      maintenanceType,
      prompt: userPrompt,
      chatHistory,
      webSearch,
      webSearchContextSize,
      images,
    } = body

    // Handle general chat prompt with action detection
    if (userPrompt && !action) {
      // Fetch user's boat and engine data
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      let userContext = ""
      
      if (user) {
        // Fetch boats
        const { data: boats } = await supabase
          .from('boats')
          .select('*')
          .eq('user_id', user.id)
        
        // Fetch engines
        const { data: engines } = await supabase
          .from('engines')
          .select('*')
          .eq('user_id', user.id)
        
        // Fetch recent maintenance logs
        const { data: recentMaintenance } = await supabase
          .from('maintenance_log')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(20)
        
        // Fetch active reminders
        const { data: reminders } = await supabase
          .from('reminders')
          .select('*')
          .eq('user_id', user.id)
          .order('due_date', { ascending: true })
          .limit(20)
        
        // Fetch user's documents (both stored files and links)
        const { data: documentLinks } = await supabase
          .from('document_links')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(30)
        
        // Build context string
        if (boats && boats.length > 0) {
          userContext += "\n\n**BRUKERENS BÅT(ER):**\n"
          boats.forEach((boat: any) => {
            userContext += `- ${boat.name || 'Uten navn'}: ${boat.manufacturer || ''} ${boat.model || ''} (${boat.year || 'ukjent år'})\n`
            userContext += `  Lengde: ${boat.length_meters || 'ukjent'}m, Bredde: ${boat.width_meters || 'ukjent'}m\n`
            userContext += `  Skrog: ${boat.hull_material || 'ukjent'}, Vekt: ${boat.weight_kg || 'ukjent'}kg\n`
          })
        }
        
        if (engines && engines.length > 0) {
          userContext += "\n**BRUKERENS MOTOR(ER):**\n"
          engines.forEach((engine: any) => {
            userContext += `- ${engine.manufacturer || ''} ${engine.model || ''} ${engine.horsepower ? `${engine.horsepower} HK` : ''}\n`
            userContext += `  Type: ${engine.engine_type || 'ukjent'}, Drivstoff: ${engine.fuel_type || 'ukjent'}\n`
            userContext += `  Tank: ${engine.tank_capacity_liters || 'ukjent'}L, Forbruk: ${engine.fuel_consumption_lph || 'ukjent'}L/t\n`
            if (engine.oil_type) userContext += `  Olje: ${engine.oil_type}\n`
          })
        }
        
        if (recentMaintenance && recentMaintenance.length > 0) {
          userContext += "\n**VEDLIKEHOLDSLOGG (siste 20):**\n"
          recentMaintenance.forEach((log: any) => {
            userContext += `- ${log.date}: ${log.title} (${log.category}/${log.type})\n`
            if (log.description) userContext += `  Beskrivelse: ${log.description}\n`
            if (log.parts_used) userContext += `  Deler brukt: ${log.parts_used}\n`
            if (log.cost) userContext += `  Kostnad: ${log.cost} kr\n`
            if (log.notes) userContext += `  Notater: ${log.notes}\n`
          })
        }
        
        if (reminders && reminders.length > 0) {
          userContext += "\n**PÅMINNELSER (neste 20):**\n"
          reminders.forEach((reminder: any) => {
            const status = reminder.completed ? '✓' : '○'
            userContext += `${status} ${reminder.title} - Forfaller: ${reminder.due_date} (${reminder.priority})\n`
            if (reminder.description) userContext += `  Beskrivelse: ${reminder.description}\n`
            if (reminder.recurrence && reminder.recurrence !== 'none') {
              userContext += `  Gjentagelse: ${reminder.recurrence}\n`
            }
          })
        }
        
        if (documentLinks && documentLinks.length > 0) {
          userContext += "\n**BRUKERENS DOKUMENTER (siste 30):**\n"
          documentLinks.forEach((doc: any) => {
            userContext += `- ${doc.title} (${doc.type})\n`
            if (doc.description) userContext += `  Beskrivelse: ${doc.description}\n`
            if (doc.url) userContext += `  URL: ${doc.url}\n`
            if (doc.file_path) userContext += `  Fil lagret i system\n`
          })
        }
      }

      // Build messages array with chat history
      const messages: any[] = [
        {
          role: 'system',
          content: `Du er en proaktiv AI-assistent for båteiere, ekspert på båter, båtmotorer, og båtvedlikehold. Du skal være frempå og hjelpe mest mulig med konkrete neste steg.

${userContext}

VIKTIG - SØKING I BRUKERENS DATA:
Du har tilgang til brukerens:
- Vedlikeholdslogg (komplett historikk med detaljer)
- Påminnelser (alle aktive og planlagte)
- Dokumenter (lagrede manualer, PDF-er, lenker)
- Båt- og motorinformasjon

Når brukeren spør om noe relatert til deres egne data (f.eks. "når byttet jeg olje sist?", "hva står i min manual om X?", "har jeg noen påminnelser om Y?"), SØK NØYE gjennom dataene ovenfor og gi KONKRETE svar basert på brukerens faktiske data.

EKSEMPLER PÅ SPØRSMÅL OM BRUKERDATA:
- "Når byttet jeg olje sist?" → Sjekk VEDLIKEHOLDSLOGG etter oljeskift
- "Hva har jeg gjort med motoren i år?" → Sjekk VEDLIKEHOLDSLOGG (category: motor)
- "Når skal jeg ha neste vedlikehold?" → Sjekk PÅMINNELSER
- "Har jeg manualen til min motor?" → Sjekk BRUKERENS DOKUMENTER
- "Hva står i manualen min om X?" → Hvis dokument finnes, referer til det og be brukeren åpne det for detaljer
- "Hvor mye har jeg brukt på vedlikehold?" → Summer opp cost fra VEDLIKEHOLDSLOGG
- "Hvilke deler har jeg byttet?" → Sjekk parts_used i VEDLIKEHOLDSLOGG

VIKTIG - DU KAN UTFØRE FØLGENDE HANDLINGER AUTOMATISK:
1. Legge til vedlikeholdslogg-oppføring
2. Opprette påminnelser for fremtidig vedlikehold
3. Foreslå manualer/dokumenter

Du har også tilgang til web-søk. Når brukeren spør etter mål/dimensjoner, spesifikasjoner, dele-/sprengskisser, eller manualer (PDF), bruk web-søk og inkluder konkrete kilder/URL-er i svaret.

VIKTIG - HVORDAN DU SVARER:
- Gi ALLTID konkrete svar direkte i chatten - ikke si "se i manualen" eller "sjekk dokumentet".
- Hvis du bruker web-søk for å finne informasjon, PRESENTER funnene direkte i svaret ditt.
- Når du henviser til en manual/kilde, inkluder relevant utdrag/informasjon i svaret OG lenk til kilden.
- Brukeren skal få svaret sitt UTEN å måtte åpne eksterne lenker (lenkene er supplement/verifisering).
- Eksempel RIKTIG: "MD11D bruker 3,5 liter motorolje (SAE 15W-40). Oljeskift anbefales hver 100 timer. Kilde: Volvo Penta MD11D Manual https://..."
- Eksempel FEIL: "Du finner denne informasjonen i manualen her: https://..."
- VIKTIG: Kun del lenker fra pålitelige kilder (offisielle produsenters nettsider, anerkjente PDF-databaser). Systemet vil validere at lenkene er aktive.

FORMATERING AV SVAR:
- Bruk enkel markdown: **fet**, *kursiv*, lister med -, overskrifter med #
- Lenker skal formateres slik: "Kilde: Beskrivelse https://url-her.com"
- Bruk linjeskift og struktur for lesbarhet
- Unngå komplisert formatering

HVIS DU IKKE FINNER DET BRUKEREN BER OM:
- ALDRI bare si "Jeg fant det ikke" eller "Jeg har dessverre ikke funnet..."
- ALLTID foreslå et nyttig alternativ eller beslektet informasjon som kan hjelpe
- Eksempel: Hvis bruker ber om en manual du ikke finner, foreslå å søke etter spesifikasjoner, teknisk data, eller lignende båtmodeller som kan ha relevant info
- Vær proaktiv - hjelp brukeren videre med alternative løsninger

PROAKTIV DOKUMENTHÅNDTERING:
- Når det er relevant for samtalen (f.eks. feilsøking, vedlikehold, spesifikasjoner, prosedyrer), foreslå å finne og laste ned riktig brukermanual/verkstedmanual/datablad
- KRITISK REGEL: Når du foreslår et dokument, MÅ du inkludere URL-en BÅDE i "response"-teksten OG i "suggest_document"-action
- Eksempel: "Du kan laste ned manualen her: https://example.com/manual.pdf" I TILLEGG til suggest_document-action
- ALDRI si "Du kan laste ned manualen her:" uten å inkludere den faktiske URL-en i teksten
- Nedlastbare filtyper (lagres i dokumentarkiv): .pdf, .doc, .docx, .txt, .jpg, .jpeg, .png, .gif, .xls, .xlsx, .csv, .ppt, .pptx, .zip, .rar
- IKKE nedlastbare filtyper (lagres kun som lenker): .html, .htm, nettsider
- Hvis du anbefaler et konkret dokument, inkluder URL-en i teksten OG legg det inn som en action av typen "suggest_document"
- Begge må ha SAMME URL - én i "response" (synlig for bruker) og én i "suggest_document"-action (for nedlasting)

DIN OPPGAVE:
Analyser brukerens forespørsel og identifiser om det skal utføres en handling. BRUK brukerens faktiske båt- og motorinformasjon når du svarer og foreslår handlinger.

SVAR ALLTID MED JSON I FØLGENDE FORMAT:
{
  "response": "Ditt svar til brukeren på norsk",
  "actions": [
    {
      "type": "add_maintenance" | "add_reminder" | "suggest_document",
      "data": { ... }, // Data spesifikk for handlingen
      "confirmationMessage": "Bekreftelse til bruker om hva som ble gjort"
    }
  ]
}

KRITISK VIKTIG OM suggest_document:
- Hvis du inkluderer EN ENESTE URL til en fil (.pdf, .doc, .jpg, etc.) i "response", MÅ du ha minst én "suggest_document" i "actions".
- Ingen unntak - hver fil-URL i teksten krever en tilsvarende suggest_document-action.
- Eksempel: hvis du skriver "se denne PDF-en: https://example.com/manual.pdf" i response, MÅ actions inneholde suggest_document med samme URL.

HANDLINGSTYPER OG DATA:

1. **add_maintenance**: Legg til vedlikeholdslogg
{
  "type": "add_maintenance",
  "data": {
    "title": "Kort beskrivende tittel",
    "description": "Detaljer om hva som ble gjort",
    "category": "motor" | "skrog" | "elektrisitet" | "sikkerhetsutstyr" | "annet",
    "type": "service" | "reparasjon" | "skade" | "oppgradering" | "inspeksjon",
    "date": "YYYY-MM-DD",
    "cost": 1234.56 (optional),
    "performed_by": "Navn" (optional),
    "hours_spent": 2.5 (optional),
    "parts_used": "Liste av deler" (optional),
    "notes": "Ekstra notater" (optional)
  },
  "confirmationMessage": "✅ Lagt til i vedlikeholdslogg: [tittel]"
}

2. **add_reminder**: Opprett påminnelse
{
  "type": "add_reminder",
  "data": {
    "title": "Hva skal gjøres",
    "description": "Detaljer",
    "category": "motor" | "skrog" | "sikkerhet" | "sesong" | "annet",
    "due_date": "YYYY-MM-DD",
    "priority": "low" | "medium" | "high",
    "recurrence": "none" | "monthly" | "quarterly" | "yearly" | "custom",
    "recurrence_interval": 365 (kun hvis recurrence er "custom", antall dager),
    "ai_suggested": true
  },
  "confirmationMessage": "🔔 Opprettet påminnelse: [tittel] (forfaller [dato])"
}

3. **suggest_document**: Foreslå manual/dokument
{
  "type": "suggest_document",
  "data": {
    "title": "Navn på dokument",
    "url": "URL til dokument",
    "type": "brukermanual" | "serviceguide" | "annet",
    "description": "Hva dokumentet inneholder"
  },
  "confirmationMessage": "📄 Foreslått dokument: [tittel]"
}

Når du foreslår flere dokumenter, legg én "suggest_document"-action per dokument (i samme svar).

EKSEMPLER:

Input: "Hvor finner jeg manual for Volvo Penta MD11D?"
Output:
{
  "response": "MD11D brukermanual finner du hos Volvo Penta. Manualen dekker drift, vedlikehold og feilsøking. Du kan laste den ned her: https://example.com/volvo-md11d-manual.pdf\n\nManualen er på engelsk og inneholder komplett informasjon om drift, vedlikehold og feilsøking.",
  "actions": [
    {
      "type": "suggest_document",
      "data": {
        "title": "Volvo Penta MD11D Brukermanual",
        "url": "https://example.com/volvo-md11d-manual.pdf",
        "type": "brukermanual",
        "description": "Komplett manual for drift og vedlikehold av MD11D motor"
      },
      "confirmationMessage": "📄 Foreslått dokument: Volvo Penta MD11D Brukermanual"
    }
  ]
}

Input: "Trenger service manual for Mercury 75 hk"
Output:
{
  "response": "Jeg har funnet en servicehåndbok for Mercury 75 hk motorer. Denne manualen dekker full service, demontering og vedlikehold.\n\nLast ned manualen her: https://www.manualslib.com/manual/mercury-75-service.pdf\n\nManualen er på engelsk og inneholder detaljerte diagrammer og prosedyrer.",
  "actions": [
    {
      "type": "suggest_document",
      "data": {
        "title": "Mercury 75 Service Manual",
        "url": "https://www.manualslib.com/manual/mercury-75-service.pdf",
        "type": "serviceguide",
        "description": "Komplett servicemanual for Mercury 75 hk motor"
      },
      "confirmationMessage": "📄 Foreslått dokument: Mercury 75 Service Manual"
    }
  ]
}

Input: "Kan du finne brukermanual til Scanmar 33?"
Output (hvis ikke funnet):
{
  "response": "Jeg fant dessverre ikke en digital brukermanual for Scanmar 33 som kan lastes ned direkte. Men jeg kan hjelpe deg med noe annet:\n\n- Scanmar sin kontaktinfo: Du kan kontakte dem på sales@scanmar.no eller telefon +47 33 35 44 00 for å be om en kopi av manualen.\n\n- I mellomtiden kan jeg hjelpe deg med:\n  • Tekniske spesifikasjoner for båten\n  • Vanlige vedlikeholdsoppgaver for seilbåter\n  • Spesifikke spørsmål om rigg, seil eller utstyr\n\nHva kan jeg hjelpe deg med angående Scanmar 33?",
  "actions": []
}

Input: "Jeg byttet motorolje i dag, brukte 5L Castrol Edge 10W-40"
Output:
{
  "response": "Flott! Jeg har lagt til oljeskiftet i vedlikeholdsloggen og opprettet en påminnelse for neste oljeskift om 6 måneder.",
  "actions": [
    {
      "type": "add_maintenance",
      "data": {
        "title": "Oljeskift motor",
        "description": "Byttet motorolje - 5L Castrol Edge 10W-40",
        "category": "motor",
        "type": "service",
        "date": "${new Date().toISOString().split('T')[0]}",
        "parts_used": "5L Castrol Edge 10W-40"
      },
      "confirmationMessage": "✅ Lagt til i vedlikeholdslogg: Oljeskift motor"
    },
    {
      "type": "add_reminder",
      "data": {
        "title": "Oljeskift motor",
        "description": "Tid for å bytte motorolje igjen",
        "category": "motor",
        "due_date": "${new Date(Date.now() + 180*24*60*60*1000).toISOString().split('T')[0]}",
        "priority": "medium",
        "recurrence": "custom",
        "recurrence_interval": 180,
        "ai_suggested": true
      },
      "confirmationMessage": "🔔 Opprettet påminnelse: Oljeskift motor (forfaller om 6 måneder)"
    }
  ]
}

Input: "Når skal jeg bytte anoder?"
Output:
{
  "response": "Anoder bør sjekkes årlig og byttes når de er nedslitt til 50% av opprinnelig størrelse. Dette er vanligvis hvert 12-18 måneder avhengig av bruk og vannforhold. Vil du at jeg oppretter en påminnelse?",
  "actions": []
}

Input: "Kan du finne tegninger til Scanmar 33?"
Output (hvis du finner ressurser):
{
  "response": "Jeg har funnet noen nyttige ressurser om Scanmar 33:\n\n- Skippo har en side med spesifikasjoner og fakta om Scanmar 33:\nhttps://www.skippo.se/batar/batmarken/scanmar/33\n\n- Sailguide har detaljerte spesifikasjoner:\nhttps://www.sailguide.com/index.php/batfakta/scanmar-33\n\n- Boding Segel tilbyr seil til Scanmar 33:\nhttps://www.boding.se/modeller/scanmar-33/\n\nFor mer detaljerte tegninger anbefaler jeg å kontakte Scanmar direkte på sales@scanmar.no eller telefon +47 33 35 44 00.",
  "actions": []
}

VIKTIGE REGLER:
- Kun returner JSON, ingen annen tekst
- BRUK brukerens faktiske båt/motor-informasjon i svarene dine (f.eks. hvis de har Suzuki DF150, nevn det)
- Hvis brukeren refererer til "min båt" eller "min motor", bruk den faktiske informasjonen fra BRUKERENS BÅT(ER) og BRUKERENS MOTOR(ER)
- Ta hensyn til nylig vedlikehold når du anbefaler nye vedlikeholdsoppgaver
- Bruk dagens dato: ${new Date().toISOString().split('T')[0]}

HANDLINGS-REGLER:
- Hvis brukeren svarer "ja", "ok", "gjerne", "gå på" på et forslag fra deg i forrige melding - UTFØR handlingen MED EN GANG
- Hvis brukeren klart sier noe er GJORT ("jeg byttet", "jeg sjekket", "har gjort") - LEGG TIL I LOGG og OPPRETT PÅMINNELSE automatisk
- Hvis brukeren sier noe SKAL gjøres ("jeg skal", "må", "planlegger") - OPPRETT PÅMINNELSE automatisk
- Hvis du mangler kritisk info (dato, kostnad, etc.) - spør KORT (1 spørsmål om gangen)
- IKKE spør om tillatelse hvis intensjonen er klar - BARE GJØR DET
- Hvis bruker bare stiller et spørsmål uten handling - svar uten actions (tom array)`,
          }
      ]
      
      // Add chat history if available
      if (chatHistory && Array.isArray(chatHistory) && chatHistory.length > 0) {
        // Convert chat history with potential images
        for (const msg of chatHistory) {
          if (msg.images && msg.images.length > 0) {
            // Message with images - use Responses API format
            const content: any[] = [
              { type: 'input_text', text: msg.content }
            ]
            for (const image of msg.images) {
              // Extract base64 data from data URL
              const base64Data = image.startsWith('data:') 
                ? image.split(',')[1] 
                : image
                
              content.push({
                type: 'input_image',
                image: base64Data
              })
            }
            messages.push({
              role: msg.role,
              content
            })
          } else {
            // Text-only message
            messages.push({
              role: msg.role,
              content: msg.content
            })
          }
        }
      } else {
        // If no history, add the current user prompt with images if any
        if (images && images.length > 0) {
          const content: any[] = [
            { type: 'input_text', text: userPrompt }
          ]
          for (const image of images) {
            // Extract base64 data from data URL
            const base64Data = image.startsWith('data:') 
              ? image.split(',')[1] 
              : image
              
            content.push({
              type: 'input_image',
              image: base64Data
            })
          }
          messages.push({
            role: 'user',
            content
          })
        } else {
          messages.push({
            role: 'user',
            content: userPrompt,
          })
        }
      }
      // VANLIG SAMTALE
      let responseText = ''
      
      // Check if any message contains images
      const hasImages = images && images.length > 0
      
      if (hasImages) {
        // Use Chat Completions API for vision support (no web search with images)
        const chatMessages = messages.map(msg => {
          if (typeof msg.content === 'string') {
            return msg
          }
          // Convert to Chat Completions format
          const content: any[] = []
          for (const part of msg.content) {
            if (part.type === 'input_text') {
              content.push({ type: 'text', text: part.text })
            } else if (part.type === 'input_image') {
              content.push({
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${part.image}`
                }
              })
            }
          }
          return { role: msg.role, content }
        })
        
        const chatResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: chatMessages as any,
          temperature: 0.7,
          max_tokens: 1500,
        })
        
        responseText = chatResponse.choices[0]?.message?.content || ''
      } else {
        // Use Responses API with web search for text-only
        const response = await createWebSearchResponse({
          model: 'gpt-4.1-mini',
          messages,
          temperature: 0.7,
          maxOutputTokens: 1500,
          searchContextSize:
            webSearchContextSize === 'low' ||
            webSearchContextSize === 'medium' ||
            webSearchContextSize === 'high'
              ? webSearchContextSize
              : 'medium',
        })
        responseText = extractResponseText(response)
      }
      
      try {
        // Try to parse as JSON
        const parsedResponse = JSON.parse(responseText || '{}')
        return NextResponse.json({ 
          suggestion: parsedResponse.response || responseText,
          actions: parsedResponse.actions || []
        })
      } catch {
        // If not valid JSON, return as plain text
        return NextResponse.json({ 
          suggestion: responseText,
          actions: []
        })
      }
    }

    // Handle maintenance reminder suggestion
    if (action === 'maintenance_reminder') {
      const response = await createWebSearchResponse({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: `Du er en ekspert på båtvedlikehold og service. Basert på vedlikeholdstype og kategori, skal du anbefale når neste service/vedlikehold bør utføres.

Svar ALLTID med et JSON-objekt:
{
  "nextServiceDate": "YYYY-MM-DD (dato for neste service, beregnet fra i dag)",
  "intervalDays": "antall dager mellom hver service",
  "priority": "low/medium/high basert på viktighet",
  "reason": "En kort forklaring på hvorfor dette intervallet anbefales (1-2 setninger)"
}

Eksempler på typiske intervaller:
- Motorolje: 50-100 timer eller 6-12 måneder
- Anoder: 12 måneder
- Antifouling: 12 måneder
- Impeller: 12-24 måneder
- Drivstoffilter: 12 måneder eller 100 timer
- Batterier: 3 måneder (sjekk)
- Sikkerhetsutstyr: 12 måneder (kontroll)

Ta hensyn til båttype, bruksfrekvens (anta gjennomsnittlig bruk), og sikkerhetsaspekter.
Dagens dato er ${new Date().toISOString().split('T')[0]}.

Kun returner JSON-objektet, ingen annen tekst.`,
          },
          {
            role: 'user',
            content: `Vedlikehold utført: "${maintenanceTitle}"
Kategori: ${maintenanceCategory}
Type: ${maintenanceType}

Når bør neste vedlikehold/service utføres?`,
          },
        ],
        temperature: 0.4,
        maxOutputTokens: 300,
        searchContextSize: 'medium',
      })

      const responseText = extractResponseText(response)

      if (responseText) {
        try {
          const suggestion = JSON.parse(responseText)
          return NextResponse.json({ suggestion })
        } catch (parseError) {
          console.error('Error parsing AI response:', parseError)
        }
      }

      return NextResponse.json({ suggestion: null })
    }

    // Handle autofill action
    if (action === 'autofill') {
      if (!manufacturer || !model) {
        return NextResponse.json({ suggestions: null })
      }

      // Handle boat autofill
      if (type === 'boat') {
        const response = await createWebSearchResponse({
          model: 'gpt-4.1-mini',
          messages: [
            {
              role: 'system',
              content: `Du er en ekspert på båter. Basert på båtprodusent og modell skal du finne tekniske spesifikasjoner. 
Svar ALLTID med et JSON-objekt med følgende felter (bruk null hvis du ikke vet verdien):
{
  "length_meters": "lengde i FOT som desimaltall (f.eks: '21.3')",
  "width_meters": "bredde i meter som desimaltall (f.eks: '2.4')",
  "weight_kg": "vekt i kg som heltall (f.eks: '1200')",
  "year": "typisk produksjonsår (valgfritt)"
}

Kun returner JSON-objektet, ingen annen tekst.`,
            },
            {
              role: 'user',
              content: `Finn tekniske spesifikasjoner for båt: ${manufacturer} ${model}`,
            },
          ],
          temperature: 0.3,
          maxOutputTokens: 300,
          searchContextSize: 'medium',
        })

        const responseText = extractResponseText(response)

        if (responseText) {
          try {
            const suggestions = JSON.parse(responseText)
            const filteredSuggestions = Object.fromEntries(
              Object.entries(suggestions).filter(([_, v]) => v !== null && v !== 'null' && v !== '')
            )
            
            if (Object.keys(filteredSuggestions).length > 0) {
              return NextResponse.json({ suggestions: filteredSuggestions })
            }
          } catch (parseError) {
            console.error('Error parsing AI response:', parseError)
          }
        }

        return NextResponse.json({ suggestions: null })
      }

      // Handle engine autofill
      const response = await createWebSearchResponse({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: `Du er en ekspert på båtmotorer. Basert på motorprodusent og modell skal du finne tekniske spesifikasjoner. 
Svar ALLTID med et JSON-objekt med følgende felter (bruk null hvis du ikke vet verdien):
{
  "horsepower": "hestekrefter som tall",
  "year": "typisk produksjonsår",
  "engine_type": "motortype (f.eks: 'Påhengsmotor', 'Innenbords', etc)",
  "fuel_type": "drivstofftype (f.eks: 'Bensin', 'Diesel', etc)",
  "tank_capacity_liters": "typisk tankkapasitet i liter",
  "fuel_consumption_lph": "forbruk i liter per time ved cruisefart",
  "propeller": "anbefalt propellstørrelse",
  "oil_type": "anbefalt oljetype"
}

Kun returner JSON-objektet, ingen annen tekst.`,
          },
          {
            role: 'user',
            content: `Finn tekniske spesifikasjoner for: ${manufacturer} ${model}`,
          },
        ],
        temperature: 0.3,
        maxOutputTokens: 300,
        searchContextSize: 'medium',
      })

      const responseText = extractResponseText(response)

      if (responseText) {
        try {
          const suggestions = JSON.parse(responseText)
          // Filter out null values
          const filteredSuggestions = Object.fromEntries(
            Object.entries(suggestions).filter(([_, v]) => v !== null && v !== 'null' && v !== '')
          )
          
          if (Object.keys(filteredSuggestions).length > 0) {
            return NextResponse.json({ suggestions: filteredSuggestions })
          }
        } catch (parseError) {
          console.error('Error parsing AI response:', parseError)
        }
      }

      return NextResponse.json({ suggestions: null })
    }

    // Handle correction action (original functionality)
    const correctionAction = action || 'correct'
    
    if (!value || value.length < 2) {
      return NextResponse.json({ suggestion: null })
    }

    const prompts: Record<string, string> = {
      manufacturer: `Du er en båt/motor-ekspert. Brukeren skrev "${value}" som produsent. Hvis dette ser ut som en skrivefeil av et kjent merke, svar BARE med det korrekte navnet. Hvis "${value}" allerede er korrekt eller du er usikker, svar med "OK". Ikke gi forklaringer, bare navnet eller "OK".`,
      model: `Du er en båt/motor-ekspert. Brukeren skrev "${value}" som modell. Hvis dette ser ut som en skrivefeil, svar BARE med det korrekte navnet. Hvis "${value}" allerede er korrekt eller du er usikker, svar med "OK". Ikke gi forklaringer.`,
      hull_material: `Brukeren skrev "${value}" som skrogmateriale. Vanlige materialer er: Glassfiber, Aluminium, Tre, Stål, Kompositt. Hvis dette ser ut som en skrivefeil, svar BARE med det korrekte navnet. Hvis "${value}" allerede er korrekt eller du er usikker, svar med "OK".`,
    }

    const prompt = prompts[field]
    if (!prompt) {
      return NextResponse.json({ suggestion: null })
    }

    const response = await createWebSearchResponse({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: 'Du er en hjelpsom assistent som korrigerer skrivefeil i båt- og motorrelaterte termer. Vær konservativ - bare foreslå rettelser når du er ganske sikker på at det er en skrivefeil.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      maxOutputTokens: 50,
      searchContextSize: 'low',
    })

    const suggestion = extractResponseText(response)

    if (suggestion && suggestion !== 'OK' && suggestion.toLowerCase() !== value.toLowerCase()) {
      return NextResponse.json({ suggestion })
    }

    return NextResponse.json({ suggestion: null })
  } catch (error) {
    console.error('Error getting suggestion:', error)
    return NextResponse.json({ suggestion: null, suggestions: null })
  }
}
