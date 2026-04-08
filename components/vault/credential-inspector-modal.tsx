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

export function CredentialInspectorModal({
  isOpen,
  onClose,
  credential,
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
}) {
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [reason, setReason] = useState('');
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const publicUrl = signedUrl ?? '';

  useEffect(() => {
    if (!isOpen || !credential) {
      setBlocked(false);
      return;
    }

    let mounted = true;
    async function checkBlocks() {
      try {
        const count = await fetchRequiredNonCompliantCount();
        if (mounted) setBlocked(count > 0);
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
        if (mounted) setSignedUrl(result.signedUrl);
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
    <div className="fixed inset-0 z-[var(--z-tour)] flex items-end sm:items-center justify-center bg-black/70 sm:bg-gradient-to-r sm:from-blue-600 sm:via-indigo-600 sm:to-cyan-500/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-6xl h-[92vh] sm:h-[90vh] bg-glass-strong rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* LEFT: Document Preview (The "Proof") */}
        <div className="flex-1 bg-glass-strong relative overflow-hidden flex items-center justify-center p-6 sm:p-8 border-b md:border-b-0 md:border-r border-glass-border min-h-[240px]">
          <div className="absolute top-6 left-6 z-10">
            <span className="px-3 py-1.5 bg-glass-strong backdrop-blur-md text-xs font-black uppercase tracking-widest rounded-lg border border-glass-border shadow-sm flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-blue-500" />
              Evidence Preview
            </span>
          </div>

          {/* Direct embed of the credential file */}
          <iframe
            src={signedUrl || ''}
            className="w-full h-full rounded-2xl shadow-lg bg-glass-strong border border-white/10"
            title="Credential Preview"
          />
        </div>

        {/* RIGHT: Metadata & Action Sidebar (The "Audit Control") */}
        <div className="w-full md:w-[400px] flex flex-col justify-between p-6 sm:p-10 bg-glass-strong">
          <div className="space-y-10">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-foreground tracking-tight">
                Audit Inspection
              </h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-glass-strong rounded-xl transition-all"
                aria-label="Close inspector"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                  Document Type
                </p>
                <p className="text-lg font-black text-foreground">
                  {credential.document_type}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-white/10">
                <div className="space-y-1">
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                    Issue Date
                  </p>
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground/70">
                    <Calendar className="h-3.5 w-3.5" />
                    {credential.issue_date || 'Not set'}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                    Expiry Date
                  </p>
                  <div
                    className={`flex items-center gap-2 text-xs font-bold ${credential.expiry_date ? 'text-foreground/70' : 'text-muted-foreground'}`}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    {credential.expiry_date || 'No expiry'}
                  </div>
                </div>
              </div>

              <div className="space-y-1 pt-6 border-t border-white/10">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                  Personnel ID
                </p>
                <div className="flex items-center gap-2 text-xs font-bold text-foreground/70">
                  <User className="h-3.5 w-3.5" />
                  USR-{credential.user_id.slice(0, 12).toUpperCase()}
                </div>
              </div>
            </div>

            <div className="p-6 bg-sky-500/10 border border-sky-400/30 rounded-3xl space-y-3">
              <div className="flex items-center gap-2 text-sky-300">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-xs font-black uppercase tracking-widest">
                  Visual Match Check
                </span>
              </div>
              <p className="text-xs text-blue-600 leading-relaxed font-medium">
                Confirm the name and dates on the document match the data
                entered by the staff member.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-10">
            <div>
              <label
                htmlFor="field-229"
                className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2"
              >
                Approval Reason (required)
              </label>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="w-full min-h-[80px] rounded-xl border border-glass-border bg-glass-strong px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60"
                placeholder="Explain why this credential is approved or rejected."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleVerify('rejected')}
                disabled={loading}
                className="flex-1 py-4 rounded-2xl border border-red-100 bg-red-50 text-red-600 text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-all flex items-center justify-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
              <button
                onClick={() => handleVerify('verified')}
                disabled={loading || blocked}
                className={`flex-[2] py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl active:scale-95 ${blocked ? 'bg-glass-strong text-white/70 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white hover:brightness-110'}`}
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
                Approve Credential
              </button>
            </div>
            <a
              href={publicUrl}
              target="_blank"
              className="w-full flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground py-2 hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Open Original File
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
