import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Paths that must be completely skipped by auth middleware.
// Stripe (and any other server-to-server webhooks) must never hit auth redirects.
const UNPROTECTED_API_PATHS = [
  '/api/stripe/webhook',
]

export async function middleware(request: NextRequest) {
  // Hard bypass for webhook endpoints — return before ANY Supabase work.
  if (UNPROTECTED_API_PATHS.some((p) => request.nextUrl.pathname.startsWith(p))) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Allow API routes to proceed without page-redirects so API handlers
  // can return proper JSON responses (e.g. /api/stripe/checkout).
  if (request.nextUrl.pathname.startsWith('/api')) {
    return supabaseResponse
  }

  // Determine subscription/access status for signed-in users
  // NOTE: Middleware runs in the Edge runtime. Avoid Stripe SDK calls here.
  let hasAccess = false
  if (user) {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('stripe_subscription_id')
        .eq('id', user.id)
        .limit(1)
        .maybeSingle()

      hasAccess = Boolean((profile as any)?.stripe_subscription_id)
    } catch (e) {
      // Fallback: if profile columns are missing, avoid false redirects for known customers
      try {
        const { data: profileFallback } = await supabase
          .from('user_profiles')
          .select('stripe_customer_id')
          .eq('id', user.id)
          .limit(1)
          .maybeSingle()

        hasAccess = Boolean((profileFallback as any)?.stripe_customer_id)
      } catch (fallbackErr) {
        // ignore and treat as no access
        // eslint-disable-next-line no-console
        console.error('[middleware] error fetching profile for user', user.id, fallbackErr)
      }
    }
  }

  // Update last_seen_at for authenticated users
  if (user) {
    try {
      await supabase.rpc('update_last_seen', { user_id: user.id })
    } catch {
      // Silently fail if update fails - don't block the request
    }
  }

  // If user is not signed in, allow access to public pages (login, signup, reset-password)
  if (!user) {
    const publicPaths = ['/login', '/signup', '/reset-password']
    const isPublic = publicPaths.some((p) => request.nextUrl.pathname.startsWith(p))
    if (!isPublic) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  // If user is signed in but has no subscription/access, redirect to /nosub
  if (user && !hasAccess) {
    const subscriptionSuccess = request.nextUrl.searchParams.get('subscription') === 'success'
    if (subscriptionSuccess) return supabaseResponse
    const allowedFromNoSub = ['/nosub', '/login', '/signup', '/reset-password', '/sjefen']
    const isAllowed = allowedFromNoSub.some((p) => request.nextUrl.pathname.startsWith(p))
    if (!isAllowed) {
      const url = request.nextUrl.clone()
      url.pathname = '/nosub'
      return NextResponse.redirect(url)
    }
  }

  // If user has access, prevent visiting /nosub
  if (user && hasAccess && request.nextUrl.pathname.startsWith('/nosub')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Check admin access for /sjefen route
  if (user && request.nextUrl.pathname.startsWith('/sjefen')) {
    const { data: adminData, error } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    // If there's an error or no admin data, redirect to home
    if (error || !adminData) {
      console.log('Admin check failed:', { error, adminData, userId: user.id })
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // If user is signed in and has access, prevent visiting auth pages
  if (user && hasAccess && (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - Stripe webhook (must be publicly reachable, no auth middleware)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
