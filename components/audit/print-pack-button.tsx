"use client";

import { Download } from "lucide-react";

export default function PrintPackButton() {
  return (
    <button
      className="flex items-center gap-2 bg-white/10 text-slate-100 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all shadow-xl"
      onClick={() => window.print()}
    >
      <Download className="h-4 w-4" />
      Print Pack
    </button>
  );
}
