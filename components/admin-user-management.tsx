'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { getUserDetails } from '@/app/sjefen/user-actions'

interface User {
  id: string
  email: string
  created_at: string
  last_seen_at: string
  boat_count: number
  conversation_count: number
  is_admin: boolean
}

interface UserDetails {
  user: {
    id: string
    email: string
    created_at: string
    last_seen_at: string
  }
  boats: any[]
  conversations: any[]
  documents: any[]
  maintenance_logs: any[]
  reminders: any[]
  equipment: any[]
}

interface Props {
  users: User[]
  onGrantAdmin: (userId: string) => Promise<void>
  onRevokeAdmin: (userId: string) => Promise<void>
  onDeleteUser: (userId: string) => Promise<void>
}

type SortField = 'email' | 'boat_count' | 'conversation_count' | 'created_at' | 'last_seen_at'
type SortDirection = 'asc' | 'desc'

export function UserManagement({ users, onGrantAdmin, onRevokeAdmin, onDeleteUser }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [expandedConversationId, setExpandedConversationId] = useState<string | null>(null)

  const sortUsers = (users: User[]) => {
    return [...users].sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      // Compare values
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      } else {
        return sortDirection === 'asc'
          ? aValue < bValue ? -1 : aValue > bValue ? 1 : 0
          : bValue < aValue ? -1 : bValue > aValue ? 1 : 0
      }
    })
  }

  const filteredUsers = sortUsers(
    users.filter((user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('nb-NO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDateShort = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('nb-NO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleViewDetails = async (user: User) => {
    setSelectedUser(user)
    setIsLoading(true)
    setIsDetailsOpen(true)
    setUserDetails(null)
    setExpandedConversationId(null)
    try {
      const details = await getUserDetails(user.id)
      setUserDetails(details)
    } catch (error) {
      console.error('Failed to load user details:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (selectedUser) {
      setIsLoading(true)
      try {
        await onDeleteUser(selectedUser.id)
        setIsDeleteDialogOpen(false)
        setSelectedUser(null)
      } catch (error) {
        console.error('Failed to delete user:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleGrantAdmin = async (userId: string) => {
    setIsLoading(true)
    try {
      await onGrantAdmin(userId)
    } catch (error) {
      console.error('Failed to grant admin:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRevokeAdmin = async (userId: string) => {
    setIsLoading(true)
    try {
      await onRevokeAdmin(userId)
    } catch (error) {
      console.error('Failed to revoke admin:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Brukeradministrasjon</CardTitle>
        <CardDescription>Administrer brukere og tilganger</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Søk etter bruker..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sorter etter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">E-post</SelectItem>
                <SelectItem value="boat_count">Antall båter</SelectItem>
                <SelectItem value="conversation_count">Antall samtaler</SelectItem>
                <SelectItem value="created_at">Opprettet dato</SelectItem>
                <SelectItem value="last_seen_at">Sist sett</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
            >
              {sortDirection === 'asc' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3 8 4-4 4 4"/><path d="M7 4v16"/><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/>
                </svg>
              )}
            </Button>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-post</TableHead>
                  <TableHead>Båter</TableHead>
                  <TableHead>Samtaler</TableHead>
                  <TableHead>Opprettet</TableHead>
                  <TableHead>Sist sett</TableHead>
                  <TableHead>Rolle</TableHead>
                  <TableHead className="text-right">Handlinger</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Ingen brukere funnet
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.boat_count}</TableCell>
                      <TableCell>{user.conversation_count}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.last_seen_at ? formatDate(user.last_seen_at) : 'Aldri'}
                      </TableCell>
                      <TableCell>
                        {user.is_admin ? (
                          <Badge variant="default">Admin</Badge>
                        ) : (
                          <Badge variant="secondary">Bruker</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(user)}
                          >
                            Detaljer
                          </Button>
                          {user.is_admin ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRevokeAdmin(user.id)}
                              disabled={isLoading}
                            >
                              Fjern Admin
                            </Button>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleGrantAdmin(user.id)}
                              disabled={isLoading}
                            >
                              Gi Admin
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user)
                              setIsDeleteDialogOpen(true)
                            }}
                            disabled={isLoading}
                          >
                            Slett
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>

      {/* User Details Sheet */}
      <Sheet open={isDetailsOpen} onOpenChange={(open) => {
        setIsDetailsOpen(open)
        if (!open) setExpandedConversationId(null)
      }}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Brukerdetaljer</SheetTitle>
            <SheetDescription>Fullstendig oversikt over brukerens data</SheetDescription>
          </SheetHeader>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">Laster brukerdetaljer...</p>
            </div>
          ) : selectedUser && userDetails ? (
            <div className="space-y-6 mt-6 px-5">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Brukerinformasjon</h3>
                <div className="grid gap-4">
                  <div>
                    <Label>Bruker ID</Label>
                    <p className="text-sm font-mono text-muted-foreground">{selectedUser.id}</p>
                  </div>
                  <div>
                    <Label>E-post</Label>
                    <p className="text-sm">{selectedUser.email}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Opprettet</Label>
                      <p className="text-sm">{formatDate(selectedUser.created_at)}</p>
                    </div>
                    <div>
                      <Label>Sist sett</Label>
                      <p className="text-sm">
                        {selectedUser.last_seen_at ? formatDate(selectedUser.last_seen_at) : 'Aldri'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Antall båter</Label>
                      <p className="text-2xl font-bold">{selectedUser.boat_count}</p>
                    </div>
                    <div>
                      <Label>Antall samtaler</Label>
                      <p className="text-2xl font-bold">{selectedUser.conversation_count}</p>
                    </div>
                  </div>
                  <div>
                    <Label>Rolle</Label>
                    <div className="mt-2">
                      {selectedUser.is_admin ? (
                        <Badge variant="default">Admin</Badge>
                      ) : (
                        <Badge variant="secondary">Bruker</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Boats */}
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"></path></svg>
                  Båter ({userDetails.boats?.length || 0})
                </h3>
                {userDetails.boats?.length > 0 ? (
                  <div className="grid gap-3">
                    {userDetails.boats.map((boat: any) => (
                      <div key={boat.id} className="rounded-lg border p-4">
                        <p className="font-medium">{boat.name || 'Uten navn'}</p>
                        <p className="text-sm text-muted-foreground">
                          {boat.manufacturer} {boat.model} {boat.year ? `(${boat.year})` : ''} • {boat.type}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Ingen båter registrert</p>
                )}
              </div>

              <Separator />

              {/* Documents */}
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                  Dokumenter ({userDetails.documents?.length || 0})
                </h3>
                {userDetails.documents?.length > 0 ? (
                  <div className="grid gap-3">
                    {userDetails.documents.map((doc: any) => (
                      <div key={doc.id} className="rounded-lg border p-4">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium">{doc.name}</p>
                          <Badge variant={doc.status === 'valid' ? 'default' : 'destructive'}>
                            {doc.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {doc.type} • {doc.boat_name || 'Ingen båt'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB` : 'Ukjent størrelse'}
                        </p>
                        {doc.expiry_date && (
                          <p className="text-sm text-muted-foreground">
                            Utløper: {formatDateShort(doc.expiry_date)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Ingen dokumenter</p>
                )}
              </div>

              <Separator />

              {/* Maintenance Logs */}
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
                  Vedlikeholdslogger ({userDetails.maintenance_logs?.length || 0})
                </h3>
                {userDetails.maintenance_logs?.length > 0 ? (
                  <div className="grid gap-3">
                    {userDetails.maintenance_logs.map((log: any) => (
                      <div key={log.id} className="rounded-lg border p-4">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium">{log.title}</p>
                          <Badge variant="secondary">{log.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {log.category} • {log.type} • {log.boat_name || 'Ingen båt'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDateShort(log.date)} {log.cost ? `• ${log.cost} kr` : ''}
                        </p>
                        {log.notes && (
                          <p className="text-sm text-muted-foreground mt-2">{log.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Ingen vedlikeholdslogger</p>
                )}
              </div>

              <Separator />

              {/* Equipment */}
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"></rect><line x1="8" x2="16" y1="21" y2="21"></line><line x1="12" x2="12" y1="17" y2="21"></line></svg>
                  Utstyr ({userDetails.equipment?.length || 0})
                </h3>
                {userDetails.equipment?.length > 0 ? (
                  <div className="grid gap-3">
                    {userDetails.equipment.map((eq: any) => (
                      <div key={eq.id} className="rounded-lg border p-4">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium">{eq.name}</p>
                          <Badge variant={eq.status === 'active' ? 'default' : 'destructive'}>
                            {eq.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {eq.category} • {eq.boat_name || 'Ingen båt'}
                        </p>
                        {eq.cost && (
                          <p className="text-sm text-muted-foreground">{eq.cost} kr</p>
                        )}
                        {eq.expiry_date && (
                          <p className="text-sm text-muted-foreground">
                            Utløper: {formatDateShort(eq.expiry_date)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Ingen utstyr registrert</p>
                )}
              </div>

              <Separator />

              {/* Reminders */}
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2v2"></path><path d="M18 2v2"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path></svg>
                  Påminnelser ({userDetails.reminders?.length || 0})
                </h3>
                {userDetails.reminders?.length > 0 ? (
                  <div className="grid gap-3">
                    {userDetails.reminders.map((reminder: any) => (
                      <div key={reminder.id} className="rounded-lg border p-4">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium">{reminder.title}</p>
                          <div className="flex gap-2">
                            <Badge variant={reminder.priority === 'high' ? 'destructive' : 'secondary'}>
                              {reminder.priority}
                            </Badge>
                            {reminder.completed && <Badge variant="default">Fullført</Badge>}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {reminder.category} • {reminder.boat_name || 'Ingen båt'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Forfaller: {formatDateShort(reminder.due_date)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Ingen påminnelser</p>
                )}
              </div>

              <Separator />

              {/* Conversations */}
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                  Samtaler ({userDetails.conversations?.length || 0})
                </h3>
                {userDetails.conversations?.length > 0 ? (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="font-medium">Tittel</TableHead>
                          <TableHead className="font-medium text-center">Meldinger</TableHead>
                          <TableHead className="font-medium">Status</TableHead>
                          <TableHead className="font-medium">Sist oppdatert</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userDetails.conversations.map((conv: any) => (
                          <>
                            <TableRow 
                              key={conv.id} 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => setExpandedConversationId(expandedConversationId === conv.id ? null : conv.id)}
                            >
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className={`transition-transform ${expandedConversationId === conv.id ? 'rotate-90' : ''}`}
                                  >
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                  </svg>
                                  {conv.title}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">{conv.message_count}</TableCell>
                              <TableCell>
                                {conv.archived ? (
                                  <Badge variant="secondary">Arkivert</Badge>
                                ) : (
                                  <Badge variant="default">Aktiv</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDateShort(conv.updated_at)}
                              </TableCell>
                            </TableRow>
                            {expandedConversationId === conv.id && conv.messages && conv.messages.length > 0 && (
                              <TableRow>
                                <TableCell colSpan={4} className="bg-muted/30 p-0">
                                  <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="font-semibold text-sm">Samtalehistorikk</h4>
                                      <Badge variant="outline">{conv.messages.length} meldinger</Badge>
                                    </div>
                                    {conv.messages.map((msg: any, idx: number) => (
                                      <div 
                                        key={msg.id} 
                                        className={`p-3 rounded-lg ${
                                          msg.role === 'user' 
                                            ? 'bg-blue-50 dark:bg-blue-950/50 border-l-4 border-blue-500' 
                                            : 'bg-gray-50 dark:bg-gray-900/50 border-l-4 border-gray-500'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <Badge variant={msg.role === 'user' ? 'default' : 'secondary'} className="text-xs">
                                              {msg.role === 'user' ? 'Bruker' : 'Assistent'}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                              Melding #{idx + 1}
                                            </span>
                                          </div>
                                          <span className="text-xs text-muted-foreground">
                                            {formatDate(msg.created_at)}
                                          </span>
                                        </div>
                                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                          {msg.content}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Ingen samtaler</p>
                )}
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Slett bruker</DialogTitle>
            <DialogDescription>
              Er du sikker på at du vil slette denne brukeren? Dette vil permanent slette all brukerens
              data inkludert båter, dokumenter, og samtaler. Denne handlingen kan ikke angres.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <p className="font-semibold">Bruker som skal slettes:</p>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isLoading}>
                  Avbryt
                </Button>
                <Button variant="destructive" onClick={handleDeleteUser} disabled={isLoading}>
                  {isLoading ? 'Sletter...' : 'Slett bruker permanent'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
