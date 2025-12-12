// Supabase server client utilities

import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/database.types'

/**
 * Creates a Supabase client for server-side usage using cookie-based auth.
 * Returns null if environment variables are not configured.
 *
 * Note: Next.js 15 requires awaiting cookies() to satisfy dynamic API analysis.
 */
export async function createClient(): Promise<SupabaseClient<Database> | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  const cookieStore = await cookies()

  const client = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string): string | undefined {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions): void {
        try {
          cookieStore.set({
            name,
            value,
            ...options,
          })
        } catch {
          // Setting cookies can fail within server components; ignored if middleware handles session refresh.
        }
      },
      remove(name: string, options: CookieOptions): void {
        try {
          cookieStore.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          })
        } catch {
          // Removing cookies can fail within server components; ignored if middleware handles session refresh.
        }
      },
    },
  })

  return client
}
