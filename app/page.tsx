"use client";

import Ai04 from "@/components/ai-04"
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
import { useState } from "react"
import { IconSparkles, IconUser } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { LinkifiedText } from "@/components/linkified-text"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface AIAction {
  type: "add_maintenance" | "add_reminder" | "suggest_document"
  data: any
  confirmationMessage: string
}

export default function Page() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)

  const executeAction = async (action: AIAction) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      toast.error("Du må være logget inn")
      return false
    }

    try {
      if (action.type === "add_maintenance") {
        // Show confirmation toast before adding to maintenance log
        toast(action.confirmationMessage || "Legg til i vedlikeholdsloggen?", {
          description: `${action.data.title || 'Vedlikeholdsoppgave'} - ${action.data.category || 'Annet'}`,
          duration: 15000,
          action: {
            label: "Legg til",
            onClick: async () => {
              try {
                const { error } = await supabase
                  .from("maintenance_log")
                  .insert([{
                    ...action.data,
                    user_id: user.id,
                    status: action.data.status || "completed",
                    priority: action.data.priority || "medium",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  }])

                if (error) throw error
                toast.success("✅ Lagt til i vedlikeholdsloggen")
              } catch (error) {
                console.error("Error adding maintenance:", error)
                toast.error("Kunne ikke legge til i vedlikeholdsloggen")
              }
            },
          },
          cancel: {
            label: "Avvis",
            onClick: () => {},
          },
        })
        return true
      } 
      else if (action.type === "add_reminder") {
        // Show confirmation toast before adding reminder
        const reminderData: any = {
          title: action.data.title,
          description: action.data.description || null,
          due_date: action.data.due_date,
          priority: action.data.priority || "medium",
          category: action.data.category || "annet",
          user_id: user.id,
          completed: false,
          ai_suggested: action.data.ai_suggested || true,
          recurrence: action.data.recurrence || "none",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        // Only add recurrence_interval if recurrence is custom
        if (action.data.recurrence === "custom" && action.data.recurrence_interval) {
          reminderData.recurrence_interval = action.data.recurrence_interval
        }
        
        toast(action.confirmationMessage || "Opprett påminnelse?", {
          description: `${action.data.title} - Forfaller: ${action.data.due_date}`,
          duration: 15000,
          action: {
            label: "Opprett",
            onClick: async () => {
              try {
                const { error } = await supabase
                  .from("reminders")
                  .insert([reminderData])

                if (error) throw error
                toast.success("✅ Påminnelse opprettet")
              } catch (error) {
                console.error("Error adding reminder:", error)
                toast.error("Kunne ikke opprette påminnelse")
              }
            },
          },
          cancel: {
            label: "Avvis",
            onClick: () => {},
          },
        })
        return true
      }
      else if (action.type === "suggest_document") {
        const url = action.data?.url ? String(action.data.url) : ""
        const title = action.data?.title ? String(action.data.title) : "Dokument"
        const type = action.data?.type ? String(action.data.type) : "annet"
        const description = action.data?.description ? String(action.data.description) : null

        // Check if file is downloadable (not .html)
        const downloadableExtensions = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.gif', '.xls', '.xlsx', '.csv', '.ppt', '.pptx', '.zip', '.rar']
        const isDownloadable = downloadableExtensions.some(ext => url.toLowerCase().includes(ext)) && 
                               !url.toLowerCase().includes('.html') && 
                               !url.toLowerCase().includes('.htm')

        if (isDownloadable) {
          // Ask user to download and save file to Supabase Storage
          toast(action.confirmationMessage || `Last ned "${title}"?`, {
            description: description ? `${description}\n\nFilen lastes ned og lagres i dokumentarkivet.` : "Filen lastes ned og lagres i dokumentarkivet.",
            duration: 15000,
            action: {
              label: "Last ned",
              onClick: async () => {
                const downloadToast = toast.loading("Laster ned dokument...")
                try {
                  const downloadResponse = await fetch("/api/download-document", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url, title, type, description })
                  })

                  const downloadData = await downloadResponse.json()

                  if (!downloadResponse.ok) {
                    throw new Error(downloadData.error || "Kunne ikke laste ned dokument")
                  }

                  toast.success("Dokument lastet ned og lagret", { id: downloadToast })
                } catch (error: any) {
                  console.error("Download error:", error)
                  toast.error(error.message || "Kunne ikke laste ned dokument", { id: downloadToast })
                }
              },
            },
            cancel: {
              label: "Avvis",
              onClick: () => {},
            },
          })
        } else {
          // Save as link only (for .html and non-downloadable files)
          toast(action.confirmationMessage || `Legg til "${title}" som lenke?`, {
            description: description || undefined,
            duration: 15000,
            action: {
              label: "Legg til",
              onClick: async () => {
                try {
                  const { data: boats } = await supabase
                    .from("boats")
                    .select("id")
                    .eq("user_id", user.id)
                    .limit(1)

                  const boatId = boats?.[0]?.id ?? null

                  const { error } = await supabase
                    .from("document_links")
                    .insert([
                      {
                        user_id: user.id,
                        boat_id: boatId,
                        title,
                        url,
                        type,
                        description,
                        source: "ai",
                      },
                    ])

                  if (error) throw error

                  toast.success("Lenke lagt til under Dokumenter")
                } catch (error: any) {
                  const maybeMissingTable =
                    error?.code === "42P01" ||
                    String(error?.message || "").toLowerCase().includes("document_links")

                  if (maybeMissingTable) {
                    toast.error("Database-tabell mangler. Kjør SQL-setup først.")
                  } else {
                    toast.error("Kunne ikke legge til lenke")
                  }
                }
              },
            },
            cancel: {
              label: "Avvis",
              onClick: () => {},
            },
          })
        }
        return true
      }
    } catch (error) {
      console.error("Error executing action:", error)
      toast.error("Kunne ikke utføre handlingen")
      return false
    }

    return false
  }

  const handleSubmit = async (prompt: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error("Du må være logget inn")
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: prompt,
      timestamp: new Date()
    }
    
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Ensure a conversation exists
      let activeConversationId = conversationId
      if (!activeConversationId) {
        const title = prompt.trim().slice(0, 80)
        const { data: createdConv, error: createConvError } = await supabase
          .from("conversations")
          .insert([{ user_id: user.id, title, archived: false }])
          .select("id")
          .single()

        if (createConvError) throw createConvError
        activeConversationId = createdConv.id as string
        setConversationId(activeConversationId)
      }

      // Persist user message
      const { error: insertUserMsgError } = await supabase
        .from("messages")
        .insert([{ conversation_id: activeConversationId, user_id: user.id, role: "user", content: prompt }])

      if (insertUserMsgError) throw insertUserMsgError

      // Send the last 5 messages for context
      const recentMessages = [...messages, userMessage].slice(-5).map(m => ({
        role: m.role,
        content: m.content
      }))
      
      const response = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt,
          chatHistory: recentMessages
        })
      })

      const data = await response.json()
      
      // Auto-detect file URLs in response and create suggest_document actions if missing
      const fileExtensions = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.xls', '.xlsx', '.csv', '.ppt', '.pptx', '.zip', '.rar', '.xml', '.json']
      const urlRegex = /https?:\/\/[^\s<>()]+/g
      const responseText = data.suggestion || ""
      const foundUrls = responseText.match(urlRegex) || []
      
      const existingDocUrls = new Set(
        (data.actions || [])
          .filter((a: any) => a.type === "suggest_document")
          .map((a: any) => a.data?.url)
      )
      
      // Add missing suggest_document actions for file URLs
      for (const url of foundUrls) {
        const isFileUrl = fileExtensions.some(ext => url.toLowerCase().includes(ext))
        if (isFileUrl && !existingDocUrls.has(url)) {
          const filename = url.split('/').pop()?.split('?')[0] || "Dokument"
          const autoAction = {
            type: "suggest_document",
            data: {
              title: filename,
              url: url,
              type: "annet",
              description: "Automatisk detektert fra AI-svar"
            },
            confirmationMessage: `📄 Foreslått dokument: ${filename}`
          }
          data.actions = data.actions || []
          data.actions.push(autoAction)
        }
      }
      
      // Track URL validation results for summary
      let urlValidationSummary: string[] = []
      
      // Execute actions if any, with URL validation for suggest_document
      if (data.actions && Array.isArray(data.actions)) {
        for (const action of data.actions) {
          // Validate URLs in suggest_document actions before executing
          if (action.type === "suggest_document" && action.data?.url) {
            try {
              const validateResponse = await fetch("/api/validate-url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: action.data.url })
              })
              const validateData = await validateResponse.json()
              
              if (!validateData.valid) {
                console.warn("Invalid/inactive URL, requesting alternative from AI:", action.data.url)
                
                // Automatically request alternative URL from AI (up to 5 attempts)
                const retryToast = toast.loading(`Lenken til "${action.data.title}" er ikke tilgjengelig. Søker etter alternativ kilde...`)
                
                let foundValidUrl = false
                let testedUrls = new Set([action.data.url])
                let urlCheckDetails: string[] = [`❌ ${action.data.url} (utilgjengelig)`]
                
                for (let attempt = 1; attempt <= 5 && !foundValidUrl; attempt++) {
                  try {
                    const retryPrompt = attempt === 1 
                      ? `Den opprinnelige lenken ${action.data.url} til "${action.data.title}" er NEDE og svarer ikke (HTTP feil). 

SØK PÅ WEB og finn EN HELT ANNEN alternativ kilde/lenke til dette dokumentet. Bruk en FORSKJELLIG server, domene eller nettsted enn ${new URL(action.data.url).hostname}. 

KRITISK VIKTIG: Du MÅ returnere en "suggest_document" action med den nye URL-en i "actions"-arrayet. Uten denne action-en kan jeg ikke gi brukeren den alternative lenken.

Søk etter: "${action.data.title}" PDF manual download`
                      : `Følgende lenker til "${action.data.title}" er ALLE nede og fungerer IKKE:
${Array.from(testedUrls).map(u => `- ${u}`).join('\n')}

SØK PÅ WEB og finn EN HELT NY alternativ kilde fra et ANNET nettsted/domene. IKKE bruk disse domenene: ${Array.from(new Set(Array.from(testedUrls).map(u => {
  try { return new URL(u).hostname } catch { return u }
}))).join(', ')}

KRITISK VIKTIG: Du MÅ returnere en "suggest_document" action med den nye URL-en. Dette er forsøk ${attempt}/5 så vær kreativ og søk bredt.

Søk etter: "${action.data.title}" alternative download sites PDF`
                    
                    toast.loading(`Søker etter alternativ kilde ${attempt}/5...`, { id: retryToast })
                    
                    const retryResponse = await fetch("/api/suggest", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ 
                        prompt: retryPrompt,
                        chatHistory: [],
                        webSearch: true, // CRITICAL: Enable web search to find real alternatives
                        webSearchContextSize: 'high'
                      })
                    })
                    
                    const retryData = await retryResponse.json()
                    
                    console.log(`AI response for attempt ${attempt}:`, {
                      suggestion: retryData.suggestion,
                      actions: retryData.actions,
                      hasDocActions: retryData.actions?.filter((a: any) => a.type === 'suggest_document').length
                    })
                    
                    // Check if AI provided alternative document actions
                    const alternativeAction = retryData.actions?.find(
                      (a: any) => a.type === "suggest_document" && a.data?.url && !testedUrls.has(a.data.url)
                    )
                    
                    if (alternativeAction && alternativeAction.data?.url) {
                      console.log(`Found alternative URL (attempt ${attempt}):`, alternativeAction.data.url)
                      testedUrls.add(alternativeAction.data.url)
                      
                      // Validate the new URL
                      const newValidateResponse = await fetch("/api/validate-url", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ url: alternativeAction.data.url })
                      })
                      const newValidateData = await newValidateResponse.json()
                      
                      if (newValidateData.valid) {
                        // Use the new valid URL
                        action.data.url = newValidateData.url || alternativeAction.data.url
                        action.data.description = `Alternativ kilde (original ikke tilgjengelig): ${alternativeAction.data.description || ''}`
                        urlCheckDetails.push(`✅ ${action.data.url} (aktiv - brukes)`)
                        toast.success(`✅ Fant aktiv kilde til "${action.data.title}" (forsøk ${attempt}/5)`, { id: retryToast })
                        foundValidUrl = true
                        await executeAction(action)
                      } else {
                        urlCheckDetails.push(`❌ ${alternativeAction.data.url} (utilgjengelig)`)
                        console.log(`Attempt ${attempt}/5 failed, URL not active:`, alternativeAction.data.url)
                      }
                    } else {
                      console.log(`Attempt ${attempt}/5: AI did not provide a new alternative URL`)
                      break // No point continuing if AI can't suggest more
                    }
                  } catch (retryError) {
                    console.error(`Error on attempt ${attempt}/5:`, retryError)
                  }
                }
                
                if (!foundValidUrl) {
                  toast.error(`Kunne ikke finne tilgjengelig kilde til "${action.data.title}" etter 5 forsøk`, { id: retryToast })
                }
                
                // Add summary to validation report
                if (urlCheckDetails.length > 0) {
                  urlValidationSummary.push(`\n**Søk etter "${action.data.title}":**\n${urlCheckDetails.join('\n')}`)
                }
                
                continue // Skip original action
              }
              
              // Use cleaned URL from validation
              if (validateData.url && validateData.url !== action.data.url) {
                action.data.url = validateData.url
              }
              
              // Track successful validation
              urlValidationSummary.push(`\n**Validert "${action.data.title}":**\n✅ ${action.data.url} (aktiv)`)
            } catch (error) {
              console.warn("URL validation failed, proceeding anyway:", error)
            }
          }
          await executeAction(action)
        }
      }
      
      // Add URL validation summary to response if any checks were performed
      let finalContent = data.suggestion || "Beklager, jeg kunne ikke behandle forespørselen din."
      if (urlValidationSummary.length > 0) {
        finalContent += `\n\n---\n**URL-validering:**${urlValidationSummary.join('\n')}`
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: finalContent,
        timestamp: new Date()
      }
      
      setMessages((prev) => [...prev, assistantMessage])

      // Persist assistant message and bump conversation updated_at
      const { error: insertAssistantMsgError } = await supabase
        .from("messages")
        .insert([{ conversation_id: activeConversationId!, user_id: user.id, role: "assistant", content: assistantMessage.content }])
      if (insertAssistantMsgError) throw insertAssistantMsgError

      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", activeConversationId!)
    } catch (error) {
      console.error("Error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Beklager, det oppstod en feil. Prøv igjen senere.",
        timestamp: new Date()
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const startNewConversation = () => {
    setConversationId(null)
    setMessages([])
  }

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
                    Nautix
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Samtale</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <main className="flex flex-1 flex-col overflow-hidden">
          {messages.length === 0 ? (
            <div className="flex flex-1 justify-center mt-[15vh]">
              <Ai04 onSubmit={handleSubmit} />
            </div>
          ) : (
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto px-4 py-6">
                <div className="mx-auto max-w-3xl space-y-6">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-4",
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.role === "assistant" && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                          <IconSparkles size={18} className="text-primary-foreground" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-3 max-w-[80%]",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        <LinkifiedText text={message.content} className="text-sm" />
                      </div>
                      {message.role === "user" && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                          <IconUser size={18} className="text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                        <IconSparkles size={18} className="text-primary-foreground" />
                      </div>
                      <div className="rounded-2xl bg-muted px-4 py-3">
                        <div className="flex gap-1">
                          <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: "0ms" }} />
                          <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: "150ms" }} />
                          <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="border-t bg-background p-4">
                <div className="mx-auto max-w-3xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-muted-foreground">
                      {conversationId ? "Aktiv samtale lagres automatisk" : "Ny samtale opprettes ved første melding"}
                    </div>
                    {messages.length > 0 && (
                      <button className="text-xs underline" onClick={startNewConversation}>Start ny samtale</button>
                    )}
                  </div>
                  <Ai04 onSubmit={handleSubmit} compact />
                </div>
              </div>
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
