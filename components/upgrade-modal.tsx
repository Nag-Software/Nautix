"use client"

import React, { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
const stripePromise = publishableKey ? loadStripe(publishableKey) : null

type Props = {
	priceIdMonthly?: string
	priceIdYearly?: string
	userId?: string | undefined
}

export default function UpgradeModal({ priceIdMonthly = '', priceIdYearly = '', userId }: Props) {
	const [loading, setLoading] = useState(false)

	async function startCheckout(priceId: string) {
		try {
			setLoading(true)
			if (!stripePromise) {
				alert('Stripe publishable key missing. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in env.')
				setLoading(false)
				return
			}

			const res = await fetch('/api/create-checkout-session', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ priceId, userId }),
			})

			const data = await res.json()
			if (!data.sessionId) throw new Error(data.error || 'Missing sessionId')

			const stripe = await stripePromise
			if (!stripe) throw new Error('Could not load Stripe')

			const { error } = await (stripe as any).redirectToCheckout({ sessionId: data.sessionId })
			if (error) console.error('Stripe redirect error:', error)
		} catch (err) {
			console.error('Checkout error:', err)
			alert('Kunne ikke starte betaling. Sjekk konsollen for detaljer.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="mt-6">
			<div className="flex gap-2 items-center">
				<button
					className="rounded-md bg-primary px-3 py-1 text-sm text-white"
					onClick={() => startCheckout(priceIdMonthly)}
					disabled={loading || !priceIdMonthly}
				>
					{loading ? 'Starter...' : 'Oppgrader - Månedlig'}
				</button>
				<button
					className="rounded-md border px-3 py-1 text-sm"
					onClick={() => startCheckout(priceIdYearly)}
					disabled={loading || !priceIdYearly}
				>
					{loading ? 'Starter...' : 'Oppgrader - Årlig'}
				</button>
			</div>
		</div>
	)
}
