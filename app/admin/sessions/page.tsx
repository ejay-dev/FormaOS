'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Clock, MapPin, Monitor, ShieldCheck, XCircle } from 'lucide-react';
import { useRealtimeSessions } from '@/lib/hooks/use-realtime-security';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type SessionRecord = {
  id: string;
  session_id: string;
  user_id: string;
  org_id: string | null;
  created_at: string;
  last_seen_at: string;
  ip_address: string | null;
  user_agent: string | null;
  geo_country: string | null;
  geo_city: string | null;
  metadata: {
    browser?: string;
    os?: string;
    device?: string;
  } | null;
  user: {
    id: string;
    email: string | null;
    full_name: string | null;
  };
  org: {
    id: string;
    name: string;
  } | null;
};

export default function ActiveSessionsPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Audit 2026-05-23 (Sprint 5a): hold the pending session in state so
  // AlertDialog can confirm before revoke. Replaces the browser confirm()
  // that lacked focus trap / aria semantics.
  const [pendingRevoke, setPendingRevoke] = useState<{
    sessionId: string;
    user: string;
  } | null>(null);

  const visibleSessions = useMemo(() => sessions.slice(0, 100), [sessions]);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/sessions', { cache: 'no-store' });
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error ?? 'Failed to load sessions');
      }
      setSessions((data.sessions ?? []) as SessionRecord[]);
      setError(null);
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const { connected } = useRealtimeSessions(
    useCallback(() => {
      void fetchSessions();
    }, [fetchSessions]),
    { minIntervalMs: 4000 },
  );

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (connected) return;
    const interval = setInterval(() => {
      void fetchSessions();
    }, 90000);
    return () => clearInterval(interval);
  }, [connected, fetchSessions]);

  const revokeSession = useCallback(
    async (sessionId: string) => {
      try {
        const res = await fetch('/api/session/revoke', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();
        if (!data.ok) {
          throw new Error(data.error ?? 'Failed to revoke session');
        }
        await fetchSessions();
      } catch (revokeError) {
        const message =
          revokeError instanceof Error ? revokeError.message : 'Unknown error';
        setError(message);
      }
    },
    [fetchSessions],
  );

  const relativeTime = (value: string) => {
    const diff = Date.now() - new Date(value).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Active now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(value).toLocaleString();
  };

  const getDeviceInfo = (metadata: SessionRecord['metadata'], userAgent: string | null) => {
    if (metadata?.browser || metadata?.os) {
      return `${metadata.browser ?? 'Unknown browser'} on ${metadata.os ?? 'Unknown OS'}`;
    }
    if (userAgent) {
      return userAgent.length > 80 ? `${userAgent.slice(0, 80)}...` : userAgent;
    }
    return 'Unknown device';
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 w-56 animate-pulse rounded-md bg-muted" />
        <div className="h-24 animate-pulse rounded-lg bg-card" />
        <div className="h-24 animate-pulse rounded-lg bg-card" />
        <div className="h-24 animate-pulse rounded-lg bg-card" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Active sessions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {sessions.length} active session{sessions.length === 1 ? '' : 's'}.
          </p>
        </div>
        <span
          className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
            connected
              ? 'border-success/20 bg-success/10 text-success'
              : 'border-border bg-muted text-muted-foreground'
          }`}
        >
          {connected ? 'Realtime connected' : 'Realtime reconnecting'}
        </span>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {visibleSessions.length ? (
          visibleSessions.map((session) => (
            <div
              key={session.id}
              className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Monitor className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold text-foreground">
                        {session.user.full_name ||
                          session.user.email ||
                          session.user_id}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.user.email ?? 'No email available'}
                      </p>
                    </div>
                  </div>

                  {session.org?.name && (
                    <p className="pl-8 text-sm text-muted-foreground">
                      Organization: <span className="text-foreground">{session.org.name}</span>
                    </p>
                  )}

                  <div className="space-y-1 pl-8 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <Monitor className="h-3.5 w-3.5" />
                      {getDeviceInfo(session.metadata, session.user_agent)}
                    </p>
                    {(session.geo_city || session.geo_country) && (
                      <p className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5" />
                        {[session.geo_city, session.geo_country].filter(Boolean).join(', ')}
                      </p>
                    )}
                    <p className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      Last seen: {relativeTime(session.last_seen_at)}
                    </p>
                  </div>

                  <details className="pl-8 text-xs text-muted-foreground">
                    <summary className="cursor-pointer hover:text-muted-foreground">
                      Technical details
                    </summary>
                    <div className="mt-2 space-y-1 font-mono">
                      <p>IP: {session.ip_address ?? 'n/a'}</p>
                      <p>Session: {session.session_id.slice(0, 20)}...</p>
                      <p>Created: {new Date(session.created_at).toLocaleString()}</p>
                    </div>
                  </details>
                </div>

                <button
                  onClick={() =>
                    setPendingRevoke({
                      sessionId: session.session_id,
                      user:
                        session.user.full_name ?? session.user.email ?? 'Unknown user',
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
                  title="Revoke Session"
                >
                  <XCircle className="h-4 w-4" />
                  Revoke
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <ShieldCheck className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <p className="text-muted-foreground">No active sessions found.</p>
          </div>
        )}
        {sessions.length > visibleSessions.length && (
          <p className="text-xs text-muted-foreground">
            Showing {visibleSessions.length} most recent sessions.
          </p>
        )}
      </div>

      <AlertDialog
        open={pendingRevoke !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRevoke(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke this session?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRevoke?.user ?? 'The user'} will be logged out
              immediately. This is recorded in the security audit log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingRevoke) {
                  void revokeSession(pendingRevoke.sessionId);
                  setPendingRevoke(null);
                }
              }}
            >
              Revoke session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
