"use client"

import { useEffect, useState } from "react"
import { Bell, Calendar, MessageCircle, AlertTriangle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"

interface ReminderNotification {
  id: string
  title: string
  due_date: string
  priority: "high" | "medium" | "low"
  category: string
}

interface ForumNotification {
  id: string
  title: string
  unread_comment_count: number
  category: {
    name: string
  }
}

export function NotificationsPanel() {
  const [reminders, setReminders] = useState<ReminderNotification[]>([])
  const [forumPosts, setForumPosts] = useState<ForumNotification[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [isMarkingRead, setIsMarkingRead] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const totalCount = reminders.length
    + forumPosts.reduce((sum, post) => sum + post.unread_comment_count, 0)
    + notifications.filter(n => !n.read).length

  // Realtime: subscribe to new notifications so authors get near-instant updates
  useEffect(() => {
    let channel: any

    const setup = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        channel = supabase
          .channel('public:notifications')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'notifications' },
            async (payload: any) => {
              try {
                const notif = payload?.new
                if (!notif) return
                if (notif.user_id === user.id) {
                  fetchNotifications()
                }
              } catch (err) {
                console.error('Realtime notification handler error:', err)
              }
            }
          )
          .subscribe()
      } catch (err) {
        console.error('Error setting up realtime subscription:', err)
      }
    }

    setup()

    return () => {
      try {
        if (channel && typeof channel.unsubscribe === 'function') {
          channel.unsubscribe()
        }
      } catch (err) {
        // ignore
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (open) {
      // Fetch immediately when panel opens
      fetchNotifications()
      fetchPersistentNotifications()
    }
  }, [open])

  useEffect(() => {
    // Initial fetch
    fetchNotifications()
    fetchPersistentNotifications()

    // Refresh every 2 minutes (not too aggressive)
    const interval = setInterval(fetchNotifications, 120000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Fetch reminders due within 7 days or overdue
      const today = new Date()
      const sevenDaysFromNow = new Date()
      sevenDaysFromNow.setDate(today.getDate() + 7)

      const { data: reminderData } = await supabase
        .from("reminders")
        .select("id, title, due_date, priority, category")
        .eq("user_id", user.id)
        .eq("completed", false)
        .eq("archived", false)
        .lte("due_date", sevenDaysFromNow.toISOString())
        .order("due_date", { ascending: true })
        .limit(5)

      setReminders(reminderData || [])

      // Fetch forum posts with unread comments
      const response = await fetch("/api/forum/posts/my-posts")
      const postsData = await response.json()
      
      if (Array.isArray(postsData)) {
        const postsWithUnread = postsData.filter(post => post.unread_comment_count && post.unread_comment_count > 0)
        setForumPosts(postsWithUnread.slice(0, 5))
      }

      setLoading(false)
    } catch (error) {
      console.error("Error fetching notifications:", error)
      setLoading(false)
    }
  }

  // Fetch persistent notifications for the user
  const fetchPersistentNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: notifs } = await supabase
        .from('notifications')
        .select('id,type,post_id,comment_id,post_title,read,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      setNotifications(notifs || [])
    } catch (err) {
      console.error('Error fetching persistent notifications:', err)
    }
  }

  const getDaysUntil = (dateString: string) => {
    const today = new Date()
    const dueDate = new Date(dateString)
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} dag${Math.abs(diffDays) === 1 ? '' : 'er'} siden`, status: "overdue" }
    } else if (diffDays === 0) {
      return { text: "I dag", status: "today" }
    } else if (diffDays === 1) {
      return { text: "I morgen", status: "soon" }
    } else if (diffDays <= 3) {
      return { text: `Om ${diffDays} dager`, status: "soon" }
    } else {
      return { text: `Om ${diffDays} dager`, status: "upcoming" }
    }
  }

  const getPriorityIcon = (priority: string) => {
    if (priority === "high") {
      return <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
    }
    return null
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {totalCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full px-1 text-[10px] leading-5"
            >
              {totalCount > 9 ? "9+" : totalCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifikasjoner</span>
          {totalCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {totalCount}
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Laster...
          </div>
        ) : totalCount === 0 ? (
          <div className="p-8 text-center">
            <Bell className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">Ingen nye notifikasjoner</p>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {/* Reminders Section */}
            {reminders.length > 0 && (
              <>
                <div className="px-2 py-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Påminnelser
                  </p>
                </div>
                {reminders.map((reminder) => {
                  const daysInfo = getDaysUntil(reminder.due_date)
                  return (
                    <DropdownMenuItem
                      key={reminder.id}
                      className="cursor-pointer flex-col items-start p-3 focus:bg-muted"
                      onSelect={(e) => {
                        e.preventDefault()
                        
                        // Optimistically remove from list
                        setReminders(prev => prev.filter(r => r.id !== reminder.id))
                        
                        // Close panel and navigate
                        setOpen(false)
                        router.push("/vedlikehold/paminnelser")
                      }}
                    >
                      <div className="flex items-start gap-2 w-full">
                        <Calendar className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium line-clamp-1">
                              {reminder.title}
                            </p>
                            {getPriorityIcon(reminder.priority)}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <p className={`text-xs ${
                              daysInfo.status === "overdue" 
                                ? "text-red-600 font-medium" 
                                : daysInfo.status === "today" || daysInfo.status === "soon"
                                  ? "text-orange-600 font-medium"
                                  : "text-muted-foreground"
                            }`}>
                              {daysInfo.text}
                            </p>
                            <span className="text-xs text-muted-foreground">•</span>
                            <p className="text-xs text-muted-foreground capitalize">
                              {reminder.category}
                            </p>
                          </div>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  )
                })}
                {notifications.length > 0 && <DropdownMenuSeparator />}
              </>
            )}

            {/* Persistent Notifications Section */}
            {notifications.length > 0 && (
              <>
                <div className="px-2 py-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Meldinger
                  </p>
                </div>
                {notifications.map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    className="cursor-pointer flex-col items-start p-3 focus:bg-muted"
                    onSelect={async (e) => {
                      e.preventDefault()
                      try {
                        // Mark notification read
                        await supabase.from('notifications').update({ read: true }).eq('id', n.id)
                        // Optimistically update
                        setNotifications(prev => prev.filter(x => x.id !== n.id))
                        setOpen(false)
                        // If the notification points to a post, mark it read (update post view) so unread counts update
                        if (n.post_id) {
                          try {
                            await fetch(`/api/forum/posts/${n.post_id}/mark-read`, { method: 'POST' })
                          } catch (err) {
                            console.error('Error calling mark-read for notification click:', err)
                          }
                        }

                        // Don't navigate to `?post=null` — fall back to forum root when no post_id
                        const target = n.post_id ? `/forum?post=${n.post_id}${n.comment_id ? `&comment=${n.comment_id}` : ''}` : '/forum'
                        router.push(target)
                      } catch (err) {
                        console.error('Error marking notification read:', err)
                      }
                    }}
                  >
                    <div className="flex items-start gap-2 w-full">
                      <MessageCircle className="h-4 w-4 mt-0.5 shrink-0 text-green-500" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium line-clamp-1">
                            {n.post_title || 'Nytt svar'}
                          </p>
                          {!n.read && (
                            <Badge variant="destructive" className="shrink-0 h-5 min-w-5 px-1.5 text-[10px]">
                              ny
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(n.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
                {forumPosts.length > 0 && <DropdownMenuSeparator />}
              </>
            )}

            {/* Forum Comments Section */}
            {forumPosts.length > 0 && (
              <>
                <div className="px-2 py-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Forumkommentarer
                  </p>
                </div>
                {forumPosts.map((post) => (
                  <DropdownMenuItem
                    key={post.id}
                    className="cursor-pointer flex-col items-start p-3 focus:bg-muted"
                    onSelect={async (e) => {
                      e.preventDefault() // Prevent default close behavior
                      
                      if (isMarkingRead) return // Prevent multiple clicks
                      
                      setIsMarkingRead(true)
                      
                      try {
                        // Optimistically remove from list
                        setForumPosts(prev => prev.filter(p => p.id !== post.id))
                        
                        // Mark as read on server - wait for it to complete
                        await fetch(`/api/forum/posts/${post.id}/mark-read`, {
                          method: 'POST'
                        })
                        
                        // Close panel
                        setOpen(false)
                        
                        // Navigate after marking as read
                        router.push(`/forum?post=${post.id}`)
                      } catch (error) {
                        console.error("Error marking post as read:", error)
                        // Still navigate even if marking failed
                        setOpen(false)
                        router.push(`/forum?post=${post.id}`)
                      } finally {
                        setIsMarkingRead(false)
                      }
                    }}
                  >
                    <div className="flex items-start gap-2 w-full">
                      <MessageCircle className="h-4 w-4 mt-0.5 shrink-0 text-green-500" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium line-clamp-1">
                            {post.title}
                          </p>
                          <Badge variant="destructive" className="shrink-0 h-5 min-w-5 px-1.5 text-[10px]">
                            {post.unread_comment_count}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {post.unread_comment_count} ny{post.unread_comment_count > 1 ? 'e' : ''} kommentar{post.unread_comment_count > 1 ? 'er' : ''}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
