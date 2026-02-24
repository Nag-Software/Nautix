import { NextResponse } from 'next/server'
import stripe from '../../../../lib/stripe'
import { createClient as createSupabaseClient } from '../../../../lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data: users } = await supabase.from('user_profiles').select('stripe_customer_id').eq('id', user.id).limit(1).single()
    const customerId = users?.stripe_customer_id
    if (!customerId) return NextResponse.json({ error: 'No stripe customer' }, { status: 400 })

    const returnUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const session = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: returnUrl })
    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('stripe portal error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
