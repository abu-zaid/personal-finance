import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function updateSession(request: NextRequest) {
  // If Supabase is not configured, just pass through
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log('[MIDDLEWARE]', request.nextUrl.pathname, 'User:', !!user);

  // Protected routes - redirect to login if not authenticated
  const protectedPaths = ['/dashboard', '/transactions', '/budgets', '/insights', '/settings', '/recurring', '/goals'];
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  const isDemo = request.cookies.get('demo_mode')?.value === 'true';

  // CRITICAL FIX: Only redirect if we're SURE there's no session
  // Check for session cookies before redirecting
  const hasSessionCookie = request.cookies.has('sb-access-token') ||
    request.cookies.has('sb-refresh-token');

  console.log('[MIDDLEWARE] Protected:', isProtectedPath, 'Demo:', isDemo, 'HasCookies:', hasSessionCookie);

  if (isProtectedPath && !user && !isDemo && !hasSessionCookie) {
    console.log('[MIDDLEWARE] Redirecting to login');
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  const authPaths = ['/login', '/signup'];
  const isAuthPath = authPaths.includes(request.nextUrl.pathname);

  if (isAuthPath && (user || isDemo)) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
