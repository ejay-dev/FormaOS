'use client';

import { useState } from 'react';
import {
  Layers,
  Play,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

type BulkOpType = 'suspend_orgs' | 'extend_trials' | 'recalculate_health';

interface Org {
  id: string;
  name: string;
}

interface Preview {
  operation: string;
  targets: Array<{ orgId: string; orgName?: string }>;
  affectedUsers: number;
  affectedSubscriptions: number;
  warnings: string[];
}

interface Result {
  total: number;
  succeeded: number;
  failed: number;
  results: Array<{ orgId: string; status: string; error?: string }>;
}

const OP_OPTIONS: Array<{
  value: BulkOpType;
  label: string;
  description: string;
}> = [
  {
    value: 'suspend_orgs',
    label: 'Suspend Organizations',
    description: 'Suspend selected organizations and revoke API keys',
  },
  {
    value: 'extend_trials',
    label: 'Extend Trials',
    description: 'Extend trial period for all selected organizations',
  },
  {
    value: 'recalculate_health',
    label: 'Recalculate Health Scores',
    description: 'Queue health score recalculation for selected orgs',
  },
];

export function BulkOperations({ orgs }: { orgs: Org[] }) {
  const [selectedOp, setSelectedOp] = useState<BulkOpType | null>(null);
  const [selectedOrgs, setSelectedOrgs] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<Preview | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<
    'select-op' | 'select-targets' | 'preview' | 'done'
  >('select-op');
  const [trialDays, setTrialDays] = useState(14);

  const toggleOrg = (id: string) => {
    setSelectedOrgs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDryRun = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/bulk-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: selectedOp,
          targets: Array.from(selectedOrgs).map((id) => ({
            orgId: id,
            orgName: orgs.find((o) => o.id === id)?.name,
          })),
          dryRun: true,
          params:
            selectedOp === 'extend_trials' ? { days: trialDays } : undefined,
        }),
      });
      const data = await res.json();
      setPreview(data);
      setStep('preview');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/bulk-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: selectedOp,
          targets: Array.from(selectedOrgs).map((id) => ({ orgId: id })),
          dryRun: false,
          params:
            selectedOp === 'extend_trials' ? { days: trialDays } : undefined,
        }),
      });
      const data = await res.json();
      setResult(data);
      setStep('done');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="bulk-operations">
      {/* Step 1: Select Operation */}
      <div>
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Layers className="h-4 w-4" /> Select Operation
        </h3>
        <div className="grid gap-2">
          {OP_OPTIONS.map((op) => (
            <button
              key={op.value}
              onClick={() => {
                setSelectedOp(op.value);
                setStep('select-targets');
                setPreview(null);
                setResult(null);
              }}
              className={`text-left p-3 rounded-lg border transition-colors ${
                selectedOp === op.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <p className="text-sm font-medium">{op.label}</p>
              <p className="text-xs text-muted-foreground">{op.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Select Targets */}
      {selectedOp && step !== 'select-op' && (
        <div>
          <h3 className="text-sm font-medium mb-3">
            Select Organizations ({selectedOrgs.size})
          </h3>
          {selectedOp === 'extend_trials' && (
            <div className="mb-3">
              <label className="text-sm text-muted-foreground">
                Extra days:
              </label>
              <input
                type="number"
                min={1}
                max={90}
                value={trialDays}
                onChange={(e) => setTrialDays(Number(e.target.value))}
                className="ml-2 w-20 rounded-md border border-input bg-background px-2 py-1 text-sm"
              />
            </div>
          )}
          <div className="max-h-48 overflow-y-auto border border-border rounded-lg divide-y divide-border">
            {orgs.map((org) => (
              <label
                key={org.id}
                className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedOrgs.has(org.id)}
                  onChange={() => toggleOrg(org.id)}
                  className="rounded border-input"
                />
                <span className="text-sm">{org.name}</span>
              </label>
            ))}
          </div>
          <button
            onClick={handleDryRun}
            disabled={selectedOrgs.size === 0 || loading}
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium bg-muted hover:bg-muted/80 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            Preview (Dry Run)
          </button>
        </div>
      )}

      {/* Step 3: Preview */}
      {preview && step === 'preview' && (
        <div className="p-4 border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30 rounded-lg">
          <h3 className="text-sm font-medium mb-2">Blast Radius Preview</h3>
          <div className="grid grid-cols-2 gap-3 text-sm mb-3">
            <div>
              Affected Users:{' '}
              <span className="font-medium">{preview.affectedUsers}</span>
            </div>
            <div>
              Active Subscriptions:{' '}
              <span className="font-medium">
                {preview.affectedSubscriptions}
              </span>
            </div>
          </div>
          {preview.warnings.length > 0 && (
            <div className="space-y-1 mb-3">
              {preview.warnings.map((w, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 text-sm text-yellow-700 dark:text-yellow-400"
                >
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {w}
                </div>
              ))}
            </div>
          )}
          <button
            onClick={handleExecute}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Execute ({selectedOrgs.size} orgs)
          </button>
        </div>
      )}

      {/* Step 4: Results */}
      {result && step === 'done' && (
        <div className="p-4 border border-border rounded-lg">
          <h3 className="text-sm font-medium mb-3">Results</h3>
          <div className="flex gap-4 text-sm mb-3">
            <span className="text-green-600 dark:text-green-400">
              <CheckCircle2 className="inline h-4 w-4 mr-1" />
              {result.succeeded} succeeded
            </span>
            {result.failed > 0 && (
              <span className="text-red-600 dark:text-red-400">
                <XCircle className="inline h-4 w-4 mr-1" />
                {result.failed} failed
              </span>
            )}
          </div>
          {result.results
            .filter((r) => r.status === 'failed')
            .map((r) => (
              <div
                key={r.orgId}
                className="text-sm text-red-600 dark:text-red-400"
              >
                {r.orgId}: {r.error}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
