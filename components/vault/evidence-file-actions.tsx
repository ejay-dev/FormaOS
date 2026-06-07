'use client';

import { useState, useTransition } from 'react';
import {
  Download,
  ExternalLink,
  Eye,
  Loader2,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  getEvidenceSignedUrl,
  deleteEvidence,
} from '@/app/app/actions/vault';
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
import { toast } from '@/components/ui/toaster';

interface EvidenceFileActionsProps {
  filePath: string | null;
  variant?: 'pending' | 'table';
  evidenceId?: string;
  canDelete?: boolean;
}

export function EvidenceFileActions({
  filePath,
  variant = 'table',
  evidenceId,
  canDelete = false,
}: EvidenceFileActionsProps) {
  const [loading, setLoading] = useState(false);
  const [isDeleting, startDelete] = useTransition();
  const router = useRouter();
  // Audit 2026-05-23 (Sprint 5a): replaces window.confirm + window.alert
  // with AlertDialog + sonner toast.
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function openFile(mode: 'view' | 'download') {
    if (!filePath) return;

    try {
      setLoading(true);
      const result = await getEvidenceSignedUrl(filePath);
      if ('error' in result) throw new Error(result.error);
      const { signedUrl } = result;

      if (mode === 'download') {
        const anchor = document.createElement('a');
        anchor.href = signedUrl;
        anchor.download = '';
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        return;
      }

      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('[EvidenceFileActions] Failed to open file:', error);
      toast.error('Unable to open this file right now.');
    } finally {
      setLoading(false);
    }
  }

  function performDelete() {
    if (!evidenceId) return;
    startDelete(async () => {
      const result = await deleteEvidence(evidenceId);
      if (result && 'error' in result) {
        toast.error(`Could not delete: ${result.error}`);
        return;
      }
      router.refresh();
    });
  }

  if (variant === 'pending') {
    return (
      <button
        type="button"
        disabled={!filePath || loading}
        onClick={() => openFile('view')}
        className="flex-1 py-3 flex items-center justify-center gap-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-xs font-bold text-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
        View
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
      <button
        type="button"
        disabled={!filePath || loading}
        onClick={() => openFile('view')}
        className="p-2 hover:bg-surface-2 text-muted-foreground rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Open file"
        aria-label="Open file"
      >
        <ExternalLink className="h-4 w-4" />
      </button>
      <button
        type="button"
        disabled={!filePath || loading}
        onClick={() => openFile('download')}
        data-testid="evidence-download-button"
        className="p-2 hover:bg-surface-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Download file"
        aria-label="Download file"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
      </button>
      {canDelete && evidenceId && (
        <>
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => setConfirmOpen(true)}
            data-testid="evidence-delete-button"
            className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete evidence"
            aria-label="Delete evidence"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this evidence file?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes the row and the underlying file from storage.
                  This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    performDelete();
                    setConfirmOpen(false);
                  }}
                  disabled={isDeleting}
                >
                  Delete evidence
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
