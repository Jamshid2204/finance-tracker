import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Telegram webhook updates
    const message = body.message?.text
    const chatId = body.message?.chat?.id

    if (message && chatId) {
      // Handle bot commands
      if (message === "/start") {
        // Respond with instructions
        return NextResponse.json({
          method: "sendMessage",
          chat_id: chatId,
          text: "Assalomu alaykum! Employee Payroll Management botiga xush kelibsiz.\n\nOylik va to'lovlar haqida bildirishnomalarni olish uchun admin bilan bog'laning.",
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
