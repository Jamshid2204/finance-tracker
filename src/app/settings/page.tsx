"use client"

import { useTheme } from "next-themes"
import { AppLayout } from "@/components/layouts/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { useEffect, useState } from "react"
import { Sun, Moon, Laptop } from "lucide-react"
import { toast } from "sonner"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const themeOptions = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" },
  ]

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Sozlamalar</h1>

        <Card>
          <CardHeader>
            <CardTitle>Tashqi ko'rinish</CardTitle>
            <CardDescription>Mavzu va ko'rinish sozlamalari</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Mavzu</Label>
              {mounted && (
                <div className="flex gap-2">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    onClick={() => setTheme("light")}
                    className="flex-1"
                  >
                    <Sun className="mr-2 h-4 w-4" />
                    Light
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    onClick={() => setTheme("dark")}
                    className="flex-1"
                  >
                    <Moon className="mr-2 h-4 w-4" />
                    Dark
                  </Button>
                  <Button
                    variant={theme === "system" ? "default" : "outline"}
                    onClick={() => setTheme("system")}
                    className="flex-1"
                  >
                    <Laptop className="mr-2 h-4 w-4" />
                    System
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kompaniya</CardTitle>
            <CardDescription>Kompaniya ma'lumotlari</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Kompaniya nomi</Label>
              <Input id="company-name" placeholder="Mening kompaniyam" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Valyuta</Label>
              <Input id="currency" defaultValue="so'm" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Vaqt mintaqasi</Label>
              <Select
                id="timezone"
                defaultValue="Asia/Tashkent"
                options={[
                  { value: "Asia/Tashkent", label: "Asia/Tashkent (UTC+5)" },
                  { value: "Asia/Samarkand", label: "Asia/Samarkand (UTC+5)" },
                ]}
              />
            </div>
            <Button onClick={() => toast.success("Sozlamalar saqlandi")}>
              Saqlash
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Telegram Bot</CardTitle>
            <CardDescription>Telegram orqali bildirishnomalar yuborish</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Bot tokeni <code>.env.local</code> faylida sozlangan. @BotFather orqali bot yaratib, token oling.
            </p>
            <div className="space-y-2">
              <Label>Bot holati</Label>
              <div className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span>Bot sozlangan</span>
              </div>
            </div>
            <Button
              onClick={async () => {
                try {
                  const res = await fetch("/api/webhook", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url: window.location.origin }),
                  })
                  const data = await res.json()
                  if (data.ok) {
                    toast.success("Webhook muvaffaqiyatli o'rnatildi")
                  } else {
                    toast.error(data.error || "Xatolik yuz berdi")
                  }
                } catch {
                  toast.error("Webhook o'rnatishda xatolik")
                }
              }}
            >
              Webhook o'rnatish
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
