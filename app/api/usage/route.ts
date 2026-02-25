import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { countUserMessages, computeLimits } from '../../../lib/usage'
import { getSubscriptionForCustomer } from '@/lib/stripe'

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Use shared helpers for consistency and testability
    const chatsUsed = await countUserMessages(supabase, user.id)

    const [logsRes, docsRes] = await Promise.all([
      supabase.from('maintenance_log').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('documents').select('id', { count: 'exact' }).eq('user_id', user.id),
    ])

    const logsUsed = Number(logsRes.count ?? 0)
    const docsUsed = Number(docsRes.count ?? 0)

    // Determine limits by deriving plan from Stripe using stored customer id
    let plan: string | null = null
    let access = false
    try {
      const { data: profileRow } = await supabase.from('user_profiles').select('stripe_customer_id').eq('id', user.id).limit(1).single()
      const customerId = profileRow?.stripe_customer_id
      if (customerId) {
        const subInfo = await getSubscriptionForCustomer(customerId)
        plan = subInfo.planId || null
        if (subInfo.status === 'active' || subInfo.status === 'trialing') access = true
      }
    } catch (e) {
      plan = null
    }

    const limits = computeLimits(plan)
    const cLimit = limits.chatsLimit
    const lLimit = limits.logsLimit
    const dLimit = limits.docsLimit

    return NextResponse.json({ chatsUsed, chatsLimit: cLimit, logsUsed, logsLimit: lLimit, docsUsed, docsLimit: dLimit, access })
  } catch (err: any) {
    console.error('Error in /api/usage:', err)
    return NextResponse.json({ error: err.message || 'Error' }, { status: 500 })
  }
}
