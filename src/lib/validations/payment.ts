import { z } from "zod"

export const paymentSchema = z.object({
  payroll_id: z.string().uuid("To'lov varaqasini tanlang"),
  amount: z.coerce.number().positive("Summa musbat bo'lishi kerak"),
  payment_method: z.enum(["cash", "card", "bank", "click", "payme"]),
  note: z.string().optional().nullable(),
})

export type PaymentFormData = z.infer<typeof paymentSchema>
