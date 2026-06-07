"use client";

import { Download } from "lucide-react";

export default function PrintPackButton() {
  return (
    <button
      className="flex items-center gap-2 bg-surface-2 text-foreground px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-surface-3 transition-all shadow-xl"
      onClick={() => window.print()}
    >
      <Download className="h-4 w-4" />
      Print Pack
    </button>
  );
}
