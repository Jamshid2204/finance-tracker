import { cookies } from "next/headers"

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return !!(
    url &&
    key &&
    url !== "https://your-project.supabase.co" &&
    key !== "your-anon-key"
  )
}

export async function createClient() {
  if (!isSupabaseConfigured()) {
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
            order: () => ({ range: () => Promise.resolve({ data: [], error: null, count: 0 }) }),
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
            limit: () => Promise.resolve({ data: [], error: null }),
          }),
          order: () => ({ range: () => Promise.resolve({ data: [], error: null, count: 0 }) }),
          limit: () => Promise.resolve({ data: [], error: null }),
        }),
        insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: { message: "Supabase sozlanmagan" } }) }) }),
        update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: { message: "Supabase sozlanmagan" } }) }) }) }),
        delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
      }),
    } as any
  }

  const { createServerClient } = await import("@supabase/ssr")
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY sozlanmagan")
  }

  const { createClient } = require("@supabase/supabase-js")
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
