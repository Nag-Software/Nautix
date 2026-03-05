"use client"

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { 
  Bell, 
  AlertTriangle,
  Calendar,
  Anchor,
  Droplets,
  Snowflake,
  Wrench,
  CheckCircle2,
  Clock,
  Waves,
  Sparkles,
  Loader2,
  Trash2,
  RotateCcw,
  Plus,
  Archive,
} from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface Reminder {
  id: string
  title: string
  description: string
  due_date: string
  priority: "high" | "medium" | "low"
  category: string
  completed: boolean
  archived: boolean
  ai_suggested: boolean
  maintenance_log_id?: string
}

const categoryIcons: Record<string, any> = {
  motor: Wrench,
  skrog: Waves,
  elektrisitet: Droplets,
  sikkerhet: AlertTriangle,
  sesong: Snowflake,
  annet: Anchor,
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingAction, setPendingAction] = useState<{ id: string; type: string } | null>(null)
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null)
  const [newReminderOpen, setNewReminderOpen] = useState(false)
  const [editReminderOpen, setEditReminderOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [filterView, setFilterView] = useState<'active' | 'overdue' | 'completed' | 'all'>('active')
  const [newReminderData, setNewReminderData] = useState({
    title: "",
    description: "",
    due_date: "",
    priority: "medium" as "high" | "medium" | "low",
    category: "annet",
  })
  const [editReminderData, setEditReminderData] = useState({
    id: "",
    title: "",
    description: "",
    due_date: "",
    priority: "medium" as "high" | "medium" | "low",
    category: "annet",
  })

  const fetchReminders = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.warn("User not authenticated")
        setReminders([])
        return
      }

      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .order("due_date", { ascending: true })

      if (error) {
        console.error("Supabase error:", error)
        if (error.code === '42P01') {
          toast.error("Tabellen 'reminders' finnes ikke. Kjør database-migreringen først.")
        } else {
          toast.error("Kunne ikke laste påminnelser: " + error.message)
        }
        return
      }
      
      setReminders(data || [])
    } catch (error) {
      console.error("Error fetching reminders:", error)
      toast.error("En uventet feil oppstod")
    } finally {
      setLoading(false)
    }
  }

  const createReminder = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Du må være logget inn")
        return
      }

      // Get or create boat
      let { data: boats } = await supabase
        .from("boats")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)

      let boatId: string

      if (!boats || boats.length === 0) {
        const { data: newBoat, error: boatError } = await supabase
          .from("boats")
          .insert([{ user_id: user.id }])
          .select("id")
          .single()

        if (boatError) throw boatError
        boatId = newBoat.id
      } else {
        boatId = boats[0].id
      }

      const { error } = await supabase.from("reminders").insert([{
        boat_id: boatId,
        user_id: user.id,
        title: newReminderData.title,
        description: newReminderData.description,
        due_date: newReminderData.due_date,
        priority: newReminderData.priority,
        category: newReminderData.category,
        completed: false,
        ai_suggested: false,
      }])

      if (error) throw error

      toast.success("Påminnelse opprettet")
      setNewReminderOpen(false)
      setNewReminderData({
        title: "",
        description: "",
        due_date: "",
        priority: "medium",
        category: "annet",
      })
      fetchReminders()
    } catch (error) {
      console.error("Error creating reminder:", error)
      toast.error("Kunne ikke opprette påminnelse")
    } finally {
      setCreating(false)
    }
  }

  useEffect(() => {
    fetchReminders()
  }, [])

  const toggleReminder = async (id: string, currentStatus: boolean) => {
    setPendingAction({ id, type: currentStatus ? "uncomplete" : "complete" })
    
    try {
      const supabase = createClient()
      
      // Build update object conditionally
      const updateData: any = {
        completed: !currentStatus,
        completed_at: !currentStatus ? new Date().toISOString() : null
      }
      
      // Only add archived when completing, not when uncompleting
      if (!currentStatus) {
        updateData.archived = true
      } else {
        updateData.archived = false
      }
      
      const { error } = await supabase
        .from("reminders")
        .update(updateData)
        .eq("id", id)

      if (error) throw error

      setReminders(reminders.map(reminder => 
        reminder.id === id 
          ? { ...reminder, completed: !currentStatus, archived: !currentStatus }
          : reminder
      ))
      
      toast.success(!currentStatus ? "Påminnelse fullført og arkivert" : "Påminnelse gjenåpnet")
    } catch (error) {
      console.error("Error toggling reminder:", error)
      toast.error("Kunne ikke oppdatere påminnelse")
    } finally {
      setPendingAction(null)
    }
  }

  const deleteReminder = async (id: string) => {
    setPendingAction({ id, type: "delete" })
    
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("reminders")
        .delete()
        .eq("id", id)

      if (error) throw error

      setReminders(reminders.filter(reminder => reminder.id !== id))
      toast.success("Påminnelse slettet")
    } catch (error) {
      console.error("Error deleting reminder:", error)
      toast.error("Kunne ikke slette påminnelse")
    } finally {
      setPendingAction(null)
    }
  }

  const openEditDialog = (reminder: Reminder) => {
    setEditReminderData({
      id: reminder.id,
      title: reminder.title,
      description: reminder.description,
      due_date: reminder.due_date,
      priority: reminder.priority,
      category: reminder.category,
    })
    setEditReminderOpen(true)
  }

  const updateReminder = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)

    try {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Du må være logget inn")
        return
      }

      const { error } = await supabase
        .from("reminders")
        .update({
          title: editReminderData.title,
          description: editReminderData.description,
          due_date: editReminderData.due_date,
          priority: editReminderData.priority,
          category: editReminderData.category,
        })
        .eq("id", editReminderData.id)

      if (error) throw error

      toast.success("Påminnelse oppdatert")
      setEditReminderOpen(false)
      setSelectedReminder(null)
      setEditReminderData({
        id: "",
        title: "",
        description: "",
        due_date: "",
        priority: "medium",
        category: "annet",
      })
      fetchReminders()
    } catch (error) {
      console.error("Error updating reminder:", error)
      toast.error("Kunne ikke oppdatere påminnelse")
    } finally {
      setUpdating(false)
    }
  }

  const getDaysUntilNumber = (dateString: string) => {
    const today = new Date()
    const dueDate = new Date(dateString)
    const diffTime = dueDate.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getDaysUntil = (dateString: string) => {
    const diffDays = getDaysUntilNumber(dateString)
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'dag' : 'dager'} siden`
    } else if (diffDays === 0) {
      return "I dag"
    } else if (diffDays === 1) {
      return "I morgen"
    } else {
      return `Om ${diffDays} ${diffDays === 1 ? 'dag' : 'dager'}`
    }
  }

  const activeReminders = reminders.filter(r => !r.completed && !r.archived)
  const overdueReminders = activeReminders.filter(r => getDaysUntilNumber(r.due_date) < 0)
  const completedReminders = reminders.filter(r => r.completed || r.archived)
  
  const displayedReminders = (() => {
    switch (filterView) {
      case 'active':
        return activeReminders
      case 'overdue':
        return overdueReminders
      case 'completed':
        return completedReminders
      case 'all':
        return reminders
      default:
        return activeReminders
    }
  })()
  
  const highPriorityCount = activeReminders.filter(r => r.priority === "high").length

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-red-500 bg-red-50 dark:bg-red-950/20"
      case "medium":
        return "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
      case "low":
        return "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
      default:
        return ""
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return (
          <Badge
            variant="outline"
            className="bg-red-500/15 text-red-700 hover:bg-red-500/25 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 border-0"
          >
            Høy
          </Badge>
        )
      case "medium":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/25 dark:bg-yellow-500/10 dark:text-yellow-400 dark:hover:bg-yellow-500/20 border-0"
          >
            Middels
          </Badge>
        )
      case "low":
        return (
          <Badge
            variant="outline"
            className="bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 border-0"
          >
            Lav
          </Badge>
        )
      default:
        return null
    }
  }

  const getStatusBadge = (reminder: Reminder) => {
    if (reminder.completed) {
      return (
        <Badge
          variant="outline"
          className="bg-green-500/15 text-green-700 hover:bg-green-500/25 dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20 border-0"
        >
          Fullført
        </Badge>
      )
    }
    
    const daysUntil = getDaysUntilNumber(reminder.due_date)
    
    if (daysUntil < 0) {
      return (
        <Badge
          variant="outline"
          className="bg-red-500/15 text-red-700 hover:bg-red-500/25 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 border-0"
        >
          Forfalt
        </Badge>
      )
    } else if (daysUntil <= 7) {
      return (
        <Badge
          variant="outline"
          className="bg-orange-500/15 text-orange-700 hover:bg-orange-500/25 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20 border-0"
        >
          Snart
        </Badge>
      )
    } else {
      return (
        <Badge
          variant="outline"
          className="bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 border-0"
        >
          Aktiv
        </Badge>
      )
    }
  }

  const isActionPending = (id: string, type: string) => 
    pendingAction?.id === id && pendingAction.type === type

  const isReminderBusy = (id: string) => pendingAction?.id === id

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
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
                    Vedlikehold
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Påminnelser</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <main className="flex flex-1 flex-col w-full min-w-0 mx-auto max-w-[1200px] gap-4 md:gap-6 p-4 md:p-6 lg:p-8 overflow-x-hidden">
          <div className="w-full space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dine Påminnelser</h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  Hold oversikt over kommende vedlikehold og viktige oppgaver
                </p>
              </div>
              <Button onClick={() => setNewReminderOpen(true)} size="lg" className="w-full lg:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Ny påminnelse
              </Button>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={filterView === 'active' ? 'default' : 'outline'}
                onClick={() => setFilterView('active')}
                size="sm"
              >
                <Bell className="mr-2 h-4 w-4" />
                Aktive
                {activeReminders.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-white/20 hover:bg-white/30">
                    {activeReminders.length}
                  </Badge>
                )}
              </Button>
              <Button 
                variant={filterView === 'overdue' ? 'default' : 'outline'}
                onClick={() => setFilterView('overdue')}
                size="sm"
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Forfalt
                {overdueReminders.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-white/20 hover:bg-white/30">
                    {overdueReminders.length}
                  </Badge>
                )}
              </Button>
              <Button 
                variant={filterView === 'completed' ? 'default' : 'outline'}
                onClick={() => setFilterView('completed')}
                size="sm"
              >
                <Archive className="mr-2 h-4 w-4" />
                Fullført
                {completedReminders.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-white/20 hover:bg-white/30">
                    {completedReminders.length}
                  </Badge>
                )}
              </Button>
              <Button 
                variant={filterView === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterView('all')}
                size="sm"
              >
                Alle
                <Badge variant="secondary" className="ml-2 bg-white/20 hover:bg-white/30">
                  {reminders.length}
                </Badge>
              </Button>
            </div>

            {/* Reminders List/Table */}
            {displayedReminders.length > 0 ? (
              <>
                {/* Mobile List */}
                <div className="md:hidden space-y-3">
                  {displayedReminders.map((reminder) => {
                    const Icon = categoryIcons[reminder.category] || Anchor
                    const daysUntil = getDaysUntilNumber(reminder.due_date)
                    const isOverdue = daysUntil < 0
                    const isSoon = daysUntil >= 0 && daysUntil <= 7
                    
                    return (
                      <div
                        key={reminder.id}
                        onClick={() => setSelectedReminder(reminder)}
                        className="rounded-xl border bg-card p-4 hover:shadow-md active:scale-[0.98] cursor-pointer transition-all"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`rounded-full p-2.5 ${
                            reminder.completed 
                              ? 'bg-green-500/10' 
                              : isOverdue 
                                ? 'bg-red-500/10' 
                                : isSoon 
                                  ? 'bg-orange-500/10' 
                                  : 'bg-primary/10'
                          }`}>
                            <Icon className={`h-4 w-4 ${
                              reminder.completed 
                                ? 'text-green-500' 
                                : isOverdue 
                                  ? 'text-red-500' 
                                  : isSoon 
                                    ? 'text-orange-500' 
                                    : 'text-primary'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-semibold text-base mb-1 ${
                              reminder.completed ? 'line-through text-muted-foreground' : ''
                            }`}>
                              {reminder.title}
                            </h3>
                            {reminder.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {reminder.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 flex-wrap">
                              {getStatusBadge(reminder)}
                              {getPriorityBadge(reminder.priority)}
                              {reminder.ai_suggested && (
                                <Badge variant="outline" className="gap-1">
                                  <Sparkles className="h-3 w-3 text-purple-500" />
                                  AI
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span className="font-medium">
                              {new Date(reminder.due_date).toLocaleDateString('nb-NO', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                          {!reminder.completed && (
                            <span className={`text-sm font-semibold ${
                              isOverdue 
                                ? 'text-red-600' 
                                : isSoon 
                                  ? 'text-orange-600' 
                                  : 'text-muted-foreground'
                            }`}>
                              {getDaysUntil(reminder.due_date)}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block rounded-xl border bg-card overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-b bg-muted/50">
                          <TableHead className="h-14 px-6 font-semibold">Påminnelse</TableHead>
                          <TableHead className="h-14 px-6 font-semibold">Kategori</TableHead>
                          <TableHead className="h-14 px-6 font-semibold">Prioritet</TableHead>
                          <TableHead className="h-14 px-6 font-semibold">Forfallsdato</TableHead>
                          <TableHead className="h-14 px-6 font-semibold">Status</TableHead>
                          <TableHead className="h-14 px-6 font-semibold text-right">Handlinger</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayedReminders.map((reminder) => {
                          const Icon = categoryIcons[reminder.category] || Anchor
                          const busy = isReminderBusy(reminder.id)
                          const completePending = isActionPending(reminder.id, "complete")
                          const uncompletePending = isActionPending(reminder.id, "uncomplete")
                          const deletePending = isActionPending(reminder.id, "delete")
                          const daysUntil = getDaysUntilNumber(reminder.due_date)
                          const isOverdue = daysUntil < 0
                          const isSoon = daysUntil >= 0 && daysUntil <= 7
                      
                          return (
                            <TableRow 
                              key={reminder.id} 
                              className="hover:bg-muted/50 cursor-pointer border-b last:border-0 group"
                              onClick={() => setSelectedReminder(reminder)}
                            >
                              <TableCell className="h-20 px-6 max-w-lg">
                                <div className="flex items-center gap-4">
                                  <div className={`rounded-lg p-2.5 ${
                                    reminder.completed 
                                      ? 'bg-green-500/10' 
                                      : isOverdue 
                                        ? 'bg-red-500/10' 
                                        : isSoon 
                                          ? 'bg-orange-500/10' 
                                          : 'bg-primary/10'
                                  }`}>
                                    <Icon className={`h-5 w-5 ${
                                      reminder.completed 
                                        ? 'text-green-500' 
                                        : isOverdue 
                                          ? 'text-red-500' 
                                          : isSoon 
                                            ? 'text-orange-500' 
                                            : 'text-primary'
                                    }`} />
                                  </div>
                                  <div className="flex flex-col gap-1 min-w-0">
                                    <span className={`font-semibold ${reminder.completed ? 'line-through text-muted-foreground' : ''}`}>
                                      {reminder.title}
                                    </span>
                                    {reminder.description && (
                                      <span className="text-sm text-muted-foreground line-clamp-1">
                                        {reminder.description}
                                      </span>
                                    )}
                                    {reminder.ai_suggested && (
                                      <Badge variant="outline" className="gap-1 w-fit">
                                        <Sparkles className="h-3 w-3 text-purple-500" />
                                        AI-generert
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="h-20 px-6">
                                <span className="text-sm font-medium text-muted-foreground capitalize">
                                  {reminder.category}
                                </span>
                              </TableCell>
                              <TableCell className="h-20 px-6">
                                {getPriorityBadge(reminder.priority)}
                              </TableCell>
                              <TableCell className="h-20 px-6">
                                <div className="flex flex-col gap-1.5">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">
                                      {new Date(reminder.due_date).toLocaleDateString('nb-NO', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                  {!reminder.completed && (
                                    <span className={`text-xs font-semibold ${
                                      isOverdue 
                                        ? 'text-red-600' 
                                        : isSoon 
                                          ? 'text-orange-600' 
                                          : 'text-muted-foreground'
                                    }`}>
                                      {getDaysUntil(reminder.due_date)}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="h-20 px-6">
                                {getStatusBadge(reminder)}
                              </TableCell>
                              <TableCell className="h-20 px-6" onClick={(e) => e.stopPropagation()}>
                                <TooltipProvider>
                                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {!reminder.completed ? (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-9 w-9 hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/50"
                                            onClick={() => toggleReminder(reminder.id, reminder.completed)}
                                            disabled={busy}
                                          >
                                            {completePending ? (
                                              <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                              <CheckCircle2 className="h-4 w-4" />
                                            )}
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Marker som fullført</TooltipContent>
                                      </Tooltip>
                                    ) : (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-9 w-9 hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/50"
                                            onClick={() => toggleReminder(reminder.id, reminder.completed)}
                                            disabled={busy}
                                          >
                                            {uncompletePending ? (
                                              <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                              <RotateCcw className="h-4 w-4" />
                                            )}
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Gjenåpne</TooltipContent>
                                      </Tooltip>
                                    )}
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                                          onClick={() => deleteReminder(reminder.id)}
                                          disabled={busy}
                                        >
                                          {deletePending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <Trash2 className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Slett</TooltipContent>
                                    </Tooltip>
                                  </div>
                                </TooltipProvider>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed p-12 text-center bg-muted/20">
                {filterView === 'completed' ? (
                  <>
                    <Archive className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Ingen fullførte påminnelser</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Påminnelser du fullfører vil vises her.
                    </p>
                  </>
                ) : filterView === 'overdue' ? (
                  <>
                    <CheckCircle2 className="mx-auto h-16 w-16 text-green-500/50 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Ingen forfalte påminnelser</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Flott! Du har ingen forfalte påminnelser.
                    </p>
                  </>
                ) : filterView === 'all' ? (
                  <>
                    <Bell className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Ingen påminnelser ennå</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-4">
                      Kom i gang ved å opprette din første påminnelse, eller la AI-assistenten automatisk opprette påminnelser når du logger vedlikehold.
                    </p>
                    <Button onClick={() => setNewReminderOpen(true)} size="lg">
                      <Plus className="mr-2 h-4 w-4" />
                      Opprett første påminnelse
                    </Button>
                  </>
                ) : (
                  <>
                    <Bell className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Ingen aktive påminnelser</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Du har ingen aktive påminnelser. AI-assistenten vil automatisk opprette påminnelser når du logger vedlikehold.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </main>
      </SidebarInset>

      {/* Reminder Details Sheet */}
      <Sheet open={!!selectedReminder} onOpenChange={(open) => !open && setSelectedReminder(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedReminder && (() => {
            const Icon = categoryIcons[selectedReminder.category] || Anchor
            const busy = isReminderBusy(selectedReminder.id)
            const completePending = isActionPending(selectedReminder.id, "complete")
            const uncompletePending = isActionPending(selectedReminder.id, "uncomplete")
            const deletePending = isActionPending(selectedReminder.id, "delete")
            const daysUntil = getDaysUntilNumber(selectedReminder.due_date)
            const isOverdue = daysUntil < 0
            const isSoon = daysUntil >= 0 && daysUntil <= 7
            
            return (
              <>
                <SheetHeader className="pb-6 border-b">
                  <div className="flex items-start gap-4">
                    <div className={`rounded-xl p-3 ${
                      selectedReminder.completed 
                        ? 'bg-green-500/10' 
                        : isOverdue 
                          ? 'bg-red-500/10' 
                          : isSoon 
                            ? 'bg-orange-500/10' 
                            : 'bg-primary/10'
                    }`}>
                      <Icon className={`h-6 w-6 ${
                        selectedReminder.completed 
                          ? 'text-green-500' 
                          : isOverdue 
                            ? 'text-red-500' 
                            : isSoon 
                              ? 'text-orange-500' 
                              : 'text-primary'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <SheetTitle className={`text-xl text-left mb-2 ${selectedReminder.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {selectedReminder.title}
                      </SheetTitle>
                      <SheetDescription className="text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusBadge(selectedReminder)}
                          {getPriorityBadge(selectedReminder.priority)}
                          {selectedReminder.ai_suggested && (
                            <Badge variant="outline" className="gap-1.5">
                              <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                              AI-generert
                            </Badge>
                          )}
                        </div>
                      </SheetDescription>
                    </div>
                  </div>
                </SheetHeader>

                <div className="space-y-6 py-6 mx-3">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold mb-1">Forfallsdato</h4>
                        <p className="text-sm">
                          {new Date(selectedReminder.due_date).toLocaleDateString('nb-NO', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        <p className={`text-sm font-semibold mt-1 ${
                          isOverdue 
                            ? 'text-red-600' 
                            : isSoon 
                              ? 'text-orange-600' 
                              : 'text-muted-foreground'
                        }`}>
                          {getDaysUntil(selectedReminder.due_date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                      <Wrench className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold mb-1">Kategori</h4>
                        <p className="text-sm capitalize">{selectedReminder.category}</p>
                      </div>
                    </div>

                    {selectedReminder.description && (
                      <div className="p-4 rounded-lg bg-muted/50">
                        <h4 className="text-sm font-semibold mb-2">Beskrivelse</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {selectedReminder.description}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        openEditDialog(selectedReminder)
                        setSelectedReminder(null)
                      }}
                      className="w-full"
                    >
                      Rediger påminnelse
                    </Button>
                    <div className="flex items-center gap-3">
                      {!selectedReminder.completed ? (
                        <Button
                          size="lg"
                          onClick={() => {
                            toggleReminder(selectedReminder.id, selectedReminder.completed)
                            setSelectedReminder(null)
                          }}
                          disabled={busy}
                          className="flex-1"
                        >
                          {completePending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                          )}
                          Fullfør
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => {
                            toggleReminder(selectedReminder.id, selectedReminder.completed)
                            setSelectedReminder(null)
                          }}
                          disabled={busy}
                          className="flex-1"
                        >
                          {uncompletePending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <RotateCcw className="mr-2 h-4 w-4" />
                          )}
                          Gjenåpne
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="lg"
                        onClick={() => {
                          deleteReminder(selectedReminder.id)
                          setSelectedReminder(null)
                        }}
                        disabled={busy}
                      >
                        {deletePending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )
          })()}
        </SheetContent>
      </Sheet>

      {/* Edit Reminder Dialog */}
      <Dialog open={editReminderOpen} onOpenChange={setEditReminderOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rediger påminnelse</DialogTitle>
            <DialogDescription>
              Oppdater påminnelsens detaljer
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={updateReminder} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_title">Tittel *</Label>
              <Input
                id="edit_title"
                placeholder="F.eks. Skifte motorolje"
                value={editReminderData.title}
                onChange={(e) => setEditReminderData({ ...editReminderData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_description">Beskrivelse</Label>
              <Textarea
                id="edit_description"
                placeholder="Ytterligere detaljer..."
                value={editReminderData.description}
                onChange={(e) => setEditReminderData({ ...editReminderData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_category">Kategori *</Label>
                <Select
                  value={editReminderData.category}
                  onValueChange={(value) => setEditReminderData({ ...editReminderData, category: value })}
                >
                  <SelectTrigger id="edit_category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="motor">Motor</SelectItem>
                    <SelectItem value="skrog">Skrog</SelectItem>
                    <SelectItem value="elektrisitet">Elektrisitet</SelectItem>
                    <SelectItem value="sikkerhet">Sikkerhet</SelectItem>
                    <SelectItem value="sesong">Sesong</SelectItem>
                    <SelectItem value="annet">Annet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_priority">Prioritet *</Label>
                <Select
                  value={editReminderData.priority}
                  onValueChange={(value) => setEditReminderData({ ...editReminderData, priority: value as "high" | "medium" | "low" })}
                >
                  <SelectTrigger id="edit_priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Høy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Lav</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_due_date">Forfallsdato *</Label>
              <Input
                id="edit_due_date"
                type="date"
                value={editReminderData.due_date}
                onChange={(e) => setEditReminderData({ ...editReminderData, due_date: e.target.value })}
                required
              />
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditReminderOpen(false)}
                className="w-full sm:w-auto"
              >
                Avbryt
              </Button>
              <Button type="submit" disabled={updating} className="w-full sm:w-auto">
                {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Oppdater påminnelse
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* New Reminder Dialog */}
      <Dialog open={newReminderOpen} onOpenChange={setNewReminderOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ny påminnelse</DialogTitle>
            <DialogDescription>
              Opprett en ny vedlikeholdspåminnelse for båten din
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createReminder} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Tittel *</Label>
              <Input
                id="title"
                placeholder="F.eks. Skifte motorolje"
                value={newReminderData.title}
                onChange={(e) => setNewReminderData({ ...newReminderData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beskrivelse</Label>
              <Textarea
                id="description"
                placeholder="Ytterligere detaljer..."
                value={newReminderData.description}
                onChange={(e) => setNewReminderData({ ...newReminderData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Kategori *</Label>
                <Select
                  value={newReminderData.category}
                  onValueChange={(value) => setNewReminderData({ ...newReminderData, category: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="motor">Motor</SelectItem>
                    <SelectItem value="skrog">Skrog</SelectItem>
                    <SelectItem value="elektrisitet">Elektrisitet</SelectItem>
                    <SelectItem value="sikkerhet">Sikkerhet</SelectItem>
                    <SelectItem value="sesong">Sesong</SelectItem>
                    <SelectItem value="annet">Annet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioritet *</Label>
                <Select
                  value={newReminderData.priority}
                  onValueChange={(value) => setNewReminderData({ ...newReminderData, priority: value as "high" | "medium" | "low" })}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Høy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Lav</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Forfallsdato *</Label>
              <Input
                id="due_date"
                type="date"
                value={newReminderData.due_date}
                onChange={(e) => setNewReminderData({ ...newReminderData, due_date: e.target.value })}
                required
              />
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setNewReminderOpen(false)}
                className="w-full sm:w-auto"
              >
                Avbryt
              </Button>
              <Button type="submit" disabled={creating} className="w-full sm:w-auto">
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Opprett påminnelse
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </SidebarProvider>
  )
}
