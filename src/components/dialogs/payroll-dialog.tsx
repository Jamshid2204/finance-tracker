"use client"

import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PayrollForm } from "@/components/forms/payroll-form"
import { PayrollFormData } from "@/lib/validations/payroll"
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
      const final_salary = data.base_salary + (data.bonus || 0) - (data.penalty || 0) - (data.advance || 0)

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
