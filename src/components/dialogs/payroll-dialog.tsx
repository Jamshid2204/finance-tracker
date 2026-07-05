"use client"

import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PayrollForm } from "@/components/forms/payroll-form"
import { PayrollFormData, calculateFinalSalary } from "@/lib/validations/payroll"
import { Payroll, Employee } from "@/types"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useQueryClient, useQuery } from "@tanstack/react-query"

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
      const final_salary = calculateFinalSalary(data.base_salary, data.bonus || 0, data.penalty || 0, 0)

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
        toast.success("Oylik qo'shildi")

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
