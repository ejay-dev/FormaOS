"use client"

import { AlertTriangle, ShieldCheck, Zap } from "lucide-react";

interface RiskHeatmapProps {
  data: {
    high: number;
    medium: number;
    low: number;
  }
}

export function RiskHeatmap({ data }: RiskHeatmapProps) {
  const total = data.high + data.medium + data.low || 1;
  
  const segments = [
    { label: "High Risk", count: data.high, color: "bg-red-500", text: "text-red-600", icon: AlertTriangle },
    { label: "Medium Risk", count: data.medium, color: "bg-amber-500", text: "text-amber-600", icon: Zap },
    { label: "Low Risk", count: data.low, color: "bg-emerald-500", text: "text-emerald-300", icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-100">Security Risk Profile</h3>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Distribution</span>
      </div>

      {/* Visual Progress Bar */}
      <div className="h-4 w-full flex rounded-full overflow-hidden bg-white/10">
        {segments.map((s) => (
          <div 
            key={s.label}
            className={`${s.color} transition-all duration-500`}
            style={{ width: `${(s.count / total) * 100}%` }}
          />
        ))}
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {segments.map((s) => (
          <div key={s.label} className="p-3 rounded-xl border border-white/10 bg-white/10">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`h-3 w-3 ${s.text}`} />
              <span className="text-[10px] font-bold text-slate-400 uppercase">{s.count} Assets</span>
            </div>
            <p className={`text-xs font-bold ${s.text}`}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
