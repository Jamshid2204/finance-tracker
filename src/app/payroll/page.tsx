"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { AppLayout } from "@/components/layouts/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Pagination } from "@/components/ui/pagination"
import { PayrollDialog } from "@/components/dialogs/payroll-dialog"
import { Payroll } from "@/types"
import { formatCurrency, getMonthName, getCurrentMonth, getCurrentYear } from "@/lib/utils"
import { Plus, Wallet } from "lucide-react"
import { PAYROLL_STATUS } from "@/constants"

export default function PayrollPage() {
  const [page, setPage] = useState(1)
  const [month] = useState(getCurrentMonth())
  const [year] = useState(getCurrentYear())
  const [dialogOpen, setDialogOpen] = useState(false)
  const supabase = createClient()
  const pageSize = 10

  const { data, isLoading } = useQuery({
    queryKey: ["payrolls", page, month, year],
    queryFn: async () => {
      let query = supabase
        .from("payrolls")
        .select("*, employee:employees(*)", { count: "exact" })
        .eq("month", month)
        .eq("year", year)

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      const { data, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to)

      return {
        data: (data || []) as Payroll[],
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      }
    },
  })

  const statusBadge = (status: string) => {
    const s = PAYROLL_STATUS.find((ps) => ps.value === status)
    return (
      <Badge variant={s?.color as "success" | "warning" | "destructive" | "default"}>
        {s?.label || status}
      </Badge>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            Oyliklar - {getMonthName(month)} {year}
          </h1>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yangi oylik
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Oylik ro'yxati</CardTitle>
          </CardHeader>
          <CardContent>
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
                      <TableHead>Asosiy</TableHead>
                      <TableHead>Bonus</TableHead>
                      <TableHead>Jarima</TableHead>
                      <TableHead>Avans</TableHead>
                      <TableHead>Yakuniy</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((payroll) => (
                      <TableRow key={payroll.id}>
                        <TableCell className="font-medium">
                          {payroll.employee?.fullname || "Noma'lum"}
                        </TableCell>
                        <TableCell>{formatCurrency(payroll.base_salary)}</TableCell>
                        <TableCell className="text-green-600">+{formatCurrency(payroll.bonus)}</TableCell>
                        <TableCell className="text-red-600">-{formatCurrency(payroll.penalty)}</TableCell>
                        <TableCell className="text-amber-600">-{formatCurrency(payroll.advance)}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(payroll.final_salary)}</TableCell>
                        <TableCell>{statusBadge(payroll.status)}</TableCell>
                      </TableRow>
                    ))}
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
                icon={<Wallet className="h-12 w-12" />}
                title="Bu oy uchun oyliklar yo'q"
                description={`${getMonthName(month)} ${year} uchun hali oylik hisoblanmagan`}
                action={
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Oylik hisoblash
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>
      </div>

      <PayrollDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </AppLayout>
  )
}
