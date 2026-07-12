import { createClient } from "@/lib/supabase/server"

export async function getTodayAttendance() {
  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]

  const { data } = await supabase
    .from("attendance")
    .select("*, employee:employees(fullname, position)")
    .eq("date", today)
    .order("arrived_at", { ascending: true })

  return (data || []) as any[]
}

export async function getAttendanceStats() {
  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]

  const { data } = await supabase
    .from("attendance")
    .select("id, arrived_at, left_at")
    .eq("date", today)

  const items = data || []
  const arrived = items.filter((a: any) => a.arrived_at)
  const left = items.filter((a: any) => a.left_at)

  return {
    total: items.length,
    arrived: arrived.length,
    left: left.length,
    still_at_work: arrived.length - left.length,
  }
}
