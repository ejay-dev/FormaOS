import { getAdminFetchConfig } from '@/app/admin/lib';
import { FileText, Shield } from 'lucide-react';
import Link from 'next/link';
import { AuditLogSection } from './audit-log-section';
import { AuditRunnerClient } from './audit-runner-client';

type AuditEntry = {
  id: string;
  actor_user_id: string;
  action: string;
  target_type: string;
  target_id: string;
  metadata: Record<string, any> | null;
  created_at: string;
};

async function fetchAuditLog(page?: string) {
  const { base, headers } = await getAdminFetchConfig();
  const params = new URLSearchParams();
  if (page) params.set('page', page);

  const res = await fetch(`${base}/api/admin/audit?${params.toString()}`, {
    cache: 'no-store',
    headers,
  });
  if (!res.ok) return null;
  return res.json();
}

const TABS = [
  { key: 'log', label: 'Audit Log', icon: FileText },
  { key: 'runner', label: 'QA Runner', icon: Shield },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; page?: string }>;
}) {
  const resolved = await searchParams;
  const activeTab: TabKey =
    resolved?.tab === 'runner' ? 'runner' : 'log';

  const data = activeTab === 'log' ? await fetchAuditLog(resolved?.page) : null;
  const entries: AuditEntry[] = data?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Audit</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Administrative actions, system events, and quality assurance.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-border">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const href =
            tab.key === 'log' ? '/admin/audit?tab=log' : '/admin/audit?tab=runner';

          return (
            <Link
              key={tab.key}
              href={href}
              className={`flex items-center gap-2 px-1 pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                isActive
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'log' ? (
        <AuditLogSection
          entries={entries}
          pagination={data?.pagination}
        />
      ) : (
        <AuditRunnerClient />
      )}
    </div>
  );
}
