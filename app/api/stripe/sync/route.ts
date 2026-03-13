import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { getSubscriptionForCustomer } from '@/lib/stripe'

export async function POST() {
  try {
    const supabase = await createSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ access: false }, { status: 401 })

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id,stripe_customer_id')
      .eq('id', user.id)
      .limit(1)
      .single()

    const customerId = profile?.stripe_customer_id
    if (!customerId) return NextResponse.json({ access: false })

    const subInfo = await getSubscriptionForCustomer(customerId)
    const status = subInfo.status || null
    const isActive = status === 'active' || status === 'trialing'

    if (subInfo.subscription?.id || subInfo.priceId || subInfo.planId) {
      if (isActive) {
        await supabase
          .from('user_profiles')
          .update({
            stripe_subscription_id: subInfo.subscription?.id ?? null,
            stripe_price_id: subInfo.priceId ?? null,
            plan: subInfo.planId ?? null,
          })
          .eq('id', user.id)
      }
    }

    return NextResponse.json({ access: isActive, status })
  } catch (err: any) {
    console.error('stripe sync error', err)
    return NextResponse.json({ access: false, error: err.message || String(err) }, { status: 500 })
  }
}
