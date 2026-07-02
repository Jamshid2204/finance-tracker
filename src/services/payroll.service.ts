import { createClient } from "@/lib/supabase/server"
import { Payroll, PaginatedResult, PaginationParams } from "@/types"
import { calculateFinalSalary } from "@/lib/validations/payroll"
import { logAudit } from "@/lib/auth/audit"

export async function getPayrolls(params: PaginationParams & { month?: number; year?: number; status?: string }): Promise<PaginatedResult<Payroll>> {
  const supabase = await createClient()
  const { page, pageSize, search, month, year, status, sortBy = "created_at", sortOrder = "desc" } = params

  let query = supabase.from("payrolls").select("*, employee:employees(*)", { count: "exact" })

  if (month) query = query.eq("month", month)
  if (year) query = query.eq("year", year)
  if (status) query = query.eq("status", status)
  if (search) {
    query = query.textSearch("employee.fullname", search)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await query
    .order(sortBy, { ascending: sortOrder === "asc" })
    .range(from, to)

  if (error) throw new Error(error.message)

  return {
    data: data as Payroll[],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  }
}

export async function getPayroll(id: string): Promise<Payroll | null> {
  const supabase = await createClient()
  const { data } = await supabase.from("payrolls").select("*, employee:employees(*)").eq("id", id).single()
  return data as Payroll | null
}

export async function createPayroll(input: {
  employee_id: string
  month: number
  year: number
  base_salary: number
  bonus?: number
  penalty?: number
  advance?: number
}, userId: string): Promise<Payroll> {
  const supabase = await createClient()
  const bonus = input.bonus || 0
  const penalty = input.penalty || 0
  const advance = input.advance || 0
  const final_salary = calculateFinalSalary(input.base_salary, bonus, penalty, advance)

  const { data, error } = await supabase.from("payrolls").insert({
    ...input,
    bonus,
    penalty,
    advance,
    final_salary,
  }).select("*, employee:employees(*)").single()

  if (error) throw new Error(error.message)

  await logAudit({
    userId,
    action: "create",
    entityType: "payrolls",
    entityId: data.id,
    newValues: { ...input, final_salary },
  })

  return data as Payroll
}

export async function updatePayrollStatus(id: string, status: "pending" | "paid" | "cancelled", userId: string): Promise<Payroll> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("payrolls").update({ status }).eq("id", id).select("*, employee:employees(*)").single()
  if (error) throw new Error(error.message)

  await logAudit({
    userId,
    action: "update",
    entityType: "payrolls",
    entityId: id,
    newValues: { status },
  })

  return data as Payroll
}

export async function getPayrollStats(month: number, year: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("payrolls")
    .select("*")
    .eq("month", month)
    .eq("year", year)

  if (error) throw new Error(error.message)

  const total = data.reduce((sum: any, p: any) => sum + Number(p.final_salary), 0)
  const paid = data.filter((p: any) => p.status === "paid").reduce((sum: any, p: any) => sum + Number(p.final_salary), 0)
  const pending = data.filter((p: any) => p.status === "pending").reduce((sum: any, p: any) => sum + Number(p.final_salary), 0)

  return {
    total,
    paid,
    pending,
    count: data.length,
    paidCount: data.filter((p: any) => p.status === "paid").length,
    pendingCount: data.filter((p: any) => p.status === "pending").length,
  }
}
