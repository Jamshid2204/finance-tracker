import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = "so'm"): string {
  return new Intl.NumberFormat("uz-UZ").format(amount) + ` ${currency}`
}

export function formatDate(date: string | Date, format: "short" | "long" = "short"): string {
  const d = new Date(date)
  if (format === "long") {
    return d.toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }
  return d.toLocaleDateString("uz-UZ")
}

export function getCurrentMonth(): number {
  return new Date().getMonth() + 1
}

export function getCurrentYear(): number {
  return new Date().getFullYear()
}

export function getMonthName(month: number): string {
  const months = [
    "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
    "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
  ]
  return months[month - 1] || ""
}
