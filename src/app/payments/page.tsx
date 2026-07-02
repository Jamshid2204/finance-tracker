"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { AppLayout } from "@/components/layouts/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Pagination } from "@/components/ui/pagination"
import { Payment } from "@/types"
import { formatCurrency } from "@/lib/utils"
import { CreditCard, Banknote, Landmark, Wallet, Smartphone } from "lucide-react"
import { PAYMENT_METHODS } from "@/constants"

const methodIcons: Record<string, React.ReactNode> = {
  cash: <Banknote className="h-4 w-4" />,
  card: <CreditCard className="h-4 w-4" />,
  bank: <Landmark className="h-4 w-4" />,
  click: <Smartphone className="h-4 w-4" />,
  payme: <Wallet className="h-4 w-4" />,
}

export default function PaymentsPage() {
  const [page, setPage] = useState(1)
  const supabase = createClient()
  const pageSize = 10

  const { data, isLoading } = useQuery({
    queryKey: ["payments", page],
    queryFn: async () => {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      const { data, count } = await supabase
        .from("payments")
        .select("*, payroll:payrolls(*, employee:employees(*))", { count: "exact" })
        .order("paid_at", { ascending: false })
        .range(from, to)

      return {
        data: (data || []) as Payment[],
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      }
    },
  })

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">To'lovlar</h1>

        <Card>
          <CardHeader>
            <CardTitle>To'lov tarixi</CardTitle>
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
                title="To'lovlar yo'q"
                description="Hali hech qanday to'lov amalga oshirilmagan"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
