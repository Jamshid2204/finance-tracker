import { createClient } from "@/lib/supabase/server"
import { Payment, PaginatedResult, PaginationParams } from "@/types"

export async function getPayments(params: PaginationParams & { payroll_id?: string }): Promise<PaginatedResult<Payment>> {
  const supabase = await createClient()
  const { page, pageSize, payroll_id, sortBy = "paid_at", sortOrder = "desc" } = params

  let query = supabase.from("payments").select("*, payroll:payrolls(*, employee:employees(*))", { count: "exact" })

  if (payroll_id) query = query.eq("payroll_id", payroll_id)

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await query
    .order(sortBy, { ascending: sortOrder === "asc" })
    .range(from, to)

  if (error) throw new Error(error.message)

  return {
    data: data as Payment[],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  }
}

export async function createPayment(input: {
  payroll_id: string
  amount: number
  payment_method: "cash" | "card" | "bank" | "click" | "payme"
  note?: string | null
}, userId: string): Promise<Payment> {
  const supabase = await createClient()

  const { data: payroll } = await supabase
    .from("payrolls")
    .update({ status: "paid" })
    .eq("id", input.payroll_id)
    .select()
    .single()

  if (!payroll) throw new Error("Payroll not found")

  const { data, error } = await supabase.from("payments").insert({
    ...input,
    paid_at: new Date().toISOString(),
  }).select("*, payroll:payrolls(*, employee:employees(*))").single()

  if (error) throw new Error(error.message)

  return data as Payment
}

export async function getRecentPayments(limit = 5): Promise<Payment[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("payments")
    .select("*, payroll:payrolls(*, employee:employees(*))")
    .order("paid_at", { ascending: false })
    .limit(limit)

  return (data as Payment[]) || []
}
