'use client';

import { useState } from 'react';
import { ArrowRight, Link2, Zap } from 'lucide-react';

interface Mapping {
  sourceFramework: string;
  sourceControlId: string;
  targetFramework: string;
  targetControlId: string;
  strength: 'exact' | 'partial' | 'related';
}

interface Props {
  frameworks: string[];
  mappings: Mapping[];
}

const STRENGTH_COLORS: Record<string, string> = {
  exact: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  partial:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  related: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export function CrossMapMatrix({ frameworks, mappings }: Props) {
  const [selectedCell, setSelectedCell] = useState<{
    src: string;
    tgt: string;
  } | null>(null);

  const getCellMappings = (src: string, tgt: string) =>
    mappings.filter(
      (m) =>
        (m.sourceFramework === src && m.targetFramework === tgt) ||
        (m.sourceFramework === tgt && m.targetFramework === src),
    );

  const getCellStrength = (src: string, tgt: string): string | null => {
    const cellMappings = getCellMappings(src, tgt);
    if (!cellMappings.length) return null;
    if (cellMappings.some((m) => m.strength === 'exact')) return 'exact';
    if (cellMappings.some((m) => m.strength === 'partial')) return 'partial';
    return 'related';
  };

  const cellMappings = selectedCell
    ? getCellMappings(selectedCell.src, selectedCell.tgt)
    : [];

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left text-sm font-medium text-muted-foreground border-b border-border" />
              {frameworks.map((fw) => (
                <th
                  key={fw}
                  className="p-2 text-center text-sm font-medium text-foreground border-b border-border"
                >
                  {fw}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {frameworks.map((src) => (
              <tr key={src}>
                <td className="p-2 text-sm font-medium text-foreground border-r border-border">
                  {src}
                </td>
                {frameworks.map((tgt) => {
                  if (src === tgt) {
                    return (
                      <td key={tgt} className="p-2 text-center bg-muted/30">
                        <span className="text-xs text-muted-foreground">—</span>
                      </td>
                    );
                  }
                  const strength = getCellStrength(src, tgt);
                  const count = getCellMappings(src, tgt).length;
                  return (
                    <td
                      key={tgt}
                      className={`p-2 text-center cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all ${
                        selectedCell?.src === src && selectedCell?.tgt === tgt
                          ? 'ring-2 ring-primary'
                          : ''
                      }`}
                      onClick={() => count > 0 && setSelectedCell({ src, tgt })}
                    >
                      {strength ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${STRENGTH_COLORS[strength]}`}
                        >
                          <Link2 className="h-3 w-3" />
                          {count}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs">
        <span className={`px-2 py-0.5 rounded ${STRENGTH_COLORS.exact}`}>
          Exact
        </span>
        <span className={`px-2 py-0.5 rounded ${STRENGTH_COLORS.partial}`}>
          Partial
        </span>
        <span className={`px-2 py-0.5 rounded ${STRENGTH_COLORS.related}`}>
          Related
        </span>
      </div>

      {/* Detail panel */}
      {selectedCell && cellMappings.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h4 className="text-sm font-semibold text-foreground">
            {selectedCell.src} ↔ {selectedCell.tgt} Mappings
          </h4>
          {cellMappings.map((m, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <code className="px-1.5 py-0.5 rounded bg-muted text-foreground">
                {m.sourceControlId}
              </code>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <code className="px-1.5 py-0.5 rounded bg-muted text-foreground">
                {m.targetControlId}
              </code>
              <span
                className={`px-2 py-0.5 rounded text-xs ${STRENGTH_COLORS[m.strength]}`}
              >
                {m.strength}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface DeduplicationOpportunity {
  groupName: string;
  category: string | null;
  satisfiedControls: { framework: string; controlId: string }[];
  unsatisfiedControls: { framework: string; controlId: string }[];
  potentialScoreImprovement: number;
}

export function DeduplicationOpportunities({
  opportunities,
}: {
  opportunities: DeduplicationOpportunity[];
}) {
  return (
    <div className="space-y-3">
      {opportunities.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No deduplication opportunities found. All cross-mapped controls are
          consistent.
        </p>
      )}
      {opportunities.map((opp, i) => (
        <div
          key={i}
          className="rounded-lg border border-border bg-card p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                {opp.groupName}
              </h4>
              {opp.category && (
                <span className="text-xs text-muted-foreground">
                  {opp.category}
                </span>
              )}
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 text-xs font-medium">
              <Zap className="h-3 w-3" />+{opp.potentialScoreImprovement}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">
                Satisfied
              </p>
              {opp.satisfiedControls.map((c, j) => (
                <div key={j} className="text-xs text-foreground">
                  {c.framework}:{' '}
                  <code className="text-green-600 dark:text-green-400">
                    {c.controlId}
                  </code>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
                Gaps (linkable)
              </p>
              {opp.unsatisfiedControls.map((c, j) => (
                <div
                  key={j}
                  className="flex items-center gap-2 text-xs text-foreground"
                >
                  {c.framework}:{' '}
                  <code className="text-red-600 dark:text-red-400">
                    {c.controlId}
                  </code>
                  <button className="px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-[10px] hover:bg-primary/90">
                    Link
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
