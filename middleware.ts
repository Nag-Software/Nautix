import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSubscriptionForCustomer } from '@/lib/stripe'

export async function middleware(request: NextRequest) {
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
  let hasAccess = false
  if (user) {
    try {
      // Use stored stripe_customer_id and derive plan & access directly from Stripe
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .limit(1)
        .maybeSingle()

      const customerId = (profile as any)?.stripe_customer_id ?? null

      // Debug: log profile info
      // eslint-disable-next-line no-console
      console.log('[middleware] profile fetched', { userId: user.id, customerId })

      if (customerId) {
        try {
          const subInfo = await getSubscriptionForCustomer(customerId)
          // eslint-disable-next-line no-console
          console.log('[middleware] subscription info', { userId: user.id, status: subInfo.status, planId: subInfo.planId })
          if (subInfo.status === 'active' || subInfo.status === 'trialing') {
            hasAccess = true
          }
        } catch (e) {
          // If stripe check fails, be conservative and leave hasAccess as false
          // eslint-disable-next-line no-console
          console.error('[middleware] stripe check failed for user', user.id, e)
        }
      }
    } catch (e) {
      // ignore and treat as no access
      // eslint-disable-next-line no-console
      console.error('[middleware] error fetching profile for user', user.id, e)
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
    const allowedFromNoSub = ['/nosub', '/login', '/signup', '/reset-password']
    const isAllowed = allowedFromNoSub.some((p) => request.nextUrl.pathname.startsWith(p))
    if (!isAllowed) {
      const url = request.nextUrl.clone()
      url.pathname = '/nosub'
      return NextResponse.redirect(url)
    }
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
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
