"use client"

import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EmployeeForm } from "@/components/forms/employee-form"
import { Employee } from "@/types"
import { EmployeeFormData } from "@/lib/validations/employee"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

interface EmployeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee?: Employee | null
}

export function EmployeeDialog({ open, onOpenChange, employee }: EmployeeDialogProps) {
  const queryClient = useQueryClient()
  const supabase = createClient()

  const handleSubmit = async (data: EmployeeFormData) => {
    try {
      if (employee) {
        const { error } = await supabase
          .from("employees")
          .update(data)
          .eq("id", employee.id)

        if (error) throw error
        toast.success("Xodim yangilandi")
      } else {
        const { error } = await supabase
          .from("employees")
          .insert(data)

        if (error) throw error
        toast.success("Xodim qo'shildi")
      }

      queryClient.invalidateQueries({ queryKey: ["employees"] })
      onOpenChange(false)
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>{employee ? "Xodimni tahrirlash" : "Yangi xodim qo'shish"}</DialogTitle>
      </DialogHeader>
      <EmployeeForm
        defaultValues={employee || undefined}
        onSubmit={handleSubmit}
        onCancel={() => onOpenChange(false)}
      />
    </Dialog>
  )
}
