import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { countUserMessages, countUserLogs, computeLimits } from '../../../lib/usage'
import { getSubscriptionForCustomer } from '@/lib/stripe'

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Use shared helpers for consistency and testability
    const chatsUsed = await countUserMessages(supabase, user.id)
    const logsUsed = await countUserLogs(supabase, user.id)

    const docsRes = await supabase.from('documents')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)

    const docsUsed = Number(docsRes.count ?? 0)

    // Determine limits by deriving plan from Stripe using stored customer id
    let plan: string | null = null
    let access = false
    try {
      const { data: profileRow } = await supabase
        .from('user_profiles')
        .select('stripe_customer_id,stripe_subscription_id,stripe_price_id,plan')
        .eq('id', user.id)
        .limit(1)
        .single()

      access = Boolean(profileRow?.stripe_subscription_id || profileRow?.stripe_price_id || profileRow?.plan)

      const customerId = profileRow?.stripe_customer_id
      if (customerId) {
        const subInfo = await getSubscriptionForCustomer(customerId)
        const isActive = subInfo.status === 'active' || subInfo.status === 'trialing'
        
        // Trust Stripe truth over the DB if we fetched it
        access = isActive
        plan = isActive ? (subInfo.planId || null) : null
        
        // Auto-sync the DB if we found a discrepancy (Optional, but fixes the middleware loop)
        const dbHadAccess = Boolean(profileRow?.stripe_subscription_id || profileRow?.stripe_price_id || profileRow?.plan)
        if (isActive !== dbHadAccess) {
           await supabase.from('user_profiles').update({
              stripe_subscription_id: isActive ? (subInfo.subscription?.id ?? null) : null,
              stripe_price_id: isActive ? (subInfo.priceId ?? null) : null,
              plan: isActive ? (subInfo.planId ?? null) : null,
           }).eq('id', user.id)
        }
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
