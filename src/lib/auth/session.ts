import { createClient } from "@/lib/supabase/server"
import { User, Role } from "@/types"

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) return null

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single()

  return profile as User
}

export async function requireAuth(allowedRoles?: Role[]): Promise<User> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("Authentication required")
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new Error("Insufficient permissions")
  }

  return user
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}
