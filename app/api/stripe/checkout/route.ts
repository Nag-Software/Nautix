import { NextResponse } from 'next/server'
import stripe from '../../../../lib/stripe'
import { createClient as createSupabaseClient } from '../../../../lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const priceId = body.priceId as string | undefined
    const trial = Boolean(body?.trial)
    if (!priceId) return NextResponse.json({ error: 'priceId required' }, { status: 400 })

    const supabase = await createSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    // get user row to see if stripe customer id exists
    const { data: users } = await supabase.from('user_profiles').select('id,stripe_customer_id').eq('id', user.id).limit(1).single()

    let customerId = users?.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
      await supabase.from('user_profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    } else {
      // Ensure existing customers are linked back to Supabase user
      try {
        await stripe.customers.update(customerId, {
          metadata: { supabase_user_id: user.id },
        })
      } catch (e) {
        console.error('stripe customer metadata update failed', e)
      }
    }

    if (trial) {
      const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 1 })
      if (subs?.data?.length) {
        return NextResponse.json({ error: 'Trial already used' }, { status: 409 })
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000'

    const TRIAL_DAYS = 14

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer: customerId,
      client_reference_id: user.id,
      metadata: { supabase_user_id: user.id },
      success_url: `${baseUrl}/?subscription=success`,
      cancel_url: `${baseUrl}/?subscription=cancel`,
      ...(trial ? {
        payment_method_collection: 'if_required',
        subscription_data: {
          trial_period_days: TRIAL_DAYS,
          metadata: { supabase_user_id: user.id },
        },
      } : {}),
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('stripe checkout error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
