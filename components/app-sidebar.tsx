"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
  Anchor,
  BookOpen,
  Command,
  Folder,
  Gauge,
  LifeBuoy,
  Send,
  Settings2,
  Ship,
  Wrench,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "./ui/button"
import { title } from "process"

const data = {
  navMain: [
    {
      title: "Min båt",
      url: "#",
      icon: Ship,
      isActive: true,
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
        {
          title: "Dokumenter",
          url: "/min-bat/dokumenter",
        },
      ],
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
      title: "Hjelp (kommende)",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduksjon",
          url: "#",
        },
        {
          title: "Kom i gang",
          url: "#",
        },
        {
          title: "Veiledninger",
          url: "#",
        },
        {
          title: "Endringslogg",
          url: "#",
        },
      ],
    },
    {
      title: "Innstillinger",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Generelt",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Fakturering",
          url: "#",
        },
        {
          title: "Grenser",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Tilbakemelding",
      url: "#",
      icon: Send,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

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
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
