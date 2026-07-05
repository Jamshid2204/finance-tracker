import { NextResponse } from "next/server"
import { setWebhook } from "@/lib/telegram/bot"

export async function POST(request: Request) {
  try {
    const { url } = await request.json()
    if (!url) {
      return NextResponse.json({ ok: false, error: "URL required" }, { status: 400 })
    }
    const result = await setWebhook(url)
    return NextResponse.json({ ok: true, result })
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 })
  }
}
