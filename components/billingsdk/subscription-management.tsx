"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { UpdatePlanDialog } from './update-plan-dialog'
import { CancelSubscriptionDialog } from './cancel-subscription-dialog'

import type { CurrentPlan, Plan } from '@/lib/billingsdk-config'

type UpdatePlanProps = {
  currentPlan: Plan
  plans: Plan[]
  onPlanChange: (planId: string, interval?: "monthly" | "yearly") => void
  triggerText?: string
}

type CancelSubscriptionProps = {
  title: string
  description?: string
  leftPanelImageUrl?: string
  plan: Plan
  warningTitle?: string
  warningText?: string
  onCancel: (planId: string) => Promise<void>
  onKeepSubscription?: (planId: string) => Promise<void>
}

type Props = {
  className?: string
  currentPlan: CurrentPlan
  updatePlan?: UpdatePlanProps
  cancelSubscription?: CancelSubscriptionProps
}

export function SubscriptionManagement({ className, currentPlan, updatePlan, cancelSubscription }: Props) {
  return (
    <div className={className}>
      <div className="border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Ditt abonnement</h3>
            <p className="text-sm text-muted-foreground">
              {currentPlan.plan.title}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold">{currentPlan.price}</div>
            <div className="text-sm text-muted-foreground">Neste fakturering: {currentPlan.nextBillingDate}</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <div className="text-sm">Betalingsmetode: {currentPlan.paymentMethod}</div>
            <div className="text-sm">
              Status: {currentPlan.status}
            </div>
          </div>
            <div className="flex max-w-full items-center justify-end gap-2">
              {updatePlan && (
                <UpdatePlanDialog
                  currentPlan={updatePlan.currentPlan}
                  plans={updatePlan.plans}
                  onPlanChange={updatePlan.onPlanChange}
                  triggerText={updatePlan.triggerText || 'Oppdater'}
                />
              )}

              {cancelSubscription && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/stripe/portal', { method: 'POST' })
                      const json = await res.json()
                      if (json?.url) window.location.href = json.url
                      else console.error('Portal error', json)
                    } catch (err) {
                      console.error(err)
                    }
                  }}
                >
                  Administrer abonnement
                </Button>
              )}
            </div>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionManagement
