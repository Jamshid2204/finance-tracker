import { Role } from "@/types"

export const ROLES: { value: Role; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "hr", label: "HR" },
  { value: "accountant", label: "Accountant" },
  { value: "employee", label: "Employee" },
]

export const PAYMENT_METHODS = [
  { value: "cash", label: "Naqd" },
  { value: "card", label: "Karta" },
  { value: "bank", label: "Bank" },
  { value: "click", label: "Click" },
  { value: "payme", label: "Payme" },
] as const

export const PAYROLL_STATUS = [
  { value: "pending", label: "Kutilmoqda", color: "warning" },
  { value: "paid", label: "To'langan", color: "success" },
  { value: "cancelled", label: "Bekor qilingan", color: "destructive" },
] as const

export const EMPLOYEE_STATUS = [
  { value: "active", label: "Aktiv" },
  { value: "inactive", label: "Passiv" },
] as const

export const DEPARTMENTS = [
  "Boshqarma",
  "Buxgalteriya",
  "HR",
  "Savdo",
  "Marketing",
  "IT",
  "Ishlab chiqarish",
  "Logistika",
] as const

export const SIDEBAR_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard", roles: ["owner", "admin", "hr", "accountant"] },
  { href: "/employees", label: "Xodimlar", icon: "Users", roles: ["owner", "admin", "hr"] },
  { href: "/payroll", label: "Oyliklar", icon: "Wallet", roles: ["owner", "admin", "accountant"] },
  { href: "/payments", label: "To'lovlar", icon: "CreditCard", roles: ["owner", "admin", "accountant"] },
  { href: "/reports", label: "Hisobotlar", icon: "FileText", roles: ["owner", "admin", "accountant", "hr"] },
  { href: "/settings", label: "Sozlamalar", icon: "Settings", roles: ["owner", "admin"] },
] as const

export const PAGE_SIZE = 10
