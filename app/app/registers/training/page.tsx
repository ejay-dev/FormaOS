'use client';

import { useEffect, useMemo, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import {
  GraduationCap,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  User,
  Search,
} from 'lucide-react';
import { AddCertificationModal } from '@/components/registers/add-certification-modal';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [
          { data: recs, error: recError },
          { data: mems, error: memberError },
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
        ]);

        if (recError) throw recError;
        if (memberError) throw memberError;

        if (cancelled) return;
        setRecords((recs ?? []) as TrainingRecord[]);
        setMembers((mems ?? []) as OrgMember[]);
      } catch (err) {
        if (cancelled) return;
        console.error('[TrainingRegisterPage] fetch failed:', err);
        setError('Unable to load training register right now.');
        setRecords([]);
        setMembers([]);
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

      const searchableText = `${record.title} ${record.user_id}`.toLowerCase();
      return searchableText.includes(normalizedQuery);
    });
  }, [records, searchQuery, statusFilter]);

  return (
    <div className="space-y-8 pb-12">
      <AddCertificationModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        members={members}
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">
            Staff Training Register
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">
            Monitor mandatory certifications and worker screening.
          </p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-glass-strong text-foreground px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/20 transition-all shadow-xl active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Add Certification
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] md:grid-cols-[1fr_auto] items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by personnel ID or certification..."
            aria-label="Search training records"
            className="w-full pl-12 pr-4 py-2.5 text-sm font-medium outline-none bg-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter by status"
          className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold uppercase tracking-wider text-foreground/70"
        >
          <option value={ALL_FILTER}>All Statuses</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="bg-white/5 border border-white/10 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="min-w-[860px] w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                <th className="px-8 py-6">Personnel</th>
                <th className="px-8 py-6">Certification / Training</th>
                <th className="px-8 py-6">Completion</th>
                <th className="px-8 py-6">Expiry Status</th>
                <th className="px-8 py-6 text-right">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-8 py-20 text-center animate-pulse"
                  >
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                      Synchronizing Registry...
                    </p>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center">
                    <div className="h-16 w-16 bg-glass-strong rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
                      <GraduationCap className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-black text-foreground tracking-tight">
                      No matching records found
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Adjust your search or add a new certification.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const isExpired = Boolean(
                    record.expiry_date &&
                    new Date(record.expiry_date) < new Date(),
                  );
                  return (
                    <tr
                      key={record.id}
                      className="group hover:bg-white/5 transition-colors"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-glass-strong flex items-center justify-center text-muted-foreground border border-white/10 group-hover:bg-white/20 transition-colors">
                            <User className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-foreground">
                              Workspace Member
                            </span>
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              ID: {record.user_id.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-semibold text-foreground tracking-tight">
                          {record.title}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-muted-foreground font-medium text-sm">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {new Date(
                            record.completion_date,
                          ).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold uppercase tracking-wide w-fit shadow-sm ${
                            isExpired
                              ? 'bg-rose-500/10 text-rose-300 border-rose-400/30'
                              : 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30'
                          }`}
                        >
                          {isExpired ? (
                            <AlertTriangle className="h-3 w-3" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          {isExpired ? 'Expired' : 'Verified Active'}
                          {record.expiry_date &&
                            ` • ${new Date(record.expiry_date).toLocaleDateString()}`}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Internal Record
                        </span>
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
  );
}
