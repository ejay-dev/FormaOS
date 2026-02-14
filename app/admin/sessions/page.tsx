'use client';

/**
 * Active Sessions Dashboard
 *
 * Shows who is logged in right now
 * Allows revoking sessions
 */

import { useEffect, useState } from 'react';
import { Monitor, MapPin, Clock, XCircle } from 'lucide-react';

type Session = {
  id: string;
  session_id: string;
  user_id: string;
  org_id?: string;
  created_at: string;
  last_seen_at: string;
  ip_address?: string;
  user_agent?: string;
  geo_country?: string;
  geo_city?: string;
  metadata?: any;
  user?: { email: string; full_name?: string };
  org?: { name: string };
};

export default function ActiveSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/admin/sessions');
      const data = await res.json();

      if (data.ok) {
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    // Refresh every 30s
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  const revokeSession = async (sessionId: string) => {
    if (!confirm('Revoke this session? The user will be logged out.')) return;

    try {
      await fetch('/api/session/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      fetchSessions(); // Refresh
    } catch (error) {
      console.error('Failed to revoke session:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (minutes < 1) return 'Active now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const getDeviceInfo = (metadata: any, userAgent?: string) => {
    if (metadata?.browser || metadata?.os) {
      return `${metadata.browser || 'Unknown'} on ${metadata.os || 'Unknown'}`;
    }
    if (userAgent) {
      return userAgent.substring(0, 50) + (userAgent.length > 50 ? '...' : '');
    }
    return 'Unknown device';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400">Loading sessions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Active Sessions</h1>
        <p className="mt-1 text-sm text-slate-400">
          {sessions.length} active session{sessions.length !== 1 ? 's' : ''} •
          Auto-refreshes every 30s
        </p>
      </div>

      {/* Sessions List */}
      <div className="space-y-3">
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <div
              key={session.id}
              className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 hover:bg-slate-900/70 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  {/* User Info */}
                  <div className="flex items-center gap-3">
                    <Monitor className="h-5 w-5 text-slate-500" />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-100">
                        {session.user?.full_name ||
                          session.user?.email ||
                          'Unknown User'}
                      </p>
                      <p className="text-sm text-slate-400">
                        {session.user?.email}
                      </p>
                    </div>
                  </div>

                  {/* Org Context */}
                  {session.org && (
                    <div className="text-sm text-slate-400 pl-8">
                      Organization:{' '}
                      <span className="text-slate-300">{session.org.name}</span>
                    </div>
                  )}

                  {/* Device & Location */}
                  <div className="text-sm text-slate-400 pl-8 space-y-1">
                    <p className="flex items-center gap-2">
                      <Monitor className="h-3.5 w-3.5" />
                      {getDeviceInfo(session.metadata, session.user_agent)}
                    </p>
                    {(session.geo_city || session.geo_country) && (
                      <p className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5" />
                        {session.geo_city}, {session.geo_country}
                      </p>
                    )}
                    <p className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      Last seen: {formatDate(session.last_seen_at)}
                    </p>
                  </div>

                  {/* Technical Details */}
                  <details className="text-xs text-slate-500 pl-8">
                    <summary className="cursor-pointer hover:text-slate-400">
                      Technical details
                    </summary>
                    <div className="mt-2 space-y-1 font-mono">
                      <p>IP: {session.ip_address || 'N/A'}</p>
                      <p>
                        Session ID: {session.session_id.substring(0, 16)}...
                      </p>
                      <p>
                        Created: {new Date(session.created_at).toLocaleString()}
                      </p>
                    </div>
                  </details>
                </div>

                {/* Actions */}
                <button
                  onClick={() => revokeSession(session.session_id)}
                  className="rounded-lg border border-red-700/50 bg-red-900/20 p-2 text-red-300 hover:bg-red-900/30"
                  title="Revoke Session"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-12 text-center">
            <Monitor className="h-16 w-16 opacity-20 mx-auto mb-4 text-slate-400" />
            <p className="text-slate-400">No active sessions</p>
          </div>
        )}
      </div>
    </div>
  );
}
