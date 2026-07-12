const { createClient } = require("@supabase/supabase-js")
const fs = require("fs")
const path = require("path")

// Parse .env.local
function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env.local")
  if (!fs.existsSync(envPath)) {
    console.error(".env.local topilmadi")
    process.exit(1)
  }
  const lines = fs.readFileSync(envPath, "utf-8").split("\n")
  const env = {}
  for (const line of lines) {
    const [k, ...v] = line.split("=")
    if (k && v.length) env[k.trim()] = v.join("=").trim()
  }
  return env
}

const env = loadEnv()
const BOT_TOKEN = env.TELEGRAM_BOT_TOKEN
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!BOT_TOKEN) { console.error("TELEGRAM_BOT_TOKEN topilmadi"); process.exit(1) }
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error("Supabase sozlanmagan"); process.exit(1) }

const isServiceRole = !!env.SUPABASE_SERVICE_ROLE_KEY
console.log(`Supabase: ${SUPABASE_URL}`)
console.log(`Kalit: ${isServiceRole ? "service_role (RLS chetlab o'tadi)" : "anon"}`)
if (!isServiceRole) {
  console.warn("⚠️  SUPABASE_SERVICE_ROLE_KEY topilmadi. .env.local ga qo'shing!")
  console.warn("   Agar anon kalit bilan RLS bloklasa, ishlamaydi.")
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const API = `https://api.telegram.org/bot${BOT_TOKEN}`
let lastUpdateId = 0

// Test Supabase connection
async function testConnection() {
  const { data, error } = await supabase.from("employees").select("id").limit(1)
  if (error) console.error("Supabase test HATO:", error.message)
  else console.log("Supabase ulanish OK, employees jadvalidan o'qiy oldi")
}
testConnection()

async function getUpdates() {
  const url = `${API}/getUpdates?offset=${lastUpdateId + 1}&timeout=10`
  const res = await fetch(url)
  const data = await res.json()
  if (!data.ok) {
    console.log("[Telegram API HATO]", data)
    return []
  }
  const updates = data.result || []
  if (updates.length > 0) {
    console.log(`${updates.length} ta yangi update keldi`)
  }
  return updates
}

function attendanceKeyboard() {
  return {
    keyboard: [
      [{ text: "✅ Keldim" }, { text: "👋 Ketdim" }],
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
  }
}

async function sendMessage(chatId, text, replyMarkup) {
  const body = { chat_id: chatId, text, parse_mode: "HTML" }
  if (replyMarkup) body.reply_markup = replyMarkup
  await fetch(`${API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

async function handleMessage(msg) {
  const text = msg.text?.trim()
  const chatId = msg.chat?.id
  const firstName = msg.chat?.first_name || "Xodim"
  console.log(`\n[KELGAN XABAR] chatId=${chatId}, text="${text}"`)

  if (!text || !chatId) {
    console.log("[HATO] text yoki chatId yo'q")
    return
  }

  console.log("[QIDIRISH] employee telegram_chat_id =", String(chatId))
  const { data: employee, error: empErr } = await supabase
    .from("employees")
    .select("id, fullname")
    .eq("telegram_chat_id", String(chatId))
    .maybeSingle()

  if (empErr) {
    console.log("[SUPABASE HATO] employee qidirishda:", empErr.message)
    return
  }

  if (!employee) {
    console.log("[XODIM TOPILMADI] telegram_chat_id =", chatId)
    if (text === "/start") {
      await sendMessage(chatId, `Assalomu alaykum, ${firstName}!\n\nSiz tizimda ro'yxatdan o'tmagansiz. Admin bilan bog'laning.`)
    } else {
      await sendMessage(chatId, "Siz tizimda ro'yxatdan o'tmagansiz. Admin bilan bog'laning.")
    }
    return
  }

  console.log(`[XODIM TOPILDI] id=${employee.id}, name=${employee.fullname}`)

  const today = new Date().toISOString().split("T")[0]

  if (text === "/start") {
    await sendMessage(
      chatId,
      `Assalomu alaykum, ${employee.fullname}!\n\nIshga kelish/ketishni belgilash uchun tugmalardan foydalaning.`,
      attendanceKeyboard()
    )
    return
  }

  if (text === "/kelish" || text === "✅ Keldim") {
    console.log("[KELISH] mavjud attendance tekshirish...")
    const { data: existing } = await supabase
      .from("attendance")
      .select("id, arrived_at")
      .eq("employee_id", employee.id)
      .eq("date", today)
      .maybeSingle()

    if (existing?.arrived_at) {
      const oldTime = new Date(existing.arrived_at).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })
      await sendMessage(chatId, `ℹ️ Siz allaqachon belgilagansiz.\n\nKelgan vaqt: ${oldTime}\nSana: ${today}`, attendanceKeyboard())
      return
    }

    console.log("[KELISH] attendance ga yozish...")
    const now = new Date().toISOString()
    const { error } = existing
      ? await supabase.from("attendance").update({ arrived_at: now, status: "present" }).eq("id", existing.id)
      : await supabase.from("attendance").insert({ employee_id: employee.id, date: today, arrived_at: now, status: "present" })

    if (error) {
      console.log("[SUPABASE HATO] attendance upsert:", error.message)
      throw error
    }

    console.log("[KELISH] muvaffaqiyatli yozildi")
    const time = new Date(now).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })
    await notifyAdmins(employee.fullname, "arrived", time)
    await sendMessage(chatId, `✅ ${employee.fullname}, kelishingiz belgilandi.\n\nVaqt: ${time}\nSana: ${today}`, attendanceKeyboard())
    return
  }

  if (text === "/ketish" || text === "👋 Ketdim") {
    console.log("[KETISH] existing attendance tekshirish...")
    const { data: existing } = await supabase
      .from("attendance")
      .select("id, arrived_at, left_at")
      .eq("employee_id", employee.id)
      .eq("date", today)
      .maybeSingle()

    if (!existing) {
      console.log("[KETISH] bugun kelmagan, xabar yuboriladi")
      await sendMessage(chatId, "❌ Bugun kelishingiz belgilanmagan. Iltimos, avval /kelish buyrug'ini yuboring.")
      return
    }

    if (existing.left_at) {
      const oldTime = new Date(existing.left_at).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })
      await sendMessage(chatId, `ℹ️ Siz allaqachon ketganingizni belgilagansiz.\n\nKetgan vaqt: ${oldTime}\nSana: ${today}`, attendanceKeyboard())
      return
    }

    console.log("[KETISH] left_at yangilanmoqda...")
    const now = new Date().toISOString()
    const { error } = await supabase
      .from("attendance")
      .update({ left_at: now })
      .eq("id", existing.id)

    if (error) {
      console.log("[SUPABASE HATO] attendance update:", error.message)
      throw error
    }

    console.log("[KETISH] muvaffaqiyatli yozildi")
    const time = new Date(now).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })
    await notifyAdmins(employee.fullname, "left", time)
    await sendMessage(chatId, `👋 ${employee.fullname}, ketishingiz belgilandi.\n\nVaqt: ${time}\nSana: ${today}`, attendanceKeyboard())
  }
}

