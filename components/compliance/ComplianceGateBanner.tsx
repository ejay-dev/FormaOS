'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, ShieldCheck, XCircle } from 'lucide-react';
import type { GateKey, ComplianceBlock } from '@/app/app/actions/enforcement';

export default function ComplianceGateBanner({
  gateKey,
  blocks,
  title,
  compact = false,
}: {
  gateKey: GateKey;
  blocks: ComplianceBlock[];
  title?: string;
  compact?: boolean;
}) {
  if (!blocks || blocks.length === 0) return null;

  // Map gate to resolution path
  const routeMap: Record<string, string> = {
    AUDIT_EXPORT: '/app/reports',
    CERT_REPORT: '/app/reports',
    FRAMEWORK_ISO27001: '/app/vault',
    FRAMEWORK_SOC2: '/app/vault',
    FRAMEWORK_HIPAA: '/app/vault',
    FRAMEWORK_NDIS: '/app/vault',
  };

  const resolvePath = routeMap[gateKey] ?? '/app/reports';

  return (
    <div
      className={`rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 ${compact ? 'text-xs' : 'text-sm'}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded border border-destructive/20 bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-foreground">
                {title ?? 'Action blocked by compliance gate'}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {blocks.length} unresolved requirement
                {blocks.length > 1 ? 's' : ''} — action prevented until
                addressed.
              </div>
            </div>

            <div className="shrink-0">
              <Link
                href={resolvePath}
                className="inline-flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/20"
              >
                Resolve requirements
                <ShieldCheck className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <ul className="mt-3 space-y-2 max-w-xl">
            {blocks.slice(0, 6).map((b) => (
              <li key={b.id} className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded border border-destructive/20 bg-destructive/10 text-destructive">
                  <XCircle className="h-3 w-3" />
                </span>
                <div className="text-foreground">
                  <div className="font-medium">
                    {b.reason ||
                      (b.metadata && String(b.metadata.message || '')) ||
                      b.gate_key}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {b.created_at
                      ? new Date(b.created_at).toLocaleString()
                      : ''}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
