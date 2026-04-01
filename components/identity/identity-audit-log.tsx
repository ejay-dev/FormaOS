'use client';

import { useEffect, useState } from 'react';

type Props = {
  orgId: string;
};

export function IdentityAuditLog({ orgId }: Props) {
  const [events, setEvents] = useState<Array<Record<string, any>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/identity/audit?orgId=${encodeURIComponent(orgId)}`, {
      cache: 'no-store',
    })
      .then((response) => response.json())
      .then((payload) => {
        if (!active) return;
        if (!payload.ok) {
          setError(payload.error ?? 'Failed to load identity audit log');
          return;
        }
        setEvents(payload.events ?? []);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load identity audit log');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [orgId]);

  return (
    <section className="rounded-3xl border border-glass-border bg-glass-subtle p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-foreground">Identity Audit Trail</h2>
          <p className="text-sm text-muted-foreground">
            SCIM, SSO, directory sync, session, and MFA events.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/identity/audit?orgId=${encodeURIComponent(orgId)}&format=csv`}
            className="rounded-xl border border-glass-border bg-glass-subtle px-3 py-2 text-sm text-foreground/90"
          >
            Export CSV
          </a>
          <a
            href={`/api/identity/audit?orgId=${encodeURIComponent(orgId)}&format=pdf`}
            className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100"
          >
            Export PDF
          </a>
        </div>
      </div>

      {loading ? <div className="text-sm text-muted-foreground/60">Loading audit events…</div> : null}
      {error ? <div className="text-sm text-rose-300">{error}</div> : null}

      <div className="space-y-3">
        {events.map((event) => (
          <details key={event.id} className="rounded-2xl border border-glass-border bg-slate-950/50 p-4">
            <summary className="cursor-pointer list-none">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-semibold text-foreground">{event.event_type}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(event.created_at).toLocaleString()} • {event.result}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {event.target_user_email ?? event.actor_label ?? event.target_user_id ?? 'system'}
                </div>
              </div>
            </summary>
            <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-950 p-3 text-xs text-foreground/70">
              {JSON.stringify(event.metadata ?? {}, null, 2)}
            </pre>
          </details>
        ))}
      </div>
    </section>
  );
}
