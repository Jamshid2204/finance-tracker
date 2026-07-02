"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { Sun, Moon, Menu, LogOut, Search } from "lucide-react"
import { User } from "@/types"
import { useState, useEffect } from "react"
import Link from "next/link"

interface NavbarProps {
  user: User | null
  onMenuClick: () => void
  onSignOut: () => void
}

export function Navbar({ user, onMenuClick, onSignOut }: NavbarProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1" />

      <Link
        href="/search"
        className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Qidirish...</span>
      </Link>

      {mounted && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      )}

      <Link href="/profile">
        <Avatar
          alt={user?.email || "User"}
          fallback={user?.email?.charAt(0).toUpperCase()}
          className="cursor-pointer"
        />
      </Link>

      <Button variant="ghost" size="icon" onClick={onSignOut}>
        <LogOut className="h-5 w-5" />
      </Button>
    </header>
  )
}
