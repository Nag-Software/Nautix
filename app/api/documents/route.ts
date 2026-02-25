import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { countUserMessages, computeLimits } from '../../../lib/usage'
import { getSubscriptionForCustomer } from '@/lib/stripe'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { boat_id, name, type, file_path, file_size, expiry_date } = body || {}

    // Enforce subscription/trial access
    try {
      const usageRes = await fetch('/api/usage')
      const usageJson = await usageRes.json()
      if (!usageJson?.access) {
        return NextResponse.json({ error: 'Subscription required' }, { status: 403 })
      }
    } catch (e) {
      return NextResponse.json({ error: 'Subscription check failed' }, { status: 500 })
    }

    // Compute docs used and limits
    const docsRes = await supabase.from('documents').select('id', { count: 'exact' }).eq('user_id', user.id)
    const docsUsed = Number(docsRes.count ?? 0)

    // Determine plan by deriving from Stripe using stored customer id
    let plan: string | null = null
    try {
      const { data: profileRow } = await supabase.from('user_profiles').select('stripe_customer_id').eq('id', user.id).limit(1).single()
      const customerId = profileRow?.stripe_customer_id
      if (customerId) {
        const subInfo = await getSubscriptionForCustomer(customerId)
        plan = subInfo.planId || null
      }
    } catch (e) {
      plan = null
    }

    const limits = computeLimits(plan)
    const dLimit = limits.docsLimit

    if (dLimit > 0 && docsUsed >= dLimit) {
      return NextResponse.json({ error: 'Document quota exceeded' }, { status: 403 })
    }

    // Insert metadata
    const { error } = await supabase.from('documents').insert([{
      boat_id: boat_id || null,
      user_id: user.id,
      name: name || null,
      type: type || null,
      file_path: file_path || null,
      file_size: file_size || 0,
      expiry_date: expiry_date || null,
      status: 'valid',
    }])

    if (error) {
      console.error('Failed to insert document metadata', error)
      return NextResponse.json({ error: 'Failed to save metadata' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error in /api/documents POST', err)
    return NextResponse.json({ error: err.message || 'Error' }, { status: 500 })
  }
}
