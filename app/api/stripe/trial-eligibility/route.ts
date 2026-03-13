import { NextResponse } from 'next/server'
import stripe from '../../../../lib/stripe'
import { createClient as createSupabaseClient } from '../../../../lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ eligible: false }, { status: 401 })

    const { data: users } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .limit(1)
      .single()

    const customerId = users?.stripe_customer_id
    if (!customerId) {
      return NextResponse.json({ eligible: true })
    }

    const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 1 })
    const eligible = !(subs?.data?.length)

    return NextResponse.json({ eligible })
  } catch (err: any) {
    console.error('stripe trial eligibility error', err)
    return NextResponse.json({ eligible: false }, { status: 500 })
  }
}
