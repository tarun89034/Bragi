import { createBrowserClient } from '@supabase/ssr'
import { type Database } from '@/database.types';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    // Provide a clearer error rather than crashing deep inside the SDK.
    // Ensure your .env has NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
    throw new Error('Supabase client is not configured. Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }

  return createBrowserClient<Database>(url, key)
}
