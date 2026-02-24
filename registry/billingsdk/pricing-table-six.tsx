"use client"

import React from 'react'
import { Button } from '@/components/ui/button'

export type PlanProps = {
  id: string
  title: string
  description?: string
  monthlyPrice?: number
  yearlyPrice?: number
  isFeatured?: boolean
  isCustom?: boolean
  features?: string[]
}

type Props = {
  plans: PlanProps[]
  onPlanSelect?: (planId: string) => void
}

export function PricingTableSix({ plans, onPlanSelect }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {plans.map((p) => (
          <div key={p.id} className={`border rounded-lg p-6 ${p.isFeatured ? 'ring-2 ring-indigo-300' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{p.title}</h3>
                {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{p.yearlyPrice ?? p.monthlyPrice ?? 0} kr</div>
                <div className="text-sm text-muted-foreground">/ år</div>
              </div>
            </div>

            <ul className="mt-4 space-y-2 text-sm">
              {(p.features || []).map((f, i) => (
                <li key={i} className="before:content-['•'] before:mr-2">{f}</li>
              ))}
            </ul>

            <div className="mt-6">
              {p.isCustom ? (
                <Button variant="outline" onClick={() => onPlanSelect?.(p.id)}>
                  Kontakt oss
                </Button>
              ) : (
                <Button onClick={() => onPlanSelect?.(p.id)}>
                  Velg {p.title}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PricingTableSix