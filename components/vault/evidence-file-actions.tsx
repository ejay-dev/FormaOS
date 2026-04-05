"use client";

import { useState } from "react";
import { Download, ExternalLink, Eye, Loader2 } from "lucide-react";
import { getEvidenceSignedUrl } from "@/app/app/actions/vault";

interface EvidenceFileActionsProps {
  filePath: string | null;
  variant?: "pending" | "table";
}

export function EvidenceFileActions({
  filePath,
  variant = "table",
}: EvidenceFileActionsProps) {
  const [loading, setLoading] = useState(false);

  async function openFile(mode: "view" | "download") {
    if (!filePath) return;

    try {
      setLoading(true);
      const { signedUrl } = await getEvidenceSignedUrl(filePath);

      if (mode === "download") {
        const anchor = document.createElement("a");
        anchor.href = signedUrl;
        anchor.download = "";
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        return;
      }

      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("[EvidenceFileActions] Failed to open file:", error);
      window.alert("Unable to open this file right now.");
    } finally {
      setLoading(false);
    }
  }

  if (variant === "pending") {
    return (
      <button
        type="button"
        disabled={!filePath || loading}
        onClick={() => openFile("view")}
        className="flex-1 py-3 flex items-center justify-center gap-2 rounded-xl bg-glass-strong hover:bg-white/20 text-xs font-bold text-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
        View
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
      <button
        type="button"
        disabled={!filePath || loading}
        onClick={() => openFile("view")}
        className="p-2 hover:bg-glass-strong text-muted-foreground rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Open file"
        aria-label="Open file"
      >
        <ExternalLink className="h-4 w-4" />
      </button>
      <button
        type="button"
        disabled={!filePath || loading}
        onClick={() => openFile("download")}
        className="p-2 hover:bg-glass-strong rounded-lg text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Download file"
        aria-label="Download file"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      </button>
    </div>
  );
}
