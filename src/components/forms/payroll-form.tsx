"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { payrollSchema, PayrollFormData } from "@/lib/validations/payroll"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Employee } from "@/types"
import { Loader2 } from "lucide-react"
import { getCurrentMonth, getCurrentYear, formatNumber, parseFormattedNumber } from "@/lib/utils"
import { useEffect, useState } from "react"

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

  const employeeId = watch("employee_id")
  const [baseStr, setBaseStr] = useState("")

  useEffect(() => {
    if (!employeeId) return
    const employee = employees.find((e) => e.id === employeeId)
    if (employee?.salary) {
      setValue("base_salary", employee.salary)
      setBaseStr(formatNumber(employee.salary))
    }
  }, [employeeId, employees, setValue])

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
