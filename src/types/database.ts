export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: "owner" | "admin" | "hr" | "accountant" | "employee"
          employee_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          role: "owner" | "admin" | "hr" | "accountant" | "employee"
          employee_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: "owner" | "admin" | "hr" | "accountant" | "employee"
          employee_id?: string | null
          created_at?: string
        }
      }
      employees: {
        Row: {
          id: string
          fullname: string
          phone: string
          position: string
          department: string
          salary: number
          status: "active" | "inactive"
          telegram_chat_id: string | null
          avatar: string | null
          created_at: string
        }
        Insert: {
          id?: string
          fullname: string
          phone: string
          position: string
          department: string
          salary: number
          status?: "active" | "inactive"
          telegram_chat_id?: string | null
          avatar?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          fullname?: string
          phone?: string
          position?: string
          department?: string
          salary?: number
          status?: "active" | "inactive"
          telegram_chat_id?: string | null
          avatar?: string | null
          created_at?: string
        }
      }
      payrolls: {
        Row: {
          id: string
          employee_id: string
          month: number
          year: number
          base_salary: number
          bonus: number
          penalty: number
          advance: number
          final_salary: number
          status: "pending" | "paid" | "cancelled"
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          month: number
          year: number
          base_salary: number
          bonus?: number
          penalty?: number
          advance?: number
          final_salary?: number
          status?: "pending" | "paid" | "cancelled"
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          month?: number
          year?: number
          base_salary?: number
          bonus?: number
          penalty?: number
          advance?: number
          final_salary?: number
          status?: "pending" | "paid" | "cancelled"
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          payroll_id: string
          amount: number
          payment_method: "cash" | "card" | "bank" | "click" | "payme"
          paid_at: string
          note: string | null
        }
        Insert: {
          id?: string
          payroll_id: string
          amount: number
          payment_method: "cash" | "card" | "bank" | "click" | "payme"
          paid_at?: string
          note?: string | null
        }
        Update: {
          id?: string
          payroll_id?: string
          amount?: number
          payment_method?: "cash" | "card" | "bank" | "click" | "payme"
          paid_at?: string
          note?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          employee_id: string
          title: string
          message: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          title: string
          message: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          title?: string
          message?: string
          read?: boolean
          created_at?: string
        }
      }
      telegram_logs: {
        Row: {
          id: string
          employee_id: string
          message: string
          status: "sent" | "failed"
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          message: string
          status?: "sent" | "failed"
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          message?: string
          status?: "sent" | "failed"
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          entity_type: string
          entity_id: string
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          entity_type: string
          entity_id: string
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          entity_type?: string
          entity_id?: string
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
