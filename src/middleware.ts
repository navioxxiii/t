import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  // Create a response object to pass through
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Return early if env vars are missing to avoid edge runtime errors
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    return supabaseResponse;
  }

  // Create Supabase client with Next.js 15 async cookie handling
  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if user is banned (for all authenticated routes)
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_banned, banned_reason, banned_at')
      .eq('id', user.id)
      .single();

    if (profile?.is_banned) {
      // Don't redirect if already on the account-suspended page (prevent loop)
      if (!request.nextUrl.pathname.startsWith('/account-suspended')) {
        // Redirect banned users to dedicated suspension page
        const suspendedUrl = new URL('/account-suspended', request.url);
        if (profile.banned_at) {
          suspendedUrl.searchParams.set('banned_at', profile.banned_at);
        }
        return NextResponse.redirect(suspendedUrl);
      }
    }

    // Check if email is verified for protected routes
    const protectedRoutes = ['/dashboard', '/swap', '/activity', '/settings', '/admin'];
    const isProtectedRoute = protectedRoutes.some(route =>
      request.nextUrl.pathname.startsWith(route)
    );

    if (isProtectedRoute && !user.email_confirmed_at) {
      // Redirect unverified users to email verification page
      const verifyUrl = new URL('/verify-email', request.url);
      return NextResponse.redirect(verifyUrl);
    }
  }

  // Protect dashboard routes (including /dashboard, /swap, /activity, /settings)
  const dashboardRoutes = ['/dashboard', '/swap', '/activity', '/settings'];
  const isDashboardRoute = dashboardRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isDashboardRoute && !user) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Protect support routes
  // /support/new - Public (accessible by everyone, uses public layout)
  // /support/guest/* - Public (guest access via token)
  // /support (list) - Authenticated only
  // /support/[ticketId] - Authenticated only
  const isSupportRoute = request.nextUrl.pathname.startsWith('/support');
  const isSupportNew = request.nextUrl.pathname === '/support/new';
  const isGuestSupport = request.nextUrl.pathname.startsWith('/support/guest/');

  // Protect authenticated support pages (list and ticket detail)
  if (isSupportRoute && !isSupportNew && !isGuestSupport && !user) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check if user is admin or super_admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Redirect authenticated users away from auth pages
  if (
    (request.nextUrl.pathname.startsWith('/login') ||
      request.nextUrl.pathname.startsWith('/register')) &&
    user
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled by route handlers directly)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
