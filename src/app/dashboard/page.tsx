"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AppLayout } from "@/components/layouts/app-layout"
import { Users, DollarSign, CheckCircle, Clock, TrendingUp, UserPlus } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { getCurrentMonth, getCurrentYear } from "@/lib/utils"

async function fetchDashboardStats() {
  const supabase = createClient()
  const month = getCurrentMonth()
  const year = getCurrentYear()

  const { count: total_employees } = await supabase
    .from("employees").select("*", { count: "exact", head: true })

  const { count: active_employees } = await supabase
    .from("employees").select("*", { count: "exact", head: true }).eq("status", "active")

  const { data: monthPayrolls } = await supabase
    .from("payrolls").select("*, employee:employees(*)").eq("month", month).eq("year", year)

  const monthly_expense = (monthPayrolls || []).reduce((sum: number, p: any) => sum + p.final_salary, 0)
  const paid_count = (monthPayrolls || []).filter((p: any) => p.status === "paid").length
  const unpaid_count = (monthPayrolls || []).filter((p: any) => p.status === "pending").length

  const { data: recentPayments } = await supabase
    .from("payments").select("*, payroll:payrolls(*, employee:employees(*))")
    .order("paid_at", { ascending: false }).limit(5)

  const { data: newEmployees } = await supabase
    .from("employees").select("*").order("created_at", { ascending: false }).limit(5)

  return {
    total_employees: total_employees || 0,
    active_employees: active_employees || 0,
    monthly_expense,
    paid_count,
    unpaid_count,
    recent_payments: recentPayments || [],
    new_employees: newEmployees || [],
    month,
    year,
  }
}

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
  })

  if (isLoading) {
    return (
      <AppLayout>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-destructive">Ma'lumotlarni yuklashda xatolik: {(error as Error).message}</p>
        </div>
      </AppLayout>
    )
  }

  const stats = [
    {
      title: "Jami xodimlar",
      value: data?.total_employees || 0,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900",
    },
    {
      title: `Shu oy xarajati (${data?.month}.${data?.year})`,
      value: formatCurrency(data?.monthly_expense || 0),
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-100 dark:bg-green-900",
    },
    {
      title: "To'langan",
      value: data?.paid_count || 0,
      icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-100 dark:bg-emerald-900",
    },
    {
      title: "To'lanmagan",
      value: data?.unpaid_count || 0,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-100 dark:bg-amber-900",
    },
  ]

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`rounded-lg p-2 ${stat.bg}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Oxirgi to'lovlar</CardTitle>
            </CardHeader>
            <CardContent>
              {data?.recent_payments && data.recent_payments.length > 0 ? (
                <div className="space-y-3">
                  {data.recent_payments.map((payment: any) => (
                    <div key={payment.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {payment.payroll?.employee?.fullname || "Noma'lum"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(payment.paid_at).toLocaleDateString("uz-UZ")}
                        </p>
                      </div>
                      <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Hali to'lovlar yo'q</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Yangi xodimlar</CardTitle>
            </CardHeader>
            <CardContent>
              {data?.new_employees && data.new_employees.length > 0 ? (
                <div className="space-y-3">
                  {data.new_employees.map((employee: any) => (
                    <div key={employee.id} className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <UserPlus className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{employee.fullname}</p>
                        <p className="text-sm text-muted-foreground">{employee.position}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Yangi xodimlar yo'q</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
