"use client"

import { useState, useEffect } from "react"
import { MessageSquare, Archive, Trash2, MoreHorizontal, Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Conversation {
  id: string
  title: string
  archived: boolean
  created_at: string
  updated_at: string
}

interface NavConversationsProps {
  onConversationSelect?: (conversationId: string) => void
  activeConversationId?: string | null
  onNewConversation?: () => void
}

export function NavConversations({
  onConversationSelect,
  activeConversationId,
  onNewConversation,
}: NavConversationsProps) {
  const { isMobile } = useSidebar()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [showArchived, setShowArchived] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchConversations()
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          fetchConversations()
        }
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

  const handleArchive = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
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

  const handleDelete = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Er du sikker på at du vil slette denne samtalen?')) return

    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)

      if (error) throw error
      fetchConversations()
    } catch (error) {
      console.error('Error deleting conversation:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 48) {
      return 'I går'
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('nb-NO', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })
    }
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <div className="flex items-center justify-between px-2">
        <SidebarGroupLabel>Samtaler</SidebarGroupLabel>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onNewConversation}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <SidebarMenu>
        {loading ? (
          <div className="px-2 py-4 text-sm text-muted-foreground">
            Laster...
          </div>
        ) : conversations.length === 0 ? (
          <div className="px-2 py-4 text-sm text-muted-foreground">
            {showArchived ? 'Ingen arkiverte samtaler' : 'Ingen samtaler ennå'}
          </div>
        ) : (
          conversations.map((conversation) => (
            <SidebarMenuItem key={conversation.id}>
              <SidebarMenuButton
                asChild
                isActive={activeConversationId === conversation.id}
                onClick={() => onConversationSelect?.(conversation.id)}
                className={cn(
                  "group/item relative cursor-pointer",
                  activeConversationId === conversation.id && "bg-sidebar-accent"
                )}
              >
                <div className="flex items-center gap-2 w-full">
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <div className="flex-1 overflow-hidden">
                    <div className="truncate text-sm font-medium">
                      {conversation.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(conversation.updated_at)}
                    </div>
                  </div>
                </div>
              </SidebarMenuButton>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction 
                    showOnHover
                    className="opacity-0 group-hover/item:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Mer</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-48"
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "end" : "start"}
                >
                  <DropdownMenuItem
                    onClick={(e) => handleArchive(conversation.id, e)}
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    {showArchived ? 'Gjenopprett' : 'Arkiver'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => handleDelete(conversation.id, e)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Slett
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ))
        )}
      </SidebarMenu>

      {conversations.length > 0 && (
        <div className="px-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? (
              <>
                <MessageSquare className="mr-2 h-3 w-3" />
                Vis aktive
              </>
            ) : (
              <>
                <Archive className="mr-2 h-3 w-3" />
                Vis arkiverte
              </>
            )}
          </Button>
        </div>
      )}
    </SidebarGroup>
  )
}
