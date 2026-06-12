"use client";

import { useMemo } from "react";

interface Risk {
  id: string;
  title: string;
  likelihood: number;
  impact: number;
}

export function RiskMatrix({ risks }: { risks: Risk[] }) {
  const matrix = useMemo(() => {
    const grid = Array.from({ length: 5 }, () => Array(5).fill(0));

    risks.forEach(r => {
      if (r.likelihood >= 1 && r.likelihood <= 5 && r.impact >= 1 && r.impact <= 5) {
        grid[r.likelihood - 1][r.impact - 1] += 1;
      }
    });

    return grid;
  }, [risks]);

  const getCellColor = (l: number, i: number) => {
    const score = (l + 1) * (i + 1);
    if (score >= 15) return "bg-destructive text-destructive-foreground";
    if (score >= 8) return "bg-warning text-warning-foreground";
    if (score >= 4) return "bg-warning/40 text-warning-foreground";
    return "bg-success/30 text-success-foreground";
  };

  return (
    <div className="p-6 bg-surface-2 rounded-2xl border shadow-sm">
      <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-6">Risk Heatmap</h3>

      <div className="grid grid-cols-5 gap-1">
        {[4,3,2,1,0].map(l =>
          [0,1,2,3,4].map(i => {
            const count = matrix[l][i];
            return (
              <div
                key={`${l}-${i}`}
                className={`aspect-square rounded-lg flex items-center justify-center font-bold border ${getCellColor(l,i)} ${count ? "shadow-md" : "opacity-30"}`}
              >
                {count || ""}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}