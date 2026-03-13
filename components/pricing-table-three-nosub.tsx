"use client"

import React, { useEffect, useState } from 'react'
import { PricingTableThree } from './billingsdk/pricing-table-three'
import { plans } from '@/lib/billingsdk-config'
import { Button } from './ui/button'
import { Switch } from './ui/switch'

export default function PricingTableThreeNoSub() {
  const [trialEligible, setTrialEligible] = useState<boolean | null>(null)
  const [useTrial, setUseTrial] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/stripe/trial-eligibility', { cache: 'no-store' })
        if (!res.ok) {
          if (mounted) setTrialEligible(false)
          return
        }
        const json = await res.json()
        if (!mounted) return
        const eligible = Boolean(json?.eligible)
        setTrialEligible(eligible)
        setUseTrial(eligible)
      } catch (err) {
        if (mounted) setTrialEligible(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  async function handlePlanSelect(planId: string, interval: 'monthly' | 'yearly') {
    setErrorMessage(null)
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
        body: JSON.stringify({ priceId, trial: Boolean(trialEligible && useTrial) }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        const message = json?.error || 'Kunne ikke starte betaling.'
        setErrorMessage(message)
        console.error('Checkout error', json)
        return
      }
      if (json?.url) window.location.href = json.url
      else console.error('Checkout error', json)
    } catch (err) {
      console.error(err)
      setErrorMessage('Kunne ikke starte betaling. Prøv igjen.')
    }
  }

  return (
    <div className="flex items-center justify-center flex-col">
      {trialEligible && (
        <div className="w-full max-w-4xl rounded-lg border bg-muted/30 p-4 mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">14 dagers gratis prøveperiode</h2>
              <p className="text-sm text-muted-foreground">
                Ingen kort kreves nå. Velg et abonnement under og start gratis.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={useTrial}
                onCheckedChange={setUseTrial}
                aria-label="Start med prøveperiode"
              />
              <span className="text-sm">Start med prøveperiode</span>
            </div>
          </div>
        </div>
      )}
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
      {errorMessage && (
        <div className="mt-4 text-sm text-rose-600">{errorMessage}</div>
      )}
      <Button variant="outline" className="mt-5" onClick={() => (window.location.href = '/')}>
        Jeg har allerede et abonnement
      </Button>
    </div>
  )
}
