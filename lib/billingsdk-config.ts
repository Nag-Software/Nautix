export type Plan = {
  id: string
  title: string
  description?: string
  monthlyPrice?: number
  yearlyPrice?: number
  features?: string[]
  buttonText?: string
  highlight?: boolean
  badge?: string
  discount_yearly?: number
}

export const plans: Plan[] = [
  {
    id: 'matros',
    title: 'Matros',
    description: 'For enkeltbrukere',
    monthlyPrice: 29,
    yearlyPrice: 290,
    features: ['20 meldinger /mnd', '15 vedlikeholdslogger', '10 dokumenter'],
    buttonText: "Velg",
  },
  {
    id: 'maskinist',
    title: 'Maskinist',
    description: 'For aktive båtfolk',
    monthlyPrice: 49,
    yearlyPrice: 490,
    features: ['60 meldinger /mnd', '30 vedlikeholdslogger', '30 dokumenter', "Utstyrsliste", "Påminnelser"],
    buttonText: "Velg",
    highlight: true,
    badge: "Mest populær",
  },
  {
    id: 'kaptein',
    title: 'Kaptein',
    description: 'For større team og organisasjoner',
    monthlyPrice: 99,
    yearlyPrice: 990,
    features: ["Ubegrenset meldinger", 'Ubegrenset logger', 'Ubegrenset dokumenter', "Utstyr & Påminnelser" ,'Prioritert support'],
    buttonText: "Velg",
  },
]

export type CurrentPlan = {
  plan: Plan
  type: 'monthly' | 'yearly'
  price: string
  nextBillingDate: string
  paymentMethod: string
  status: 'active' | 'past_due' | 'canceled'
}

