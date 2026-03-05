"use client"

import React, { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { createClient } from '@/lib/supabase/client'
import {SubscriptionManagement} from '@/components/billingsdk/subscription-management'
import { plans, type CurrentPlan } from '@/lib/billingsdk-config'
import { countUserMessages, countUserLogs } from '@/lib/usage'
import UsageMeterCircle from '@/registry/billingsdk/usage-meter-circle'
import { PricingTableThree } from './billingsdk/pricing-table-three'

interface BillingSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BillingSheet({ open, onOpenChange }: BillingSheetProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<CurrentPlan | null>(null)
  const [chatsUsed, setChatsUsed] = useState<number | null>(null)
  const [logsUsed, setLogsUsed] = useState<number | null>(null)
  const [docsUsed, setDocsUsed] = useState<number | null>(null)

  const [chatsLimit, setChatsLimit] = useState<number | null>(null)
  const [logsLimit, setLogsLimit] = useState<number | null>(null)
  const [docsLimit, setDocsLimit] = useState<number | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const { data } = await supabase.auth.getUser()
        const user = data.user
        if (!user) return

        const { data: row, error: profileError } = await supabase.from('user_profiles').select('stripe_customer_id').eq('id', user.id).limit(1).single()

        if (profileError) {
          console.error('Supabase error fetching profile', profileError)
          if (mounted) {
            setCurrentPlan(null)
            setChatsUsed(Number(0))
            setLogsUsed(Number(0))
            setDocsUsed(Number(0))
            setChatsLimit(Number(0))
            setLogsLimit(Number(0))
            setDocsLimit(Number(0))
          }
          return
        }

        // Compute usage counts using shared helpers
        try {
          const chatsCount = await countUserMessages(supabase, user.id)
          const logsCount = await countUserLogs(supabase, user.id)

          const docsRes = await supabase
            .from('documents')
            .select('id', { count: 'exact' })
            .eq('user_id', user.id)

          const docsCount = docsRes.count ?? 0

          if (mounted) {
            setChatsUsed(Number(chatsCount))
            setLogsUsed(Number(logsCount))
            setDocsUsed(Number(docsCount))
          }
        } catch (err) {
          console.error('Failed to compute usage counts', err)
          if (mounted) {
            setChatsUsed(0)
            setLogsUsed(0)
            setDocsUsed(0)
          }
        }

        // Fetch subscription info from server using stripe_customer_id
        let subscription: any = null
        try {
          const subRes = await fetch('/api/stripe/subscription')
          const subJson = await subRes.json()
          subscription = subJson?.subscription ?? null
          console.debug('fetched subscription from /api/stripe/subscription', subscription)
        } catch (e) {
          console.error('Failed to fetch subscription', e)
        }

        // If no subscription found, treat as no plan
        if (!subscription || !subscription.planId) {
          if (mounted) {
            setCurrentPlan(null)
          }
          return
        }

        // If server didn't map price -> plan, try a client-side fallback mapping using env vars
        const planObj = plans.find((p) => p.id === subscription.planId) || (() => {
          const mapping: Record<string, string[]> = {
            matros: [process.env.NEXT_PUBLIC_PRICE_ID_MATROSEN_MONTHLY || '', process.env.NEXT_PUBLIC_PRICE_ID_MATROSEN_YEARLY || '', process.env.NEXT_PUBLIC_PRICE_ID_MATROSEN || ''],
            maskinist: [process.env.NEXT_PUBLIC_PRICE_ID_MASKINISTEN_MONTHLY || '', process.env.NEXT_PUBLIC_PRICE_ID_MASKINISTEN_YEARLY || '', process.env.NEXT_PUBLIC_PRICE_ID_MASKINISTEN || ''],
            kaptein: [process.env.NEXT_PUBLIC_PRICE_ID_KAPTEINEN_MONTHLY || '', process.env.NEXT_PUBLIC_PRICE_ID_KAPTEINEN_YEARLY || '', process.env.NEXT_PUBLIC_PRICE_ID_KAPTEINEN || ''],
            matrosen: [process.env.NEXT_PUBLIC_PRICE_ID_MATROSEN_MONTHLY || '', process.env.NEXT_PUBLIC_PRICE_ID_MATROSEN_YEARLY || '', process.env.NEXT_PUBLIC_PRICE_ID_MATROSEN || ''],
            maskinisten: [process.env.NEXT_PUBLIC_PRICE_ID_MASKINISTEN_MONTHLY || '', process.env.NEXT_PUBLIC_PRICE_ID_MASKINISTEN_YEARLY || '', process.env.NEXT_PUBLIC_PRICE_ID_MASKINISTEN || ''],
            kapteinen: [process.env.NEXT_PUBLIC_PRICE_ID_KAPTEINEN_MONTHLY || '', process.env.NEXT_PUBLIC_PRICE_ID_KAPTEINEN_YEARLY || '', process.env.NEXT_PUBLIC_PRICE_ID_KAPTEINEN || ''],
          }

          const priceId = subscription?.priceId
          if (!priceId) return null

          for (const [planKey, ids] of Object.entries(mapping)) {
            if (ids.includes(priceId)) return plans.find(p => p.id === planKey) || null
          }

          return null
        })()
        if (!planObj) {
          if (mounted) setCurrentPlan(null)
          return
        }

        const nextBilling = subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toLocaleDateString('nb-NO') : '—'

        // Determine billing interval based on the Stripe priceId (fall back to yearly)
        const yearlyIds = [
          process.env.NEXT_PUBLIC_PRICE_ID_MATROSEN_YEARLY,
          process.env.NEXT_PUBLIC_PRICE_ID_MASKINISTEN_YEARLY,
          process.env.NEXT_PUBLIC_PRICE_ID_KAPTEINEN_YEARLY,
        ]

        const monthlyIds = [
          process.env.NEXT_PUBLIC_PRICE_ID_MATROSEN_MONTHLY,
          process.env.NEXT_PUBLIC_PRICE_ID_MASKINISTEN_MONTHLY,
          process.env.NEXT_PUBLIC_PRICE_ID_KAPTEINEN_MONTHLY,
        ]

        const priceId = String(subscription.priceId || '')
        let interval: 'monthly' | 'yearly' = 'yearly'
        if (monthlyIds.some(id => id && id === priceId)) interval = 'monthly'
        else if (yearlyIds.some(id => id && id === priceId)) interval = 'yearly'
        else if (priceId.toLowerCase().includes('month')) interval = 'monthly'

        const price = interval === 'yearly'
          ? `${planObj.yearlyPrice ?? planObj.monthlyPrice ?? 0} kr`
          : `${planObj.monthlyPrice ?? planObj.yearlyPrice ?? 0} kr`

        const cp: CurrentPlan = {
          plan: planObj,
          type: interval,
          price,
          nextBillingDate: nextBilling,
          paymentMethod: 'Kort',
          status: subscription.status ?? 'canceled',
        }

        if (mounted) {
          // If subscription status is canceled, treat as no active plan
          if ((cp.status || '').toLowerCase() === 'canceled') {
            setCurrentPlan(null)
            setChatsLimit(0)
            setLogsLimit(0)
            setDocsLimit(0)
          } else {
            setCurrentPlan(cp)

            // Determine limits based on plan id (allow older id variants)
            const pid = String(planObj.id || '').toLowerCase()
            let cLimit = 0
            let lLimit = 0
            let dLimit = 0

            if (pid.includes('matros')) {
              cLimit = 20
              lLimit = 15
              dLimit = 10
            } else if (pid.includes('maskinist')) {
              cLimit = 60
              lLimit = 30
              dLimit = 30
            } else {
              // kaptein or other: unlimited
              cLimit = 0
              lLimit = 0
              dLimit = 0
            }

            setChatsLimit(cLimit)
            setLogsLimit(lLimit)
            setDocsLimit(dLimit)
          }
        }
      } catch (e) {
        console.error(e)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    if (open) load()
    return () => { mounted = false }
  }, [open])

  // Listen for external requests to open the pricing/checkout flow (e.g. from UpdatePlanDialog)
  useEffect(() => {
    function handleOpenPricing(e: any) {
      try {
        const detail = e?.detail || {}
        const planId = String(detail.planId || "")
        const interval = detail.interval === 'yearly' ? 'yearly' : 'monthly'
        if (!planId) return
        // Delegate to existing helper
        void handlePlanSelect(planId, interval as 'monthly' | 'yearly')
      } catch (err) {
        console.error('open-pricing-dialog handler error', err)
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('open-pricing-dialog', handleOpenPricing as EventListener)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('open-pricing-dialog', handleOpenPricing as EventListener)
      }
    }
  }, [])

  function handleChoose() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-pricing-dialog', { detail: {} }))
    }
  }

  async function handlePlanSelect(planId: string, interval: 'monthly' | 'yearly') {
    const mapping: Record<
      string,
      { monthly?: string; yearly?: string; base?: string }
    > = {
      // canonical keys from plans
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
      // older or alternate ids
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
      // If no priceId is set for this plan/interval, fall back to contacting sales
      window.location.href = '/'
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

  // Trial functionality removed

  async function handleManage() {
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const json = await res.json()
      if (json?.url) window.location.href = json.url
      else console.error('Portal error', json)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[fit-content] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Abonnement & Priser</SheetTitle>
          <SheetDescription>Oversikt over abonnement og priser.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 px-6 pb-8">
          {loading ? (
            <div className="text-center">Laster...</div>
          ) : (
            <div className="space-y-6">
              {currentPlan ? (
                <>
                <div className="flex justify-evenly space-x-4">
                  <UsageMeterCircle used={chatsUsed ?? 0} limit={chatsLimit ?? 0} label="Samtale-bruk" />
                  <UsageMeterCircle used={logsUsed ?? 0} limit={logsLimit ?? 0} label="Logg-bruk" />
                  <UsageMeterCircle used={docsUsed ?? 0} limit={docsLimit ?? 0} label="Lagringsplass" />
                </div>
                <SubscriptionManagement
                  className="mx-auto max-w-3xl"
                  currentPlan={currentPlan}
                  updatePlan={{
                    currentPlan: currentPlan.plan,
                    plans: plans,
                    onPlanChange: (planId, interval) => {
                        if (typeof window !== 'undefined') {
                          const _interval = interval === 'yearly' ? 'yearly' : 'monthly'
                          window.dispatchEvent(new CustomEvent('open-pricing-dialog', { detail: { planId, interval: _interval } }))
                        }
                      },
                    triggerText: 'Oppdater',
                  }}
                  cancelSubscription={{
                    title: 'Avslutt abonnement',
                    description: 'Er du sikker på at du vil avslutte abonnementet?',
                    plan: currentPlan.plan,
                    onCancel: async (planId) => {
                      console.log('Avslutt abonnement', planId)
                    }
                  }}
                />
                </>
              ) : (
                <div className="flex items-center justify-center">
                  <PricingTableThree
                    plans={plans}
                    onPlanSelect={handlePlanSelect}
                    className={"mx-auto w-full max-w-4xl"}
                    variant="small"
                    showFooter={true}
                    footerText={"Trenger du mer informasjon? Kontakt oss for en tilpasset løsning."}
                    footerButtonText="Kontakt oss"
                    onFooterButtonClick={() => window.location.href = "/contact"}
                  />
                </div>
              )}
            </div>
          )}
        </div>
        </SheetContent>
    </Sheet>
    </>
  )
}
