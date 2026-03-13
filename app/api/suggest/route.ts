import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { shouldSearchUserDocumentsForPrompt, extractTextFromBuffer, cosineSimilarity } from '@/lib/doc-search'

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

function cleanJSONResponse(text: string): string {
  let cleaned = text.trim()
  
  // Clean markdown code blocks
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '')
  cleaned = cleaned.replace(/\n?```\s*$/i, '')
  
  // Extract JSON object if there's text before/after
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1)
  }
  
  return cleaned.trim()
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
      
      // uploadedDocuments may be referenced later when performing semantic search;
      // declare in outer scope so it's available regardless of where we reference it.
      let uploadedDocuments: any[] | null = null

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

        // Also fetch uploaded documents stored in the documents table
        const { data: _uploaded } = await supabase
          .from('documents')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(30)
        uploadedDocuments = _uploaded || null
        
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
        
        // Include uploaded documents with signed URLs when possible
        if (uploadedDocuments && uploadedDocuments.length > 0) {
          userContext += "\n**OPPLASTEDE DOKUMENTER (siste 30):**\n"
          for (const doc of uploadedDocuments) {
            userContext += `- ${doc.name} (${doc.type || 'ukjent type'})\n`
            if (doc.upload_date) userContext += `  Lastet opp: ${doc.upload_date}\n`
            if (doc.expiry_date) userContext += `  Utløper: ${doc.expiry_date}\n`
            if (doc.file_path) {
              try {
                const { data: signed, error: signErr } = await supabase.storage
                  .from('documents')
                  .createSignedUrl(doc.file_path, 60 * 60) // 1 hour

                const maybe: any = signed
                const url = maybe?.signedUrl ?? maybe?.signed_url ?? null

                if (url) {
                  userContext += `  URL: ${url}\n`
                } else if (signErr) {
                  // fallback: note that file exists but couldn't create URL
                  userContext += `  Fil lagret i system (ingen URL tilgjengelig)\n`
                }
              } catch (e) {
                userContext += `  Fil lagret i system\n`
              }
            }
          }
        }
      }

const messages: any[] = [
        {
          role: 'system',
          content: `Du er en proaktiv AI-assistent for båteiere, ekspert på båt og vedlikehold.

${userContext}

BRUKERDATA: Du HAR tilgang til brukerens vedlikeholdslogg, påminnelser, dokumenter (manualer/PDF), og båt/motorinfo.
- Svar ALLTID konkret basert på disse dataene hvis brukeren spør om noe de eier.
- ALDRI si at du ikke har tilgang til denne informasjonen.
- "Når byttet jeg olje?" -> Sjekk VEDLIKEHOLDSLOGG.
- "Har jeg manualen min?" -> Sjekk DOKUMENTER (svar JA/NEI med info). 

HANDLINGER DU KAN UTFØRE:
1. Legge til vedlikeholdslogg (\`add_maintenance\`)
2. Opprette påminnelser (\`add_reminder\`)
3. Foreslå dokument/manual (\`suggest_document\`)

SVAR-FORMAT (STRENGT JSON-KRAV):
Du MÅ returnere ET GYLDIG JSON-OBJEKT og INGENTING ANNET. Ikke skriv noen tekst før eller etter JSON-objektet. Unngå markdown-kodeblokker rundt (som \`\`\`json).

{
  "response": "Svaret ditt til brukeren på norsk. Formater med **fet**, *kursiv*, eller lister. Hvis du deler en URL, MÅ den skrives i full klartekst (f.eks. 'Her er manualen: https://url.com') og ikke skjules i en markdown-lenke.",
  "actions": [
    {
      "type": "add_maintenance" | "add_reminder" | "suggest_document",
      "data": { ... }, 
      "confirmationMessage": "Kort bekreftelse til bruker"
    }
  ]
}

VIKTIGE REGLER FOR SUGGEST_DOCUMENT:
- Foreslå manualer/dokumenter proaktivt (PDF, jpg, docx, etc.).
- Hvis du har en URL til en manuell nedlasting i "response"-teksten, MÅ det være en tilsvarende \`suggest_document\` action i \`actions\`-arrayen.
- Bruk eksakt samme URL i både teksten og i action-data.

JSON-STRUKTUR FOR ACTIONS:

1. \`add_maintenance\`:
{
  "type": "add_maintenance",
  "data": {
    "title": "Tittel", "description": "Detaljer", "category": "motor|skrog|elektrisitet|annet", "type": "service|reparasjon|inspeksjon",
    "date": "YYYY-MM-DD", "cost": 1234, "hours_spent": 2.5, "parts_used": "Deler"
  }, "confirmationMessage": "✅ Lagt til i logg: [tittel]"
}

2. \`add_reminder\`:
{
  "type": "add_reminder",
  "data": {
    "title": "Tittel", "description": "Detaljer", "category": "motor|skrog|annet",
    "due_date": "YYYY-MM-DD", "priority": "low|medium|high", "recurrence": "none|monthly|quarterly|yearly", "ai_suggested": true
  }, "confirmationMessage": "🔔 Påminnelse: [tittel]"
}

3. \`suggest_document\`:
{
  "type": "suggest_document",
  "data": {
    "title": "Navn", "url": "MÅ VÆRE DIREKTELINK (IKKE HTML)", "type": "brukermanual|serviceguide|annet", "description": "Kort beskrivelse"
  }, "confirmationMessage": "📄 Foreslått dokument: [tittel]"
}

HANDLINGSREGLER:
- Utfør handlinger automatisk når brukeren bekrefter ("ja", "ok") eller sier de HAR GJORT / SKAL GJØRE noe.
- Dagens dato er ${new Date().toISOString().split('T')[0]}.
- MÅ IKKE RETURNERE ANNEN TEKST ENN JSON OBJEKTET!!!`,
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
                image_url: `data:image/jpeg;base64,${base64Data}`
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
              image_url: `data:image/jpeg;base64,${base64Data}`
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
      
      // If prompt likely targets user's documents, run semantic search over uploaded docs
      if (shouldSearchUserDocumentsForPrompt(userPrompt)) {
        const docsWithText: Array<{ id: string; name: string; text: string; score?: number }> = []
        for (const doc of uploadedDocuments || []) {
          if (!doc.file_path) continue
          try {
            const { data: fileData, error: downloadError } = await supabase.storage
              .from('documents')
              .download(doc.file_path)

            if (downloadError || !fileData) continue

            const arrayBuffer = await fileData.arrayBuffer()
            const text = await extractTextFromBuffer(arrayBuffer, doc.file_path)
            if (text && text.trim().length > 20) {
              docsWithText.push({ id: doc.id, name: doc.name, text })
            }
          } catch (e) {
            continue
          }
        }

        if (docsWithText.length > 0) {
          // Build embeddings for user prompt and document texts
          const embeddingModel = 'text-embedding-3-small'
          const inputs = [userPrompt, ...docsWithText.map((d) => d.text.slice(0, 8192))]
          const embResp = await openai.embeddings.create({
            model: embeddingModel,
            input: inputs,
          } as any)

          const userEmb = embResp.data[0].embedding as number[]
          const docEmbs = embResp.data.slice(1)

          // Score docs
          for (let i = 0; i < docsWithText.length; i++) {
            const emb = docEmbs[i].embedding as number[]
            const score = cosineSimilarity(userEmb, emb)
            docsWithText[i].score = score
          }

          docsWithText.sort((a, b) => (b.score || 0) - (a.score || 0))
          const top = docsWithText.slice(0, 3)

          // Prepend top excerpts to messages for final generation
          const excerpts = top
            .map((d) => `Fra dokument: ${d.name}\n---\n${d.text.slice(0, 800)}\n---\n`)
            .join('\n')

          messages.unshift({ role: 'system', content: `Søk i brukerens dokumenter - relevante utdrag følger:\n\n${excerpts}` })
        }
      }

      // Use Responses API for everything (supports both vision and web search)
      const response = await createWebSearchResponse({
        model: 'gpt-4o-mini',
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
      
      try {
        // Try to parse as JSON
        const parsedResponse = JSON.parse(cleanJSONResponse(responseText || '{}'))
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
        model: 'gpt-4o-mini',
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
          const suggestion = JSON.parse(cleanJSONResponse(responseText))
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
          model: 'gpt-4o-mini',
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
            const suggestions = JSON.parse(cleanJSONResponse(responseText))
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
        model: 'gpt-4o-mini',
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
          const suggestions = JSON.parse(cleanJSONResponse(responseText))
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
      model: 'gpt-4o-mini',
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
