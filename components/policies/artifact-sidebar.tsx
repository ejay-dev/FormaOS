'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  FileText,
  Plus,
  ExternalLink,
  Paperclip,
  Loader2,
  Link as LinkIcon,
  CheckCircle2,
} from 'lucide-react';
import { linkArtifactToPolicy } from '@/app/app/actions/policies';
import { useComplianceAction } from '@/components/compliance-system';

/**
 * =========================================================
 * ARTIFACT SIDEBAR
 * Node Type: Evidence linking to Policy
 * Wire: Policy ← Evidence
 * =========================================================
 *
 * This component manages the evidence → policy relationship.
 * When artifacts are linked, it creates a visual wire connection.
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
      await linkArtifactToPolicy(policyId, artifactId);

      // Show success state briefly
      setJustLinked(artifactId);
      setTimeout(() => setJustLinked(null), 2000);

      // Report to compliance system
      nodesLinked(
        'evidence',
        artifactName,
        'policy',
        policyTitle || `Policy ${policyId.slice(0, 8)}`,
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

  const availableItems = (allVaultItems || []).filter(
    (item: VaultItem) =>
      !(linkedArtifacts || []).find((l: VaultItem) => l.id === item.id),
  );

  return (
    <div className="bg-surface-1 border border-border rounded-[2rem] p-6 shadow-sm space-y-8 md:sticky md:top-6">
      {/* SECTION 1: LINKED EVIDENCE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <LinkIcon className="h-3 w-3 text-muted-foreground" />
            <span>Linked Evidence</span>
          </h3>
          <span className="px-2 py-0.5 bg-muted text-foreground rounded text-xs font-bold border border-border min-w-[20px] text-center tabular-nums">
            {(linkedArtifacts || []).length}
          </span>
        </div>

        <div className="space-y-2">
          {(linkedArtifacts || []).length === 0 ? (
            <div className="p-6 border-2 border-dashed border-border rounded-2xl text-center bg-muted">
              <Paperclip className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground font-bold uppercase">
                No Evidence Linked
              </p>
              <p className="text-[9px] text-muted-foreground mt-1">
                Link artifacts to strengthen audit defensibility
              </p>
            </div>
          ) : (
            (linkedArtifacts || []).map((file: VaultItem) => {
              const fileName =
                file.file_name || file.title || 'Untitled Artifact';
              const fileType = String(file.file_type || '');
              const typeLabel = fileType.includes('/')
                ? fileType.split('/')[1]
                : 'DOC';
              const sizeKb = ((Number(file.file_size) || 0) / 1024).toFixed(0);

              return (
                <Link
                  key={file.id}
                  href={`/app/evidence?evidenceId=${file.id}`}
                  className="group flex items-center justify-between p-3 bg-surface-1 rounded-xl border border-border hover:border-edge-2 hover:bg-surface-2 transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {/* Evidence node indicator */}
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-muted-foreground border border-border">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-foreground truncate block">
                        {fileName}
                      </span>
                      <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest truncate">
                        {typeLabel} • {sizeKb}KB
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* SECTION 2: VAULT BROWSER */}
      {!readOnly && (
        <div className="pt-6 border-t border-border space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest">
              Vault Browser
            </h4>
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
              {availableItems.length} Available
            </span>
          </div>

          <div className="max-h-[240px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {availableItems.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-2">
                No unlinked items found in Vault.
              </p>
            ) : (
              availableItems.map((item: VaultItem) => {
                const itemName = item.file_name || item.title || 'Untitled';
                const isCurrentlyLinking = isLinking === item.id;
                const wasJustLinked = justLinked === item.id;

                return (
                  <button
                    key={item.id}
                    disabled={!!isLinking}
                    onClick={() => handleLink(item.id, itemName)}
                    className="w-full flex items-center justify-between p-2 rounded-xl border border-transparent hover:border-edge-2 hover:bg-surface-2 transition-all text-left group disabled:opacity-50 motion-safe:active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div
                        className={`h-7 w-7 rounded-lg border flex items-center justify-center shadow-sm transition-all ${
                          wasJustLinked
                            ? 'bg-emerald-400/20 border-emerald-400/40'
                            : isCurrentlyLinking
                              ? 'bg-primary/10 border-primary/30'
                              : 'bg-surface-1 border-border group-hover:bg-surface-2 group-hover:border-edge-2'
                        }`}
                      >
                        {wasJustLinked ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        ) : isCurrentlyLinking ? (
                          <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
                        ) : (
                          <Plus className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        )}
                      </div>
                      <span
                        className={`text-[11px] font-bold truncate transition-colors ${
                          wasJustLinked
                            ? 'text-emerald-300'
                            : 'text-muted-foreground group-hover:text-foreground'
                        }`}
                      >
                        {wasJustLinked ? 'Linked!' : itemName}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* INFO CARD - Updated with node language */}
      <div className="relative overflow-hidden rounded-[1.25rem] p-5 text-foreground shadow-sm bg-card border border-border">
        <div className="flex items-center gap-2 mb-3 relative z-10">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-widest text-foreground">
            Graph Defensibility
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed relative z-10">
          Each linked artifact creates a wire in your compliance graph. Auditors
          trace these connections to verify implementation.
        </p>
      </div>
    </div>
  );
}

export default ArtifactSidebar;
