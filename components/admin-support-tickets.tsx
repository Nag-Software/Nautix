'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface SupportTicket {
  id: string
  user_email: string
  subject: string
  message: string
  status: string
  priority: string
  created_at: string
}

interface Props {
  tickets: SupportTicket[]
  onUpdateStatus: (ticketId: string, newStatus: string) => Promise<void>
}

const statusColors = {
  open: 'bg-blue-500',
  'in-progress': 'bg-yellow-500',
  resolved: 'bg-green-500',
  closed: 'bg-gray-500',
}

const priorityColors = {
  low: 'bg-gray-500',
  normal: 'bg-blue-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
}

export function SupportTickets({ tickets, onUpdateStatus }: Props) {
  const [isLoading, setIsLoading] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nb-NO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    setIsLoading(true)
    try {
      await onUpdateStatus(ticketId, newStatus)
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Support Tickets</CardTitle>
        <CardDescription>Administrer bruker support henvendelser</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bruker</TableHead>
                <TableHead>Emne</TableHead>
                <TableHead>Melding</TableHead>
                <TableHead>Prioritet</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Opprettet</TableHead>
                <TableHead className="text-right">Handlinger</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Ingen tickets funnet
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.user_email}</TableCell>
                    <TableCell>{ticket.subject}</TableCell>
                    <TableCell className="max-w-xs truncate">{ticket.message}</TableCell>
                    <TableCell>
                      <Badge className={priorityColors[ticket.priority as keyof typeof priorityColors]}>
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[ticket.status as keyof typeof statusColors]}>
                        {ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(ticket.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {ticket.status === 'open' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(ticket.id, 'in-progress')}
                            disabled={isLoading}
                          >
                            Start
                          </Button>
                        )}
                        {ticket.status === 'in-progress' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleUpdateStatus(ticket.id, 'resolved')}
                            disabled={isLoading}
                          >
                            Løs
                          </Button>
                        )}
                        {ticket.status === 'resolved' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleUpdateStatus(ticket.id, 'closed')}
                            disabled={isLoading}
                          >
                            Lukk
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
