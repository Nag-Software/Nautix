"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

interface SubscriptionContextType {
  hasSubscription: boolean | null
  loading: boolean
  refresh: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/usage', { cache: 'no-store' })
      if (!res.ok) {
        setHasSubscription(false)
        return
      }
      const j = await res.json()
      setHasSubscription(Boolean(j.access))
    } catch (e) {
      setHasSubscription(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  // Redirect to /nosub if no subscription and not already on /nosub
  useEffect(() => {
    if (loading) return
    // don't redirect from auth or public pages
    const publicPaths = ['/nosub', '/login', '/signup', '/reset-password']
    const isPublic = publicPaths.some((p) => pathname?.startsWith(p))

    if (hasSubscription === false && !isPublic) {
      router.push('/nosub')
    }

    // If user gains subscription while on /nosub, do not force navigation.
    // Leaving navigation choice to the user so /nosub remains reachable.
  }, [hasSubscription, loading, pathname, router])

  return (
    <SubscriptionContext.Provider value={{ hasSubscription, loading, refresh: fetchStatus }}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext)
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider')
  return ctx
}