async function notifyAdmins(employeeName, type, time) {
  const { data: admins } = await supabase
    .from("users")
    .select("employee_id")
    .in("role", ["owner", "admin"])

  if (!admins?.length) return

  const ids = admins.map((a) => a.employee_id).filter(Boolean)
  const { data: employees } = await supabase
    .from("employees")
    .select("telegram_chat_id")
    .in("id", ids)

  const emoji = type === "arrived" ? "🟢" : "🔴"
  const label = type === "arrived" ? "keldi" : "ketdi"
  const message = `${emoji} <b>${employeeName}</b> ishga <b>${label}</b>\n\nVaqt: ${time}`

  for (const emp of employees || []) {
    if (!emp.telegram_chat_id) continue
    await fetch(`${API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: emp.telegram_chat_id, text: message, parse_mode: "HTML" }),
    }).catch(() => {})
  }
}

async function poll() {
  // Avval webhook ni o'chiramiz (polling bilan birga ishlamaydi)
  console.log("Webhook o'chirilmoqda...")
  const delRes = await fetch(`${API}/deleteWebhook?drop_pending_updates=true`, { method: "POST" })
  const delData = await delRes.json()
  console.log("deleteWebhook:", delData.ok ? "OK" : "HATO", delData)

  console.log("Telegram polling boshlandi...")
  while (true) {
    try {
      const updates = await getUpdates()
      for (const update of updates) {
        if (update.update_id > lastUpdateId) lastUpdateId = update.update_id
        if (update.message) {
          await handleMessage(update.message)
        }
      }
    } catch (e) {
      console.error("Polling error:", e.message)
    }
    await new Promise((r) => setTimeout(r, 3000))
  }
}

poll().catch(console.error)
