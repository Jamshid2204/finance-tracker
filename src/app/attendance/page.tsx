"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { AppLayout } from "@/components/layouts/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useSession } from "@/hooks/use-session"
import { LogIn, LogOut, Clock } from "lucide-react"

export default function AttendancePage() {
  const supabase = createClient()
  const { user } = useSession()
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])

  const isHR = user?.role ? ["owner", "admin", "hr"].includes(user.role) : false

  const { data: records } = useQuery({
    queryKey: ["attendance", date],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from("attendance")
        .select("*, employee:employees(fullname, position)")

      if (!isHR && user?.employee_id) {
        query = query.eq("employee_id", user.employee_id)
      }

      const { data } = await query
        .eq("date", date)
        .order("arrived_at", { ascending: true })

      return data || []
    },
  })

  const { data: history } = useQuery({
    queryKey: ["attendance-history", isHR, user?.employee_id],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from("attendance")
        .select("*, employee:employees(fullname, position)")
        .order("date", { ascending: false })
        .limit(30)

      if (!isHR && user?.employee_id) {
        query = query.eq("employee_id", user.employee_id)
      }

      const { data } = await query
      return data || []
    },
  })

  const todayStats = {
    total: records?.length || 0,
    arrived: records?.filter((r: any) => r.arrived_at).length || 0,
    left: records?.filter((r: any) => r.left_at).length || 0,
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Davomat</h1>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Kelganlar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <LogIn className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold">{todayStats.arrived}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ketganlar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <LogOut className="h-5 w-5 text-orange-600" />
                <span className="text-2xl font-bold">{todayStats.left}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ishda (hali ketmagan)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold">{todayStats.arrived - todayStats.left}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Kunlik davomat</CardTitle>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Xodim</TableHead>
                  <TableHead>Kelgan vaqt</TableHead>
                  <TableHead>Ketgan vaqt</TableHead>
                  <TableHead>Holat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records && records.length > 0 ? (
                  records.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.employee?.fullname}</TableCell>
                      <TableCell>
                        {r.arrived_at
                          ? new Date(r.arrived_at).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {r.left_at
                          ? new Date(r.left_at).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <span className={r.left_at ? "text-muted-foreground" : "text-green-600 font-medium"}>
                          {r.left_at ? "Ketgan" : "Ishda"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Bu sana uchun ma'lumot yo'q
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {isHR && (
          <Card>
            <CardHeader>
              <CardTitle>Oxirgi 30 kunlik tarix</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sana</TableHead>
                    <TableHead>Xodim</TableHead>
                    <TableHead>Kelgan</TableHead>
                    <TableHead>Ketgan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history && history.length > 0 ? (
                    history.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell>{new Date(r.date).toLocaleDateString("uz-UZ")}</TableCell>
                        <TableCell>{r.employee?.fullname}</TableCell>
                        <TableCell>
                          {r.arrived_at
                            ? new Date(r.arrived_at).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {r.left_at
                            ? new Date(r.left_at).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Ma'lumot yo'q
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
