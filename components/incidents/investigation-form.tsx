'use client';

import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

type Methodology =
  | '5_whys'
  | 'fishbone'
  | 'timeline_analysis'
  | 'barrier_analysis';

interface InvestigationFormProps {
  methodology: Methodology;
  initialData?: {
    rootCause?: string;
    contributingFactors?: string[];
    whys?: string[];
    fishbone?: Record<string, string[]>;
    timeline?: Array<{ time: string; event: string }>;
    barriers?: Array<{ barrier: string; status: string }>;
  };
  onSave: (data: Record<string, unknown>) => void;
}

const FISHBONE_CATEGORIES = [
  'People',
  'Process',
  'Equipment',
  'Environment',
  'Management',
  'Materials',
];

export function InvestigationForm({
  methodology,
  initialData,
  onSave,
}: InvestigationFormProps) {
  const [rootCause, setRootCause] = useState(initialData?.rootCause ?? '');
  const [factors, setFactors] = useState<string[]>(
    initialData?.contributingFactors ?? [],
  );

  // 5 Whys
  const [whys, setWhys] = useState<string[]>(
    initialData?.whys ?? ['', '', '', '', ''],
  );

  // Fishbone
  const [fishbone, setFishbone] = useState<Record<string, string[]>>(
    initialData?.fishbone ??
      Object.fromEntries(FISHBONE_CATEGORIES.map((c) => [c, ['']])),
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(FISHBONE_CATEGORIES),
  );

  // Timeline
  const [timeline, setTimeline] = useState<
    Array<{ time: string; event: string }>
  >(initialData?.timeline ?? [{ time: '', event: '' }]);

  // Barrier Analysis
  const [barriers, setBarriers] = useState<
    Array<{ barrier: string; status: string }>
  >(initialData?.barriers ?? [{ barrier: '', status: 'failed' }]);

  const handleSave = () => {
    const data: Record<string, unknown> = {
      rootCause,
      contributingFactors: factors.filter(Boolean),
    };
    if (methodology === '5_whys') data.whys = whys.filter(Boolean);
    if (methodology === 'fishbone') data.fishbone = fishbone;
    if (methodology === 'timeline_analysis')
      data.timeline = timeline.filter((t) => t.event);
    if (methodology === 'barrier_analysis')
      data.barriers = barriers.filter((b) => b.barrier);
    onSave(data);
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <div className="space-y-6" data-testid="investigation-form">
      {/* Methodology-specific fields */}
      {methodology === '5_whys' && (
        <div>
          <h4 className="text-sm font-medium mb-3">5 Whys Analysis</h4>
          <div className="space-y-3">
            {whys.map((why, i) => (
              <div key={i}>
                <label className="text-xs text-muted-foreground">
                  Why #{i + 1}?
                </label>
                <input
                  type="text"
                  value={why}
                  onChange={(e) => {
                    const next = [...whys];
                    next[i] = e.target.value;
                    setWhys(next);
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder={
                    i === 0
                      ? 'Why did the incident happen?'
                      : `Why? (based on #${i})`
                  }
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {methodology === 'fishbone' && (
        <div>
          <h4 className="text-sm font-medium mb-3">
            Fishbone (Ishikawa) Analysis
          </h4>
          <div className="space-y-2">
            {FISHBONE_CATEGORIES.map((cat) => (
              <div key={cat} className="border border-border rounded-lg">
                <button
                  onClick={() => toggleCategory(cat)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-muted/50"
                >
                  {expandedCategories.has(cat) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  {cat}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {fishbone[cat]?.filter(Boolean).length ?? 0} causes
                  </span>
                </button>
                {expandedCategories.has(cat) && (
                  <div className="px-3 pb-3 space-y-1.5">
                    {(fishbone[cat] ?? []).map((cause, i) => (
                      <div key={i} className="flex gap-1.5">
                        <input
                          type="text"
                          value={cause}
                          onChange={(e) => {
                            const next = {
                              ...fishbone,
                              [cat]: [...(fishbone[cat] ?? [])],
                            };
                            next[cat][i] = e.target.value;
                            setFishbone(next);
                          }}
                          className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm"
                          placeholder={`${cat} cause`}
                        />
                        <button
                          onClick={() => {
                            const next = {
                              ...fishbone,
                              [cat]: (fishbone[cat] ?? []).filter(
                                (_, j) => j !== i,
                              ),
                            };
                            setFishbone(next);
                          }}
                          className="text-muted-foreground hover:text-red-500"
                          aria-label="Remove cause"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const next = {
                          ...fishbone,
                          [cat]: [...(fishbone[cat] ?? []), ''],
                        };
                        setFishbone(next);
                      }}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Plus className="h-3 w-3" /> Add cause
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {methodology === 'timeline_analysis' && (
        <div>
          <h4 className="text-sm font-medium mb-3">Timeline Analysis</h4>
          <div className="space-y-2">
            {timeline.map((entry, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={entry.time}
                  onChange={(e) => {
                    const next = [...timeline];
                    next[i] = { ...next[i], time: e.target.value };
                    setTimeline(next);
                  }}
                  className="w-32 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  placeholder="Time"
                />
                <input
                  type="text"
                  value={entry.event}
                  onChange={(e) => {
                    const next = [...timeline];
                    next[i] = { ...next[i], event: e.target.value };
                    setTimeline(next);
                  }}
                  className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  placeholder="What happened"
                />
                <button
                  onClick={() =>
                    setTimeline(timeline.filter((_, j) => j !== i))
                  }
                  className="text-muted-foreground hover:text-red-500"
                  aria-label="Remove timeline event"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                setTimeline([...timeline, { time: '', event: '' }])
              }
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Plus className="h-3 w-3" /> Add event
            </button>
          </div>
        </div>
      )}

      {methodology === 'barrier_analysis' && (
        <div>
          <h4 className="text-sm font-medium mb-3">Barrier Analysis</h4>
          <div className="space-y-2">
            {barriers.map((b, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={b.barrier}
                  onChange={(e) => {
                    const next = [...barriers];
                    next[i] = { ...next[i], barrier: e.target.value };
                    setBarriers(next);
                  }}
                  className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  placeholder="Barrier / control that should have prevented this"
                />
                <select
                  value={b.status}
                  onChange={(e) => {
                    const next = [...barriers];
                    next[i] = { ...next[i], status: e.target.value };
                    setBarriers(next);
                  }}
                  className="w-32 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                >
                  <option value="failed">Failed</option>
                  <option value="bypassed">Bypassed</option>
                  <option value="missing">Missing</option>
                  <option value="ineffective">Ineffective</option>
                </select>
                <button
                  onClick={() =>
                    setBarriers(barriers.filter((_, j) => j !== i))
                  }
                  className="text-muted-foreground hover:text-red-500"
                  aria-label="Remove barrier"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                setBarriers([...barriers, { barrier: '', status: 'failed' }])
              }
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Plus className="h-3 w-3" /> Add barrier
            </button>
          </div>
        </div>
      )}

      {/* Root Cause & Contributing Factors (all methodologies) */}
      <div>
        <label className="block text-sm font-medium mb-1">Root Cause</label>
        <textarea
          value={rootCause}
          onChange={(e) => setRootCause(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          rows={3}
          placeholder="The fundamental root cause identified through analysis"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Contributing Factors
        </label>
        <div className="space-y-1.5">
          {factors.map((f, i) => (
            <div key={i} className="flex gap-1.5">
              <input
                type="text"
                value={f}
                onChange={(e) => {
                  const next = [...factors];
                  next[i] = e.target.value;
                  setFactors(next);
                }}
                className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
              />
              <button
                onClick={() => setFactors(factors.filter((_, j) => j !== i))}
                className="text-muted-foreground hover:text-red-500"
                aria-label="Remove factor"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button
            onClick={() => setFactors([...factors, ''])}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Plus className="h-3 w-3" /> Add factor
          </button>
        </div>
      </div>

      <button
        onClick={handleSave}
        className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
      >
        Save Investigation Data
      </button>
    </div>
  );
}
