"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
  BookOpen,
  Command,
  Folder,
  Heart,
  LifeBuoy,
  MessageSquare,
  Send,
  Ship,
  Wrench,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { ThemeToggle } from "@/components/theme-toggle"
import { SupportDialog } from "@/components/support-dialog"
import { FeedbackDialog } from "@/components/feedback-dialog"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Samtaler",
      url: "/samtaler",
      icon: MessageSquare,
      isActive: true,
    },
    {
      title: "Min båt",
      url: "#",
      icon: Ship,
      items: [
        {
          title: "Båtinformasjon",
          url: "/min-bat/informasjon",
        },
        {
          title: "Motordetaljer",
          url: "/min-bat/motor",
        },
        {
          title: "Utstyr & Tilbehør",
          url: "/min-bat/utstyr",
        },
      ],
    },
    {
      title: "Dokumenter",
      url: "/min-bat/dokumenter",
      icon: Folder,
      isActive: true,
    },
    {
      title: "Vedlikehold",
      url: "#",
      icon: Wrench,
      items: [
        {
          title: "Logg",
          url: "/vedlikehold/logg",
        },
        {
          title: "Påminnelser",
          url: "/vedlikehold/paminnelser",
        },
      ],
    },
    {
      title: "Hjelp",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduksjon",
          url: "/hjelp/introduksjon",
        },
        {
          title: "Kom i gang",
          url: "/hjelp/kom-i-gang",
        },
        {
          title: "Veiledninger",
          url: "/hjelp/veiledninger",
        },
        {
          title: "Endringslogg",
          url: "/hjelp/endringslogg",
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = useState<User | null>(null)
  const [supportOpen, setSupportOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const supabase = createClient()

  const navSecondary = [
    {
      title: "Support",
      icon: LifeBuoy,
      onClick: () => setSupportOpen(true),
    },
    {
      title: "Tilbakemelding",
      icon: Send,
      onClick: () => setFeedbackOpen(true),
    },
    {
      title: "Gi en gave",
      url: "/gave",
      icon: Heart,
    },
  ]

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const userData = user ? {
    name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Bruker',
    email: user.email || '',
    avatar: user.user_metadata?.avatar_url || '',
  } : {
    name: 'Gjestebruker',
    email: '',
    avatar: '',
  }

  return (
    <>
      <Sidebar variant="inset" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <a href="#">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Command className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">Nautix</span>
                    <span className="truncate text-xs">Digital båtassistent</span>
                  </div>
                  <ThemeToggle />
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={data.navMain} />
          <NavSecondary items={navSecondary} className="mt-auto" />
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={userData} />
        </SidebarFooter>
      </Sidebar>
      
      <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} />
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </>
  )
}