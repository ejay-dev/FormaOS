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
import {
  getOrgMemberIdentities,
  type MemberIdentityMap,
} from '@/lib/team/member-identity';
import { useAppStore } from '@/lib/stores/app';

type PendingCredential = {
  id: string;
  user_id: string;
  document_type: string | null;
  issue_date: string | null;
  expiry_date: string | null;
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
  const [identities, setIdentities] = useState<MemberIdentityMap>({});
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
        setIdentities({});
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [{ data, error: fetchError }, identityMap] = await Promise.all([
          supabase
            .from('org_credentials')
            .select(
              'id, user_id, document_type, issue_date, expiry_date, created_at, verification_status, file_path',
            )
            .eq('organization_id', orgId)
            .eq('verification_status', 'pending')
            .order('created_at', { ascending: false }),
          getOrgMemberIdentities(),
        ]);

        if (fetchError) throw fetchError;
        if (cancelled) return;

        setDocs((data ?? []) as PendingCredential[]);
        setIdentities(identityMap);
      } catch (err) {
        if (cancelled) return;
        console.error('[CredentialReviewPage] Failed to load queue:', err);
        setDocs([]);
        setIdentities({});
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

      const identity = identities[doc.user_id];
      const searchableText =
        `${identity?.name ?? ''} ${identity?.email ?? ''} ${doc.document_type ?? ''}`.toLowerCase();
      return searchableText.includes(normalizedQuery);
    });
  }, [docs, identities, searchQuery, docFilter]);

  function handleCloseModal() {
    setSelectedDoc(null);
    setRefreshTick((value) => value + 1);
  }

  return (
    <div className="flex flex-col h-full">
      <CredentialInspectorModal
        isOpen={!!selectedDoc}
        onClose={handleCloseModal}
        credential={selectedDoc}
        staffName={
          selectedDoc ? (identities[selectedDoc.user_id]?.name ?? null) : null
        }
      />

      <div className="page-header">
        <div>
          <h1 className="page-title">Verification queue</h1>
          <p className="page-description">
            Review and approve staff credentials before they count as evidence.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {filteredDocs.length} awaiting review
        </span>
      </div>

      <div className="page-content space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by staff name or document type"
            aria-label="Search documents"
            className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            enterKeyHint="search"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
        <select
          value={docFilter}
          onChange={(event) => setDocFilter(event.target.value)}
          aria-label="Filter by document type"
          className="h-9 rounded-md border border-border bg-background px-2 text-xs text-foreground"
        >
          <option value={ALL_FILTER}>All types</option>
          {documentTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-success opacity-70" />
          <p className="mt-3 text-sm font-medium text-foreground">
            All credentials reviewed
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            New submissions appear here for review.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/30 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {doc.document_type ?? 'Document'}
                    </p>
                    <span className="text-sm text-muted-foreground">
                      {identities[doc.user_id]?.name ?? 'Unknown member'}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      Expires{' '}
                      {doc.expiry_date
                        ? new Date(doc.expiry_date).toLocaleDateString()
                        : 'no expiry'}
                    </span>
                    <span>
                      Submitted{' '}
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedDoc(doc)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Eye className="h-3.5 w-3.5" />
                Inspect and verify
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Verifying a document confirms you checked it against the staff
          record. The verification is recorded in the audit trail under your
          name.
        </p>
      </div>
      </div>
    </div>
  );
}
