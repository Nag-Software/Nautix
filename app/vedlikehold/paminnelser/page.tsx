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
import { Toaster, toast } from "sonner"

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
  const [creating, setCreating] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [newReminderData, setNewReminderData] = useState({
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

  const activeReminders = reminders.filter(r => !r.completed && !r.archived)
  const completedReminders = reminders.filter(r => r.completed)
  const archivedReminders = reminders.filter(r => r.archived)
  const displayedReminders = showArchived ? archivedReminders : activeReminders
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

        <main className="flex flex-1 flex-col w-full mx-auto max-w-6xl gap-6 p-4 md:p-6 lg:p-8">
          <div className="w-full space-y-6">
            <div className="flex flex-col items-left justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Vedlikeholdspåminnelser</h1>
                <p className="text-muted-foreground">
                  Hold oversikt over kommende vedlikehold og viktige oppgaver
                </p>
              </div>
              <div className="flex gap-4 w-full">
                <Button 
                  variant={showArchived ? "default" : "outline"}
                  onClick={() => setShowArchived(!showArchived)} 
                  className="shrink-0"
                >
                  <Archive className="mr-2 h-4 w-4" />
                  {showArchived ? "Vis aktive" : "Vis arkiv"}
                </Button>
                <Button onClick={() => setNewReminderOpen(true)} className="shrink-0">
                  <Plus className="mr-2 h-4 w-4" />
                  Ny påminnelse
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 md:gap-4 md:grid-cols-4">
              <div className="rounded-lg border p-3 md:p-4">
                <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground">
                  <Bell className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span className="truncate">Aktive</span>
                </div>
                <div className="mt-1 md:mt-2 text-xl md:text-2xl font-bold">{activeReminders.length}</div>
              </div>
              <div className="rounded-lg border p-3 md:p-4">
                <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground">
                  <AlertTriangle className="h-3.5 w-3.5 md:h-4 md:w-4 text-red-500" />
                  <span className="truncate">Høy prio</span>
                </div>
                <div className="mt-1 md:mt-2 text-xl md:text-2xl font-bold text-red-600">{highPriorityCount}</div>
              </div>
              <div className="rounded-lg border p-3 md:p-4">
                <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground">
                  <Archive className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-600" />
                  <span className="truncate">Arkiv</span>
                </div>
                <div className="mt-1 md:mt-2 text-xl md:text-2xl font-bold text-gray-600">{archivedReminders.length}</div>
              </div>
              <div className="rounded-lg border p-3 md:p-4">
                <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span className="truncate">Totalt</span>
                </div>
                <div className="mt-1 md:mt-2 text-xl md:text-2xl font-bold">{reminders.length}</div>
              </div>
            </div>

            {/* Reminders List/Table */}
            {displayedReminders.length > 0 ? (
              <>
                {/* Mobile List */}
                <div className="md:hidden space-y-2">
                  {displayedReminders.map((reminder) => {
                    const Icon = categoryIcons[reminder.category] || Anchor
                    return (
                      <div
                        key={reminder.id}
                        onClick={() => setSelectedReminder(reminder)}
                        className="rounded-lg border bg-card p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="rounded-full bg-primary/10 p-2 shrink-0">
                              <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className={`font-medium text-sm ${
                                reminder.completed ? 'line-through text-muted-foreground' : ''
                              }`}>
                                {reminder.title}
                              </span>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
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
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {new Date(reminder.due_date).toLocaleDateString('nb-NO', {
                              day: '2-digit',
                              month: 'short'
                            })}
                          </span>
                          <span className={`font-medium ${
                            getDaysUntilNumber(reminder.due_date) < 0 
                              ? 'text-red-600' 
                              : getDaysUntilNumber(reminder.due_date) <= 7 
                                ? 'text-orange-600' 
                                : ''
                          }`}>
                            · {getDaysUntil(reminder.due_date)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block rounded-lg border bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-b">
                        <TableHead className="h-12 px-4 font-medium">Påminnelse</TableHead>
                        <TableHead className="h-12 px-4 font-medium">Kategori</TableHead>
                        <TableHead className="h-12 px-4 font-medium">Status</TableHead>
                        <TableHead className="h-12 px-4 font-medium">Prioritet</TableHead>
                        <TableHead className="h-12 px-4 font-medium">Forfallsdato</TableHead>
                        <TableHead className="h-12 px-4 font-medium">Beskrivelse</TableHead>
                        <TableHead className="h-12 px-4 font-medium text-right">Handlinger</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedReminders.map((reminder) => {
                        const Icon = categoryIcons[reminder.category] || Anchor
                        const busy = isReminderBusy(reminder.id)
                        const completePending = isActionPending(reminder.id, "complete")
                        const uncompletePending = isActionPending(reminder.id, "uncomplete")
                        const deletePending = isActionPending(reminder.id, "delete")
                    
                        return (
                          <TableRow key={reminder.id} className="hover:bg-muted/50">
                            <TableCell className="h-16 px-4">
                              <div className="flex items-center gap-3">
                                <div className="rounded-full bg-primary/10 p-2">
                                  <Icon className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex flex-col">
                                  <span className={`font-medium ${reminder.completed ? 'line-through text-muted-foreground' : ''}`}>
                                    {reminder.title}
                                  </span>
                                  {reminder.ai_suggested && (
                                    <Badge variant="outline" className="gap-1 w-fit mt-1">
                                      <Sparkles className="h-3 w-3 text-purple-500" />
                                      AI
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="h-16 px-4 text-sm text-muted-foreground capitalize">
                              {reminder.category}
                            </TableCell>
                            <TableCell className="h-16 px-4">
                              {getStatusBadge(reminder)}
                            </TableCell>
                            <TableCell className="h-16 px-4">
                              {getPriorityBadge(reminder.priority)}
                            </TableCell>
                            <TableCell className="h-16 px-4 text-sm">
                              <div className="flex flex-col gap-1">
                                <span className="text-muted-foreground">
                                  {new Date(reminder.due_date).toLocaleDateString('nb-NO', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                                <span className={`text-xs font-medium ${
                                  getDaysUntilNumber(reminder.due_date) < 0 
                                    ? 'text-red-600' 
                                    : getDaysUntilNumber(reminder.due_date) <= 7 
                                      ? 'text-orange-600' 
                                      : 'text-muted-foreground'
                                }`}>
                                  {getDaysUntil(reminder.due_date)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="h-16 px-4 max-w-[300px] text-sm text-muted-foreground">
                              {reminder.description ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="block cursor-help truncate">
                                        {reminder.description}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-md">
                                      {reminder.description}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                <span className="text-muted-foreground/50">-</span>
                              )}
                            </TableCell>
                            <TableCell className="h-16 px-4">
                          <TooltipProvider>
                            <div className="flex items-center gap-1">
                              {!reminder.completed ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => toggleReminder(reminder.id, reminder.completed)}
                                      disabled={busy}
                                    >
                                      {completePending ? (
                                        <Loader2 className="size-4 animate-spin" />
                                      ) : (
                                        <CheckCircle2 className="size-4" />
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
                                      className="h-8 w-8"
                                      onClick={() => toggleReminder(reminder.id, reminder.completed)}
                                      disabled={busy}
                                    >
                                      {uncompletePending ? (
                                        <Loader2 className="size-4 animate-spin" />
                                      ) : (
                                        <RotateCcw className="size-4" />
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
                                    className="h-8 w-8 text-destructive hover:bg-destructive hover:text-white"
                                    onClick={() => deleteReminder(reminder.id)}
                                    disabled={busy}
                                  >
                                    {deletePending ? (
                                      <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="size-4" />
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
              </>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              {showArchived ? (
                <>
                  <Archive className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <h3 className="text-lg font-semibold mb-2">Arkivet er tomt</h3>
                  <p className="text-muted-foreground">
                    Fullf\u00f8rte p\u00e5minnelser vil vises her.
                  </p>
                </>
              ) : (
                <>
                  <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <h3 className="text-lg font-semibold mb-2">Ingen aktive p\u00e5minnelser</h3>
                  <p className="text-muted-foreground">
                    Du har ingen aktive p\u00e5minnelser enn\u00e5. AI-assistenten vil automatisk opprette p\u00e5minnelser n\u00e5r du logger vedlikehold.
                  </p>
                </>
              )}
            </div>
          )}
          </div>
        </main>
      </SidebarInset>

      {/* Reminder Details Dialog */}
      <Dialog open={!!selectedReminder} onOpenChange={(open) => !open && setSelectedReminder(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedReminder && (() => {
            const Icon = categoryIcons[selectedReminder.category] || Anchor
            const busy = isReminderBusy(selectedReminder.id)
            const completePending = isActionPending(selectedReminder.id, "complete")
            const uncompletePending = isActionPending(selectedReminder.id, "uncomplete")
            const deletePending = isActionPending(selectedReminder.id, "delete")
            
            return (
              <>
                <DialogHeader>
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-3">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <DialogTitle className={`text-left ${selectedReminder.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {selectedReminder.title}
                      </DialogTitle>
                      <DialogDescription className="mt-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusBadge(selectedReminder)}
                          {getPriorityBadge(selectedReminder.priority)}
                          {selectedReminder.ai_suggested && (
                            <Badge variant="outline" className="gap-1">
                              <Sparkles className="h-3 w-3 text-purple-500" />
                              AI-generert
                            </Badge>
                          )}
                        </div>
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Kategori</h4>
                    <p className="text-sm text-muted-foreground capitalize">{selectedReminder.category}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Forfallsdato</h4>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(selectedReminder.due_date).toLocaleDateString('nb-NO', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                      <span className={`text-sm font-medium ${
                        getDaysUntilNumber(selectedReminder.due_date) < 0 
                          ? 'text-red-600' 
                          : getDaysUntilNumber(selectedReminder.due_date) <= 7 
                            ? 'text-orange-600' 
                            : 'text-muted-foreground'
                      }`}>
                        ({getDaysUntil(selectedReminder.due_date)})
                      </span>
                    </div>
                  </div>

                  {selectedReminder.description && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Beskrivelse</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedReminder.description}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-4 border-t">
                    {!selectedReminder.completed ? (
                      <Button
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
                        Marker som fullført
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
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
                      onClick={() => {
                        deleteReminder(selectedReminder.id)
                        setSelectedReminder(null)
                      }}
                      disabled={busy}
                    >
                      {deletePending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Slett
                    </Button>
                  </div>
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* New Reminder Dialog */}
      <Dialog open={newReminderOpen} onOpenChange={setNewReminderOpen}>
        <DialogContent className="sm:max-w-sm">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Kategori *</Label>
                <Select
                  value={newReminderData.category}
                  onValueChange={(value) => setNewReminderData({ ...newReminderData, category: value })}
                >
                  <SelectTrigger>
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
                  <SelectTrigger>
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

      <Toaster richColors position="top-right" />
    </SidebarProvider>
  )
}
