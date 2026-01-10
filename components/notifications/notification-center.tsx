"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { markAllNotificationsRead, markNotificationRead } from "@/app/app/actions/notifications";

type Notif = {
  id: string;
  title: string;
  body: string | null;
  action_url: string | null;
  read_at: string | null;
  created_at: string;
  type: string;
};

export function NotificationCenter({ orgId }: { orgId: string }) {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [items, setItems] = useState<Notif[]>([]);
  const unreadCount = items.filter(n => !n.read_at).length;

  useEffect(() => {
    let mounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function bootstrap() {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) return;
      if (!orgId) return;

      const { data } = await supabase
        .from("org_notifications")
        .select("id,title,body,action_url,read_at,created_at,type")
        .eq("user_id", userId)
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!mounted) return;
      setItems((data as Notif[]) || []);

      channel = supabase
        .channel("notif-stream")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "org_notifications",
            filter: `user_id=eq.${userId},organization_id=eq.${orgId}`,
          },
          (payload) => {
            const n = payload.new as Notif;
            setItems(prev => [n, ...prev].slice(0, 30));
          }
        )
        .subscribe();
    }

    bootstrap();

    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase]);

  async function handleMarkRead(id: string) {
    setItems(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    try {
      await markNotificationRead(id);
    } catch {
      setItems(prev => prev.map(n => n.id === id ? { ...n, read_at: null } : n));
    }
  }

  async function handleMarkAll() {
    const ts = new Date().toISOString();
    setItems(prev => prev.map(n => n.read_at ? n : ({ ...n, read_at: ts })));
    await markAllNotificationsRead();
  }

  return (
    <div className="relative">
      {/* Bell */}
      <div className="relative">
        <Bell className="h-5 w-5 text-slate-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 h-5 min-w-[20px] px-1 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </div>

      {/* Panel */}
      <div className="mt-3 w-[360px] rounded-2xl border border-white/10 bg-white/10 shadow-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="text-xs font-black uppercase tracking-widest text-slate-400">
            Notifications
          </div>
          <button
            onClick={handleMarkAll}
            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-100 flex items-center gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        </div>

        <div className="max-h-[420px] overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-400 font-medium">
              No notifications yet.
            </div>
          ) : (
            items.map((n) => (
              <div
                key={n.id}
                className={`px-4 py-3 border-b border-white/10 ${
                  n.read_at ? "bg-white/10" : "bg-sky-500/10"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-black text-slate-100 truncate">
                      {n.title}
                    </div>
                    {n.body && (
                      <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {n.body}
                      </div>
                    )}
                    <div className="text-[10px] text-slate-400 font-mono mt-2">
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {!n.read_at && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="p-2 rounded-lg hover:bg-white/10 border border-transparent hover:border-white/10"
                      >
                        <Check className="h-4 w-4 text-slate-400" />
                      </button>
                    )}
                    {n.action_url && (
                      <Link
                        href={n.action_url}
                        className="text-[10px] font-black uppercase tracking-widest text-sky-300 hover:text-blue-900"
                      >
                        Open
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-3 bg-white/10 border-t border-white/10">
          <Link
            href="/app/settings/email-preferences"
            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-100"
          >
            Notification Preferences →
          </Link>
        </div>
      </div>
    </div>
  );
}
