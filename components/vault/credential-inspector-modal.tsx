'use client';

import { useEffect, useState } from 'react';
import {
  X,
  ShieldCheck,
  XCircle,
  Calendar,
  User,
  FileText,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { verifyCredential } from '@/app/app/actions/credentials';
import { fetchRequiredNonCompliantCount } from '@/app/app/actions/control-evaluations';
import { getEvidenceSignedUrl } from '@/app/app/actions/vault';
import { useModalA11y } from '@/lib/hooks/use-modal-a11y';

export function CredentialInspectorModal({
  isOpen,
  onClose,
  credential,
  staffName,
}: {
  isOpen: boolean;
  onClose: () => void;
  credential: {
    id: string;
    document_type: string | null;
    issue_date?: string | null;
    expiry_date?: string | null;
    user_id: string;
    file_path?: string | null;
    verification_status?: string;
  } | null;
  /** Display name of the staff member who submitted the credential. */
  staffName?: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [reason, setReason] = useState('');
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const publicUrl = signedUrl ?? '';

  const panelRef = useModalA11y<HTMLDivElement>(isOpen && !!credential, onClose);

  useEffect(() => {
    if (!isOpen || !credential) {
      setBlocked(false);
      return;
    }

    let mounted = true;
    async function checkBlocks() {
      try {
        const count = await fetchRequiredNonCompliantCount();
        if (mounted)
          setBlocked(
            typeof count === 'number' && typeof count === 'number' && count > 0,
          );
      } catch {
        if (mounted) setBlocked(false);
      }
    }
    checkBlocks();
    return () => {
      mounted = false;
    };
  }, [isOpen, credential]);

  useEffect(() => {
    if (!isOpen || !credential?.file_path) {
      setSignedUrl(null);
      return;
    }

    let mounted = true;
    async function loadSignedUrl() {
      try {
        const result = await getEvidenceSignedUrl(credential!.file_path!);
        if (mounted && 'signedUrl' in result && 'signedUrl' in result)
          setSignedUrl(result.signedUrl);
      } catch {
        if (mounted) setSignedUrl(null);
      }
    }
    loadSignedUrl();
    return () => {
      mounted = false;
    };
  }, [isOpen, credential?.file_path]);

  if (!isOpen || !credential) return null;

  async function handleVerify(status: 'verified' | 'rejected') {
    if (blocked && status === 'verified') {
      alert('Evidence approval blocked by non-compliant controls.');
      return;
    }
    if (!reason.trim()) {
      alert('Approval reason is required.');
      return;
    }
    setLoading(true);
    try {
      const result = await verifyCredential(
        credential!.id,
        status,
        reason.trim(),
      );
      if (!result?.success) {
        alert(result?.message || 'Verification failed.');
        return;
      }
      onClose();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[var(--z-tour)] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="credential-inspector-title"
        className="w-full max-w-6xl h-[92vh] sm:h-[90vh] bg-popover rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
      >
        {/* LEFT: Document Preview (The "Proof") */}
        <div className="flex-1 bg-muted relative overflow-hidden flex items-center justify-center p-6 sm:p-8 border-b md:border-b-0 md:border-r border-border min-h-[240px]">
          <div className="absolute top-6 left-6 z-10">
            <span className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              Evidence preview
            </span>
          </div>

          {/* Direct embed of the credential file */}
          <iframe
            src={signedUrl || ''}
            className="w-full h-full rounded-xl bg-surface-2 border border-border"
            title="Credential Preview"
          />
        </div>

        {/* RIGHT: Metadata & Action Sidebar (The "Audit Control") */}
        <div className="w-full md:w-[400px] flex flex-col justify-between p-6 sm:p-10 bg-popover">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3
                id="credential-inspector-title"
                className="text-sm font-semibold text-foreground"
              >
                Review credential
              </h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-surface-2 rounded-xl transition-all"
                aria-label="Close inspector"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Document type
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {credential.document_type}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Issued
                  </p>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {credential.issue_date || 'Not set'}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Expires
                  </p>
                  <div
                    className={`flex items-center gap-2 text-sm ${credential.expiry_date ? 'text-foreground' : 'text-muted-foreground'}`}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    {credential.expiry_date || 'No expiry'}
                  </div>
                </div>
              </div>

              <div className="space-y-1 pt-4 border-t border-border">
                <p className="text-sm font-medium text-muted-foreground">
                  Submitted by
                </p>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <User className="h-3.5 w-3.5" />
                  {staffName ?? 'Unknown member'}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <div className="flex items-center gap-2 text-foreground">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-sm font-medium">Before you approve</span>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Confirm the name and dates on the document match the data
                entered by the staff member.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-6">
            <div>
              <label
                htmlFor="credential-decision-note"
                className="mb-2 block text-sm font-medium text-muted-foreground"
              >
                Decision note (required)
              </label>
              <textarea
                id="credential-decision-note"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="w-full min-h-[80px] rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60"
                placeholder="Explain why this credential is approved or rejected."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleVerify('rejected')}
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
              <button
                onClick={() => handleVerify('verified')}
                disabled={loading || blocked}
                className={`flex flex-[2] items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${blocked ? 'cursor-not-allowed bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
                title={
                  blocked
                    ? 'Evidence approval blocked by non-compliant controls.'
                    : undefined
                }
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                Approve credential
              </button>
            </div>
            <a
              href={publicUrl}
              target="_blank"
              className="flex w-full items-center justify-center gap-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" />
              Open original file
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
