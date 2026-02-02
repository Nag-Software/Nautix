"use client"

import { useState, useEffect } from "react"
import { MessageSquare, Archive, Trash2, Plus, MoreVertical, Bot, User, Folder } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { AppSidebar } from "@/components/app-sidebar"
import { useRouter } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { IconLivePhoto } from "@tabler/icons-react"

interface Conversation {
  id: string
  title: string
  archived: boolean
  created_at: string
  updated_at: string
}

interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export default function SamtalerPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [showArchived, setShowArchived] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchConversations()

    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => fetchConversations()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [showArchived])

  const fetchConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('archived', showArchived)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setConversations(data || [])
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleArchive = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ archived: !showArchived })
        .eq('id', conversationId)

      if (error) throw error
      fetchConversations()
    } catch (error) {
      console.error('Error archiving conversation:', error)
    }
  }

  const handleDelete = async (conversationId: string) => {
    if (!confirm('Er du sikker på at du vil slette denne samtalen?')) return

    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)

      if (error) throw error
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null)
        setIsDrawerOpen(false)
      }
      fetchConversations()
    } catch (error) {
      console.error('Error deleting conversation:', error)
    }
  }

  const handleNewConversation = () => {
    setSelectedConversation(null)
    setIsDrawerOpen(false)
    router.push("/")
  }

  const handleOpenConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation)
    setIsDrawerOpen(true)
    setLoadingMessages(true)

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
      setMessages([])
    } finally {
      setLoadingMessages(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return 'Nå nettopp'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} timer siden`
    } else if (diffInHours < 48) {
      return 'I går'
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('nb-NO', { weekday: 'long' })
    }
    return date.toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Samtaler</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Samtaler</h1>
              <p className="text-muted-foreground">Administrer dine samtaler med AI04</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showArchived ? "outline" : "ghost"}
                size="sm"
                onClick={() => setShowArchived(!showArchived)}
              >
                {!showArchived ? (<Archive className="mr-2 h-4 w-4" />) : (<IconLivePhoto className="mr-2 h-4 w-4" />)}
                {showArchived ? 'Vis aktive' : 'Vis arkiverte'}
              </Button>
              <Button onClick={handleNewConversation}>
                <Plus className="mr-2 h-4 w-4" />
                Ny samtale
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">Laster samtaler...</div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center border rounded-lg bg-muted/10">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {showArchived ? 'Ingen arkiverte samtaler' : 'Ingen samtaler ennå'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {showArchived ? 'Du har ingen arkiverte samtaler.' : 'Start din første samtale med AI04 for å komme i gang.'}
              </p>
              {!showArchived && (
                <Button onClick={handleNewConversation}>
                  <Plus className="mr-2 h-4 w-4" />
                  Start samtale
                </Button>
              )}
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]" />
                    <TableHead>Tittel</TableHead>
                    <TableHead>Opprettet</TableHead>
                    <TableHead>Sist oppdatert</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conversations.map((conversation) => (
                    <TableRow
                      key={conversation.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleOpenConversation(conversation)}
                    >
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <div className="bg-primary/10 p-2 rounded-lg">
                            <MessageSquare className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{conversation.title}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(conversation.created_at).toLocaleDateString('nb-NO', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(conversation.updated_at)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Meny</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleArchive(conversation.id) }}>
                              <Archive className="mr-2 h-4 w-4" />
                              {showArchived ? 'Gjenopprett' : 'Arkiver'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => { e.stopPropagation(); handleDelete(conversation.id) }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Slett
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {conversations.length > 0 && (
            <div className="flex items-center justify-center">
              <Badge variant="outline" className="text-xs">
                {conversations.length} {showArchived ? 'arkiverte' : 'aktive'} samtale{conversations.length !== 1 ? 'r' : ''}
              </Badge>
            </div>
          )}
        </div>

        <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <SheetContent className="w-full px-4 sm:max-w-2xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{selectedConversation?.title}</SheetTitle>
              <SheetDescription>
                Opprettet {selectedConversation && new Date(selectedConversation.created_at).toLocaleDateString('nb-NO', {
                  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-muted-foreground">Laster meldinger...</div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-center">
                  <div className="text-muted-foreground">Ingen meldinger i denne samtalen</div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3 p-4 rounded-lg",
                      message.role === 'user' ? "bg-primary/5 ml-8" : "bg-muted/50 mr-8"
                    )}
                  >
                    <div
                      className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                        message.role === 'user' ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                      )}
                    >
                      {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{message.role === 'user' ? 'Du' : 'AI04'}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.created_at).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </SheetContent>
        </Sheet>
      </SidebarInset>
    </SidebarProvider>
  )
}
