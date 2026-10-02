"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { payrollSchema, PayrollFormData } from "@/lib/validations/payroll"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Employee } from "@/types"
import { Loader2, Info } from "lucide-react"
import { getCurrentMonth, getCurrentYear, formatNumber, parseFormattedNumber, formatCurrency } from "@/lib/utils"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { getKpiInfo } from "@/lib/kpi"

interface PayrollFormProps {
  employees: Employee[]
  onSubmit: (data: PayrollFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function PayrollForm({ employees, onSubmit, onCancel, loading }: PayrollFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PayrollFormData>({
    resolver: zodResolver(payrollSchema) as any,
    defaultValues: {
      month: getCurrentMonth(),
      year: getCurrentYear(),
      bonus: 0,
      penalty: 0,
      advance: 0,
    },
  })

  const supabase = createClient()
  const employeeId = watch("employee_id")
  const month = watch("month")
  const year = watch("year")
  const [baseStr, setBaseStr] = useState("")
  const [kpi, setKpi] = useState<{ targetHours: number; hoursWorked: number; percentage: number } | null>(null)
  const [kpiLoading, setKpiLoading] = useState(false)

  useEffect(() => {
    if (!employeeId) return
    const employee = employees.find((e) => e.id === employeeId)
    if (employee?.salary) {
      setValue("base_salary", employee.salary)
      setBaseStr(formatNumber(employee.salary))
    }
  }, [employeeId, employees, setValue])

  useEffect(() => {
    let mounted = true
    if (!employeeId || !month || !year) {
      setKpi(null)
      return
    }
    setKpiLoading(true)
    getKpiInfo(supabase, employeeId, Number(month), Number(year))
      .then((info) => {
        if (mounted) setKpi(info)
      })
      .catch(() => {
        if (mounted) setKpi(null)
      })
      .finally(() => {
        if (mounted) setKpiLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [employeeId, month, year, supabase])

  const baseSalary = parseFormattedNumber(baseStr)
  const estimatedSalary = kpi ? Math.round(baseSalary * kpi.percentage) : baseSalary

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="employee_id">Xodim</Label>
        <Select
          id="employee_id"
          {...register("employee_id")}
          options={employees.map((e) => ({ value: e.id, label: `${e.fullname} - ${e.position}` }))}
          placeholder="Xodimni tanlang"
        />
        {errors.employee_id && <p className="text-sm text-destructive">{errors.employee_id.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="month">Oy</Label>
          <Input id="month" type="number" min={1} max={12} {...register("month")} />
          {errors.month && <p className="text-sm text-destructive">{errors.month.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="year">Yil</Label>
          <Input id="year" type="number" {...register("year")} />
          {errors.year && <p className="text-sm text-destructive">{errors.year.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="base_salary">Asosiy oylik (so'm)</Label>
        <Input
          id="base_salary"
          type="text"
          inputMode="numeric"
          value={baseStr}
          onChange={(e) => {
            const raw = parseFormattedNumber(e.target.value)
            setBaseStr(formatNumber(raw))
            setValue("base_salary", raw)
          }}
          placeholder="Misol: 5 000 000"
        />
        {errors.base_salary && <p className="text-sm text-destructive">{errors.base_salary.message}</p>}
      </div>

      {employeeId && month && year && (
        <div className="rounded-lg border bg-muted p-3 space-y-1 text-sm">
          {kpiLoading ? (
            <p className="text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> KPI hisoblanmoqda...
            </p>
          ) : kpi ? (
            <>
              <div className="flex justify-between">
                <span>Target soat</span>
                <span>{formatNumber(kpi.targetHours)} soat</span>
              </div>
              <div className="flex justify-between">
                <span>Ishlangan soat</span>
                <span>{formatNumber(kpi.hoursWorked)} soat</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Bajarilgan foiz</span>
                <span className={kpi.percentage >= 1 ? "text-green-600" : "text-amber-600"}>
                  {Math.round(kpi.percentage * 100)}%
                </span>
              </div>
              <div className="flex justify-between border-t pt-1 font-semibold">
                <span>Hisoblangan oylik</span>
                <span>{formatCurrency(estimatedSalary)}</span>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground flex items-center gap-2">
              <Info className="h-3.5 w-3.5" /> KPI ma'lumoti topilmadi, to'liq oylik hisoblanadi
            </p>
          )}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Bekor qilish
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Saqlash
        </Button>
      </div>
    </form>
  )
}
