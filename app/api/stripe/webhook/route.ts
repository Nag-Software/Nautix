import { NextResponse } from 'next/server'
import stripe from '../../../../lib/stripe'
import { PRICE_MAP } from '../../../../lib/stripe'
import { createClient as createSupabaseClient } from '../../../../lib/supabase/server'

export const runtime = 'edge'

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature') || ''
  const buf = await req.arrayBuffer()
  const raw = Buffer.from(buf)
  const secret = process.env.STRIPE_WEBHOOK_SECRET || ''

  let event
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret)
  } catch (err: any) {
    console.error('webhook signature verification failed', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    const supabase = await createSupabaseClient()

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any
        // associate customer and subscription with user
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string
        const metadata = session.metadata || {}
        // try to find user by supabase_user_id in metadata or by customer mapping
        if (metadata.supabase_user_id) {
          await supabase.from('user_profiles').update({ stripe_customer_id: customerId, stripe_subscription_id: subscriptionId }).eq('id', metadata.supabase_user_id)
        } else {
          // fallback: find user by stripe_customer_id
          const { data: users } = await supabase.from('user_profiles').select('id').eq('stripe_customer_id', customerId).limit(1).single()
          if (users?.id) await supabase.from('user_profiles').update({ stripe_subscription_id: subscriptionId }).eq('id', users.id)
        }
        break
      }
      case 'invoice.payment_succeeded':
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any
        const customerId = subscription.customer as string
        const subscriptionId = subscription.id as string
        const priceId = subscription.items?.data?.[0]?.price?.id as string | undefined
        const plan = priceId ? PRICE_MAP[priceId] || null : null

        // update user row matching stripe customer
        const { data: userRow } = await supabase.from('user_profiles').select('id').eq('stripe_customer_id', customerId).limit(1).single()
        if (userRow?.id) {
          await supabase.from('user_profiles').update({ stripe_subscription_id: subscriptionId, stripe_price_id: priceId || null, plan: plan }).eq('id', userRow.id)
        }
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any
        const customerId = subscription.customer as string
        const { data: userRow } = await supabase.from('user_profiles').select('id').eq('stripe_customer_id', customerId).limit(1).single()
        if (userRow?.id) {
          await supabase.from('user_profiles').update({ stripe_subscription_id: null, stripe_price_id: null, plan: null }).eq('id', userRow.id)
        }
        break
      }
      default:
        // ignore
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('webhook handler error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
