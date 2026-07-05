"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@/types"

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

function createDemoUser(authUser?: { id?: string; email?: string }): User {
  return {
    id: authUser?.id || "demo-user",
    email: authUser?.email || "admin@demo.local",
    role: "admin",
    employee_id: null,
    created_at: new Date().toISOString(),
  }
}

export function useSession() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabaseRef = useRef(createClient())
  const isDemo = useRef(!isSupabaseConfigured())

  useEffect(() => {
    let mounted = true
    const supabase = supabaseRef.current

    const getUser = async () => {
      try {
        const result = await Promise.race([
          supabase.auth.getSession(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Supabase timeout")), 5000)
          ),
        ]) as any

        if (!mounted) return

        const session = result?.data?.session
        if (session?.user) {
          const profileResult = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .maybeSingle()
          if (mounted && profileResult?.data) {
            setUser(profileResult.data as User)
            return
          }
          // Auth user exists but no profile in users table yet
          if (mounted) {
            setUser(createDemoUser({ id: session.user.id, email: session.user.email }))
            return
          }
        }
      } catch (e) {
        console.error("Session fetch error:", e)
      }

      if (mounted) {
        setUser(createDemoUser())
      }
    }

    getUser().finally(() => { if (mounted) setLoading(false) })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
      if (!mounted) return
      if (session?.user) {
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle()
        if (mounted) {
          setUser((profile as User) || createDemoUser({ id: session.user.id, email: session.user.email }))
        }
      } else {
        if (mounted) setUser(isDemo.current ? createDemoUser() : null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = useCallback(async () => {
    const supabase = supabaseRef.current
    await supabase.auth.signOut()
    if (isDemo.current) {
      setUser(createDemoUser())
    } else {
      setUser(null)
    }
  }, [])

  return { user, loading, signOut }
}
