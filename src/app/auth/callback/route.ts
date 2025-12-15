import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const supabase = await createClient();
    
    if (!supabase) {
      return NextResponse.redirect(`${origin}/login?error=supabase_not_configured`);
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Ensure next path starts with /
      const redirectPath = next.startsWith('/') ? next : `/${next}`;
      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
    
    console.error('Auth callback error:', error.message);
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
