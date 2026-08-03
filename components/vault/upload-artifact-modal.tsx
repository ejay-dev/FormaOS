'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import {
  registerVaultArtifact,
  listOrgPoliciesForLinking,
  getControlForEvidenceLink,
} from '@/app/app/actions/vault';
import {
  FileUp,
  Loader2,
  RefreshCw,
  X,
  ShieldCheck,
  FileText,
  CheckCircle2,
  AlertTriangle,
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
 * Upload dialog for the evidence vault.
 *
 * When the vault was opened from an evidence gap or a report finding, the
 * `?control=` param names the control the upload is meant to close. The id
 * is handed to the server action so the linkage is part of the insert.
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
  const [controlLabel, setControlLabel] = useState<string | null>(null);
  const [controlAttached, setControlAttached] = useState(true);
  const supabase = createSupabaseClient();
  const { evidenceAdded, reportError } = useComplianceAction();
  const orgId = useAppStore((state) => state.organization?.id ?? null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const controlId = searchParams?.get('control')?.trim() || '';

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
      setControlAttached(true);
    }
  }, [isOpen]);

  // Name the control the upload was started from, so the dialog can say
  // what the file will be attached to rather than showing a raw id.
  useEffect(() => {
    if (!isOpen || !controlId) {
      setControlLabel(null);
      return;
    }
    let cancelled = false;
    getControlForEvidenceLink(controlId).then((result) => {
      if (cancelled) return;
      if (result.success && result.control) {
        const { code, title: controlTitle } = result.control;
        setControlLabel([code, controlTitle].filter(Boolean).join(' · '));
      } else {
        setControlLabel(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, controlId]);

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

  // Swapping the form for the outcome view unmounts whatever held focus, so
  // it has to be moved back into the panel by hand. useModalA11y only does
  // this when the dialog opens.
  useEffect(() => {
    if (!success) return;
    const panel = panelRef.current;
    if (!panel) return;
    if (!panel.hasAttribute('tabindex')) panel.setAttribute('tabindex', '-1');
    panel.focus();
  }, [success, panelRef]);

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

      // 0. Compute the SHA-256 of the file for chain-of-custody. The hash
      //    also doubles as an idempotency key — using it as the storage
      //    filename means a retry writes to the same path, and Storage's
      //    upsert flag turns that into an idempotent operation. A
      //    subsequent registerVaultArtifact insert is then caught by the
      //    UNIQUE INDEX on org_evidence(organization_id, file_path), which
      //    the action treats as a successful retry rather than a duplicate.
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const fileHash = hashArray
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      // 1. Upload Binary to Supabase Storage. Path is deterministic on
      //    file content so identical re-uploads collapse to one object.
      const fileExt = file.name.split('.').pop() || 'bin';
      const filePath = `${orgId}/vault/${fileHash}.${fileExt}`;

      const { error: storageError } = await supabase.storage
        .from('evidence')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type || undefined,
        });

      if (storageError) throw storageError;

      setUploadProgress(95);

      // 2. Register the row via the server action. The action returns
      //    { success: false, error } on a database failure instead of
      //    throwing, so the result has to be inspected — otherwise the
      //    success state would show for a row that never persisted. On
      //    failure the storage object is removed again.
      const artifactTitle = title || file.name;
      const result = await registerVaultArtifact({
        title: artifactTitle,
        fileName: file.name,
        filePath: filePath,
        fileType: fileExt || 'unknown',
        fileSize: file.size,
        fileHash,
        policyId: policyId || undefined,
        controlId: controlId || undefined,
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
      const attachedToControl = controlId ? result.controlLinked === true : true;
      setControlAttached(attachedToControl);
      setSuccess(true);

      // Report to compliance system
      evidenceAdded(artifactTitle);

      // Close after animation. The action revalidated /app/vault, so the
      // refresh is what actually redraws the list behind the dialog. A
      // failed control link stays on screen until the user dismisses it,
      // because it is the one outcome they have to act on.
      if (attachedToControl) {
        setTimeout(() => {
          onClose();
          router.refresh();
        }, 1500);
      }
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

  // The outcome view keeps the same panel shape as the form below, and must
  // keep `ref={panelRef}`: React reuses the DOM node across this switch, and
  // useModalA11y captured that node when the dialog opened.
  if (success) {
    return (
      <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-artifact-success-title"
          className="w-full max-w-md bg-popover rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden p-10 sm:p-12 flex flex-col items-center justify-center animate-in zoom-in-95"
        >
          <div
            className={`h-20 w-20 rounded-full flex items-center justify-center mb-4 border-2 ${
              controlAttached
                ? 'bg-success/10 border-success/20'
                : 'bg-warning/10 border-warning/20'
            }`}
          >
            {controlAttached ? (
              <CheckCircle2 className="h-10 w-10 text-success" />
            ) : (
              <AlertTriangle className="h-10 w-10 text-warning" />
            )}
          </div>
          <h3
            id="upload-artifact-success-title"
            className="text-xl font-bold text-foreground"
          >
            {controlAttached
              ? 'Evidence uploaded'
              : 'Uploaded, but not attached'}
          </h3>
          {controlAttached ? (
            <p className="text-sm text-muted-foreground mt-2 text-center">
              {controlLabel
                ? `Attached to ${controlLabel}.`
                : 'Saved to the vault and waiting for review.'}
            </p>
          ) : (
            <p
              role="alert"
              className="text-sm text-muted-foreground mt-2 text-center"
            >
              Saved to the vault, but it could not be attached to{' '}
              <span className="font-medium text-foreground">
                {controlLabel || 'the control'}
              </span>
              . Attach it from the control so the gap closes.
            </p>
          )}
          {!controlAttached && (
            <button
              type="button"
              onClick={() => {
                onClose();
                router.refresh();
              }}
              className="mt-5 min-h-[44px] rounded-xl border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              Close
            </button>
          )}
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
        className="w-full max-w-md bg-popover rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-primary" />
            </div>
            <h3 id="upload-artifact-title" className="font-bold text-foreground">
              Upload evidence
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 hover:bg-surface-2 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleUpload} className="p-6 space-y-6">
          {validationError && (
            <div className="p-3 rounded-xl border border-destructive/20 bg-destructive/10 text-sm text-destructive">
              {validationError}
            </div>
          )}
          {controlLabel && (
            <p className="rounded-xl border border-border bg-surface-1 p-3 text-sm text-muted-foreground">
              This file will be attached to{' '}
              <span className="font-medium text-foreground">
                {controlLabel}
              </span>
              .
            </p>
          )}
          {/* File Dropzone */}
          <div className="group relative border-2 border-dashed border-border rounded-2xl p-8 transition-all hover:border-primary hover:bg-muted flex flex-col items-center justify-center text-center">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            {file ? (
              <div className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-muted text-foreground flex items-center justify-center mb-2 border border-border">
                  <FileText className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-foreground truncate max-w-[200px]">
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ready to upload
                </p>
              </div>
            ) : (
              <>
                <FileUp className="h-8 w-8 text-muted-foreground mb-3 group-hover:text-foreground transition-colors" />
                <p className="text-sm font-bold text-foreground">
                  Drop a file here
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
              className="text-sm font-medium text-muted-foreground"
            >
              File label
            </label>
            <input
              id="field-104"
              placeholder="e.g. Annual Fire Safety Certificate 2025"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-4 rounded-xl border border-border bg-surface-1 focus:border-primary focus-visible:ring-2 focus-visible:ring-ring text-sm transition-all outline-none"
            />
          </div>

          {policies.length > 0 && (
            <div className="space-y-2">
              <label
                htmlFor="vault-link-policy"
                className="text-sm font-medium text-muted-foreground"
              >
                Link to policy (optional)
              </label>
              <select
                id="vault-link-policy"
                value={policyId}
                onChange={(e) => setPolicyId(e.target.value)}
                className="w-full p-4 rounded-xl border border-border bg-surface-1 focus:border-primary focus-visible:ring-2 focus-visible:ring-ring text-sm transition-all outline-none"
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
                <span className="text-foreground font-medium">
                  Uploading…
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {uploadProgress}%
                </span>
              </div>
              <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!file || uploading}
            className="w-full bg-foreground text-background p-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 min-h-[44px] hover:opacity-90 transition-all disabled:opacity-50 shadow-lg motion-safe:active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading…
              </>
            ) : lastFailure ? (
              <>
                <RefreshCw className="h-4 w-4" />
                Retry upload
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                Upload to the vault
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
