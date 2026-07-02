import { z } from "zod"

export const employeeSchema = z.object({
  fullname: z.string().min(3, "Ism kamida 3 harf bo'lishi kerak"),
  phone: z.string().min(9, "Telefon raqam noto'g'ri"),
  position: z.string().min(2, "Lavozim kamida 2 harf"),
  department: z.string().min(2, "Bo'lim kamida 2 harf"),
  salary: z.coerce.number().positive("Maosh musbat son bo'lishi kerak"),
  status: z.enum(["active", "inactive"]).default("active"),
  telegram_chat_id: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
})

export type EmployeeFormData = z.infer<typeof employeeSchema>
