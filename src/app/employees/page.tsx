"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { AppLayout } from "@/components/layouts/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Pagination } from "@/components/ui/pagination"
import { EmployeeDialog } from "@/components/dialogs/employee-dialog"
import { Employee } from "@/types"
import { formatCurrency } from "@/lib/utils"
import { Plus, Search, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

export default function EmployeesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const queryClient = useQueryClient()
  const supabase = createClient()
  const pageSize = 10

  const { data, isLoading } = useQuery({
    queryKey: ["employees", page, search],
    queryFn: async () => {
      let query = supabase.from("employees").select("*", { count: "exact" })

      if (search) {
        query = query.or(`fullname.ilike.%${search}%,position.ilike.%${search}%,department.ilike.%${search}%`)
      }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      const { data, count } = await query
        .order("fullname", { ascending: true })
        .range(from, to)

      return {
        data: (data || []) as Employee[],
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      }
    },
  })

  const handleDelete = async (id: string) => {
    if (!confirm("Rostdan ham o'chirmoqchimisiz?")) return

    const { error } = await supabase.from("employees").delete().eq("id", id)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Xodim o'chirildi")
      queryClient.invalidateQueries({ queryKey: ["employees"] })
    }
  }

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee)
    setDialogOpen(true)
  }

  const handleAdd = () => {
    setSelectedEmployee(null)
    setDialogOpen(true)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Xodimlar</h1>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Yangi xodim
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Xodim qidirish..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pl-9"
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Barcha xodimlar</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : data && data.data.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ism</TableHead>
                      <TableHead>Lavozim</TableHead>
                      <TableHead>Bo'lim</TableHead>
                      <TableHead>Maosh</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Harakat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">{employee.fullname}</TableCell>
                        <TableCell>{employee.position}</TableCell>
                        <TableCell>{employee.department}</TableCell>
                        <TableCell>{formatCurrency(employee.salary)}</TableCell>
                        <TableCell>
                          <Badge variant={employee.status === "active" ? "success" : "secondary"}>
                            {employee.status === "active" ? "Aktiv" : "Passiv"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(employee)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(employee.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Pagination
                  currentPage={page}
                  totalPages={data.totalPages}
                  onPageChange={setPage}
                />
              </>
            ) : (
              <EmptyState
                title="Xodimlar yo'q"
                description="Hali hech qanday xodim qo'shilmagan"
                action={
                  <Button onClick={handleAdd}>
                    <Plus className="mr-2 h-4 w-4" />
                    Birinchi xodimni qo'shish
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>
      </div>

      <EmployeeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        employee={selectedEmployee}
      />
    </AppLayout>
  )
}
