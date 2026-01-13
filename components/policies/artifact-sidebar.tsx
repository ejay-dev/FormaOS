"use client";

import { useState } from "react";
import {
  ShieldCheck,
  FileText,
  Plus,
  ExternalLink,
  Paperclip,
  Loader2,
  Link as LinkIcon,
  CheckCircle2,
} from "lucide-react";
import { linkArtifactToPolicy } from "@/app/app/actions/policies";
import { useComplianceAction } from "@/components/compliance-system";

/**
 * =========================================================
 * ARTIFACT SIDEBAR
 * Node Type: Evidence (violet) linking to Policy (cyan)
 * Wire: Policy ← Evidence (dashed violet)
 * =========================================================
 * 
 * This component manages the evidence → policy relationship.
 * When artifacts are linked, it creates a visual wire connection.
 */

interface ArtifactSidebarProps {
  policyId: string;
  policyTitle?: string;
  linkedArtifacts: any[];
  allVaultItems: any[];
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
  const { nodesLinked, reportError, reportInfo } = useComplianceAction();

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
        "evidence", 
        artifactName, 
        "policy", 
        policyTitle || `Policy ${policyId.slice(0, 8)}`
      );
    } catch (err: any) {
      console.error("Linking failed", err);
      reportError(`Failed to link artifact: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLinking(null);
    }
  }

  const availableItems = (allVaultItems || []).filter(
    (item: any) => !(linkedArtifacts || []).find((l: any) => l.id === item.id)
  );

  return (
    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 shadow-sm space-y-8 sticky top-6">
      {/* SECTION 1: LINKED EVIDENCE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <LinkIcon className="h-3 w-3 text-violet-400" />
            <span>Linked Evidence</span>
          </h3>
          <span className="px-2 py-0.5 bg-violet-400/10 text-violet-300 rounded text-[10px] font-bold border border-violet-400/30 min-w-[20px] text-center">
            {(linkedArtifacts || []).length}
          </span>
        </div>

        <div className="space-y-2">
          {(linkedArtifacts || []).length === 0 ? (
            <div className="p-6 border-2 border-dashed border-violet-400/20 rounded-2xl text-center bg-violet-400/5">
              <Paperclip className="h-5 w-5 text-violet-400/50 mx-auto mb-2" />
              <p className="text-[10px] text-violet-300/70 font-bold uppercase">
                No Evidence Linked
              </p>
              <p className="text-[9px] text-slate-400 mt-1">
                Link artifacts to strengthen audit defensibility
              </p>
            </div>
          ) : (
            (linkedArtifacts || []).map((file: any) => {
              const fileName = file.file_name || file.title || "Untitled Artifact";
              const fileType = String(file.file_type || "");
              const typeLabel = fileType.includes("/") ? fileType.split("/")[1] : "DOC";
              const sizeKb = ((Number(file.file_size) || 0) / 1024).toFixed(0);

              return (
                <div
                  key={file.id}
                  className="group flex items-center justify-between p-3 bg-violet-400/5 rounded-xl border border-violet-400/20 hover:border-violet-400/40 hover:bg-violet-400/10 transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {/* Evidence node indicator */}
                    <div className="h-8 w-8 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 text-violet-400 border border-violet-400/30">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-100 truncate block">
                        {fileName}
                      </span>
                      <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest truncate">
                        {typeLabel} • {sizeKb}KB
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="h-3 w-3 text-violet-400 group-hover:text-violet-300 cursor-pointer shrink-0 transition-colors" />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SECTION 2: VAULT BROWSER */}
      {!readOnly && (
        <div className="pt-6 border-t border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Vault Browser
            </h4>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              {availableItems.length} Available
            </span>
          </div>

          <div className="max-h-[240px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {availableItems.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic py-2">
                No unlinked items found in Vault.
              </p>
            ) : (
              availableItems.map((item: any) => {
                const itemName = item.file_name || item.title || "Untitled";
                const isCurrentlyLinking = isLinking === item.id;
                const wasJustLinked = justLinked === item.id;
                
                return (
                  <button
                    key={item.id}
                    disabled={!!isLinking}
                    onClick={() => handleLink(item.id, itemName)}
                    className="w-full flex items-center justify-between p-2 rounded-xl border border-transparent hover:border-violet-400/30 hover:bg-violet-400/10 transition-all text-left group disabled:opacity-50 active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`h-7 w-7 rounded-lg border flex items-center justify-center shadow-sm transition-all ${
                        wasJustLinked 
                          ? 'bg-emerald-400/20 border-emerald-400/40' 
                          : isCurrentlyLinking 
                            ? 'bg-violet-400/20 border-violet-400/40'
                            : 'bg-white/5 border-white/10 group-hover:bg-violet-400/10 group-hover:border-violet-400/30'
                      }`}>
                        {wasJustLinked ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        ) : isCurrentlyLinking ? (
                          <Loader2 className="h-3.5 w-3.5 text-violet-400 animate-spin" />
                        ) : (
                          <Plus className="h-3.5 w-3.5 text-slate-400 group-hover:text-violet-300 transition-colors" />
                        )}
                      </div>
                      <span className={`text-[11px] font-bold truncate transition-colors ${
                        wasJustLinked 
                          ? 'text-emerald-300' 
                          : 'text-slate-400 group-hover:text-slate-100'
                      }`}>
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
      <div className="relative overflow-hidden rounded-[1.25rem] p-5 text-white shadow-xl bg-gradient-to-br from-violet-600/80 via-indigo-600/80 to-cyan-600/80 border border-violet-400/20">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-12 -mt-12" />
        <div className="flex items-center gap-2 mb-3 relative z-10">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200">
            Graph Defensibility
          </span>
        </div>
        <p className="text-[10px] text-white/70 leading-relaxed relative z-10">
          Each linked artifact creates a wire in your compliance graph. Auditors trace these connections to verify implementation.
        </p>
      </div>
    </div>
  );
}

export default ArtifactSidebar;
