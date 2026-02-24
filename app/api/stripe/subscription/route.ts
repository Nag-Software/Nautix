import { NextResponse } from 'next/server'
import stripe from '../../../../lib/stripe'
import { createClient as createSupabaseClient } from '../../../../lib/supabase/server'

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ subscription: null })

    const { data: users } = await supabase.from('user_profiles').select('stripe_customer_id').eq('id', user.id).limit(1).single()
    const customerId = users?.stripe_customer_id
    if (!customerId) return NextResponse.json({ subscription: null })

    const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 10 })
    if (!subs?.data?.length) return NextResponse.json({ subscription: null })

    // Prefer active or trialing subscriptions
    let sub = subs.data.find(s => s.status === 'active' || s.status === 'trialing') || subs.data[0]

    const priceId = sub.items?.data?.[0]?.price?.id || null

    // Map known price IDs to canonical plan keys (matching client-side plan ids)
    const priceToPlan: Record<string, string> = {}
    const add = (planKey: string, ...envKeys: Array<string | undefined>) => {
      envKeys.forEach(k => { if (k) priceToPlan[k] = planKey })
    }

    add('matros', process.env.NEXT_PUBLIC_PRICE_ID_MATROSEN_MONTHLY, process.env.NEXT_PUBLIC_PRICE_ID_MATROSEN_YEARLY, process.env.NEXT_PUBLIC_PRICE_ID_MATROSEN)
    add('maskinist', process.env.NEXT_PUBLIC_PRICE_ID_MASKINISTEN_MONTHLY, process.env.NEXT_PUBLIC_PRICE_ID_MASKINISTEN_YEARLY, process.env.NEXT_PUBLIC_PRICE_ID_MASKINISTEN)
    add('kaptein', process.env.NEXT_PUBLIC_PRICE_ID_KAPTEINEN_MONTHLY, process.env.NEXT_PUBLIC_PRICE_ID_KAPTEINEN_YEARLY, process.env.NEXT_PUBLIC_PRICE_ID_KAPTEINEN)
    add('matrosen', process.env.NEXT_PUBLIC_PRICE_ID_MATROSEN_MONTHLY, process.env.NEXT_PUBLIC_PRICE_ID_MATROSEN_YEARLY, process.env.NEXT_PUBLIC_PRICE_ID_MATROSEN)
    add('maskinisten', process.env.NEXT_PUBLIC_PRICE_ID_MASKINISTEN_MONTHLY, process.env.NEXT_PUBLIC_PRICE_ID_MASKINISTEN_YEARLY, process.env.NEXT_PUBLIC_PRICE_ID_MASKINISTEN)
    add('kapteinen', process.env.NEXT_PUBLIC_PRICE_ID_KAPTEINEN_MONTHLY, process.env.NEXT_PUBLIC_PRICE_ID_KAPTEINEN_YEARLY, process.env.NEXT_PUBLIC_PRICE_ID_KAPTEINEN)

    const planId = priceId ? priceToPlan[priceId] || null : null

    return NextResponse.json({ subscription: sub ? {
      id: sub.id,
      status: sub.status,
      priceId,
      planId,
      current_period_end: sub.current_period_end,
    } : null })
  } catch (err: any) {
    console.error('stripe subscription error', err)
    return NextResponse.json({ subscription: null }, { status: 500 })
  }
}
