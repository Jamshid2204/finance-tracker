import { createClient } from "@/lib/supabase/server"
import { Employee, PaginatedResult, PaginationParams } from "@/types"
import { logAudit } from "@/lib/auth/audit"

export async function getEmployees(params: PaginationParams): Promise<PaginatedResult<Employee>> {
  const supabase = await createClient()
  const { page, pageSize, search, sortBy = "fullname", sortOrder = "asc" } = params

  let query = supabase.from("employees").select("*", { count: "exact" })

  if (search) {
    query = query.or(`fullname.ilike.%${search}%,position.ilike.%${search}%,department.ilike.%${search}%`)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await query
    .order(sortBy, { ascending: sortOrder === "asc" })
    .range(from, to)

  if (error) throw new Error(error.message)

  return {
    data: data as Employee[],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  }
}

export async function getEmployee(id: string): Promise<Employee | null> {
  const supabase = await createClient()
  const { data } = await supabase.from("employees").select("*").eq("id", id).single()
  return data as Employee | null
}

export async function getAllEmployees(): Promise<Employee[]> {
  const supabase = await createClient()
  const { data } = await supabase.from("employees").select("*").eq("status", "active").order("fullname")
  return (data as Employee[]) || []
}

export async function createEmployee(input: Partial<Employee>, userId: string): Promise<Employee> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("employees").insert(input).select().single()
  if (error) throw new Error(error.message)

  await logAudit({
    userId,
    action: "create",
    entityType: "employees",
    entityId: data.id,
    newValues: input as Record<string, unknown>,
  })

  return data as Employee
}

export async function updateEmployee(id: string, input: Partial<Employee>, userId: string, oldValues: Partial<Employee>): Promise<Employee> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("employees").update(input).eq("id", id).select().single()
  if (error) throw new Error(error.message)

  await logAudit({
    userId,
    action: "update",
    entityType: "employees",
    entityId: id,
    oldValues: oldValues as Record<string, unknown>,
    newValues: input as Record<string, unknown>,
  })

  return data as Employee
}

export async function deleteEmployee(id: string, userId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from("employees").delete().eq("id", id)
  if (error) throw new Error(error.message)

  await logAudit({
    userId,
    action: "delete",
    entityType: "employees",
    entityId: id,
  })
}

export async function toggleEmployeeStatus(id: string, status: "active" | "inactive", userId: string): Promise<Employee> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("employees").update({ status }).eq("id", id).select().single()
  if (error) throw new Error(error.message)
  return data as Employee
}
