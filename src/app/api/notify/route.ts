import { NextResponse } from "next/server"
import { notifyPayrollCreated, notifyPaymentMade, notifyBonus, notifyPenalty, notifyAttendance } from "@/services/telegram.service"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, employee_id, amount, month, year, note, base_salary, bonus, penalty, advance, method } = body

    if (!employee_id || !amount) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 })
    }

    let result

    switch (type) {
      case "payroll_created":
        result = await notifyPayrollCreated(employee_id, amount, month, year)
        break
      case "payment_made":
        result = await notifyPaymentMade(employee_id, amount, { baseSalary: base_salary, bonus, penalty, advance, method, note })
        break
      case "advance_given":
        result = await notifyPaymentMade(employee_id, amount)
        break
      case "bonus":
        result = await notifyBonus(employee_id, amount, note)
        break
      case "penalty":
        result = await notifyPenalty(employee_id, amount, note)
        break
      case "attendance_arrived":
        result = await notifyAttendance(employee_id, "arrived", note || "")
        break
      case "attendance_left":
        result = await notifyAttendance(employee_id, "left", note || "")
        break
      default:
        return NextResponse.json({ ok: false, error: "Unknown notification type" }, { status: 400 })
    }

    return NextResponse.json({ ok: true, result })
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 })
  }
}
