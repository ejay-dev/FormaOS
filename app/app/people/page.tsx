'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  UserPlus,
  Shield,
  User,
  CheckSquare,
  ShieldCheck,
  Search,
  AlertCircle,
} from 'lucide-react';
import { InviteModal } from '@/components/team/invite-modal';
import {
  fetchPeopleOverview,
  type PeopleOverviewMember,
} from '@/app/app/actions/people';
import { useAppStore } from '@/lib/stores/app';

const ALL_FILTER = 'all';

export default function PeoplePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [members, setMembers] = useState<PeopleOverviewMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState(ALL_FILTER);
  const [complianceFilter, setComplianceFilter] = useState(ALL_FILTER);

  const orgId = useAppStore((state) => state.organization?.id ?? null);
  const isHydrated = useAppStore((state) => state.isHydrated);

  useEffect(() => {
    let cancelled = false;

    async function loadPersonnel() {
      if (!isHydrated) return;
      if (!orgId) {
        setMembers([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const payload = await fetchPeopleOverview();
        if (cancelled) return;
        setMembers(payload.members);
      } catch (err) {
        if (cancelled) return;
        console.error('[PeoplePage] Failed to fetch personnel data:', err);
        setMembers([]);
        setError('Unable to load personnel records right now.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPersonnel();

    return () => {
      cancelled = true;
    };
  }, [isHydrated, orgId, isModalOpen]);

  const roleOptions = useMemo(() => {
    const roles = new Set<string>();
    for (const member of members) {
      roles.add((member.role ?? 'member').toLowerCase());
    }
    return Array.from(roles).sort();
  }, [members]);

  const complianceOptions = useMemo(() => {
    const statuses = new Set<string>();
    for (const member of members) {
      statuses.add((member.compliance_status ?? 'active').toLowerCase());
    }
    return Array.from(statuses).sort();
  }, [members]);

  const filteredMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return members.filter((member) => {
      const normalizedRole = (member.role ?? 'member').toLowerCase();
      const normalizedCompliance = (
        member.compliance_status ?? 'active'
      ).toLowerCase();
      const searchableText = [
        member.user_id,
        member.department ?? '',
        normalizedRole,
        normalizedCompliance,
      ]
        .join(' ')
        .toLowerCase();

      const matchesQuery =
        !normalizedQuery || searchableText.includes(normalizedQuery);
      const matchesRole =
        roleFilter === ALL_FILTER || normalizedRole === roleFilter;
      const matchesCompliance =
        complianceFilter === ALL_FILTER ||
        normalizedCompliance === complianceFilter;

      return matchesQuery && matchesRole && matchesCompliance;
    });
  }, [members, query, roleFilter, complianceFilter]);

  return (
    <div className="space-y-8 pb-12">
      <InviteModal
        isOpen={isModalOpen}
        onCloseAction={() => setIsModalOpen(false)}
      />

      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">
            Personnel Oversight
          </h1>
          <p className="mt-1 text-muted-foreground font-medium tracking-tight">
            Workforce access, role, and compliance activity.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-glass-strong text-foreground px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/20 transition-all shadow-xl active:scale-95"
        >
          <UserPlus className="h-4 w-4" />
          Provision Access
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by member ID, department, or role..."
            aria-label="Search people"
            className="w-full pl-12 pr-4 py-2.5 text-sm font-medium outline-none bg-transparent"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
          aria-label="Filter by role"
          className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold uppercase tracking-wider text-foreground/70"
        >
          <option value={ALL_FILTER}>All Roles</option>
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>

        <select
          value={complianceFilter}
          onChange={(event) => setComplianceFilter(event.target.value)}
          aria-label="Filter by compliance status"
          className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold uppercase tracking-wider text-foreground/70"
        >
          <option value={ALL_FILTER}>All Statuses</option>
          {complianceOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-20 text-center animate-pulse">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Synchronizing Personnel Records...
            </p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 py-14 text-center">
            <p className="text-sm font-semibold text-foreground/90">
              No personnel match the current filters.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Adjust search terms or filters and try again.
            </p>
          </div>
        ) : (
          filteredMembers.map((member) => {
            const complianceStatus = (
              member.compliance_status ?? 'active'
            ).toLowerCase();
            const roleLabel = (member.role ?? 'member').toUpperCase();
            const joinedDate = new Date(
              member.start_date ?? member.created_at,
            ).toLocaleDateString();

            return (
              <div
                key={member.user_id}
                className="group bg-white/5 border border-white/10 rounded-[2.5rem] p-6 hover:border-glass-border-strong transition-all shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6"
              >
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-[1.25rem] bg-glass-strong border border-white/10 flex items-center justify-center text-muted-foreground group-hover:bg-white/20 group-hover:text-foreground transition-all duration-300">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-foreground leading-none">
                        Workspace Member
                      </p>

                      <div
                        className={`px-2 py-0.5 rounded-md border text-xs font-semibold uppercase tracking-wide flex items-center gap-1 ${
                          complianceStatus === 'active'
                            ? 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30'
                            : 'bg-rose-500/10 text-rose-300 border-rose-400/30'
                        }`}
                      >
                        {complianceStatus === 'active' ? (
                          <ShieldCheck className="h-3 w-3" />
                        ) : (
                          <AlertCircle className="h-3 w-3" />
                        )}
                        {complianceStatus}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-2">
                      {member.department || 'General Staff'} • Joined{' '}
                      {joinedDate}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-8 md:gap-16 border-t md:border-t-0 pt-6 md:pt-0 border-white/10">
                  <div className="text-center">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Tasks
                    </p>
                    <div className="flex items-center gap-2 justify-center">
                      <CheckSquare className="h-3.5 w-3.5 text-sky-300" />
                      <span className="text-sm font-black text-foreground">
                        {member.taskCount}
                      </span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Evidence
                    </p>
                    <div className="flex items-center gap-2 justify-center">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-sm font-black text-foreground">
                        {member.evidenceCount}
                      </span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Role
                    </p>
                    <div className="flex items-center gap-2 justify-center">
                      <Shield
                        className={`h-3.5 w-3.5 ${roleLabel === 'ADMIN' ? 'text-sky-300' : 'text-muted-foreground'}`}
                      />
                      <span className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                        {roleLabel}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/app/staff-compliance?member=${member.user_id}`}
                    className="px-6 py-3 bg-glass-strong text-foreground rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-white/20 transition-all"
                  >
                    View Records
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
