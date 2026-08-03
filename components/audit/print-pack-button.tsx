"use client";

import { Download } from "lucide-react";

export default function PrintPackButton() {
  return (
    <button
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      onClick={() => window.print()}
    >
      <Download className="h-3.5 w-3.5" />
      Print pack
    </button>
  );
}
