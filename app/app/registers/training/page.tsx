'use client';

import { useEffect, useMemo, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { GraduationCap, Plus, Calendar, User, Search } from 'lucide-react';
import { AddCertificationModal } from '@/components/registers/add-certification-modal';
import {
  StatusBadge,
  certificateExpiry,
} from '@/components/compliance/StatusBadge';
import {
  getOrgMemberIdentities,
  type MemberIdentityMap,
} from '@/lib/team/member-identity';
import { useAppStore } from '@/lib/stores/app';

type TrainingRecord = {
  id: string;
  user_id: string;
  title: string;
  completion_date: string;
  expiry_date: string | null;
};

type OrgMember = {
  user_id: string;
};

const ALL_FILTER = 'all';

export default function TrainingRegisterPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [identities, setIdentities] = useState<MemberIdentityMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schemaAvailable, setSchemaAvailable] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(ALL_FILTER);

  const supabase = useMemo(() => createSupabaseClient(), []);
  const orgId = useAppStore((state) => state.organization?.id ?? null);
  const isHydrated = useAppStore((state) => state.isHydrated);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      if (!isHydrated) return;
      if (!orgId) {
        setRecords([]);
        setMembers([]);
        setIdentities({});
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [
          { data: recs, error: recError },
          { data: mems, error: memberError },
          identityMap,
        ] = await Promise.all([
          supabase
            .from('org_training_records')
            .select('id, user_id, title, completion_date, expiry_date')
            .eq('organization_id', orgId)
            .order('expiry_date', { ascending: true }),
          supabase
            .from('org_members')
            .select('user_id')
            .eq('organization_id', orgId),
          getOrgMemberIdentities(),
        ]);

        if (!cancelled) setIdentities(identityMap);

        if (
          recError?.code === 'PGRST205' &&
          recError.message?.includes('org_training_records')
        ) {
          if (cancelled) return;
          setSchemaAvailable(false);
          setRecords([]);
          setMembers((mems ?? []) as OrgMember[]);
          return;
        }

        if (recError) throw recError;
        if (memberError) throw memberError;

        if (cancelled) return;
        setSchemaAvailable(true);
        setRecords((recs ?? []) as TrainingRecord[]);
        setMembers((mems ?? []) as OrgMember[]);
      } catch {
        if (cancelled) return;
        setError('Unable to load training register right now.');
        setRecords([]);
        setMembers([]);
        setIdentities({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [supabase, isHydrated, orgId, isOpen]);

  const filteredRecords = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return records.filter((record) => {
      const isExpired = Boolean(
        record.expiry_date && new Date(record.expiry_date) < new Date(),
      );
      const statusMatch =
        statusFilter === ALL_FILTER ||
        (statusFilter === 'expired' && isExpired) ||
        (statusFilter === 'active' && !isExpired);

      if (!statusMatch) return false;

      if (!normalizedQuery) return true;

      const identity = identities[record.user_id];
      const searchableText =
        `${record.title} ${identity?.name ?? ''} ${identity?.email ?? ''}`.toLowerCase();
      return searchableText.includes(normalizedQuery);
    });
  }, [records, identities, searchQuery, statusFilter]);

  return (
    <div className="flex flex-col h-full">
      <AddCertificationModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        members={members}
      />

      <div className="page-header">
        <div>
          <h1 className="page-title">Staff training register</h1>
          <p className="page-description">
            Monitor mandatory certifications and worker screening.
          </p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          disabled={!schemaAvailable}
          title={
            schemaAvailable
              ? undefined
              : 'Training records are not enabled for this workspace yet.'
          }
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Add certification
        </button>
      </div>

      <div className="page-content space-y-4">
      {!schemaAvailable ? (
        <div
          className="rounded-lg border border-warning/20 bg-warning/10 p-3 text-sm text-warning"
          data-testid="training-register-schema-disabled"
        >
          Training records are not enabled for this workspace yet. Contact
          support to turn them on.
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by name or certification"
            aria-label="Search training records"
            className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            enterKeyHint="search"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter by status"
          className="h-9 rounded-md border border-border bg-background px-2 text-xs text-foreground"
        >
          <option value={ALL_FILTER}>All statuses</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="min-w-[720px] w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs">
              <tr className="border-b border-border">
                <th className="px-3 py-2 font-medium">Staff member</th>
                <th className="px-3 py-2 font-medium">Certification</th>
                <th className="px-3 py-2 font-medium">Completed</th>
                <th className="px-3 py-2 font-medium">Expiry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-3 py-12 text-center">
                    <p className="text-sm text-muted-foreground">
                      Loading training records…
                    </p>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-12 text-center">
                    <GraduationCap className="mx-auto h-8 w-8 text-muted-foreground opacity-50" />
                    <p className="mt-2 text-sm font-medium text-foreground">
                      No matching records found
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Adjust your search or add a new certification.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const identity = identities[record.user_id];
                  return (
                    <tr
                      key={record.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 shrink-0 rounded-md border border-border bg-muted flex items-center justify-center text-[11px] font-semibold text-muted-foreground">
                            {identity ? (
                              identity.initials
                            ) : (
                              <User className="h-3.5 w-3.5" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {identity?.name ?? 'Unknown member'}
                            </span>
                            {identity?.email ? (
                              <span className="text-xs text-muted-foreground">
                                {identity.email}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-foreground">
                        {record.title}
                      </td>
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(
                            record.completion_date,
                          ).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <StatusBadge
                            {...certificateExpiry(record.expiry_date)}
                          />
                          {record.expiry_date ? (
                            <span className="text-xs text-muted-foreground">
                              {new Date(
                                record.expiry_date,
                              ).toLocaleDateString()}
                            </span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}
