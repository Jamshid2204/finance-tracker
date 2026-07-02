"use client"

import { AppLayout } from "@/components/layouts/app-layout"
import { useSession } from "@/hooks/use-session"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ROLES } from "@/constants"

export default function ProfilePage() {
  const { user, loading } = useSession()

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    )
  }

  if (!user) return null

  const roleLabel = ROLES.find((r) => r.value === user.role)?.label || user.role

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Profil</h1>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar
                alt={user.email}
                fallback={user.email?.charAt(0).toUpperCase()}
                className="h-16 w-16 text-lg"
              />
              <div>
                <CardTitle className="text-xl">{user.email}</CardTitle>
                <Badge className="mt-1">{roleLabel}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rol</p>
                <p className="font-medium">{roleLabel}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ID</p>
                <p className="font-medium text-xs">{user.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ro'yxatdan o'tgan</p>
                <p className="font-medium">
                  {new Date(user.created_at).toLocaleDateString("uz-UZ")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
