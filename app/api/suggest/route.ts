import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, field, value, manufacturer, model, type, maintenanceTitle, maintenanceCategory, maintenanceType, prompt: userPrompt, chatHistory } = body

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
          .select('title, category, type, date')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(10)
        
        // Fetch active reminders
        const { data: reminders } = await supabase
          .from('reminders')
          .select('title, category, due_date, priority')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('due_date', { ascending: true })
          .limit(10)
        
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
          userContext += "\n**NYLIG VEDLIKEHOLD (siste 10):**\n"
          recentMaintenance.forEach((log: any) => {
            userContext += `- ${log.date}: ${log.title} (${log.category}/${log.type})\n`
          })
        }
        
        if (reminders && reminders.length > 0) {
          userContext += "\n**AKTIVE PÅMINNELSER:**\n"
          reminders.forEach((reminder: any) => {
            userContext += `- ${reminder.title} - Forfaller: ${reminder.due_date} (${reminder.priority})\n`
          })
        }
      }

      // Build messages array with chat history
      const messages: any[] = [
        {
          role: 'system',
          content: `Du er en proaktiv AI-assistent for båteiere, ekspert på båter, båtmotorer, og båtvedlikehold. 

${userContext}

VIKTIG - DU KAN UTFØRE FØLGENDE HANDLINGER AUTOMATISK:
1. Legge til vedlikeholdslogg-oppføring
2. Opprette påminnelser for fremtidig vedlikehold
3. Foreslå manualer/dokumenter

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

EKSEMPLER:

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
        messages.push(...chatHistory)
      } else {
        // If no history, add the current user prompt
        messages.push({
          role: 'user',
          content: userPrompt,
        })
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 1500,
      })

      const responseText = completion.choices[0]?.message?.content?.trim()
      
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
      const completion = await openai.chat.completions.create({
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
        max_tokens: 300,
      })

      const responseText = completion.choices[0]?.message?.content?.trim()

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
        const completion = await openai.chat.completions.create({
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
  "hull_material": "skrogmateriale (f.eks: 'Glassfiber', 'Aluminium', 'Tre', 'Stål')",
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
          max_tokens: 300,
        })

        const responseText = completion.choices[0]?.message?.content?.trim()

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
      const completion = await openai.chat.completions.create({
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
        max_tokens: 300,
      })

      const responseText = completion.choices[0]?.message?.content?.trim()

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

    const completion = await openai.chat.completions.create({
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
      max_tokens: 50,
    })

    const suggestion = completion.choices[0]?.message?.content?.trim()

    if (suggestion && suggestion !== 'OK' && suggestion.toLowerCase() !== value.toLowerCase()) {
      return NextResponse.json({ suggestion })
    }

    return NextResponse.json({ suggestion: null })
  } catch (error) {
    console.error('Error getting suggestion:', error)
    return NextResponse.json({ suggestion: null, suggestions: null })
  }
}
