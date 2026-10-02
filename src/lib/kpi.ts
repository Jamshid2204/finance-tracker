export async function getKpiInfo(
  supabase: any,
  employeeId: string,
  month: number,
  year: number
): Promise<{ targetHours: number; hoursWorked: number; percentage: number }> {
  const { data: target } = await supabase
    .from("kpi_targets")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("month", month)
    .eq("year", year)
    .maybeSingle()

  const { data: result } = await supabase
    .from("kpi_results")
    .select("hours_worked")
    .eq("employee_id", employeeId)
    .eq("month", month)
    .eq("year", year)
    .maybeSingle()

  let targetHours = target ? Number(target.target_hours) : 0
  let hoursWorked = result ? Number(result.hours_worked) : 0

  if (!target && !result) {
    const start = `${year}-${String(month).padStart(2, "0")}-01`
    const end = `${year}-${String(month + 1).padStart(2, "0")}-01`
    const { data: attendance } = await supabase
      .from("attendance")
      .select("arrived_at, left_at")
      .eq("employee_id", employeeId)
      .gte("date", start)
      .lt("date", end)

    hoursWorked = (attendance || []).reduce((sum: number, a: any) => {
      if (!a.arrived_at || !a.left_at) return sum
      const diff = (new Date(a.left_at).getTime() - new Date(a.arrived_at).getTime()) / 3600000
      return sum + Math.max(0, diff)
    }, 0)

    if (hoursWorked === 0) {
      const { data: emp } = await supabase
        .from("employees")
        .select("monthly_target_hours")
        .eq("id", employeeId)
        .maybeSingle()
      targetHours = emp ? Number(emp.monthly_target_hours) : 0
    }
  }

  const percentage = targetHours > 0 ? hoursWorked / targetHours : 1
  return {
    targetHours: Math.round(targetHours * 100) / 100,
    hoursWorked: Math.round(hoursWorked * 100) / 100,
    percentage: Math.round(percentage * 100) / 100,
  }
}

export function kpiFinalSalary(baseSalary: number, percentage: number, bonus = 0, penalty = 0, advance = 0): number {
  return Math.round((baseSalary * percentage + bonus - penalty - advance) * 100) / 100
}
