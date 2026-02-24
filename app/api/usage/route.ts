import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import stripe from '@/lib/stripe'
import { countUserMessages } from '../../../lib/usage'

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

    // Determine limits by trying user_profiles.plan first, fallback to stripe/subscription
    let plan: string | null = null
    let access = false
    try {
      const { data: profile } = await supabase.from('user_profiles').select('plan').eq('id', user.id).limit(1).single()
      plan = profile?.plan ?? null
    } catch (e) {
      plan = null
    }

    if (!plan) {
      try {
        // Try to get the customer's Stripe ID from user_profiles
        try {
          const { data: profileRow } = await supabase.from('user_profiles').select('stripe_customer_id').eq('id', user.id).limit(1).single()
          const customerId = profileRow?.stripe_customer_id
          if (customerId) {
            const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 10 })
            if (subs?.data?.length) {
                // Prefer active or trialing subscriptions
                const sub = subs.data.find((s: any) => s.status === 'active' || s.status === 'trialing') || subs.data[0]
                const priceId = sub.items?.data?.[0]?.price?.id || null
                // Map known price IDs to canonical plan keys
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

                plan = priceId ? priceToPlan[priceId] || priceId : null
                if (sub && sub.status === 'active') access = true
              }
          }
        } catch (e) {
          // ignore and fallback
        }
      } catch (e) {
        plan = null
      }
    }

    let cLimit = 0, lLimit = 0, dLimit = 0
    if (plan) {
      const pid = String(plan).toLowerCase()
      if (pid.includes('matros')) { cLimit = 20; lLimit = 15; dLimit = 15 }
      else if (pid.includes('maskinist')) { cLimit = 60; lLimit = 30; dLimit = 30 }
      else { cLimit = 0; lLimit = 0; dLimit = 0 }
    }

    if (plan) access = true

    return NextResponse.json({ chatsUsed, chatsLimit: cLimit, logsUsed, logsLimit: lLimit, docsUsed, docsLimit: dLimit, access })
  } catch (err: any) {
    console.error('Error in /api/usage:', err)
    return NextResponse.json({ error: err.message || 'Error' }, { status: 500 })
  }
}
