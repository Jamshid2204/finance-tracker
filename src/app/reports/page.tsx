"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { AppLayout } from "@/components/layouts/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, getMonthName } from "@/lib/utils"
import { FileDown } from "lucide-react"
import { toast } from "sonner"

export default function ReportsPage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const supabase = createClient()

  const { data: monthlyReport, isLoading: monthlyLoading } = useQuery({
    queryKey: ["monthly-report", year],
    queryFn: async () => {
      const months = Array.from({ length: 12 }, (_, i) => i + 1)
      const results = []

      for (const month of months) {
        const { data: payrolls } = await supabase
          .from("payrolls")
          .select("*, employee:employees(*)")
          .eq("month", month)
          .eq("year", year)

        const items = payrolls || []
        results.push({
          month,
          total: items.reduce((sum: number, p: any) => sum + p.final_salary, 0),
          count: items.length,
          paid: items.filter((p: any) => p.status === "paid").length,
          pending: items.filter((p: any) => p.status === "pending").length,
        })
      }

      return results
    },
  })

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Hisobotlar</h1>
          <div className="flex items-center gap-2">
            <Select
              value={String(year)}
              onChange={(e) => setYear(Number(e.target.value))}
              options={years.map((y) => ({ value: String(y), label: String(y) }))}
            />
            <Button variant="outline" disabled>
              <FileDown className="mr-2 h-4 w-4" />
              Yuklab olish
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Yillik hisobot - {year}</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : monthlyReport ? (
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 font-medium text-sm text-muted-foreground pb-2 border-b">
                  <div className="col-span-3">Oy</div>
                  <div className="col-span-3 text-right">Summa</div>
                  <div className="col-span-2 text-right">Jami</div>
                  <div className="col-span-2 text-right">To'langan</div>
                  <div className="col-span-2 text-right">Kutilmoqda</div>
                </div>
                {monthlyReport.map((report) => (
                  <div key={report.month} className="grid grid-cols-12 gap-2 py-1.5 text-sm">
                    <div className="col-span-3 font-medium">{getMonthName(report.month)}</div>
                    <div className="col-span-3 text-right">{formatCurrency(report.total)}</div>
                    <div className="col-span-2 text-right">{report.count}</div>
                    <div className="col-span-2 text-right text-green-600">{report.paid}</div>
                    <div className="col-span-2 text-right text-amber-600">{report.pending}</div>
                  </div>
                ))}
                <div className="grid grid-cols-12 gap-2 pt-2 border-t font-semibold">
                  <div className="col-span-3">Jami</div>
                  <div className="col-span-3 text-right">
                    {formatCurrency(monthlyReport.reduce((s, r) => s + r.total, 0))}
                  </div>
                  <div className="col-span-2 text-right">
                    {monthlyReport.reduce((s, r) => s + r.count, 0)}
                  </div>
                  <div className="col-span-2 text-right">
                    {monthlyReport.reduce((s, r) => s + r.paid, 0)}
                  </div>
                  <div className="col-span-2 text-right">
                    {monthlyReport.reduce((s, r) => s + r.pending, 0)}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Ma'lumot topilmadi</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
