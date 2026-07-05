"use client"

import { useState } from "react"
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Payroll } from "@/types"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { formatCurrency, formatNumber, parseFormattedNumber } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface AdjustmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payroll: Payroll | null
  type: "bonus" | "penalty"
}

export function AdjustmentDialog({ open, onOpenChange, payroll, type }: AdjustmentDialogProps) {
  const [amountStr, setAmountStr] = useState("")
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()
  const supabase = createClient()

  const amount = parseFormattedNumber(amountStr)
  const isBonus = type === "bonus"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payroll || amount <= 0) return
    setLoading(true)

    try {
      const newBonus = isBonus ? (payroll.bonus || 0) + amount : (payroll.bonus || 0)
      const newPenalty = !isBonus ? (payroll.penalty || 0) + amount : (payroll.penalty || 0)
      const newFinal = payroll.base_salary + newBonus - newPenalty

      const { error } = await supabase
        .from("payrolls")
        .update({ bonus: newBonus, penalty: newPenalty, final_salary: newFinal })
        .eq("id", payroll.id)

      if (error) throw error

      toast.success(isBonus ? `Bonus qo'shildi: ${formatCurrency(amount)}` : `Jarima qo'llandi: ${formatCurrency(amount)}`)
      queryClient.invalidateQueries({ queryKey: ["payrolls"] })
      onOpenChange(false)

      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          employee_id: payroll.employee_id,
          amount,
        }),
      })
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>{isBonus ? "Bonus qo'shish" : "Jarima qo'llash"}</DialogTitle>
      </DialogHeader>
      {payroll && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border bg-muted p-3 space-y-1">
            <p className="text-sm text-muted-foreground">Xodim</p>
            <p className="font-semibold">{payroll.employee?.fullname || "Noma'lum"}</p>
            <p className="text-sm text-muted-foreground">
              Asosiy oylik: {formatCurrency(payroll.base_salary)}
              {isBonus && payroll.bonus > 0 && ` | Jami bonus: ${formatCurrency(payroll.bonus)}`}
              {!isBonus && payroll.penalty > 0 && ` | Jami jarima: ${formatCurrency(payroll.penalty)}`}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">{isBonus ? "Bonus summasi (so'm)" : "Jarima summasi (so'm)"}</Label>
            <Input
              id="amount"
              type="text"
              inputMode="numeric"
              value={amountStr}
              onChange={(e) => setAmountStr(formatNumber(parseFormattedNumber(e.target.value)))}
              placeholder="Summani kiriting"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" disabled={loading || amount <= 0}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isBonus ? "Bonus qo'shish" : "Jarima qo'llash"}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  )
}
