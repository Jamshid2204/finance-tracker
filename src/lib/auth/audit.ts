import { createClient } from "@/lib/supabase/server"

interface AuditEntry {
  userId: string
  action: "create" | "update" | "delete"
  entityType: string
  entityId: string
  oldValues?: Record<string, unknown> | null
  newValues?: Record<string, unknown> | null
}

export async function logAudit(entry: AuditEntry) {
  try {
    const supabase = await createClient()
    await supabase.from("audit_logs").insert({
      user_id: entry.userId,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      old_values: entry.oldValues ?? null,
      new_values: entry.newValues ?? null,
    })
  } catch (error) {
    console.error("Audit log failed:", error)
  }
}
