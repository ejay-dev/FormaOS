'use client';

import { useEffect, useMemo, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import {
  ShieldCheck,
  Eye,
  CheckCircle2,
  FileText,
  Calendar,
  Clock,
  Search,
  ArrowRight,
} from 'lucide-react';
import { CredentialInspectorModal } from '@/components/vault/credential-inspector-modal';
import { useAppStore } from '@/lib/stores/app';

type PendingCredential = {
  id: string;
  user_id: string;
  document_type: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  notes: string | null;
  created_at: string;
  verification_status: string;
  file_path: string | null;
};

const ALL_FILTER = 'all';

export default function CredentialReviewPage() {
  const [selectedDoc, setSelectedDoc] = useState<PendingCredential | null>(
    null,
  );
  const [docs, setDocs] = useState<PendingCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [docFilter, setDocFilter] = useState(ALL_FILTER);
  const [refreshTick, setRefreshTick] = useState(0);

  const supabase = useMemo(() => createSupabaseClient(), []);
  const orgId = useAppStore((state) => state.organization?.id ?? null);
  const isHydrated = useAppStore((state) => state.isHydrated);

  useEffect(() => {
    let cancelled = false;

    async function fetchQueue() {
      if (!isHydrated) return;
      if (!orgId) {
        setDocs([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('org_credentials')
          .select(
            'id, user_id, document_type, issue_date, expiry_date, notes, created_at, verification_status, file_path',
          )
          .eq('organization_id', orgId)
          .eq('verification_status', 'pending')
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        if (cancelled) return;

        setDocs((data ?? []) as PendingCredential[]);
      } catch (err) {
        if (cancelled) return;
        console.error('[CredentialReviewPage] Failed to load queue:', err);
        setDocs([]);
        setError('Unable to load verification queue right now.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchQueue();

    return () => {
      cancelled = true;
    };
  }, [supabase, isHydrated, orgId, refreshTick]);

  const documentTypes = useMemo(() => {
    const types = new Set<string>();
    for (const doc of docs) {
      if (doc.document_type) {
        types.add(doc.document_type.toLowerCase());
      }
    }
    return Array.from(types).sort();
  }, [docs]);

  const filteredDocs = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return docs.filter((doc) => {
      const normalizedType = (doc.document_type ?? 'unknown').toLowerCase();
      const matchesFilter =
        docFilter === ALL_FILTER || normalizedType === docFilter;
      if (!matchesFilter) return false;

      if (!normalizedQuery) return true;

      const searchableText =
        `${doc.user_id} ${doc.document_type ?? ''}`.toLowerCase();
      return searchableText.includes(normalizedQuery);
    });
  }, [docs, searchQuery, docFilter]);

  function handleCloseModal() {
    setSelectedDoc(null);
    setRefreshTick((value) => value + 1);
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <CredentialInspectorModal
        isOpen={!!selectedDoc}
        onClose={handleCloseModal}
        credential={selectedDoc}
      />

      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">
            Verification Queue
          </h1>
          <p className="text-muted-foreground font-medium mt-1 tracking-tight">
            Audit and approve employee professional credentials for
            organizational compliance.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-sky-500/10 px-4 py-2 rounded-full border border-sky-400/30 shadow-sm">
          <Clock className="h-3.5 w-3.5 text-sky-300" />
          <span className="text-xs font-semibold text-sky-300 uppercase tracking-wider">
            {filteredDocs.length} Items Awaiting Review
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by personnel ID or document type..."
            aria-label="Search documents"
            className="w-full pl-12 pr-4 py-2.5 text-sm font-medium outline-none bg-transparent"
          />
        </div>
        <select
          value={docFilter}
          onChange={(event) => setDocFilter(event.target.value)}
          aria-label="Filter by document type"
          className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold uppercase tracking-wider text-foreground/70"
        >
          <option value={ALL_FILTER}>All Types</option>
          {documentTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="py-24 text-center animate-pulse">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Synchronizing Vault Integrity...
          </p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-24 text-center shadow-sm">
          <div className="h-20 w-20 bg-emerald-400/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-emerald-400/30 shadow-inner">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          </div>
          <h3 className="text-xl font-black text-foreground tracking-tight">
            Vault Fully Verified
          </h3>
          <p className="text-sm text-muted-foreground mt-2 font-medium">
            All staff credentials have been audited and secured.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="group bg-white/5 border border-white/10 rounded-[2.5rem] p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-sm hover:border-glass-border-strong transition-all duration-300"
            >
              <div className="flex items-center gap-5">
                <div className="h-16 w-16 rounded-[1.25rem] bg-glass-strong border border-white/10 flex items-center justify-center text-muted-foreground group-hover:bg-white/20 group-hover:text-foreground transition-all duration-500">
                  <FileText className="h-7 w-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-foreground tracking-tight">
                      {doc.document_type ?? 'Document'}
                    </p>
                    <span className="px-2 py-0.5 bg-sky-500/10 text-sky-300 rounded-md text-xs font-semibold uppercase tracking-wide border border-sky-400/30">
                      Intake Node: USR-{doc.user_id.slice(0, 8)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <Calendar className="h-3.5 w-3.5" />
                      Expires: {doc.expiry_date || 'Continuous'}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <Activity className="h-3.5 w-3.5" />
                      Submitted: {new Date(doc.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedDoc(doc)}
                  className="flex items-center gap-2 px-8 py-4 bg-glass-strong text-foreground rounded-2xl text-xs font-semibold uppercase tracking-wider hover:bg-white/20 transition-all shadow-xl active:scale-95"
                >
                  <Eye className="h-4 w-4" />
                  Inspect & Verify
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-glass-strong rounded-[2.5rem] p-10 text-foreground flex flex-col md:flex-row md:items-center md:justify-between gap-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="flex items-start gap-6 relative z-10">
          <div className="h-12 w-12 rounded-2xl bg-glass-strong flex items-center justify-center text-blue-400 border border-white/10 backdrop-blur-md">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="max-w-xl">
            <h4 className="text-sm font-black uppercase tracking-wider text-blue-400">
              Non-Repudiation Policy
            </h4>
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed font-medium uppercase tracking-wider">
              By verifying a document, you confirm visual inspection against
              staff data. This action is permanently tethered to your session
              audit trail.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Activity({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
