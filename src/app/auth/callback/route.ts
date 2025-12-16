import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';
  
  // Get the correct origin for redirects
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  const origin = forwardedHost 
    ? `${forwardedProto}://${forwardedHost}` 
    : requestUrl.origin;

  if (code) {
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.redirect(`${origin}/login?error=supabase_not_configured`);
    }

    // Create response that we'll use for the redirect - cookies will be set on this
    const redirectPath = next.startsWith('/') ? next : `/${next}`;
    const redirectUrl = `${origin}${redirectPath}`;
    let response = NextResponse.redirect(redirectUrl);

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.headers.get('cookie')?.split('; ').map(cookie => {
            const [name, ...rest] = cookie.split('=');
            return { name, value: rest.join('=') };
          }) ?? [];
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      return response;
    }
    
    console.error('Auth callback error:', error.message);
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
