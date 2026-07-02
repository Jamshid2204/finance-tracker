import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Email noto'g'ri"),
  password: z.string().min(6, "Parol kamida 6 belgi"),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const signupSchema = z.object({
  email: z.string().email("Email noto'g'ri"),
  password: z.string().min(6, "Parol kamida 6 belgi"),
  fullname: z.string().min(3, "Ism kamida 3 harf"),
})

export type SignupFormData = z.infer<typeof signupSchema>
