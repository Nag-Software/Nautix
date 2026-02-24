"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, Zap } from "lucide-react"

export default function SubscriptionBanner() {
  const [loading, setLoading] = useState(true)
  const [access, setAccess] = useState<boolean | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/usage')
        if (!res.ok) return
        const j = await res.json()
        if (!mounted) return
        setAccess(Boolean(j.access))
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const openBilling = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-pricing-dialog', { detail: {} }))
    }
  }

  if (loading) return null
  if (access) return null

  return (
    <div className="rounded-lg border p-4 bg-yellow-50 dark:bg-yellow-900/20">
      <div className="flex items-start gap-3">
        <div className="pt-0.5">
          <AlertCircle className="h-5 w-5 text-rose-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">Abonnement kreves</h3>
          <p className="text-sm text-muted-foreground">Du må oppgradere for å bruke denne funksjonen.</p>
        </div>
        <div className="shrink-0">
          <Button onClick={openBilling} size="sm">Oppgrader</Button>
        </div>
      </div>
    </div>
  )
}
