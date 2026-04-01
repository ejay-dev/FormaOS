"use client"

import { useEffect, useState } from "react"
import { createSupabaseClient } from "@/lib/supabase/client"
import { Activity, Clock, User } from "lucide-react"
// FIXED: Specific import for formatDistanceToNow
import { formatDistanceToNow } from "date-fns"

interface AuditEntry {
  id: string
  action: string
  target: string
  actor_email: string | null
  created_at: string
}

export function DashboardAuditStream({ orgId }: { orgId: string }) {
  const supabase = createSupabaseClient()
  const [logs, setLogs] = useState<AuditEntry[]>([])

  useEffect(() => {
    // 1. Initial Fetch of recent logs
    const fetchInitialLogs = async () => {
      const { data } = await supabase
        .from("org_audit_logs")
        .select("id, action, target, actor_email, created_at")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(10)
      
      if (data) setLogs(data)
    }

    fetchInitialLogs()

    // 2. Subscribe to Realtime Changes
    const channel = supabase
      .channel("realtime_audit_logs")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "org_audit_logs",
          filter: `organization_id=eq.${orgId}`,
        },
        (payload: { new: AuditEntry }) => {
          setLogs((prev) => [payload.new as AuditEntry, ...prev].slice(0, 10))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Helper to safely format dates
  const getTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (_e) {
      return "just now"
    }
  }

  return (
    <div className="bg-glass-strong border border-glass-border rounded-2xl shadow-sm overflow-hidden flex flex-col h-full min-h-[280px] sm:min-h-[400px]">
      <div className="p-4 border-b border-glass-border flex items-center justify-between bg-glass-strong">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Activity className="h-4 w-4 text-green-500" />
          Live Audit Stream
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Live</span>
          <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Activity className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-sm italic">Listening for system events...</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="relative pl-6 pb-2 border-l border-glass-border last:border-0">
              <div className="absolute left-[-5px] top-1.5 h-2 w-2 rounded-full bg-glass-strong border-2 border-white" />
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-bold text-foreground leading-snug">
                    {log.target}
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase">
                    <User className="h-3 w-3" />
                    {(log.actor_email || "system").split('@')[0]}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase">
                    <Clock className="h-3 w-3" />
                    {getTimeAgo(log.created_at)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
