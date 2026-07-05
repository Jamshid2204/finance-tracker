"use client"

import { useState } from "react"
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Payroll } from "@/types"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { formatCurrency, formatNumber, parseFormattedNumber } from "@/lib/utils"
import { PAYMENT_METHODS } from "@/constants"
import { Loader2 } from "lucide-react"

interface AdvanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payroll: Payroll | null
}

export function AdvanceDialog({ open, onOpenChange, payroll }: AdvanceDialogProps) {
  const [amountStr, setAmountStr] = useState("")
  const [method, setMethod] = useState<string>("cash")
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()
  const supabase = createClient()

  const amount = parseFormattedNumber(amountStr)
  const maxAdvance = payroll ? payroll.base_salary - (payroll.advance || 0) : 0
  const exceedsLimit = amount > maxAdvance

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payroll || exceedsLimit || amount <= 0) return
    setLoading(true)

    try {
      const newAdvance = (payroll.advance || 0) + amount

      const { error: payrollError } = await supabase
        .from("payrolls")
        .update({ advance: newAdvance })
        .eq("id", payroll.id)

      if (payrollError) throw payrollError

      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          payroll_id: payroll.id,
          amount,
          payment_method: method,
          note: note ? `Avans: ${note}` : "Avans",
          paid_at: new Date().toISOString(),
        })

      if (paymentError) throw paymentError

      toast.success(`Avans berildi: ${formatCurrency(amount)}`)
      queryClient.invalidateQueries({ queryKey: ["payrolls"] })
      queryClient.invalidateQueries({ queryKey: ["payments"] })
      onOpenChange(false)

      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "advance_given",
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
        <DialogTitle>Avans berish</DialogTitle>
      </DialogHeader>
      {payroll && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border bg-muted p-3 space-y-1">
            <p className="text-sm text-muted-foreground">Xodim</p>
            <p className="font-semibold">{payroll.employee?.fullname || "Noma'lum"}</p>
            <p className="text-sm text-muted-foreground">
              Asosiy oylik: {formatCurrency(payroll.base_salary)}
              {payroll.advance > 0 && ` | Oldingi avans: ${formatCurrency(payroll.advance)}`}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Avans summasi (so'm)</Label>
            <Input
              id="amount"
              type="text"
              inputMode="numeric"
              value={amountStr}
              onChange={(e) => setAmountStr(formatNumber(parseFormattedNumber(e.target.value)))}
              placeholder="Misol: 1 000 000"
              required
            />
            {exceedsLimit && (
              <p className="text-sm text-destructive">
                Avans miqdori qolgan limitdan ({formatNumber(maxAdvance)} so'm) oshib ketdi
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="method">To'lov usuli</Label>
            <Select
              id="method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              options={PAYMENT_METHODS.map((m) => ({ value: m.value, label: m.label }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Izoh (ixtiyoriy)</Label>
            <Input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Avans haqida izoh"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" disabled={loading || amount <= 0 || exceedsLimit}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Avans berish
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  )
}
