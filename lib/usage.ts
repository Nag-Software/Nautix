export function oneMonthIso(): string {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
}

export function computeLimits(plan: string | null) {
  let cLimit = 0, lLimit = 0, dLimit = 0
  if (plan) {
    const pid = String(plan).toLowerCase()
    if (pid.includes('matros')) { cLimit = 30; lLimit = 15; dLimit = 15 }
    else if (pid.includes('maskinist')) { cLimit = 60; lLimit = 30; dLimit = 30 }
    else { cLimit = 0; lLimit = 0; dLimit = 0 }
  }
  return { chatsLimit: cLimit, logsLimit: lLimit, docsLimit: dLimit }
}

export async function countUserMessages(supabase: any, userId: string) {
  const since = oneMonthIso()
  const res = await supabase.from('messages')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('role', 'user')
    .gte('created_at', since)

  return Number(res.count ?? 0)
}

export async function countUserLogs(supabase: any, userId: string) {
  const since = oneMonthIso()
  const res = await supabase.from('maintenance_log')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .gte('created_at', since)

  return Number(res.count ?? 0)
}
