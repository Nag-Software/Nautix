"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { ChevronRight, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { Button } from "./ui/button"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const pathname = usePathname()
  
  // Find which parent item should be open based on current pathname
  const getActiveItem = () => {
    for (const item of items) {
      if (item.items?.some((subItem) => pathname === subItem.url)) {
        return item.title
      }
    }
    return null
  }
  
  const [openItem, setOpenItem] = useState<string | null>(getActiveItem())

  // Update open item when pathname changes
  useEffect(() => {
    const activeItem = getActiveItem()
    if (activeItem) {
      setOpenItem(activeItem)
    }
  }, [pathname])

  return (
    <SidebarGroup>
      <Button variant="outline" className="mb-2 p-0" onClick={() => window.location.href = "/"}>Ny samtale</Button>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          item.items?.length ? (
            <Collapsible 
              key={item.title} 
              asChild 
              open={openItem === item.title}
              onOpenChange={(isOpen) => {
                setOpenItem(isOpen ? item.title : null)
              }}
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title} className="cursor-pointer">
                    <item.icon />
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild>
                          <a href={subItem.url}>
                            <span>{subItem.title}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title} isActive={pathname === item.url}>
                <a href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
