"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NoSubSync() {
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        const res = await fetch('/api/stripe/sync', { method: 'POST', cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (!mounted) return
        if (json?.access) {
          router.replace('/')
        }
      } catch (err) {
        // ignore sync errors; user can retry from /nosub
      }
    })()

    return () => {
      mounted = false
    }
  }, [router])

  return null
}
