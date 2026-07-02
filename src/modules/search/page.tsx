"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { AppLayout } from "@/components/layouts/app-layout"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search as SearchIcon, Users, Wallet, FileText } from "lucide-react"
import Link from "next/link"
import { Employee, Payroll } from "@/types"
import { formatCurrency } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const debouncedQuery = useDebounce(query, 300)
  const supabase = createClient()

  const { data } = useQuery({
    queryKey: ["global-search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return null

      const { data: employees } = await supabase
        .from("employees")
        .select("*")
        .or(`fullname.ilike.%${debouncedQuery}%,position.ilike.%${debouncedQuery}%,department.ilike.%${debouncedQuery}%`)
        .limit(5)

      const { data: payrolls } = await supabase
        .from("payrolls")
        .select("*, employee:employees(*)")
        .or(`employee.fullname.ilike.%${debouncedQuery}%`)
        .limit(5)

      return {
        employees: (employees || []) as Employee[],
        payrolls: (payrolls || []) as Payroll[],
      }
    },
    enabled: debouncedQuery.length >= 2,
  })

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Qidirish</h1>

        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Xodim, lavozim, bo'lim bo'yicha qidirish..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 h-12 text-lg"
            autoFocus
          />
        </div>

        {data && (
          <div className="space-y-6">
            {data.employees.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Xodimlar
                </h2>
                <div className="space-y-2">
                  {data.employees.map((emp) => (
                    <Link key={emp.id} href="/employees">
                      <Card className="hover:bg-accent transition-colors cursor-pointer">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium">{emp.fullname}</p>
                            <p className="text-sm text-muted-foreground">{emp.position} - {emp.department}</p>
                          </div>
                          <Badge variant={emp.status === "active" ? "success" : "secondary"}>
                            {emp.status === "active" ? "Aktiv" : "Passiv"}
                          </Badge>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {data.payrolls.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Oyliklar
                </h2>
                <div className="space-y-2">
                  {data.payrolls.map((pr) => (
                    <Link key={pr.id} href="/payroll">
                      <Card className="hover:bg-accent transition-colors cursor-pointer">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium">{pr.employee?.fullname}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(pr.final_salary)}
                            </p>
                          </div>
                          <Badge
                            variant={pr.status === "paid" ? "success" : pr.status === "pending" ? "warning" : "destructive"}
                          >
                            {pr.status}
                          </Badge>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {data.employees.length === 0 && data.payrolls.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Hech narsa topilmadi</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
