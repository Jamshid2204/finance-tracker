import { createClient } from "@/lib/supabase/server"
import { DashboardStats } from "@/types"
import { getCurrentMonth, getCurrentYear } from "@/lib/utils"
import { getRecentPayments } from "./payment.service"

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient()
  const month = getCurrentMonth()
  const year = getCurrentYear()

  const { count: total_employees } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true })

  const { count: active_employees } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")

  const { data: monthPayrolls } = await supabase
    .from("payrolls")
    .select("*")
    .eq("month", month)
    .eq("year", year)

  const monthly_expense = (monthPayrolls || []).reduce((sum: any, p: any) => sum + Number(p.final_salary), 0)
  const paid_count = (monthPayrolls || []).filter((p: any) => p.status === "paid").length
  const unpaid_count = (monthPayrolls || []).filter((p: any) => p.status === "pending").length

  const recent_payments = await getRecentPayments(5)

  const { data: new_employees } = await supabase
    .from("employees")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5)

  return {
    total_employees: total_employees || 0,
    active_employees: active_employees || 0,
    monthly_expense,
    paid_count,
    unpaid_count,
    recent_payments,
    new_employees: (new_employees || []) as DashboardStats["new_employees"],
  }
}
