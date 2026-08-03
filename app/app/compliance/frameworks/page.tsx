import { Suspense } from 'react';
import Link from 'next/link';
import { ShieldCheck, Layers, CheckCircle2, ArrowRight } from 'lucide-react';
import {
  getCurrentOrgId,
  getOrgFrameworkOverview,
  getFrameworkEvaluationTallies,
  type FrameworkEvaluationTally,
} from '@/lib/frameworks/org-frameworks';
import { getControlMappingSummary } from '@/lib/frameworks/mappings';
import { SkeletonCard, SkeletonTable } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { PageHero } from '@/components/ui/page-hero';

function formatTallyTimestamp(value: string | null): string {
  if (!value) return 'not yet evaluated';
  return new Date(value).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function EvaluationTally({ tally }: { tally: FrameworkEvaluationTally }) {
  const segments: Array<{
    key: keyof Pick<FrameworkEvaluationTally, 'pass' | 'partial' | 'fail' | 'not_evaluated'>;
    label: string;
    color: string;
  }> = [
    { key: 'pass', label: 'Pass', color: 'bg-success/15 text-success border-success/30' },
    { key: 'partial', label: 'Partial', color: 'bg-warning/15 text-warning border-warning/30' },
    { key: 'fail', label: 'Fail', color: 'bg-destructive/15 text-destructive border-destructive/30' },
    { key: 'not_evaluated', label: 'Manual', color: 'bg-muted text-muted-foreground border-border' },
  ];

  return (
    <div className="mt-4 rounded-lg border border-border bg-surface-1 p-3" data-testid="framework-evaluation-tally">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium uppercase tracking-wider">Per-control status</span>
        <span>{formatTallyTimestamp(tally.lastEvaluatedAt)}</span>
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {segments.map((segment) => {
          const value = tally[segment.key];
          return (
            <div
              key={segment.key}
              className={`rounded-md border px-2 py-1.5 text-center ${segment.color}`}
              data-testid={`framework-tally-${segment.key}`}
            >
              <div className="text-lg font-semibold leading-none">{value}</div>
              <div className="mt-0.5 text-[10px] uppercase tracking-wide opacity-80">{segment.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Streamed: Framework grid (requires org framework data) */
async function FrameworkGrid({ orgId }: { orgId: string }) {
  const frameworks = await getOrgFrameworkOverview(orgId);
  const tallyMap = await getFrameworkEvaluationTallies(
    orgId,
    frameworks
      .map((fw) => fw.id)
      .filter((id): id is string => typeof id === 'string'),
  );

  if (frameworks.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface-1 p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface-1">
          <ShieldCheck className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="mt-4 text-sm font-semibold text-foreground">
          No frameworks enabled
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          Select frameworks during onboarding or contact support to enable
          additional packs.
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {frameworks.map((framework) => (
        <div
          key={framework.slug}
          className="rounded-2xl border border-border bg-card p-6 shadow-premium-lg transition-all duration-200 hover:border-edge-3 hover:shadow-premium-xl"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span>Enabled framework</span>
              </div>
              <h2 className="mt-2 text-xl font-semibold text-foreground">
                {framework.name}
              </h2>
              {framework.description ? (
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {framework.description}
                </p>
              ) : null}
            </div>
            <div className="rounded-xl border border-border bg-surface-1 px-3 py-2 text-right shrink-0">
              <div className="text-xs text-muted-foreground">Controls</div>
              <div className="text-lg font-semibold text-foreground">
                {framework.controlCount}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {framework.domains.length === 0 ? (
              <span className="text-xs text-muted-foreground">
                No domains registered yet.
              </span>
            ) : (
              framework.domains.map((domain) => (
                <Badge key={domain.id} variant="outline" className="gap-1.5">
                  <span>{domain.name}</span>
                  <span className="text-muted-foreground">
                    {domain.controlCount}
                  </span>
                </Badge>
              ))
            )}
          </div>

          {framework.id && tallyMap.get(framework.id) ? (
            <EvaluationTally tally={tallyMap.get(framework.id)!} />
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
              No per-control evaluations recorded yet. Run one from the
              Controls page, or wait for the overnight check.
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/** Streamed: SOC2 mapping table (requires mapping data) */
async function Soc2MappingSection({ orgId }: { orgId: string }) {
  const frameworks = await getOrgFrameworkOverview(orgId);
  const soc2Enabled = frameworks.find((fw) => fw.slug === 'soc2');
  if (!soc2Enabled) return null;

  const soc2Mappings = await getControlMappingSummary('soc2');
  if (!soc2Mappings.length) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <CheckCircle2 className="h-4 w-4 text-success" />
        <span>SOC 2 Mapping Coverage</span>
      </div>
      <h3 className="mt-2 text-lg font-semibold text-foreground">
        Multi-framework control view
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        SOC 2 controls mapped to NIST CSF and CIS Controls.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-[640px] w-full text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Control</th>
              <th className="px-3 py-2 text-left font-medium">
                Mapped Frameworks
              </th>
              <th className="px-3 py-2 text-left font-medium">Coverage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {soc2Mappings.map((mapping) => (
              <tr
                key={mapping.controlId}
                className="transition-colors hover:bg-surface-1"
              >
                <td className="px-3 py-3">
                  <div className="text-sm font-semibold text-foreground">
                    {mapping.controlCode}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {mapping.controlTitle}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {mapping.mappings.map((item, index) => (
                      <Badge
                        key={`${item.frameworkSlug}-${index}`}
                        variant="glass"
                      >
                        {item.frameworkSlug}: {item.reference}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-success transition-all duration-500"
                        style={{ width: `${mapping.coverageScore}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-foreground/80">
                      {mapping.coverageScore}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function ComplianceFrameworksPage() {
  const orgId = await getCurrentOrgId();

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <PageHero
        eyebrow="Compliance · Frameworks"
        title="Framework Library"
        subtitle="Enabled frameworks, control coverage, and domain structure for your organization."
      />

      {/* Framework grid — streams when data resolves */}
      <Suspense
        fallback={
          <div className="grid gap-6 lg:grid-cols-2">
            <SkeletonCard className="h-48" />
            <SkeletonCard className="h-48" />
          </div>
        }
      >
        <FrameworkGrid orgId={orgId} />
      </Suspense>

      {/* SOC 2 Readiness CTA */}
      <Link
        href="/app/compliance/soc2"
        className="flex items-center justify-between rounded-2xl border border-border bg-card p-6 hover:border-primary/40 transition-colors group"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface-1">
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <div className="text-lg font-semibold text-foreground">
              SOC 2 Readiness Dashboard
            </div>
            <div className="text-sm text-muted-foreground">
              Automated evidence checks, gap analysis, and certification
              tracking
            </div>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform" />
      </Link>

      {/* SOC2 mapping table — streams independently */}
      <Suspense fallback={<SkeletonTable rows={4} />}>
        <Soc2MappingSection orgId={orgId} />
      </Suspense>
    </div>
  );
}
