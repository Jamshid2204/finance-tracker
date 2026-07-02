import { z } from "zod"

export const payrollSchema = z.object({
  employee_id: z.string().uuid("Xodimni tanlang"),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2020).max(2100),
  base_salary: z.coerce.number().positive("Asosiy oylik musbat bo'lishi kerak"),
  bonus: z.coerce.number().min(0).default(0),
  penalty: z.coerce.number().min(0).default(0),
  advance: z.coerce.number().min(0).default(0),
})

export type PayrollFormData = z.infer<typeof payrollSchema>

export function calculateFinalSalary(base: number, bonus: number, penalty: number, advance: number): number {
  return base + bonus - penalty - advance
}
