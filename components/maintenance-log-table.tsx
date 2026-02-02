"use client"

import { useEffect, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  MoreVertical,
  Trash2,
  Edit,
  Sparkles,
  Search,
  Calendar,
  DollarSign,
  Clock,
  Filter,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { MaintenanceLog, MaintenanceLogDialog } from "./maintenance-log-dialog"
import { AiReminderDialog } from "./ai-reminder-dialog"
import { toast } from "sonner"

export function MaintenanceLogTable() {
  const [logs, setLogs] = useState<MaintenanceLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [editingLog, setEditingLog] = useState<MaintenanceLog | undefined>()
  const [reminderDialog, setReminderDialog] = useState<{
    open: boolean
    log?: MaintenanceLog
  }>({ open: false })

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.warn("User not authenticated")
        setLogs([])
        return
      }

      const { data, error } = await supabase
        .from("maintenance_log")
        .select("*")
        .order("date", { ascending: false })

      if (error) {
        console.error("Supabase error:", error)
        // Check if table doesn't exist
        if (error.code === '42P01') {
          toast.error("Tabellen 'maintenance_log' finnes ikke. Kjør database-migreringen først.")
        } else {
          toast.error("Kunne ikke laste vedlikeholdsloggen: " + error.message)
        }
        return
      }
      
      setLogs(data || [])
    } catch (error) {
      console.error("Error fetching logs:", error)
      toast.error("En uventet feil oppstod")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm("Er du sikker på at du vil slette denne oppføringen?")) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.from("maintenance_log").delete().eq("id", id)

      if (error) throw error

      toast.success("Oppføring slettet")
      fetchLogs()
    } catch (error) {
      console.error("Error deleting log:", error)
      toast.error("Kunne ikke slette oppføringen")
    }
  }

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.parts_used?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = categoryFilter === "all" || log.category === categoryFilter
    const matchesType = typeFilter === "all" || log.type === typeFilter

    return matchesSearch && matchesCategory && matchesType
  })

  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      motor: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
      skrog: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
      elektrisitet: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
      rigg: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
      navigasjon: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100",
      sikkerhet: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
      interiør: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100",
      annet: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
    }
    return colors[category] || colors.annet
  }

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      service: "Service",
      reparasjon: "Reparasjon",
      skade: "Skade",
      oppgradering: "Oppgradering",
      inspeksjon: "Inspeksjon",
      rengjøring: "Rengjøring",
    }
    return labels[type] || type
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Fullført</Badge>
      case "in-progress":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Pågående</Badge>
      case "pending":
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">Planlagt</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const totalCost = filteredLogs.reduce((sum, log) => sum + (log.cost || 0), 0)
  const totalHours = filteredLogs.reduce((sum, log) => sum + (log.hours_spent || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 md:gap-4 md:grid-cols-4">
        <div className="rounded-lg border p-3 md:p-4">
          <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="truncate">Totalt antall</span>
          </div>
          <div className="mt-1 md:mt-2 text-xl md:text-2xl font-bold">{filteredLogs.length}</div>
        </div>
        <div className="rounded-lg border p-3 md:p-4">
          <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground">
            <DollarSign className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="truncate">Total kostnad</span>
          </div>
          <div className="mt-1 md:mt-2 text-xl md:text-2xl font-bold">{totalCost.toLocaleString('nb-NO')} kr</div>
        </div>
        <div className="rounded-lg border p-3 md:p-4">
          <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="truncate">Totale timer</span>
          </div>
          <div className="mt-1 md:mt-2 text-xl md:text-2xl font-bold">{totalHours.toFixed(1)} t</div>
        </div>
        <div className="rounded-lg border p-3 md:p-4">
          <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground">
            <Filter className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="truncate">Filtrert visning</span>
          </div>
          <div className="mt-1 md:mt-2 text-xl md:text-2xl font-bold">{filteredLogs.length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Søk i vedlikeholdsloggen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle kategorier</SelectItem>
            <SelectItem value="motor">Motor</SelectItem>
            <SelectItem value="skrog">Skrog</SelectItem>
            <SelectItem value="elektrisitet">Elektrisitet</SelectItem>
            <SelectItem value="rigg">Rigg & Seil</SelectItem>
            <SelectItem value="navigasjon">Navigasjon</SelectItem>
            <SelectItem value="sikkerhet">Sikkerhet</SelectItem>
            <SelectItem value="interiør">Interiør</SelectItem>
            <SelectItem value="annet">Annet</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle typer</SelectItem>
            <SelectItem value="service">Service</SelectItem>
            <SelectItem value="reparasjon">Reparasjon</SelectItem>
            <SelectItem value="skade">Skade</SelectItem>
            <SelectItem value="oppgradering">Oppgradering</SelectItem>
            <SelectItem value="inspeksjon">Inspeksjon</SelectItem>
            <SelectItem value="rengjøring">Rengjøring</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dato</TableHead>
              <TableHead>Tittel</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Kostnad</TableHead>
              <TableHead className="text-right">Timer</TableHead>
              <TableHead className="text-right">Handlinger</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {logs.length === 0
                    ? "Ingen oppføringer ennå. Legg til din første vedlikeholdsoppføring!"
                    : "Ingen oppføringer matcher filteret."}
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">
                    {new Date(log.date).toLocaleDateString("nb-NO", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{log.title}</div>
                      {log.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {log.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getCategoryBadgeColor(log.category)}>
                      {log.category.charAt(0).toUpperCase() + log.category.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getTypeBadge(log.type)}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(log.status)}</TableCell>
                  <TableCell className="text-right">
                    {log.cost ? `${log.cost.toLocaleString('nb-NO')} kr` : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {log.hours_spent ? `${log.hours_spent}t` : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            setReminderDialog({
                              open: true,
                              log,
                            })
                          }
                        >
                          <Sparkles className="mr-2 h-4 w-4 text-purple-500" />
                          Opprett påminnelse med AI
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setEditingLog(log)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Rediger
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(log.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Slett
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      {editingLog && (
        <MaintenanceLogDialog
          editData={editingLog}
          onSuccess={() => {
            setEditingLog(undefined)
            fetchLogs()
          }}
        />
      )}

      {/* AI Reminder Dialog */}
      {reminderDialog.log && (
        <AiReminderDialog
          maintenanceLogId={reminderDialog.log.id}
          maintenanceTitle={reminderDialog.log.title}
          maintenanceCategory={reminderDialog.log.category}
          maintenanceType={reminderDialog.log.type}
          open={reminderDialog.open}
          onOpenChange={(open) => setReminderDialog({ open, log: open ? reminderDialog.log : undefined })}
        />
      )}
    </div>
  )
}
