import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'
import { AdminDashboard } from '@/components/admin-dashboard'
import { UserManagement } from '@/components/admin-user-management'
import { SupportTickets } from '@/components/admin-support-tickets'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  grantAdminAccess, 
  revokeAdminAccess, 
  deleteUser, 
  updateTicketStatus 
} from './actions'

async function getAdminStats() {
  const supabase = await createClient()

  // Get overall statistics
  const [
    { count: totalUsers },
    { count: totalBoats },
    { count: totalEngines },
    { count: totalEquipment },
    { count: totalDocuments },
    { count: totalMaintenanceLogs },
    { count: totalReminders },
    { count: openTickets },
    { data: feedbackData },
    { count: totalConversations },
    { count: totalMessages },
  ] = await Promise.all([
    supabase.from('boats').select('*', { count: 'exact', head: true }),
    supabase.from('boats').select('*', { count: 'exact', head: true }),
    supabase.from('engines').select('*', { count: 'exact', head: true }),
    supabase.from('equipment').select('*', { count: 'exact', head: true }),
    supabase.from('documents').select('*', { count: 'exact', head: true }),
    supabase.from('maintenance_log').select('*', { count: 'exact', head: true }),
    supabase.from('reminders').select('*', { count: 'exact', head: true }),
    supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open'),
    supabase.from('feedback').select('rating'),
    supabase.from('conversations').select('*', { count: 'exact', head: true }),
    supabase.from('messages').select('*', { count: 'exact', head: true }),
  ])

  // Calculate average rating
  const averageRating =
    feedbackData && feedbackData.length > 0
      ? feedbackData.reduce((sum, f) => sum + f.rating, 0) / feedbackData.length
      : 0

  // Get user count from auth.users (admin only query)
  const { data: userData, error: userError } = await supabase.rpc('get_user_count')
  const userCount = userData || 0

  return {
    total_users: userCount,
    total_boats: totalBoats || 0,
    total_engines: totalEngines || 0,
    total_equipment: totalEquipment || 0,
    total_documents: totalDocuments || 0,
    total_maintenance_logs: totalMaintenanceLogs || 0,
    total_reminders: totalReminders || 0,
    open_tickets: openTickets || 0,
    average_rating: averageRating,
    total_conversations: totalConversations || 0,
    total_messages: totalMessages || 0,
  }
}

async function getCategoryBreakdown() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('maintenance_log')
    .select('category')

  const categoryCount: Record<string, number> = {}
  data?.forEach((log) => {
    const cat = log.category || 'Annet'
    categoryCount[cat] = (categoryCount[cat] || 0) + 1
  })

  return Object.entries(categoryCount).map(([name, value]) => ({ name, value }))
}

async function getAllUsers() {
  const supabase = await createClient()

  // Use database function to get all users with stats
  const { data, error } = await supabase.rpc('get_all_users_with_stats')

  if (error) {
    console.error('Error fetching users:', error)
    return []
  }

  return data || []
}

async function getSupportTickets() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  return data || []
}

export default async function SjefenPage() {
  // Check if user is admin
  const adminStatus = await isAdmin()
  
  if (!adminStatus) {
    redirect('/login')
  }

  // Fetch all data
  const [stats, categoryBreakdown, users, tickets] = await Promise.all([
    getAdminStats(),
    getCategoryBreakdown(),
    getAllUsers(),
    getSupportTickets(),
  ])

  const recentActivity: any[] = []

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Admin Panel</h2>
          <p className="text-muted-foreground">
            Oversikt og administrasjon av Nautix systemet
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Oversikt</TabsTrigger>
          <TabsTrigger value="users">Brukere</TabsTrigger>
          <TabsTrigger value="support" className="relative">
            Support
            {stats.open_tickets > 0 && (
              <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {stats.open_tickets}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <AdminDashboard
            stats={stats}
            categoryBreakdown={categoryBreakdown}
            recentActivity={recentActivity}
          />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UserManagement
            users={users}
            onGrantAdmin={grantAdminAccess}
            onRevokeAdmin={revokeAdminAccess}
            onDeleteUser={deleteUser}
          />
        </TabsContent>

        <TabsContent value="support" className="space-y-4">
          <SupportTickets
            tickets={tickets}
            onUpdateStatus={updateTicketStatus}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
