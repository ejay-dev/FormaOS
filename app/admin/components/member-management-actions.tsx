'use client';

import { useState } from 'react';

type Props = {
  orgId: string;
  userId: string;
  currentRole: string;
};

const ROLE_OPTIONS = ['owner', 'admin', 'member', 'viewer'] as const;

export function MemberManagementActions({ orgId, userId, currentRole }: Props) {
  const [role, setRole] = useState(currentRole);
  const [loading, setLoading] = useState<'save' | 'remove' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveRole() {
    const reason = window.prompt('Reason for role change');
    if (!reason) return;

    setLoading('save');
    setError(null);
    try {
      const res = await fetch(`/api/admin/orgs/${orgId}/members/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-reason': reason,
        },
        body: JSON.stringify({ role, reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'Failed to update role');
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setLoading(null);
    }
  }

  async function removeMember() {
    const reason = window.prompt('Reason for removing member');
    if (!reason) return;
    if (!window.confirm('Remove this member from the organization?')) return;

    setLoading('remove');
    setError(null);
    try {
      const res = await fetch(`/api/admin/orgs/${orgId}/members/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-reason': reason,
        },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'Failed to remove member');
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <select
          value={role}
          onChange={(event) => setRole(event.target.value)}
          className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground"
          disabled={loading !== null}
        >
          {ROLE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void saveRole()}
          disabled={loading !== null || role === currentRole}
          className="rounded border border-border px-2 py-1 text-xs text-foreground hover:bg-muted disabled:opacity-50"
        >
          {loading === 'save' ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => void removeMember()}
          disabled={loading !== null}
          className="rounded border border-rose-500/30 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/10 disabled:opacity-50"
        >
          {loading === 'remove' ? 'Removing…' : 'Remove'}
        </button>
      </div>
      {error ? <p className="text-[11px] text-rose-300">{error}</p> : null}
    </div>
  );
}
