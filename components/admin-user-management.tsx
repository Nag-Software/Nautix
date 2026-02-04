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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { getUserDetails } from '@/app/sjefen/user-actions'

interface User {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string
  boat_count: number
  conversation_count: number
  is_admin: boolean
}

interface UserDetails {
  user: {
    id: string
    email: string
    created_at: string
    last_sign_in_at: string
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

export function UserManagement({ users, onGrantAdmin, onRevokeAdmin, onDeleteUser }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const [expandedConversations, setExpandedConversations] = useState<Set<string>>(new Set())
  const [conversationPage, setConversationPage] = useState(0)

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
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
    try {
      const details = await getUserDetails(user.id)
      setUserDetails(details)
    } catch (error) {
      console.error('Failed to load user details:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleExpanded = async (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null)
    } else {
      setExpandedUserId(userId)
      setConversationPage(0) // Reset til første side
      // Load details if not already loaded
      const user = users.find(u => u.id === userId)
      if (user) {
        setIsLoading(true)
        try {
          const details = await getUserDetails(userId)
          setUserDetails(details)
        } catch (error) {
          console.error('Failed to load user details:', error)
        } finally {
          setIsLoading(false)
        }
      }
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

  const toggleConversation = (conversationId: string) => {
    setExpandedConversations(prev => {
      const newSet = new Set(prev)
      if (newSet.has(conversationId)) {
        newSet.delete(conversationId)
      } else {
        newSet.add(conversationId)
      }
      return newSet
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Brukeradministrasjon</CardTitle>
        <CardDescription>Administrer brukere og tilganger</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Input
              placeholder="Søk etter bruker..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-post</TableHead>
                  <TableHead>Båter</TableHead>
                  <TableHead>Samtaler</TableHead>
                  <TableHead>Opprettet</TableHead>
                  <TableHead>Sist innlogget</TableHead>
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
                    <>
                      <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium" onClick={() => toggleExpanded(user.id)}>
                          <div className="flex items-center gap-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className={`transition-transform ${expandedUserId === user.id ? 'rotate-90' : ''}`}
                            >
                              <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                            {user.email}
                          </div>
                        </TableCell>
                        <TableCell>{user.boat_count}</TableCell>
                        <TableCell>{user.conversation_count}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(user.created_at)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Aldri'}
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
                      {expandedUserId === user.id && userDetails && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-muted/30">
                            <div className="p-4 space-y-6">
                              {/* Conversations */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                    Samtaler ({userDetails.conversations?.length || 0})
                                  </h4>
                                  {userDetails.conversations && userDetails.conversations.length > 5 && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground">
                                        {conversationPage * 5 + 1}-{Math.min((conversationPage + 1) * 5, userDetails.conversations.length)} av {userDetails.conversations.length}
                                      </span>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setConversationPage(p => Math.max(0, p - 1))}
                                        disabled={conversationPage === 0}
                                      >
                                        Forrige
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setConversationPage(p => p + 1)}
                                        disabled={(conversationPage + 1) * 5 >= userDetails.conversations.length}
                                      >
                                        Neste
                                      </Button>
                                    </div>
                                  )}
                                </div>
                                {userDetails.conversations?.length > 0 ? (
                                  <div className="grid gap-2">
                                    {userDetails.conversations
                                      .slice(conversationPage * 5, (conversationPage + 1) * 5)
                                      .map((conv: any) => (
                                      <div key={conv.id} className="bg-background rounded-lg border">
                                        <div 
                                          className="flex justify-between items-start p-3 cursor-pointer hover:bg-muted/50"
                                          onClick={() => toggleConversation(conv.id)}
                                        >
                                          <div className="flex items-center gap-2 flex-1">
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
                                              className={`transition-transform flex-shrink-0 ${expandedConversations.has(conv.id) ? 'rotate-90' : ''}`}
                                            >
                                              <polyline points="9 18 15 12 9 6"></polyline>
                                            </svg>
                                            <div>
                                              <p className="font-medium">{conv.title}</p>
                                              <p className="text-xs text-muted-foreground">
                                                {conv.message_count} meldinger • Sist oppdatert: {formatDateShort(conv.updated_at)}
                                              </p>
                                            </div>
                                          </div>
                                          {conv.archived && <Badge variant="secondary">Arkivert</Badge>}
                                        </div>
                                        {expandedConversations.has(conv.id) && conv.messages && conv.messages.length > 0 && (
                                          <div className="px-3 pb-3 space-y-2 border-t pt-2">
                                            {conv.messages.map((msg: any) => (
                                              <div key={msg.id} className={`text-xs p-2 rounded ${msg.role === 'user' ? 'bg-blue-50 dark:bg-blue-950' : 'bg-gray-50 dark:bg-gray-900'}`}>
                                                <div className="flex justify-between items-start mb-1">
                                                  <Badge variant={msg.role === 'user' ? 'default' : 'secondary'} className="text-xs">
                                                    {msg.role === 'user' ? 'Bruker' : 'Assistent'}
                                                  </Badge>
                                                  <span className="text-muted-foreground">{formatDateShort(msg.created_at)}</span>
                                                </div>
                                                <p className="text-xs whitespace-pre-wrap break-words">{msg.content}</p>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">Ingen samtaler</p>
                                )}
                              </div>

                              {/* Documents */}
                              <div>
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                                  Dokumenter ({userDetails.documents?.length || 0})
                                </h4>
                                {userDetails.documents?.length > 0 ? (
                                  <div className="grid gap-2">
                                    {userDetails.documents.map((doc: any) => (
                                      <div key={doc.id} className="bg-background rounded-lg p-3 border">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <p className="font-medium">{doc.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                              {doc.type} • {doc.boat_name || 'Ingen båt'} • {doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB` : 'Ukjent størrelse'}
                                            </p>
                                            {doc.expiry_date && (
                                              <p className="text-xs text-muted-foreground">
                                                Utløper: {formatDateShort(doc.expiry_date)}
                                              </p>
                                            )}
                                          </div>
                                          <Badge variant={doc.status === 'valid' ? 'default' : 'destructive'}>
                                            {doc.status}
                                          </Badge>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">Ingen dokumenter</p>
                                )}
                              </div>

                              {/* Maintenance Logs */}
                              <div>
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
                                  Vedlikeholdslogg ({userDetails.maintenance_logs?.length || 0})
                                </h4>
                                {userDetails.maintenance_logs?.length > 0 ? (
                                  <div className="grid gap-2">
                                    {userDetails.maintenance_logs.map((log: any) => (
                                      <div key={log.id} className="bg-background rounded-lg p-3 border">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <p className="font-medium">{log.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                              {log.category} • {log.type} • {log.boat_name || 'Ingen båt'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              {formatDateShort(log.date)} {log.cost ? `• ${log.cost} kr` : ''}
                                            </p>
                                          </div>
                                          <Badge variant="secondary">{log.status}</Badge>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">Ingen vedlikeholdslogger</p>
                                )}
                              </div>

                              {/* Reminders */}
                              <div>
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2v2"></path><path d="M18 2v2"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path></svg>
                                  Påminnelser ({userDetails.reminders?.length || 0})
                                </h4>
                                {userDetails.reminders?.length > 0 ? (
                                  <div className="grid gap-2">
                                    {userDetails.reminders.map((reminder: any) => (
                                      <div key={reminder.id} className="bg-background rounded-lg p-3 border">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <p className="font-medium">{reminder.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                              {reminder.category} • {reminder.boat_name || 'Ingen båt'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              Forfaller: {formatDateShort(reminder.due_date)}
                                            </p>
                                          </div>
                                          <div className="flex gap-2">
                                            <Badge variant={reminder.priority === 'high' ? 'destructive' : 'secondary'}>
                                              {reminder.priority}
                                            </Badge>
                                            {reminder.completed && <Badge variant="default">Fullført</Badge>}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">Ingen påminnelser</p>
                                )}
                              </div>

                              {/* Equipment */}
                              <div>
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"></rect><line x1="8" x2="16" y1="21" y2="21"></line><line x1="12" x2="12" y1="17" y2="21"></line></svg>
                                  Utstyr ({userDetails.equipment?.length || 0})
                                </h4>
                                {userDetails.equipment?.length > 0 ? (
                                  <div className="grid gap-2">
                                    {userDetails.equipment.map((eq: any) => (
                                      <div key={eq.id} className="bg-background rounded-lg p-3 border">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <p className="font-medium">{eq.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                              {eq.category} • {eq.boat_name || 'Ingen båt'} {eq.cost ? `• ${eq.cost} kr` : ''}
                                            </p>
                                            {eq.expiry_date && (
                                              <p className="text-xs text-muted-foreground">
                                                Utløper: {formatDateShort(eq.expiry_date)}
                                              </p>
                                            )}
                                          </div>
                                          <Badge variant={eq.status === 'active' ? 'default' : 'destructive'}>
                                            {eq.status}
                                          </Badge>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">Ingen utstyr</p>
                                )}
                              </div>

                              {/* Boats */}
                              <div>
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"></path></svg>
                                  Båter ({userDetails.boats?.length || 0})
                                </h4>
                                {userDetails.boats?.length > 0 ? (
                                  <div className="grid gap-2">
                                    {userDetails.boats.map((boat: any) => (
                                      <div key={boat.id} className="bg-background rounded-lg p-3 border">
                                        <p className="font-medium">{boat.name || 'Uten navn'}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {boat.manufacturer} {boat.model} {boat.year ? `(${boat.year})` : ''} • {boat.type}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">Ingen båter</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>

      {/* User Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Brukerdetaljer</DialogTitle>
            <DialogDescription>Detaljert informasjon om brukeren</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label>Bruker ID</Label>
                <p className="text-sm font-mono text-muted-foreground">{selectedUser.id}</p>
              </div>
              <div>
                <Label>Epost</Label>
                <p className="text-sm">{selectedUser.email}</p>
              </div>
              <div>
                <Label>Opprettet</Label>
                <p className="text-sm">{formatDate(selectedUser.created_at)}</p>
              </div>
              <div>
                <Label>Sist innlogget</Label>
                <p className="text-sm">
                  {selectedUser.last_sign_in_at
                    ? formatDate(selectedUser.last_sign_in_at)
                    : 'Aldri'}
                </p>
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
                <Label>Status</Label>
                <div className="mt-2">
                  {selectedUser.is_admin ? (
                    <Badge variant="default">Admin</Badge>
                  ) : (
                    <Badge variant="secondary">Bruker</Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
