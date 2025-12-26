import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // If we want to intercept here, we can, but usually we just let updateSession handle everything.
  // However, we want to allow demo mode which updates session might not know about unless we modify it there.
  // MODIFYING HERE: We will check cookie and skip updateSession redirect logic if present.

  // Actually, updateSession logic is what redirects. `middleware.ts` just calls it.
  // The implementation in `lib/supabase/middleware.ts` contains the logic.
  // Wait, I was editing `src/middleware.ts` but the redirect logic is in `src/lib/supabase/middleware.ts`!
  // Step 19 output shows `src/lib/supabase/middleware.ts` has the redirect logic.
  // Step 15 output shows `src/middleware.ts` just calls `updateSession`.

  // MY MISTAKE: I was trying to edit `src/middleware.ts` but the logic I wanted to change (lines 43+) was in `src/lib/supabase/middleware.ts`!
  // No wonder `replace_file_content` failed, the content I was matching was NOT in `src/middleware.ts`.

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
