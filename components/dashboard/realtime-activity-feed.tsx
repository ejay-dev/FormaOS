"use client";

import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { ActivityFeed } from "./activity-feed";
import { ActivityItem } from "@/lib/data/analytics";

export function RealtimeActivityFeed({ orgId }: { orgId: string }) {
  const supabase = createSupabaseClient();
  const [items, setItems] = useState<ActivityItem[]>([]);

  // Initial load
  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data } = await supabase
        .from("org_audit_logs")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(25);

      if (!mounted) return;

      const mapped = (data || []).map(mapAuditToActivity);
      setItems(mapped);
    }

    load();

    // Realtime subscription
    const channel = supabase
      .channel("realtime-activity")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "org_audit_logs",
          filter: `organization_id=eq.${orgId}`,
        },
        (payload: { new: any }) => {
          const newItem = mapAuditToActivity(payload.new);
          setItems((prev) => [newItem, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [orgId, supabase]);

  return <ActivityFeed items={items} />;
}

/* 🔁 Normalize audit row → ActivityItem */
function mapAuditToActivity(log: any): ActivityItem {
  return {
    id: log.id,
    user: log.actor_id ? log.actor_id.slice(0, 6) : "System",
    action: log.action,
    target: log.target_resource || log.event,
    timestamp: log.created_at,
    type:
      log.domain === "policy" ? "policy" :
      log.domain === "task" ? "task" :
      log.domain === "evidence" ? "evidence" :
      "security",
  };
}
