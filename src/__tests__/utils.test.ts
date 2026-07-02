import "@testing-library/jest-dom"
import { formatCurrency } from "@/lib/utils"
import { calculateFinalSalary } from "@/lib/validations/payroll"

describe("Utils", () => {
  describe("formatCurrency", () => {
    it("formats number with currency", () => {
      expect(formatCurrency(5000000)).toContain("so'm")
    })

    it("formats zero", () => {
      expect(formatCurrency(0)).toBe("0 so'm")
    })
  })

  describe("calculateFinalSalary", () => {
    it("calculates correctly with all components", () => {
      expect(calculateFinalSalary(5000000, 500000, 200000, 1000000)).toBe(4300000)
    })

    it("returns base when no bonus/penalty/advance", () => {
      expect(calculateFinalSalary(5000000, 0, 0, 0)).toBe(5000000)
    })
  })
})
