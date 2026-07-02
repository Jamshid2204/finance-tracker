import { z } from "zod"

export const companySettingsSchema = z.object({
  company_name: z.string().min(1, "Kompaniya nomi majburiy"),
  logo: z.string().optional().nullable(),
  currency: z.string().default("so'm"),
  telegram_bot_token: z.string().optional().nullable(),
  timezone: z.string().default("Asia/Tashkent"),
  payday: z.number().min(1).max(31).optional(),
})

export type CompanySettingsFormData = z.infer<typeof companySettingsSchema>
