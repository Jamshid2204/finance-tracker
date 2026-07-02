"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { employeeSchema, EmployeeFormData } from "@/lib/validations/employee"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { DEPARTMENTS, EMPLOYEE_STATUS } from "@/constants"
import { Employee } from "@/types"
import { Loader2 } from "lucide-react"

interface EmployeeFormProps {
  defaultValues?: Employee
  onSubmit: (data: EmployeeFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function EmployeeForm({ defaultValues, onSubmit, onCancel, loading }: EmployeeFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema) as any,
    defaultValues: defaultValues || {
      fullname: "",
      phone: "",
      position: "",
      department: "",
      salary: 0,
      status: "active",
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullname">Ism familiya</Label>
        <Input id="fullname" {...register("fullname")} placeholder="Ali Valiyev" />
        {errors.fullname && <p className="text-sm text-destructive">{errors.fullname.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefon</Label>
        <Input id="phone" {...register("phone")} placeholder="+998901234567" />
        {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="position">Lavozim</Label>
          <Input id="position" {...register("position")} placeholder="Dasturchi" />
          {errors.position && <p className="text-sm text-destructive">{errors.position.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="department">Bo'lim</Label>
          <Select id="department" {...register("department")} options={DEPARTMENTS.map((d) => ({ value: d, label: d }))} placeholder="Bo'limni tanlang" />
          {errors.department && <p className="text-sm text-destructive">{errors.department.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="salary">Maosh (so'm)</Label>
        <Input id="salary" type="number" {...register("salary")} placeholder="5000000" />
        {errors.salary && <p className="text-sm text-destructive">{errors.salary.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="telegram_chat_id">Telegram Chat ID (ixtiyoriy)</Label>
        <Input id="telegram_chat_id" {...register("telegram_chat_id")} placeholder="123456789" />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Bekor qilish
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {defaultValues ? "Yangilash" : "Qo'shish"}
        </Button>
      </div>
    </form>
  )
}
