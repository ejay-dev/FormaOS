'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, AlertTriangle, FileJson } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type Props = {
  userEmail: string;
  ownerOrgsCount: number;
};

export function PrivacyClient({ userEmail, ownerOrgsCount }: Props) {
  const router = useRouter();
  const [exportState, setExportState] = useState<
    'idle' | 'downloading' | 'error'
  >('idle');
  const [exportError, setExportError] = useState<string | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteState, setDeleteState] = useState<
    'idle' | 'submitting' | 'error'
  >('idle');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleExport() {
    setExportState('downloading');
    setExportError(null);
    try {
      const res = await fetch('/api/v1/account/export', { method: 'GET' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          typeof body?.error === 'string' ? body.error : `status_${res.status}`,
        );
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename =
        res.headers.get('content-disposition')?.match(/filename="([^"]+)"/)
          ?.[1] ??
        `formaos-account-${new Date().toISOString().slice(0, 10)}.json`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setExportState('idle');
    } catch (err) {
      setExportState('error');
      setExportError(
        err instanceof Error ? err.message : 'Could not export your data.',
      );
    }
  }

  async function handleDelete() {
    setDeleteState('submitting');
    setDeleteError(null);
    try {
      const res = await fetch('/api/v1/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'DELETE' }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const message =
          typeof body?.message === 'string'
            ? body.message
            : typeof body?.error === 'string'
              ? body.error
              : `Deletion failed (status ${res.status}).`;
        throw new Error(message);
      }
      // Account is gone — bounce to the public site.
      router.push('/');
    } catch (err) {
      setDeleteState('error');
      setDeleteError(
        err instanceof Error ? err.message : 'Could not delete your account.',
      );
    }
  }

  const deleteBlocked = deleteConfirm.trim() !== 'DELETE';

  return (
    <div className="space-y-6">
      {/* Export — GDPR Article 15 (right of access) */}
      <section
        id="export"
        className="rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileJson className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-foreground">
              Export your data
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Download a JSON file containing your account record, profile,
              security settings, email preferences, and organization
              memberships.
            </p>
            <div className="mt-4">
              <button
                type="button"
                onClick={handleExport}
                disabled={exportState === 'downloading'}
                data-testid="export-data"
                data-export
                className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4" />
                {exportState === 'downloading'
                  ? 'Preparing download…'
                  : 'Download my data'}
              </button>
              {exportState === 'error' ? (
                <p className="mt-3 text-sm text-destructive">
                  {exportError}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Portability — GDPR Article 20 (right to data portability) */}
      <section
        id="portability"
        className="rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Download className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-foreground">
              Move to another provider
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The same JSON file is portable: it follows the FormaOS account
              schema (versioned) and can be imported into any system that
              accepts structured personal data. Use the button above to
              generate a portability bundle.
            </p>
          </div>
        </div>
      </section>

      {/* Delete — GDPR Article 17 (right to erasure) */}
      <section
        id="delete"
        className="rounded-2xl border border-destructive/30 bg-card p-6 shadow-sm"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-foreground">
              Delete your account
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Permanently removes <span className="font-medium">{userEmail}</span>
              {' '}and your personal profile, security, and notification
              preferences from FormaOS. This cannot be undone.
            </p>
            {ownerOrgsCount > 0 ? (
              <p className="mt-3 rounded-md border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
                You own {ownerOrgsCount}{' '}
                {ownerOrgsCount === 1 ? 'organization' : 'organizations'} on
                FormaOS. If any of those organizations have other members,
                transfer ownership first: open{' '}
                <span className="font-medium">Team</span> and change another
                member&apos;s role to Owner before deleting your account.
              </p>
            ) : null}

            <div className="mt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    type="button"
                    data-testid="delete-account"
                    className="inline-flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/20"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Delete my account…
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete your FormaOS account?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete your account, profile,
                      security settings, and remove you from every
                      organization. Active organization data owned by others
                      is not affected.
                      <br />
                      <br />
                      Type{' '}
                      <span className="font-mono font-medium">DELETE</span> to
                      confirm.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <input
                    type="text"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder="Type DELETE"
                    className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-foreground focus:outline-none"
                    autoComplete="off"
                  />
                  {deleteState === 'error' && deleteError ? (
                    <p className="mt-2 text-sm text-destructive">
                      {deleteError}
                    </p>
                  ) : null}
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleteState === 'submitting'}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.preventDefault();
                        if (!deleteBlocked) void handleDelete();
                      }}
                      disabled={deleteBlocked || deleteState === 'submitting'}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleteState === 'submitting'
                        ? 'Deleting…'
                        : 'Delete my account'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
