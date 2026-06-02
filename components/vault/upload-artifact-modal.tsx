'use client';

import { useState, useEffect } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import {
  registerVaultArtifact,
  listOrgPoliciesForLinking,
} from '@/app/app/actions/vault';
import {
  FileUp,
  Loader2,
  RefreshCw,
  X,
  ShieldCheck,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { useComplianceAction } from '@/components/compliance-system';
import { useAppStore } from '@/lib/stores/app';
import { useModalA11y } from '@/lib/hooks/use-modal-a11y';
import { z } from 'zod';

const uploadArtifactSchema = z.object({
  title: z.string().max(300, 'Title must be under 300 characters').optional(),
  fileSize: z.number().max(10 * 1024 * 1024, 'File must be under 10MB'),
  fileName: z.string().min(1, 'A file is required'),
});

/**
 * =========================================================
 * UPLOAD ARTIFACT MODAL
 * Node Type: Evidence (violet)
 * Creates a new evidence node in the compliance graph
 * =========================================================
 */

export function UploadArtifactModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [policies, setPolicies] = useState<{ id: string; title: string }[]>(
    [],
  );
  const [policyId, setPolicyId] = useState<string>('');
  const [lastFailure, setLastFailure] = useState<string | null>(null);
  const supabase = createSupabaseClient();
  const { evidenceAdded, reportError } = useComplianceAction();
  const orgId = useAppStore((state) => state.organization?.id ?? null);

  const panelRef = useModalA11y<HTMLDivElement>(isOpen, onClose);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setTitle('');
      setSuccess(false);
      setUploadProgress(0);
      setValidationError(null);
      setPolicyId('');
      setLastFailure(null);
    }
  }, [isOpen]);

  // Lazy-fetch policies the first time the modal opens. The list is small
  // and rarely changes during a session, so we cache it on the component
  // for the lifetime of the modal mount.
  useEffect(() => {
    if (!isOpen) return;
    if (policies.length > 0) return;
    let cancelled = false;
    listOrgPoliciesForLinking().then((result) => {
      if (cancelled) return;
      if (result.success) setPolicies(result.policies);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, policies.length]);

  if (!isOpen) return null;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setValidationError(null);

    const parsed = uploadArtifactSchema.safeParse({
      title: title || undefined,
      fileSize: file.size,
      fileName: file.name,
    });

    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 85) {
          clearInterval(progressInterval);
          return 85;
        }
        return prev + 5;
      });
    }, 100);

    try {
      if (!orgId) {
        throw new Error('Organization context missing');
      }

      // 0. Compute SHA-256 checksum of file for chain-of-custody.
      //    The hash also doubles as an idempotency key — using it as the
      //    storage filename means a retry writes to the same path, and
      //    Storage's upsert flag turns that into an idempotent operation.
      //    A subsequent registerVaultArtifact insert is then caught by the
      //    UNIQUE INDEX on org_evidence(organization_id, file_path) added
      //    in 20260622_001_dedup_indexes.sql, which the action treats as
      //    a successful retry rather than a duplicate.
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const checksum = hashArray
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      // 1. Upload Binary to Supabase Storage. Path is deterministic on
      //    file content so identical re-uploads collapse to one object.
      const fileExt = file.name.split('.').pop() || 'bin';
      const filePath = `${orgId}/vault/${checksum}.${fileExt}`;

      const { error: storageError } = await supabase.storage
        .from('evidence')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type || undefined,
        });

      if (storageError) throw storageError;

      setUploadProgress(95);

      // 2. Register Artifact in Database via Server Action (with checksum).
      //    The action returns { success: false, error } on DB failure rather
      //    than throwing — so the previous code that ignored the result was
      //    showing the green "Evidence Secured" state on a row that never
      //    persisted. Inspect the result and roll back the storage object
      //    if the DB insert reports failure.
      const artifactTitle = title || file.name;
      const result = await registerVaultArtifact({
        title: artifactTitle,
        fileName: file.name,
        filePath: filePath,
        fileType: fileExt || 'unknown',
        fileSize: file.size,
        checksum,
        policyId: policyId || undefined,
      });

      if (!result || result.success !== true) {
        await supabase.storage
          .from('evidence')
          .remove([filePath])
          .catch(() => {});
        const message =
          result && 'error' in result && result.error
            ? String(result.error)
            : 'Failed to register artifact';
        throw new Error(message);
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Show success state
      setSuccess(true);

      // Report to compliance system
      evidenceAdded(artifactTitle);

      // Close after animation
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: unknown) {
      clearInterval(progressInterval);
      setUploadProgress(0);
      const message =
        error instanceof Error ? error.message : 'Upload failed';
      setLastFailure(message);
      setValidationError(message);
      reportError({
        title: 'Upload failed',
        message,
      });
    } finally {
      setUploading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-artifact-success-title"
          className="w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden p-10 sm:p-12 flex flex-col items-center justify-center animate-in zoom-in-95"
        >
          <div className="h-20 w-20 rounded-full bg-violet-400/20 flex items-center justify-center mb-4 border-2 border-violet-400/40">
            <CheckCircle2 className="h-10 w-10 text-violet-400" />
          </div>
          <h3
            id="upload-artifact-success-title"
            className="text-xl font-bold text-foreground"
          >
            Evidence Secured
          </h3>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            New evidence node added to your compliance graph
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-artifact-title"
        className="w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-glass-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-violet-400/20 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-violet-400" />
            </div>
            <h3 id="upload-artifact-title" className="font-bold text-foreground">
              Upload Evidence Artifact
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 hover:bg-glass-strong rounded-xl transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleUpload} className="p-6 space-y-6">
          {validationError && (
            <div className="p-3 rounded-xl border border-red-400/30 bg-red-400/10 text-sm text-red-400">
              {validationError}
            </div>
          )}
          {/* File Dropzone */}
          <div className="group relative border-2 border-dashed border-violet-400/30 rounded-2xl p-8 transition-all hover:border-violet-400/50 hover:bg-violet-400/5 flex flex-col items-center justify-center text-center">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            {file ? (
              <div className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center mb-2 border border-violet-400/30">
                  <FileText className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-foreground truncate max-w-[200px]">
                  {file.name}
                </p>
                <p className="text-xs text-violet-300 uppercase font-bold mt-1">
                  Ready to Secure
                </p>
              </div>
            ) : (
              <>
                <FileUp className="h-8 w-8 text-violet-400/50 mb-3 group-hover:text-violet-400 transition-colors" />
                <p className="text-sm font-bold text-foreground">
                  Drop artifact here
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, JPG, PNG, DOC, XLS (Max 10MB)
                </p>
              </>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="field-104"
              className="text-xs font-bold uppercase text-muted-foreground tracking-widest ml-1"
            >
              Artifact Label
            </label>
            <input
              id="field-104"
              placeholder="e.g. Annual Fire Safety Certificate 2025"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-4 rounded-xl border border-glass-border bg-glass-subtle focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/20 text-sm transition-all outline-none"
            />
          </div>

          {policies.length > 0 && (
            <div className="space-y-2">
              <label
                htmlFor="vault-link-policy"
                className="text-xs font-bold uppercase text-muted-foreground tracking-widest ml-1"
              >
                Link to policy (optional)
              </label>
              <select
                id="vault-link-policy"
                value={policyId}
                onChange={(e) => setPolicyId(e.target.value)}
                className="w-full p-4 rounded-xl border border-glass-border bg-glass-subtle focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/20 text-sm transition-all outline-none"
              >
                <option value="">Not linked</option>
                {policies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-violet-300 font-medium">
                  Securing artifact...
                </span>
                <span className="text-muted-foreground">{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-glass-strong rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!file || uploading}
            className="w-full bg-foreground text-background p-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 min-h-[44px] hover:opacity-90 transition-all disabled:opacity-50 shadow-lg motion-safe:active:scale-[0.98]"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Securing Artifact...
              </>
            ) : lastFailure ? (
              <>
                <RefreshCw className="h-4 w-4" />
                Retry upload
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                Upload to Vault
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
