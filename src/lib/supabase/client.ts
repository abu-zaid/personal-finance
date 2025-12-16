import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Singleton instance for browser client
let supabaseInstance: SupabaseClient | null = null;

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client during build or when env vars are missing
    console.warn('Supabase environment variables are missing. Using mock client.');
    return null;
  }
  
  // Return existing instance if available (singleton pattern)
  if (supabaseInstance) {
    return supabaseInstance;
  }
  
  supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}
