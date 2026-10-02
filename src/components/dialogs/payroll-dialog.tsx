"use client"

import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PayrollForm } from "@/components/forms/payroll-form"
import { PayrollFormData } from "@/lib/validations/payroll"
import { Payroll, Employee } from "@/types"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useQueryClient, useQuery } from "@tanstack/react-query"
import { getKpiInfo, kpiFinalSalary } from "@/lib/kpi"

interface PayrollDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payroll?: Payroll | null
}

export function PayrollDialog({ open, onOpenChange, payroll }: PayrollDialogProps) {
  const queryClient = useQueryClient()
  const supabase = createClient()

  const { data: employees } = useQuery({
    queryKey: ["active-employees"],
    queryFn: async () => {
      const { data } = await supabase.from("employees").select("*").eq("status", "active").order("fullname")
      return (data || []) as Employee[]
    },
  })

  const handleSubmit = async (data: PayrollFormData) => {
    try {
      const kpi = await getKpiInfo(supabase, data.employee_id, data.month, data.year)
      const final_salary = kpiFinalSalary(
        data.base_salary,
        kpi.percentage,
        data.bonus || 0,
        data.penalty || 0,
        0
      )

      if (payroll) {
        const { error } = await supabase
          .from("payrolls")
          .update({ ...data, final_salary })
          .eq("id", payroll.id)

        if (error) throw error
        toast.success("Oylik yangilandi")
      } else {
        const { error } = await supabase
          .from("payrolls")
          .insert({ ...data, final_salary })

        if (error) throw error
        toast.success(
          `Oylik qo'shildi (KPI ${Math.round(kpi.percentage * 100)}%: ${(final_salary / (data.base_salary || 1) * 100).toFixed(0)}% maosh)`
        )

        fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "payroll_created",
            employee_id: data.employee_id,
            amount: final_salary,
            month: data.month,
            year: data.year,
          }),
        })

        if ((data.bonus || 0) > 0) {
          fetch("/api/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "bonus",
              employee_id: data.employee_id,
              amount: data.bonus,
            }),
          })
        }

        if ((data.penalty || 0) > 0) {
          fetch("/api/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "penalty",
              employee_id: data.employee_id,
              amount: data.penalty,
            }),
          })
        }
      }

      queryClient.invalidateQueries({ queryKey: ["payrolls"] })
      onOpenChange(false)
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>{payroll ? "Oylikni tahrirlash" : "Yangi oylik qo'shish"}</DialogTitle>
      </DialogHeader>
      {employees && (
        <PayrollForm
          employees={employees}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      )}
    </Dialog>
  )
}
