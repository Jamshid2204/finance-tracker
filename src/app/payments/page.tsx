"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { AppLayout } from "@/components/layouts/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Pagination } from "@/components/ui/pagination"
import { Payment, Employee } from "@/types"
import { formatCurrency, getCurrentMonth, getCurrentYear, getMonthName } from "@/lib/utils"
import { CreditCard, Banknote, Landmark, Wallet, Smartphone, Search } from "lucide-react"
import { PAYMENT_METHODS } from "@/constants"

const methodIcons: Record<string, React.ReactNode> = {
  cash: <Banknote className="h-4 w-4" />,
  card: <CreditCard className="h-4 w-4" />,
  bank: <Landmark className="h-4 w-4" />,
  click: <Smartphone className="h-4 w-4" />,
  payme: <Wallet className="h-4 w-4" />,
}

const currentYear = getCurrentYear()

export default function PaymentsPage() {
  const [page, setPage] = useState(1)
  const [month, setMonth] = useState(getCurrentMonth())
  const [year, setYear] = useState(currentYear)
  const [employeeId, setEmployeeId] = useState("")
  const supabase = createClient()
  const pageSize = 10

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data } = await supabase.from("employees").select("*").order("fullname")
      return (data || []) as Employee[]
    },
  })

  const { data, isLoading } = useQuery({
    queryKey: ["payments", page, month, year, employeeId],
    queryFn: async () => {
      let payrollQuery = supabase
        .from("payrolls")
        .select("id")
        .eq("month", month)
        .eq("year", year)

      if (employeeId) {
        payrollQuery = payrollQuery.eq("employee_id", employeeId)
      }

      const { data: payrolls } = await payrollQuery
      const payrollIds = (payrolls || []).map((p: any) => p.id)

      if (payrollIds.length === 0) {
        return { data: [], total: 0, totalPages: 0 }
      }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      const { data, count } = await supabase
        .from("payments")
        .select("*, payroll:payrolls(*, employee:employees(*))", { count: "exact" })
        .in("payroll_id", payrollIds)
        .order("paid_at", { ascending: false })
        .range(from, to)

      return {
        data: (data || []) as Payment[],
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      }
    },
  })

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">To'lovlar</h1>

        <Card>
          <CardHeader>
            <CardTitle>To'lov tarixi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <Label htmlFor="month">Oy</Label>
                <Select
                  id="month"
                  value={String(month)}
                  onChange={(e) => { setMonth(Number(e.target.value)); setPage(1) }}
                  options={Array.from({ length: 12 }, (_, i) => ({
                    value: String(i + 1),
                    label: getMonthName(i + 1),
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Yil</Label>
                <Select
                  id="year"
                  value={String(year)}
                  onChange={(e) => { setYear(Number(e.target.value)); setPage(1) }}
                  options={years.map((y) => ({ value: String(y), label: String(y) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee">Xodim</Label>
                <Select
                  id="employee"
                  value={employeeId}
                  onChange={(e) => { setEmployeeId(e.target.value); setPage(1) }}
                  options={[
                    { value: "", label: "Barcha xodimlar" },
                    ...(employees || []).map((e) => ({
                      value: e.id,
                      label: `${e.fullname} - ${e.position}`,
                    })),
                  ]}
                />
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : data && data.data.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Xodim</TableHead>
                      <TableHead>Summa</TableHead>
                      <TableHead>Usul</TableHead>
                      <TableHead>Sana</TableHead>
                      <TableHead>Izoh</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((payment) => {
                      const method = PAYMENT_METHODS.find((m) => m.value === payment.payment_method)
                      return (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">
                            {payment.payroll?.employee?.fullname || "Noma'lum"}
                          </TableCell>
                          <TableCell className="font-semibold">{formatCurrency(payment.amount)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {methodIcons[payment.payment_method]}
                              <span>{method?.label || payment.payment_method}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(payment.paid_at).toLocaleDateString("uz-UZ")}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{payment.note || "-"}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                <Pagination
                  currentPage={page}
                  totalPages={data.totalPages}
                  onPageChange={setPage}
                />
              </>
            ) : (
              <EmptyState
                icon={<Search className="h-12 w-12" />}
                title="To'lovlar yo'q"
                description={`${getMonthName(month)} ${year} uchun to'lovlar topilmadi`}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
