'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'

interface AdminStats {
  total_users: number
  total_boats: number
  total_engines: number
  total_equipment: number
  total_documents: number
  total_maintenance_logs: number
  total_reminders: number
  open_tickets: number
  average_rating: number
  total_conversations: number
  total_messages: number
}

interface CategoryData {
  name: string
  value: number
}

interface Props {
  stats: AdminStats
  categoryBreakdown: CategoryData[]
  recentActivity: any[]
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4']

const chartConfig = {
  users: {
    label: 'Brukere',
    color: 'hsl(var(--chart-1))',
  },
}

export function AdminDashboard({ stats, categoryBreakdown, recentActivity }: Props) {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week')
  const [userGrowth, setUserGrowth] = useState<Array<{ period: string; users: number }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUserGrowth() {
      setLoading(true)
      try {
        const response = await fetch(`/api/admin/user-growth?period=${period}`)
        const data = await response.json()
        setUserGrowth(data)
      } catch (error) {
        console.error('Error fetching user growth:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserGrowth()
  }, [period])
  const overviewData = [
    { name: 'Brukere', value: stats.total_users },
    { name: 'Båter', value: stats.total_boats },
    { name: 'Motorer', value: stats.total_engines },
    { name: 'Utstyr', value: stats.total_equipment },
    { name: 'Dokumenter', value: stats.total_documents },
    { name: 'Vedlikehold', value: stats.total_maintenance_logs },
  ]

  const activityData = [
    { name: 'Samtaler', value: stats.total_conversations },
    { name: 'Meldinger', value: stats.total_messages },
    { name: 'Påminnelser', value: stats.total_reminders },
    { name: 'Åpne tickets', value: stats.open_tickets },
  ]

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt Brukere</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_users}</div>
            <p className="text-xs text-muted-foreground">Registrerte brukere</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt Båter</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
              <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_boats}</div>
            <p className="text-xs text-muted-foreground">Registrerte båter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Åpne Tickets</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.open_tickets}</div>
            <p className="text-xs text-muted-foreground">Trenger oppfølging</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gjennomsnitt Rating</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.average_rating?.toFixed(1) || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">Av 5 stjerner</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Brukervekst</CardTitle>
            <CardDescription>
              {period === 'week' && 'Siste 7 dager'}
              {period === 'month' && 'Siste 12 måneder'}
              {period === 'year' && 'Siste 5 år'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={period} onValueChange={(v) => setPeriod(v as 'week' | 'month' | 'year')} className="mb-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="week">Uke</TabsTrigger>
                <TabsTrigger value="month">Måned</TabsTrigger>
                <TabsTrigger value="year">År</TabsTrigger>
              </TabsList>
            </Tabs>
            {loading ? (
              <div className="flex h-[300px] items-center justify-center">
                <p className="text-sm text-muted-foreground">Laster...</p>
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px]">
                <AreaChart data={userGrowth}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="period" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Systemoversikt</CardTitle>
            <CardDescription>Totalt antall per kategori</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={overviewData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Aktivitet</CardTitle>
            <CardDescription>Oversikt over brukeraktivitet</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={activityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {activityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kategori Fordeling</CardTitle>
            <CardDescription>Fordeling av vedlikehold per kategori</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" />
                <YAxis dataKey="name" type="category" className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Statistics Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Database Statistikk</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Motorer</span>
              <span className="font-semibold">{stats.total_engines}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Utstyr</span>
              <span className="font-semibold">{stats.total_equipment}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Dokumenter</span>
              <span className="font-semibold">{stats.total_documents}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Vedlikehold</span>
              <span className="font-semibold">{stats.total_maintenance_logs}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Aktivitet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Samtaler</span>
              <span className="font-semibold">{stats.total_conversations}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Meldinger</span>
              <span className="font-semibold">{stats.total_messages}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Snitt/samtale</span>
              <span className="font-semibold">
                {stats.total_conversations > 0
                  ? (stats.total_messages / stats.total_conversations).toFixed(1)
                  : '0'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Support Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Åpne tickets</span>
              <span className="font-semibold text-orange-600">{stats.open_tickets}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Påminnelser</span>
              <span className="font-semibold">{stats.total_reminders}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Gjennomsnitt rating</span>
              <span className="font-semibold text-green-600">
                {stats.average_rating?.toFixed(1) || 'N/A'} ⭐
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
