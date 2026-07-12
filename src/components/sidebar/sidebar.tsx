"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { SIDEBAR_ITEMS } from "@/constants"
import { Role } from "@/types"
import {
  LayoutDashboard,
  Users,
  Wallet,
  CreditCard,
  FileText,
  Settings,
  TrendingUp,
  CalendarCheck,
  ChevronLeft,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="h-5 w-5" />,
  Users: <Users className="h-5 w-5" />,
  Wallet: <Wallet className="h-5 w-5" />,
  CreditCard: <CreditCard className="h-5 w-5" />,
  FileText: <FileText className="h-5 w-5" />,
  Settings: <Settings className="h-5 w-5" />,
  TrendingUp: <TrendingUp className="h-5 w-5" />,
  CalendarCheck: <CalendarCheck className="h-5 w-5" />,
}

interface SidebarProps {
  userRole: Role
  collapsed?: boolean
  onToggle?: () => void
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ userRole, collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()

  const items = SIDEBAR_ITEMS.filter((item) =>
    (item.roles as readonly string[]).includes(userRole)
  )

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href="/dashboard" className="font-semibold text-lg">
            Payroll
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={mobileOpen ? onMobileClose : onToggle}
          className="lg:flex hidden"
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
        {mobileOpen && (
          <Button variant="ghost" size="icon" onClick={onMobileClose} className="lg:hidden">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {items.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              onClick={mobileOpen ? onMobileClose : undefined}
            >
              {iconMap[item.icon]}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>
      <div className="border-t p-4">
        {!collapsed && (
          <p className="text-xs text-muted-foreground">
            Employee Payroll v1.0
          </p>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onMobileClose} />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r bg-sidebar transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex h-screen border-r bg-sidebar transition-all duration-200",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
