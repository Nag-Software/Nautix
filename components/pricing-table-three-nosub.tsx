"use client"

import React from 'react'
import { PricingTableThree } from './billingsdk/pricing-table-three'
import { plans } from '@/lib/billingsdk-config'
import { Button } from './ui/button'

export default function PricingTableThreeNoSub() {
  async function handlePlanSelect(planId: string, interval: 'monthly' | 'yearly') {
    const mapping: Record<string, { monthly?: string; yearly?: string; base?: string }> = {
      matros: {
        monthly: process.env.NEXT_PUBLIC_PRICE_ID_MATROSEN_MONTHLY,
        yearly: process.env.NEXT_PUBLIC_PRICE_ID_MATROSEN_YEARLY,
        base: process.env.NEXT_PUBLIC_PRICE_ID_MATROSEN,
      },
      maskinist: {
        monthly: process.env.NEXT_PUBLIC_PRICE_ID_MASKINISTEN_MONTHLY,
        yearly: process.env.NEXT_PUBLIC_PRICE_ID_MASKINISTEN_YEARLY,
        base: process.env.NEXT_PUBLIC_PRICE_ID_MASKINISTEN,
      },
      kaptein: {
        monthly: process.env.NEXT_PUBLIC_PRICE_ID_KAPTEINEN_MONTHLY,
        yearly: process.env.NEXT_PUBLIC_PRICE_ID_KAPTEINEN_YEARLY,
        base: process.env.NEXT_PUBLIC_PRICE_ID_KAPTEINEN,
      },
      // aliases
      matrosen: {
        monthly: process.env.NEXT_PUBLIC_PRICE_ID_MATROSEN_MONTHLY,
        yearly: process.env.NEXT_PUBLIC_PRICE_ID_MATROSEN_YEARLY,
        base: process.env.NEXT_PUBLIC_PRICE_ID_MATROSEN,
      },
      maskinisten: {
        monthly: process.env.NEXT_PUBLIC_PRICE_ID_MASKINISTEN_MONTHLY,
        yearly: process.env.NEXT_PUBLIC_PRICE_ID_MASKINISTEN_YEARLY,
        base: process.env.NEXT_PUBLIC_PRICE_ID_MASKINISTEN,
      },
      kapteinen: {
        monthly: process.env.NEXT_PUBLIC_PRICE_ID_KAPTEINEN_MONTHLY,
        yearly: process.env.NEXT_PUBLIC_PRICE_ID_KAPTEINEN_YEARLY,
        base: process.env.NEXT_PUBLIC_PRICE_ID_KAPTEINEN,
      },
    }

    const cfg = mapping[planId]
    const priceId = cfg?.[interval] || cfg?.yearly || cfg?.monthly || cfg?.base

    if (!priceId) {
      // fallback: navigate to contact or show message
      window.location.href = '/contact'
      return
    }

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const json = await res.json()
      if (json?.url) window.location.href = json.url
      else console.error('Checkout error', json)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="flex items-center justify-center flex-col">
      <PricingTableThree
        plans={plans}
        onPlanSelect={handlePlanSelect}
        className={"mx-auto w-full max-w-4xl"}
        variant="small"
        showFooter={true}
        footerText={"Trenger du mer informasjon? Kontakt oss for en tilpasset løsning."}
        footerButtonText="Kontakt oss"
        onFooterButtonClick={() => (window.location.href = '/contact')}
      />
      <Button variant="outline" className="mt-5" onClick={() => (window.location.href = '/')}>
        Jeg har allerede et abonnement
      </Button>
    </div>
  )
}
