Stripe integration setup

Required environment variables (add to `.env.local`):

- `STRIPE_SECRET_KEY` — your Stripe secret key
- `STRIPE_PUBLISHABLE_KEY` — your Stripe publishable key (optional, for client-side usage)
- `STRIPE_WEBHOOK_SECRET` — webhook signing secret from Stripe
- `NEXT_PUBLIC_PRICE_ID_BASIC` — Stripe price ID for Basic plan
- `NEXT_PUBLIC_PRICE_ID_PREMIUM` — Stripe price ID for Premium plan
You should instead set price ids per the public plans used below:

- `NEXT_PUBLIC_PRICE_ID_MATROSEN` — Stripe price ID for Matrosen (29 kr/år)
- `NEXT_PUBLIC_PRICE_ID_MASKINISTEN` — Stripe price ID for Maskinisten (79 kr/år)
- `NEXT_PUBLIC_PRICE_ID_KAPTEINEN` — Stripe price ID for Kapteinen (129 kr/år)
- `NEXT_PUBLIC_APP_URL` — your app URL (e.g. https://example.com or http://localhost:3000)

Quick steps:

1. Run `pnpm install` or `npm install` to install the `stripe` package.
2. Create price objects in Stripe for your plans and set the `NEXT_PUBLIC_PRICE_ID_*` values.
3. Deploy webhook endpoint or expose locally using the Stripe CLI and configure `STRIPE_WEBHOOK_SECRET`.
   Example: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. Use the Billing dialog in the app to start checkout or manage subscriptions.

DB migration:
Run the SQL in `supabase/add_stripe_fields.sql` to add columns to your `users` table.
