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
} from "lucide-react";
import { linkArtifactToPolicy } from "@/app/app/actions/policies";

interface ArtifactSidebarProps {
  policyId: string;
  linkedArtifacts: any[];
  allVaultItems: any[];
  readOnly?: boolean;
}

export function ArtifactSidebar({
  policyId,
  linkedArtifacts,
  allVaultItems,
  readOnly = false,
}: ArtifactSidebarProps) {
  const [isLinking, setIsLinking] = useState<string | null>(null);

  async function handleLink(artifactId: string) {
    if (readOnly) return;

    setIsLinking(artifactId);
    try {
      await linkArtifactToPolicy(policyId, artifactId);
    } catch (err) {
      console.error("Linking failed", err);
    } finally {
      setIsLinking(null);
    }
  }

  const availableItems = (allVaultItems || []).filter(
    (item: any) => !(linkedArtifacts || []).find((l: any) => l.id === item.id)
  );

  return (
    <div className="bg-white/10 border border-white/10 rounded-[2rem] p-6 shadow-sm space-y-8 sticky top-6">
      {/* SECTION 1: LINKED EVIDENCE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <LinkIcon className="h-3 w-3" />
            Linked Evidence
          </h3>
          <span className="px-2 py-0.5 bg-emerald-400/10 text-emerald-300 rounded text-[10px] font-bold border border-emerald-400/30 min-w-[20px] text-center">
            {(linkedArtifacts || []).length}
          </span>
        </div>

        <div className="space-y-2">
          {(linkedArtifacts || []).length === 0 ? (
            <div className="p-6 border-2 border-dashed border-white/10 rounded-2xl text-center">
              <Paperclip className="h-5 w-5 text-slate-400 mx-auto mb-2" />
              <p className="text-[10px] text-slate-400 font-bold uppercase">
                No Proof Linked
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
                  className="group flex items-center justify-between p-3 bg-white/10 rounded-xl border border-white/10 hover:border-sky-400/30 hover:bg-white/10 transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="h-8 w-8 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0 text-blue-500">
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
                  <ExternalLink className="h-3 w-3 text-slate-400 group-hover:text-blue-500 cursor-pointer shrink-0" />
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
              availableItems.map((item: any) => (
                <button
                  key={item.id}
                  disabled={!!isLinking}
                  onClick={() => handleLink(item.id)}
                  className="w-full flex items-center justify-between p-2 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/10 transition-all text-left group disabled:opacity-50"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="h-7 w-7 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                      {isLinking === item.id ? (
                        <Loader2 className="h-3.5 w-3.5 text-slate-400 animate-spin" />
                      ) : (
                        <Plus className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-100" />
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 truncate group-hover:text-slate-100">
                      {item.file_name || item.title || "Untitled"}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* INFO CARD */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 rounded-[1.25rem] p-5 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-12 -mt-12" />
        <div className="flex items-center gap-2 mb-3 relative z-10">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200">
            Audit Defensibility
          </span>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed relative z-10">
          Linking artifacts creates a cryptographic bridge. Regulators treat this file as primary
          proof of implementation.
        </p>
      </div>
    </div>
  );
}

export default ArtifactSidebar;
