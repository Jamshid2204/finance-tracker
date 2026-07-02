import { createClient } from "@/lib/supabase/server"

export async function getMonthlyReport(month: number, year: number) {
  const supabase = await createClient()
  const { data: payrolls } = await supabase
    .from("payrolls")
    .select("*, employee:employees(*)")
    .eq("month", month)
    .eq("year", year)

  if (!payrolls) return null

  const totalSalary = payrolls.reduce((sum: any, p: any) => sum + Number(p.final_salary), 0)
  const totalBonus = payrolls.reduce((sum: any, p: any) => sum + Number(p.bonus), 0)
  const totalPenalty = payrolls.reduce((sum: any, p: any) => sum + Number(p.penalty), 0)
  const totalAdvance = payrolls.reduce((sum: any, p: any) => sum + Number(p.advance), 0)

  return {
    month,
    year,
    totalEmployees: payrolls.length,
    totalSalary,
    totalBonus,
    totalPenalty,
    totalAdvance,
    paidCount: payrolls.filter((p: any) => p.status === "paid").length,
    pendingCount: payrolls.filter((p: any) => p.status === "pending").length,
    payrolls,
  }
}

export async function getYearlyReport(year: number) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("payrolls")
    .select("*, employee:employees(*)")
    .eq("year", year)

  if (!data) return null

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const monthPayrolls = data.filter((p: any) => p.month === i + 1)
    return {
      month: i + 1,
      total: monthPayrolls.reduce((sum: any, p: any) => sum + Number(p.final_salary), 0),
      count: monthPayrolls.length,
    }
  })

  return {
    year,
    totalAnnual: data.reduce((sum: any, p: any) => sum + Number(p.final_salary), 0),
    monthlyData,
  }
}

export async function getEmployeeReport(employeeId: string) {
  const supabase = await createClient()
  const { data: payrolls } = await supabase
    .from("payrolls")
    .select("*, payments(*)")
    .eq("employee_id", employeeId)
    .order("year", { ascending: false })
    .order("month", { ascending: false })

  if (!payrolls) return null

  return {
    employeeId,
    totalPaid: payrolls.filter((p: any) => p.status === "paid").reduce((sum: any, p: any) => sum + Number(p.final_salary), 0),
    totalPending: payrolls.filter((p: any) => p.status === "pending").reduce((sum: any, p: any) => sum + Number(p.final_salary), 0),
    payrolls,
  }
}
