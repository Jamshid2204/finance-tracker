"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { AppLayout } from "@/components/layouts/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useSession } from "@/hooks/use-session"
import { formatCurrency, formatNumber, parseFormattedNumber } from "@/lib/utils"
import { toast } from "sonner"
import { Pencil, Target, TrendingUp, Clock } from "lucide-react"

const MONTHS = [
  { value: "1", label: "Yanvar" },
  { value: "2", label: "Fevral" },
  { value: "3", label: "Mart" },
  { value: "4", label: "Aprel" },
  { value: "5", label: "May" },
  { value: "6", label: "Iyun" },
  { value: "7", label: "Iyul" },
  { value: "8", label: "Avgust" },
  { value: "9", label: "Sentabr" },
  { value: "10", label: "Oktabr" },
  { value: "11", label: "Noyabr" },
  { value: "12", label: "Dekabr" },
]

function computeHours(attendance: any[]): number {
  return attendance.reduce((sum, a) => {
    if (!a.arrived_at || !a.left_at) return sum
    const diff = (new Date(a.left_at).getTime() - new Date(a.arrived_at).getTime()) / 3600000
    return sum + Math.max(0, diff)
  }, 0)
}

export default function KPIPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { user } = useSession()
  const [month, setMonth] = useState(String(new Date().getMonth() + 1))
  const [year, setYear] = useState(new Date().getFullYear())

  const [editTarget, setEditTarget] = useState<any>(null)
  const [editResult, setEditResult] = useState<any>(null)

  const isHR = user?.role ? ["owner", "admin", "hr", "accountant"].includes(user.role) : false

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data } = await supabase.from("employees").select("*").eq("status", "active").order("fullname")
      return data || []
    },
  })

  const { data: targets } = useQuery({
    queryKey: ["kpi-targets", month, year],
    queryFn: async () => {
      const { data } = await supabase
        .from("kpi_targets")
        .select("*, employee:employees(fullname, position)")
        .eq("month", Number(month))
        .eq("year", year)
      return data || []
    },
  })

  const { data: results } = useQuery({
    queryKey: ["kpi-results", month, year],
    queryFn: async () => {
      const { data } = await supabase
        .from("kpi_results")
        .select("*, employee:employees(fullname, position)")
        .eq("month", Number(month))
        .eq("year", year)
      return data || []
    },
  })

  const { data: attendance } = useQuery({
    queryKey: ["attendance-month", month, year],
    queryFn: async () => {
      const start = `${year}-${String(month).padStart(2, "0")}-01`
      const { data } = await supabase
        .from("attendance")
        .select("employee_id, arrived_at, left_at")
        .gte("date", start)
        .lt("date", `${year}-${String(Number(month) + 1).padStart(2, "0")}-01`)
      return data || []
    },
  })

  const saveTarget = useMutation({
    mutationFn: async ({ employeeId, targetHours, hourlyRate }: any) => {
      const existing = editTarget?.target
      const payload = {
        target_hours: Number(targetHours),
        unit_price: Number(hourlyRate),
        target_quantity: 0,
      }
      if (existing?.id) {
        const { error } = await supabase.from("kpi_targets").update(payload).eq("id", existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("kpi_targets").insert({
          employee_id: employeeId,
          month: Number(month),
          year,
          ...payload,
        })
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success("Target saqlandi")
      queryClient.invalidateQueries({ queryKey: ["kpi-targets"] })
      setEditTarget(null)
    },
    onError: (err) => toast.error((err as Error).message),
  })

  const saveResult = useMutation({
    mutationFn: async ({ employeeId, hoursWorked }: any) => {
      const existing = editResult?.result
      const target = (targets || []).find((t: any) => t.employee_id === employeeId)
      const targetHours = target ? Number(target.target_hours) : Number((employees || []).find((e: any) => e.id === employeeId)?.monthly_target_hours || 0)
      const rate = target ? Number(target.unit_price) : 0
      const bonus = Math.max(0, Number(hoursWorked) - targetHours) * rate

      const payload = {
        hours_worked: Number(hoursWorked),
        quantity_produced: 0,
        bonus_amount: bonus,
      }
      if (existing?.id) {
        const { error } = await supabase.from("kpi_results").update(payload).eq("id", existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("kpi_results").insert({
          employee_id: employeeId,
          month: Number(month),
          year,
          ...payload,
        })
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success("Natija saqlandi")
      queryClient.invalidateQueries({ queryKey: ["kpi-results"] })
      setEditResult(null)
    },
    onError: (err) => toast.error((err as Error).message),
  })

  const addBonusToPayroll = useMutation({
    mutationFn: async ({ employeeId, bonusAmount }: { employeeId: string; bonusAmount: number }) => {
      const { data: payroll } = await supabase
        .from("payrolls")
        .select("*")
        .eq("employee_id", employeeId)
        .eq("month", Number(month))
        .eq("year", year)
        .single()

      if (!payroll) throw new Error("Bu oy uchun oylik topilmadi")

      const newBonus = Number(payroll.bonus) + bonusAmount
      const finalSalary = Number(payroll.base_salary) + newBonus - Number(payroll.penalty) - Number(payroll.advance)

      const { error } = await supabase
        .from("payrolls")
        .update({ bonus: newBonus, final_salary: finalSalary })
        .eq("id", payroll.id)

      if (error) throw error
    },
    onSuccess: () => {
      toast.success("Bonus oylikka qo'shildi")
      queryClient.invalidateQueries({ queryKey: ["kpi-results"] })
    },
    onError: (err) => toast.error((err as Error).message),
  })

  const autoHoursByEmployee = (() => {
    const map: Record<string, number> = {}
    for (const a of attendance || []) {
      const h = computeHours([a])
      map[a.employee_id] = (map[a.employee_id] || 0) + h
    }
    return map
  })()

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">KPI (ish vaqti)</h1>
          <div className="flex items-center gap-2">
            <Select
              options={MONTHS}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-32"
            />
            <Input
              type="number"
              className="w-20"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Target va ishlangan soatlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Xodim</TableHead>
                  <TableHead>Lavozim</TableHead>
                  <TableHead>Target (soat)</TableHead>
                  <TableHead>Soat narxi</TableHead>
                  <TableHead>Ishlangan (soat)</TableHead>
                  <TableHead>Bonus</TableHead>
                  {isHR && <TableHead className="text-right">Amallar</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!employees || employees.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={isHR ? 7 : 6} className="text-center text-muted-foreground">
                      Xodimlar yo'q
                    </TableCell>
                  </TableRow>
                ) : (
                  employees.map((emp: any) => {
                    const target = (targets || []).find((t: any) => t.employee_id === emp.id)
                    const result = (results || []).find((r: any) => r.employee_id === emp.id)
                    const targetHours = target ? Number(target.target_hours) : Number(emp.monthly_target_hours || 0)
                    const rate = target ? Number(target.unit_price) : 0
                    const autoHours = Math.round((autoHoursByEmployee[emp.id] || 0) * 100) / 100
                    const hoursWorked = result ? Number(result.hours_worked) : autoHours
                    const bonus = result ? Number(result.bonus_amount) : Math.max(0, autoHours - targetHours) * rate

                    return (
                      <TableRow key={emp.id}>
                        <TableCell className="font-medium">{emp.fullname}</TableCell>
                        <TableCell className="text-muted-foreground">{emp.position}</TableCell>
                        <TableCell>{formatNumber(targetHours)} soat</TableCell>
                        <TableCell>{rate > 0 ? formatCurrency(rate) + "/soat" : "—"}</TableCell>
                        <TableCell>
                          <span className={hoursWorked > targetHours ? "text-green-600 font-medium" : ""}>
                            {formatNumber(hoursWorked)} soat
                          </span>
                          {result && Math.abs(hoursWorked - autoHours) > 0.01 && (
                            <span className="text-xs text-muted-foreground ml-1">(avtomatik: {formatNumber(autoHours)})</span>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold text-green-600">{formatCurrency(bonus)}</TableCell>
                        {isHR && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditTarget({ employeeId: emp.id, target })}
                              >
                                <Target className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditResult({ employeeId: emp.id, result })}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {bonus > 0 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addBonusToPayroll.mutate({ employeeId: emp.id, bonusAmount: bonus })}
                                  disabled={addBonusToPayroll.isPending}
                                >
                                  <TrendingUp className="h-4 w-4 mr-1" />
                                  Bonus
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Target dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        {editTarget && (
          <div>
            <DialogHeader>
              <DialogTitle>{editTarget.target ? "Targetni tahrirlash" : "Yangi target"}</DialogTitle>
            </DialogHeader>
            <TargetForm
              target={editTarget.target}
              defaultHours={Number((employees || []).find((e: any) => e.id === editTarget.employeeId)?.monthly_target_hours || 160)}
              onSave={(h: number, r: number) =>
                saveTarget.mutate({ employeeId: editTarget.employeeId, targetHours: h, hourlyRate: r })
              }
              loading={saveTarget.isPending}
            />
          </div>
        )}
      </Dialog>

      {/* Result dialog */}
      <Dialog open={!!editResult} onOpenChange={(o) => !o && setEditResult(null)}>
        {editResult && (
          <div>
            <DialogHeader>
              <DialogTitle>{editResult.result ? "Ishlangan soatni tuzatish" : "Ishlangan soatni kiritish"}</DialogTitle>
            </DialogHeader>
            <ResultForm
              result={editResult.result}
              autoHours={Math.round((autoHoursByEmployee[editResult.employeeId] || 0) * 100) / 100}
              onSave={(h: number) =>
                saveResult.mutate({ employeeId: editResult.employeeId, hoursWorked: h })
              }
              loading={saveResult.isPending}
            />
          </div>
        )}
      </Dialog>
    </AppLayout>
  )
}

function TargetForm({ target, defaultHours, onSave, loading }: any) {
  const [hours, setHours] = useState(String(target?.target_hours ?? defaultHours ?? 160))
  const [rate, setRate] = useState(String(target?.unit_price || ""))

  return (
    <div className="space-y-4 mt-4">
      <div>
        <label className="text-sm font-medium">Oylik target soat</label>
        <Input type="number" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="160" />
        <p className="text-xs text-muted-foreground mt-1">Haftada bir kun dam olinadi (shanba)</p>
      </div>
      <div>
        <label className="text-sm font-medium">Qo'shimcha soat narxi (so'm/soat)</label>
        <Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="10000" />
      </div>
      <Button onClick={() => onSave(Number(hours), Number(rate))} disabled={loading}>
        {loading ? "Saqlanmoqda..." : "Saqlash"}
      </Button>
    </div>
  )
}

function ResultForm({ result, autoHours, onSave, loading }: any) {
  const [hours, setHours] = useState(String(result?.hours_worked ?? autoHours ?? ""))

  return (
    <div className="space-y-4 mt-4">
      <div>
        <label className="text-sm font-medium">Ishlangan soat (oylik)</label>
        <Input type="number" value={hours} onChange={(e) => setHours(e.target.value)} />
        <p className="text-xs text-muted-foreground mt-1">Davomatdan avtomatik hisoblangan: {formatNumber(autoHours)} soat</p>
      </div>
      <Button onClick={() => onSave(Number(hours))} disabled={loading}>
        {loading ? "Saqlanmoqda..." : "Saqlash"}
      </Button>
    </div>
  )
}
