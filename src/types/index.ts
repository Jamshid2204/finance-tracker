export type Role = "owner" | "admin" | "hr" | "accountant" | "employee"

export interface User {
  id: string
  email: string
  role: Role
  employee_id: string | null
  created_at: string
}

export interface Employee {
  id: string
  fullname: string
  phone: string
  position: string
  department: string
  salary: number
  status: "active" | "inactive"
  telegram_chat_id: string | null
  avatar: string | null
  created_at: string
}

export interface Payroll {
  id: string
  employee_id: string
  month: number
  year: number
  base_salary: number
  bonus: number
  penalty: number
  advance: number
  final_salary: number
  status: "pending" | "paid" | "cancelled"
  created_at: string
  employee?: Employee
}

export interface Payment {
  id: string
  payroll_id: string
  amount: number
  payment_method: "cash" | "card" | "bank" | "click" | "payme"
  paid_at: string
  note: string | null
  payroll?: Payroll & { employee?: Employee }
}

export interface Notification {
  id: string
  employee_id: string
  title: string
  message: string
  read: boolean
  created_at: string
}

export interface TelegramLog {
  id: string
  employee_id: string
  message: string
  status: "sent" | "failed"
  created_at: string
}

export interface DashboardStats {
  total_employees: number
  active_employees: number
  monthly_expense: number
  paid_count: number
  unpaid_count: number
  recent_payments: Payment[]
  new_employees: Employee[]
}

export interface PaginationParams {
  page: number
  pageSize: number
  search?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
