import { createClient } from "@/lib/supabase/server"

export async function setWebhook(url: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) throw new Error("Bot token not configured")

  const res = await fetch(
    `https://api.telegram.org/bot${botToken}/setWebhook`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: `${url}/api/telegram` }),
    }
  )

  return res.json()
}

export async function verifyTelegramChatId(chatId: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) return false

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/getChat`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId }),
      }
    )
    const data = await res.json()
    return data.ok === true
  } catch {
    return false
  }
}
