import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2022-11-15',
})

// Map price IDs to internal plan names (set env variables for price IDs)
export const PRICE_MAP: Record<string, string> = {
  [process.env.PRICE_ID_BASIC || '']: 'basic',
  [process.env.PRICE_ID_PREMIUM || '']: 'premium',
}

export default stripe
