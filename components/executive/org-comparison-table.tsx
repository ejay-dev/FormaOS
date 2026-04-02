'use client';

import Link from 'next/link';

interface OrgScore {
  orgId: string;
  orgName: string;
  complianceScore: number;
  totalControls: number;
  evidenceCount: number;
  incidentCount: number;
}

export function OrgComparisonTable({ orgs }: { orgs: OrgScore[] }) {
  if (!orgs.length) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No member organizations in this group.
      </p>
    );
  }

  function scoreColor(score: number): string {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  }

  function scoreBg(score: number): string {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  return (
    <div
      className="border border-border rounded-lg bg-card overflow-hidden"
      data-testid="org-comparison-table"
    >
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b border-border">
          <tr>
            <th className="text-left px-4 py-3 font-medium">Organization</th>
            <th className="text-left px-4 py-3 font-medium">Compliance</th>
            <th className="text-left px-4 py-3 font-medium w-32">Score</th>
            <th className="text-left px-4 py-3 font-medium">Controls</th>
            <th className="text-left px-4 py-3 font-medium">Evidence</th>
            <th className="text-left px-4 py-3 font-medium">Incidents (30d)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {orgs.map((org) => (
            <tr key={org.orgId} className="hover:bg-muted/30">
              <td className="px-4 py-3">
                <Link
                  href={`/app/executive?org=${org.orgId}`}
                  className="font-medium hover:underline"
                >
                  {org.orgName}
                </Link>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`font-semibold ${scoreColor(org.complianceScore)}`}
                >
                  {org.complianceScore}%
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${scoreBg(org.complianceScore)}`}
                    style={{ width: `${org.complianceScore}%` }}
                  />
                </div>
              </td>
              <td className="px-4 py-3">{org.totalControls}</td>
              <td className="px-4 py-3">{org.evidenceCount}</td>
              <td className="px-4 py-3">{org.incidentCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
