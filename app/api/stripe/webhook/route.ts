import { NextResponse } from 'next/server'
import stripe from '../../../../lib/stripe'
import { PRICE_MAP } from '../../../../lib/stripe'
import { createAdminClient } from '../../../../lib/supabase/admin'

// MUST be Node.js runtime — stripe.webhooks.constructEvent() uses Node crypto.
// Edge runtime has an incompatible crypto polyfill that breaks HMAC verification
// and can cause Next.js to emit {"redirect":"/login","status":"307"} instead of
// a proper error response.
export const runtime = 'nodejs'

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature') ?? ''
  // req.text() preserves the exact raw bytes required for HMAC verification.
  // Never parse as JSON first — that would re-serialise the body and break the sig.
  const rawBody = await req.text()
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? ''

  if (!secret) {
    console.error('[stripe/webhook] STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event: ReturnType<typeof stripe.webhooks.constructEvent>
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret)
  } catch (err: any) {
    console.error('[stripe/webhook] signature verification failed', err?.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Acknowledge receipt immediately — Stripe expects a 2xx within 30 s.
  // Heavy work (email, queues, etc.) should be dispatched here and processed
  // out-of-band. For now we process inline; move to a queue if handlers grow.
  try {
    const supabase = createAdminClient()

    switch (event.type) {
      // ------------------------------------------------------------------ //
      // Checkout completed — link customer + subscription to the Supabase user
      // ------------------------------------------------------------------ //
      case 'checkout.session.completed': {
        const session = event.data.object as any
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string
        const metadata = session.metadata ?? {}

        let userId = metadata.supabase_user_id as string | undefined
        if (!userId) {
          try {
            const customer = await stripe.customers.retrieve(customerId)
            userId = (customer as any)?.metadata?.supabase_user_id
          } catch (e) {
            console.error('[stripe/webhook] failed to read customer metadata', e)
          }
        }

        if (userId) {
          const { error } = await supabase
            .from('user_profiles')
            .update({ stripe_customer_id: customerId, stripe_subscription_id: subscriptionId })
            .eq('id', userId)
          if (error) {
            console.error('[stripe/webhook] failed to update user profile', error)
          }
        } else {
          const { data: users } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .limit(1)
            .single()
          if (users?.id) {
            const { error } = await supabase
              .from('user_profiles')
              .update({ stripe_subscription_id: subscriptionId })
              .eq('id', users.id)
            if (error) {
              console.error('[stripe/webhook] failed to update user profile', error)
            }
          }
        }
        break
      }

      // ------------------------------------------------------------------ //
      // Subscription lifecycle — keep plan / price in sync
      // ------------------------------------------------------------------ //
      case 'invoice.payment_succeeded':
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any
        const customerId = subscription.customer as string
        const subscriptionId = subscription.id as string
        const priceId = subscription.items?.data?.[0]?.price?.id as string | undefined
        const plan = priceId ? (PRICE_MAP[priceId] ?? null) : null

        const { data: userRow } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .limit(1)
          .single()
        if (userRow?.id) {
          const { error } = await supabase
            .from('user_profiles')
            .update({ stripe_subscription_id: subscriptionId, stripe_price_id: priceId ?? null, plan })
            .eq('id', userRow.id)
          if (error) {
            console.error('[stripe/webhook] failed to update user profile', error)
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any
        const customerId = subscription.customer as string
        const { data: userRow } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .limit(1)
          .single()
        if (userRow?.id) {
          const { error } = await supabase
            .from('user_profiles')
            .update({ stripe_subscription_id: null, stripe_price_id: null, plan: null })
            .eq('id', userRow.id)
          if (error) {
            console.error('[stripe/webhook] failed to update user profile', error)
          }
        }
        break
      }

      // ------------------------------------------------------------------ //
      // account.updated — Stripe Connect accounts or Express dashboard changes
      // Log and sync any fields you care about (e.g. payouts_enabled).
      // Idempotency: Stripe may re-deliver this event; the upsert below is safe
      // to run multiple times for the same account state.
      // ------------------------------------------------------------------ //
      case 'account.updated': {
        const account = event.data.object as any
        console.log('[stripe/webhook] account.updated', {
          accountId: account.id,
          payoutsEnabled: account.payouts_enabled,
          chargesEnabled: account.charges_enabled,
          detailsSubmitted: account.details_submitted,
        })

        // If you store connected account state, update it here, e.g.:
        // await supabase
        //   .from('connected_accounts')
        //   .upsert({
        //     stripe_account_id: account.id,
        //     payouts_enabled: account.payouts_enabled,
        //     charges_enabled: account.charges_enabled,
        //     details_submitted: account.details_submitted,
        //     updated_at: new Date().toISOString(),
        //   }, { onConflict: 'stripe_account_id' })
        break
      }

      default:
        // Unhandled event types are not errors — just ignore them.
        console.log('[stripe/webhook] unhandled event type', event.type)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (err: any) {
    console.error('[stripe/webhook] handler error', err)
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 })
  }
}
