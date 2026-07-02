import { createClient } from "@/lib/supabase/server"

export async function sendTelegramNotification(employeeId: string, message: string) {
  const supabase = await createClient()

  const { data: employee } = await supabase
    .from("employees")
    .select("telegram_chat_id")
    .eq("id", employeeId)
    .single()

  if (!employee?.telegram_chat_id) {
    return { status: "failed", error: "Telegram ID not found" }
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    return { status: "failed", error: "Bot token not configured" }
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: employee.telegram_chat_id,
          text: message,
          parse_mode: "HTML",
        }),
      }
    )

    const result: any = await res.json()

    await supabase.from("telegram_logs").insert({
      employee_id: employeeId,
      message,
      status: result.ok ? "sent" : "failed",
    })

    return { status: result.ok ? "sent" : "failed" }
  } catch (error) {
    await supabase.from("telegram_logs").insert({
      employee_id: employeeId,
      message,
      status: "failed",
    })
    return { status: "failed", error }
  }
}

export async function notifyPayrollCreated(employeeId: string, amount: number, month: number, year: number) {
  const monthNames = [
    "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
    "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
  ]

  const message = `✅ <b>Oylik hisoblandi</b>\n\n${monthNames[month - 1]} ${year} uchun oylik: <b>${amount.toLocaleString()} so'm</b>`

  return sendTelegramNotification(employeeId, message)
}

export async function notifyPaymentMade(employeeId: string, amount: number) {
  const message = `💰 <b>To'lov amalga oshirildi</b>\n\nBugun sizga <b>${amount.toLocaleString()} so'm</b> o'tkazildi.`

  return sendTelegramNotification(employeeId, message)
}

export async function notifyBonus(employeeId: string, amount: number) {
  const message = `🎉 <b>Bonus qo'shildi!</b>\n\nSizga <b>${amount.toLocaleString()} so'm</b> bonus qo'shildi.`

  return sendTelegramNotification(employeeId, message)
}

export async function notifyPenalty(employeeId: string, amount: number) {
  const message = `⚠️ <b>Jarima qo'llandi</b>\n\nSizga <b>${amount.toLocaleString()} so'm</b> jarima qo'llandi.`

  return sendTelegramNotification(employeeId, message)
}
