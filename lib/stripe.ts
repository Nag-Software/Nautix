import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2022-11-15',
})

// Build price map carefully breaking up any values containing '#' 
// (which can happen if a comment wasn't properly parsed out in .env)
export const buildPriceMap = (): Record<string, string> => {
  const map: Record<string, string> = {}
  const add = (planKey: string, ...envKeys: Array<string | undefined>) => {
    envKeys.forEach(k => { 
      if (k) {
        k.split('#').forEach(part => {
          if (part.trim()) map[part.trim()] = planKey
        })
      }
    })
  }

  add('basic', process.env.PRICE_ID_BASIC)
  add('premium', process.env.PRICE_ID_PREMIUM)
  add('matros', process.env.NEXT_PUBLIC_PRICE_ID_MATROSEN_MONTHLY, process.env.NEXT_PUBLIC_PRICE_ID_MATROSEN_YEARLY, process.env.NEXT_PUBLIC_PRICE_ID_MATROSEN)
  add('maskinist', process.env.NEXT_PUBLIC_PRICE_ID_MASKINISTEN_MONTHLY, process.env.NEXT_PUBLIC_PRICE_ID_MASKINISTEN_YEARLY, process.env.NEXT_PUBLIC_PRICE_ID_MASKINISTEN)
  add('kaptein', process.env.NEXT_PUBLIC_PRICE_ID_KAPTEINEN_MONTHLY, process.env.NEXT_PUBLIC_PRICE_ID_KAPTEINEN_YEARLY, process.env.NEXT_PUBLIC_PRICE_ID_KAPTEINEN)
  // aliases
  add('matrosen', process.env.NEXT_PUBLIC_PRICE_ID_MATROSEN_MONTHLY, process.env.NEXT_PUBLIC_PRICE_ID_MATROSEN_YEARLY, process.env.NEXT_PUBLIC_PRICE_ID_MATROSEN)
  add('maskinisten', process.env.NEXT_PUBLIC_PRICE_ID_MASKINISTEN_MONTHLY, process.env.NEXT_PUBLIC_PRICE_ID_MASKINISTEN_YEARLY, process.env.NEXT_PUBLIC_PRICE_ID_MASKINISTEN)
  add('kapteinen', process.env.NEXT_PUBLIC_PRICE_ID_KAPTEINEN_MONTHLY, process.env.NEXT_PUBLIC_PRICE_ID_KAPTEINEN_YEARLY, process.env.NEXT_PUBLIC_PRICE_ID_KAPTEINEN)

  return map
}

export const PRICE_MAP = buildPriceMap()

export default stripe

// Derive a canonical plan id from a Stripe customer by listing subscriptions
export async function getSubscriptionForCustomer(customerId: string) {
  try {
    const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 10 })
    if (!subs?.data?.length) return { subscription: null, priceId: null, planId: null, status: null }

    const sub = subs.data.find(s => s.status === 'active' || s.status === 'trialing') || subs.data[0]
    const priceId = sub.items?.data?.[0]?.price?.id || null
    const planId = priceId ? (PRICE_MAP[priceId] || null) : null

    return { subscription: sub, priceId, planId, status: sub.status }
  } catch (err) {
    console.error('Error fetching subscription for customer', customerId, err)
    return { subscription: null, priceId: null, planId: null, status: null }
  }
}
