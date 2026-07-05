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

type Action = "bonus" | "penalty" | "advance" | "pay"

const actionOptions = [
  { value: "bonus", label: "Bonus" },
  { value: "penalty", label: "Jarima" },
  { value: "advance", label: "Avans" },
  { value: "pay", label: "Oylikni to'lash" },
]

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payroll: Payroll | null
}

export function PaymentDialog({ open, onOpenChange, payroll }: PaymentDialogProps) {
  const [action, setAction] = useState<Action>("pay")
  const [amountStr, setAmountStr] = useState("")
  const [method, setMethod] = useState<string>("cash")
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()
  const supabase = createClient()

  if (!payroll) return null

  const amount = parseFormattedNumber(amountStr)
  const advance = payroll.advance || 0
  const remaining = Math.max(0, payroll.final_salary - advance)
  const maxAdvance = payroll.base_salary - advance
  const exceedsAdvanceLimit = action === "advance" && amount > maxAdvance

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payroll) return
    if (action === "pay" && remaining <= 0) return
    if ((action === "bonus" || action === "penalty" || action === "advance") && amount <= 0) return
    if (action === "advance" && exceedsAdvanceLimit) return
    setLoading(true)

    try {
      if (action === "bonus") {
        const newBonus = (payroll.bonus || 0) + amount
        const newFinal = payroll.base_salary + newBonus - (payroll.penalty || 0)
        await supabase.from("payrolls").update({ bonus: newBonus, final_salary: newFinal }).eq("id", payroll.id)
        toast.success(`Bonus qo'shildi: ${formatCurrency(amount)}`)
      }

      if (action === "penalty") {
        const newPenalty = (payroll.penalty || 0) + amount
        const newFinal = payroll.base_salary + (payroll.bonus || 0) - newPenalty
        await supabase.from("payrolls").update({ penalty: newPenalty, final_salary: newFinal }).eq("id", payroll.id)
        toast.success(`Jarima qo'llandi: ${formatCurrency(amount)}`)
      }

      if (action === "advance") {
        const newAdvance = advance + amount
        await supabase.from("payrolls").update({ advance: newAdvance }).eq("id", payroll.id)
        await supabase.from("payments").insert({
          payroll_id: payroll.id,
          amount,
          payment_method: method,
          note: note ? `Avans: ${note}` : "Avans",
          paid_at: new Date().toISOString(),
        })
        toast.success(`Avans berildi: ${formatCurrency(amount)}`)
      }

      if (action === "pay") {
        await supabase.from("payrolls").update({ status: "paid" }).eq("id", payroll.id)
        await supabase.from("payments").insert({
          payroll_id: payroll.id,
          amount: remaining,
          payment_method: method,
          note: note || "Ish haqi",
          paid_at: new Date().toISOString(),
        })
        toast.success(`To'lov amalga oshirildi: ${formatCurrency(remaining)}`)
      }

      queryClient.invalidateQueries({ queryKey: ["payrolls"] })
      queryClient.invalidateQueries({ queryKey: ["payments"] })
      onOpenChange(false)

      const notifyBody: Record<string, any> = {
        type: action === "pay" ? "payment_made" : action === "advance" ? "advance_given" : action,
        employee_id: payroll.employee_id,
        amount: action === "pay" ? remaining : amount,
        note: note || undefined,
      }
      if (action === "pay") {
        notifyBody.base_salary = payroll.base_salary
        notifyBody.bonus = payroll.bonus
        notifyBody.penalty = payroll.penalty
        notifyBody.advance = payroll.advance
        notifyBody.method = PAYMENT_METHODS.find((m) => m.value === method)?.label || method
      }

      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notifyBody),
      })
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const title = action === "bonus" ? "Bonus qo'shish"
    : action === "penalty" ? "Jarima qo'llash"
    : action === "advance" ? "Avans berish"
    : "Ish haqini to'lash"

  const canSubmit = action === "pay" ? remaining > 0
    : action === "advance" ? amount > 0 && !exceedsAdvanceLimit
    : amount > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg border bg-muted p-3 space-y-1">
          <p className="text-sm text-muted-foreground">Xodim</p>
          <p className="font-semibold">{payroll.employee?.fullname || "Noma'lum"}</p>
          <p className="text-sm text-muted-foreground">
            {getMonthName(payroll.month)} {payroll.year}
          </p>
        </div>

        <div className="space-y-2">
          <Label>Amal turi</Label>
          <Select
            value={action}
            onChange={(e) => { setAction(e.target.value as Action); setAmountStr(""); setNote("") }}
            options={actionOptions.filter((o) => o.value !== "advance" || advance < payroll.base_salary)}
          />
        </div>

        {(action === "bonus" || action === "penalty" || action === "advance") && (
          <div className="space-y-2">
            <Label>{action === "bonus" ? "Bonus summasi" : action === "penalty" ? "Jarima summasi" : "Avans summasi"} (so'm)</Label>
            <Input
              type="text"
              inputMode="numeric"
              value={amountStr}
              onChange={(e) => setAmountStr(formatNumber(parseFormattedNumber(e.target.value)))}
              placeholder="Summani kiriting"
              required
            />
            {exceedsAdvanceLimit && (
              <p className="text-sm text-destructive">
                Avans miqdori qolgan limitdan ({formatNumber(maxAdvance)} so'm) oshib ketdi
              </p>
            )}
          </div>
        )}

        {action === "pay" && (
          <div className="rounded-lg border p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Asosiy oylik</span>
              <span>{formatCurrency(payroll.base_salary)}</span>
            </div>
            {payroll.bonus > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Bonus</span>
                <span>+{formatCurrency(payroll.bonus)}</span>
              </div>
            )}
            {payroll.penalty > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Jarima</span>
                <span>-{formatCurrency(payroll.penalty)}</span>
              </div>
            )}
            <div className="flex justify-between font-medium border-t pt-1">
              <span>Jami hisob</span>
              <span>{formatCurrency(payroll.final_salary)}</span>
            </div>
            {advance > 0 && (
              <div className="flex justify-between text-amber-600">
                <span>Berilgan avans</span>
                <span>-{formatCurrency(advance)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t pt-1">
              <span>To'lanadigan summa</span>
              <span>{formatCurrency(remaining)}</span>
            </div>
          </div>
        )}

        {(action === "advance" || action === "pay") && (
          <div className="space-y-2">
            <Label htmlFor="method">To'lov usuli</Label>
            <Select
              id="method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              options={PAYMENT_METHODS.map((m) => ({ value: m.value, label: m.label }))}
            />
          </div>
        )}

        {(action === "bonus" || action === "penalty" || action === "pay") && (
          <div className="space-y-2">
            <Label htmlFor="note">Izoh (ixtiyoriy)</Label>
            <input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={action === "bonus" ? "Bonus haqida izoh" : action === "penalty" ? "Jarima haqida izoh" : "To'lov haqida izoh"}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button type="submit" disabled={loading || !canSubmit}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {action === "bonus" ? "Bonus qo'shish"
              : action === "penalty" ? "Jarima qo'llash"
              : action === "advance" ? "Avans berish"
              : advance > 0 ? "Qolgan qismini to'lash" : "To'lash"}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

function getMonthName(month: number): string {
  const months = [
    "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
    "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
  ]
  return months[month - 1] || "Noma'lum"
}
