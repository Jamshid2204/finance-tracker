import { createClient } from "@/lib/supabase/server"

export async function getKPITargets(month: number, year: number) {
  const supabase = await createClient()

  const { data } = await supabase
    .from("kpi_targets")
    .select("*, employee:employees(fullname, position)")
    .eq("month", month)
    .eq("year", year)
    .order("created_at", { ascending: false })

  return (data || []) as any[]
}

export async function getKPIResults(month: number, year: number) {
  const supabase = await createClient()

  const { data } = await supabase
    .from("kpi_results")
    .select("*, employee:employees(fullname, position), payroll:payrolls(id, status)")
    .eq("month", month)
    .eq("year", year)
    .order("created_at", { ascending: false })

  return (data || []) as any[]
}

export async function calculateKPIBonus(
  employeeId: string,
  month: number,
  year: number,
  quantityProduced: number
) {
  const supabase = await createClient()

  const { data: target } = await supabase
    .from("kpi_targets")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("month", month)
    .eq("year", year)
    .single()

  if (!target) return 0

  const excess = Math.max(0, quantityProduced - Number(target.target_quantity))
  return excess * Number(target.unit_price)
}
