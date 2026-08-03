'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  ExternalLink,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { linkArtifactToPolicy } from '@/app/app/actions/policies';
import { useComplianceAction } from '@/components/compliance-system';

/**
 * Evidence attached to a policy, plus a picker for vault artifacts that are
 * not attached yet. Rendered beside the policy detail body.
 */

interface VaultItem {
  id: string;
  file_name?: string;
  title?: string;
  file_type?: string;
  file_size?: number;
}

interface ArtifactSidebarProps {
  policyId: string;
  policyTitle?: string;
  linkedArtifacts: VaultItem[];
  allVaultItems: VaultItem[];
  readOnly?: boolean;
}

export function ArtifactSidebar({
  policyId,
  policyTitle,
  linkedArtifacts,
  allVaultItems,
  readOnly = false,
}: ArtifactSidebarProps) {
  const [isLinking, setIsLinking] = useState<string | null>(null);
  const [justLinked, setJustLinked] = useState<string | null>(null);
  const { nodesLinked, reportError } = useComplianceAction();

  async function handleLink(artifactId: string, artifactName: string) {
    if (readOnly) return;

    setIsLinking(artifactId);
    try {
      // The action catches its own failures and returns { success: false,
      // error } rather than throwing, so "did not throw" is not success.
      const result = await linkArtifactToPolicy(policyId, artifactId);

      if (result && result.success === false) {
        reportError({
          title: 'Link failed',
          message: result.error || 'The evidence could not be attached.',
        });
        return;
      }

      // Show success state briefly
      setJustLinked(artifactId);
      setTimeout(() => setJustLinked(null), 2000);

      // Report to compliance system
      nodesLinked(
        'evidence',
        artifactName,
        'policy',
        policyTitle || 'this policy',
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Linking failed', err);
      reportError({
        title: 'Link failed',
        message,
      });
    } finally {
      setIsLinking(null);
    }
  }

  const linked = linkedArtifacts || [];
  const availableItems = (allVaultItems || []).filter(
    (item: VaultItem) => !linked.find((l: VaultItem) => l.id === item.id),
  );

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-6 md:sticky md:top-6">
      <div className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-sm font-medium text-foreground">
            Linked evidence
          </h3>
          <span className="text-xs text-muted-foreground tabular-nums">
            {linked.length}
          </span>
        </div>

        <div className="space-y-2">
          {linked.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-4">
              <p className="text-sm text-muted-foreground">
                Nothing attached yet. Attach the records that show this policy
                is being followed.
              </p>
            </div>
          ) : (
            linked.map((file: VaultItem) => {
              const fileName = file.file_name || file.title || 'Untitled file';
              const fileType = String(file.file_type || '');
              const typeLabel = fileType.includes('/')
                ? fileType.split('/')[1]
                : fileType || 'file';
              const sizeKb = ((Number(file.file_size) || 0) / 1024).toFixed(0);

              return (
                <Link
                  key={file.id}
                  href={`/app/vault?q=${encodeURIComponent(fileName)}`}
                  className="group flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium text-foreground">
                        {fileName}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {typeLabel} · {sizeKb} KB
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                </Link>
              );
            })
          )}
        </div>
      </div>

      {!readOnly && (
        <div className="space-y-3 border-t border-border pt-5">
          <div className="flex items-baseline justify-between gap-2">
            <h4 className="text-sm font-medium text-foreground">
              Attach from the vault
            </h4>
            <span className="text-xs text-muted-foreground tabular-nums">
              {availableItems.length} available
            </span>
          </div>

          <div className="custom-scrollbar max-h-[240px] space-y-1 overflow-y-auto pr-1">
            {availableItems.length === 0 ? (
              <p className="py-1 text-sm text-muted-foreground">
                Every vault file is already attached to this policy.
              </p>
            ) : (
              availableItems.map((item: VaultItem) => {
                const itemName = item.file_name || item.title || 'Untitled';
                const isCurrentlyLinking = isLinking === item.id;
                const wasJustLinked = justLinked === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!!isLinking}
                    onClick={() => handleLink(item.id, itemName)}
                    className="flex w-full items-center gap-2.5 rounded-lg border border-transparent px-2 py-1.5 text-left transition-colors hover:border-border hover:bg-muted/40 disabled:opacity-50"
                  >
                    {wasJustLinked ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                    ) : isCurrentlyLinking ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                    ) : (
                      <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span
                      className={`truncate text-sm ${
                        wasJustLinked
                          ? 'text-success'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {wasJustLinked ? 'Attached' : itemName}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      <p className="border-t border-border pt-5 text-xs text-muted-foreground">
        Auditors follow these attachments to check the policy is more than a
        document.
      </p>
    </div>
  );
}

export default ArtifactSidebar;
