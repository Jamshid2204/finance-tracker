import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { notifyAttendance } from "@/services/telegram.service"

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

async function sendTelegram(chatId: number, text: string, replyMarkup?: any) {
  if (!BOT_TOKEN) return
  const body: any = { chat_id: chatId, text, parse_mode: "HTML" }
  if (replyMarkup) body.reply_markup = replyMarkup
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

function attendanceKeyboard() {
  return {
    keyboard: [[{ text: "✅ Keldim" }, { text: "👋 Ketdim" }]],
    resize_keyboard: true,
    one_time_keyboard: false,
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const message = body.message?.text?.trim()
    const chatId = body.message?.chat?.id
    const firstName = body.message?.chat?.first_name || "Xodim"

    if (!message || !chatId) {
      return NextResponse.json({ ok: true })
    }

    const supabase = createAdminClient()

    const { data: employee } = await supabase
      .from("employees")
      .select("id, fullname")
      .eq("telegram_chat_id", String(chatId))
      .maybeSingle()

    if (!employee) {
      if (message === "/start") {
        await sendTelegram(chatId, `Assalomu alaykum, ${firstName}!\n\nSiz tizimda ro'yxatdan o'tmagansiz. Admin bilan bog'laning.`)
      } else {
        await sendTelegram(chatId, "Siz tizimda ro'yxatdan o'tmagansiz. Admin bilan bog'laning.")
      }
      return NextResponse.json({ ok: true })
    }

    const today = new Date().toISOString().split("T")[0]

    if (message === "/start") {
      await sendTelegram(
        chatId,
        `Assalomu alaykum, ${employee.fullname}!\n\nIshga kelish/ketishni belgilash uchun tugmalardan foydalaning.`,
        attendanceKeyboard()
      )
      return NextResponse.json({ ok: true })
    }

    if (message === "/kelish" || message === "✅ Keldim") {
      const { data: existing } = await supabase
        .from("attendance")
        .select("id, arrived_at")
        .eq("employee_id", employee.id)
        .eq("date", today)
        .maybeSingle()

      if (existing?.arrived_at) {
        const t = new Date(existing.arrived_at).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })
        await sendTelegram(chatId, `ℹ️ Siz allaqachon belgilagansiz.\n\nKelgan vaqt: ${t}\nSana: ${today}`, attendanceKeyboard())
        return NextResponse.json({ ok: true })
      }

      const now = new Date().toISOString()
      const { error } = existing
        ? await supabase.from("attendance").update({ arrived_at: now, status: "present" }).eq("id", existing.id)
        : await supabase.from("attendance").insert({ employee_id: employee.id, date: today, arrived_at: now, status: "present" })

      if (error) throw error

      const t = new Date(now).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })
      await notifyAttendance(employee.fullname, "arrived", t)
      await sendTelegram(chatId, `✅ ${employee.fullname}, kelishingiz belgilandi.\n\nVaqt: ${t}\nSana: ${today}`, attendanceKeyboard())
      return NextResponse.json({ ok: true })
    }

    if (message === "/ketish" || message === "👋 Ketdim") {
      const { data: existing } = await supabase
        .from("attendance")
        .select("id, arrived_at, left_at")
        .eq("employee_id", employee.id)
        .eq("date", today)
        .maybeSingle()

      if (!existing) {
        await sendTelegram(chatId, "❌ Bugun kelishingiz belgilanmagan. Iltimos, avval /kelish buyrug'ini yuboring.")
        return NextResponse.json({ ok: true })
      }

      if (existing.left_at) {
        const t = new Date(existing.left_at).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })
        await sendTelegram(chatId, `ℹ️ Siz allaqachon ketganingizni belgilagansiz.\n\nKetgan vaqt: ${t}\nSana: ${today}`, attendanceKeyboard())
        return NextResponse.json({ ok: true })
      }

      const now = new Date().toISOString()
      const { error } = await supabase.from("attendance").update({ left_at: now }).eq("id", existing.id)
      if (error) throw error

      const t = new Date(now).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })
      await notifyAttendance(employee.fullname, "left", t)
      await sendTelegram(chatId, `👋 ${employee.fullname}, ketishingiz belgilandi.\n\nVaqt: ${t}\nSana: ${today}`, attendanceKeyboard())
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 })
  }
}
