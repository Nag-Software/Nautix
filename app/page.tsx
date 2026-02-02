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
import { Toaster } from "sonner"

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

  const executeAction = async (action: AIAction) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      toast.error("Du må være logget inn")
      return false
    }

    try {
      if (action.type === "add_maintenance") {
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
        toast.success(action.confirmationMessage)
        return true
      } 
      else if (action.type === "add_reminder") {
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
        
        const { error } = await supabase
          .from("reminders")
          .insert([reminderData])

        if (error) throw error
        toast.success(action.confirmationMessage)
        return true
      }
      else if (action.type === "suggest_document") {
        // For now, just show a toast with the suggestion
        toast.info(action.confirmationMessage, {
          description: `${action.data.description}\n\nURL: ${action.data.url}`,
          duration: 10000
        })
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
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: prompt,
      timestamp: new Date()
    }
    
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
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
      
      // Execute actions if any
      if (data.actions && Array.isArray(data.actions)) {
        for (const action of data.actions) {
          await executeAction(action)
        }
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.suggestion || "Beklager, jeg kunne ikke behandle forespørselen din.",
        timestamp: new Date()
      }
      
      setMessages((prev) => [...prev, assistantMessage])
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
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
                  <Ai04 onSubmit={handleSubmit} compact />
                </div>
              </div>
            </div>
          )}
        </main>
      </SidebarInset>
      <Toaster richColors position="top-right" />
    </SidebarProvider>
  )
}
