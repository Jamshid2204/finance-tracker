"use client"

import { useState } from "react"
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
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"
import { Pencil, Target, TrendingUp } from "lucide-react"

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

async function calculateBonus(employeeId: string, month: number, year: number, quantity: number) {
  const supabase = createClient()
  const { data: target } = await supabase
    .from("kpi_targets")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("month", month)
    .eq("year", year)
    .single()

  if (!target) return 0
  const excess = Math.max(0, quantity - Number(target.target_quantity))
  return excess * Number(target.unit_price)
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

  const saveTarget = useMutation({
    mutationFn: async ({ employeeId, targetQty, unitPrice }: any) => {
      const existing = editTarget?.target
      if (existing?.id) {
        const { error } = await supabase
          .from("kpi_targets")
          .update({ target_quantity: Number(targetQty), unit_price: Number(unitPrice) })
          .eq("id", existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("kpi_targets").insert({
          employee_id: employeeId,
          month: Number(month),
          year,
          target_quantity: Number(targetQty),
          unit_price: Number(unitPrice),
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
    mutationFn: async ({ employeeId, quantity }: any) => {
      const existing = editResult?.result
      const bonus = await calculateBonus(employeeId, Number(month), year, Number(quantity))
      if (existing?.id) {
        const { error } = await supabase
          .from("kpi_results")
          .update({ quantity_produced: Number(quantity), bonus_amount: bonus })
          .eq("id", existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("kpi_results").insert({
          employee_id: employeeId,
          month: Number(month),
          year,
          quantity_produced: Number(quantity),
          bonus_amount: bonus,
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

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">KPI</h1>
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
              <Target className="h-5 w-5" />
              Target va natijalar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Xodim</TableHead>
                  <TableHead>Lavozim</TableHead>
                  <TableHead>Target (dona)</TableHead>
                  <TableHead>Dona narxi</TableHead>
                  <TableHead>Ishlab chiqarilgan</TableHead>
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
                    const bonus = result ? Number(result.bonus_amount) : 0

                    return (
                      <TableRow key={emp.id}>
                        <TableCell className="font-medium">{emp.fullname}</TableCell>
                        <TableCell className="text-muted-foreground">{emp.position}</TableCell>
                        <TableCell>{target ? Number(target.target_quantity) : "—"}</TableCell>
                        <TableCell>{target ? formatCurrency(Number(target.unit_price)) + "/dona" : "—"}</TableCell>
                        <TableCell>{result ? Number(result.quantity_produced) : "—"}</TableCell>
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
              onSave={(targetQty: number, unitPrice: number) =>
                saveTarget.mutate({ employeeId: editTarget.employeeId, targetQty, unitPrice })
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
              <DialogTitle>{editResult.result ? "Natijani tahrirlash" : "Yangi natija"}</DialogTitle>
            </DialogHeader>
            <ResultForm
              result={editResult.result}
              onSave={(quantity: number) =>
                saveResult.mutate({ employeeId: editResult.employeeId, quantity })
              }
              loading={saveResult.isPending}
            />
          </div>
        )}
      </Dialog>
    </AppLayout>
  )
}

function TargetForm({ target, onSave, loading }: any) {
  const [qty, setQty] = useState(String(target?.target_quantity || ""))
  const [price, setPrice] = useState(String(target?.unit_price || ""))

  return (
    <div className="space-y-4 mt-4">
      <div>
        <label className="text-sm font-medium">Target (dona)</label>
        <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="100" />
      </div>
      <div>
        <label className="text-sm font-medium">Dona narxi (so'm)</label>
        <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="5000" />
      </div>
      <Button onClick={() => onSave(Number(qty), Number(price))} disabled={loading}>
        {loading ? "Saqlanmoqda..." : "Saqlash"}
      </Button>
    </div>
  )
}

function ResultForm({ result, onSave, loading }: any) {
  const [qty, setQty] = useState(String(result?.quantity_produced || ""))

  return (
    <div className="space-y-4 mt-4">
      <div>
        <label className="text-sm font-medium">Ishlab chiqarilgan mahsulot (dona)</label>
        <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="150" />
      </div>
      <Button onClick={() => onSave(Number(qty))} disabled={loading}>
        {loading ? "Saqlanmoqda..." : "Saqlash"}
      </Button>
    </div>
  )
}
