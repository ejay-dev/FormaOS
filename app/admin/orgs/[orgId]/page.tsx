import Link from 'next/link';
import { getAdminFetchConfig } from '@/app/admin/lib';
import { AddNoteForm } from '@/app/admin/components/add-note-form';

type OrgDetailProps = {
  params: Promise<{ orgId: string }>;
};

function formatDate(value?: string | null) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString();
}

async function fetchOrgDetail(orgId: string) {
  const { base, headers } = await getAdminFetchConfig();
  const res = await fetch(`${base}/api/admin/orgs/${orgId}`, {
    cache: 'no-store',
    headers,
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function AdminOrgDetailPage({ params }: OrgDetailProps) {
  const { orgId } = await params;
  const data = await fetchOrgDetail(orgId);

  if (!data?.organization) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Organization not found.
      </div>
    );
  }

  const organization = data.organization;
  const subscription = data.subscription;
  const members = data.members ?? [];
  const notes = data.notes ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {organization.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Organization details and operational notes.
          </p>
        </div>
        <Link
          href="/admin/orgs"
          className="text-sm text-sky-300 hover:text-sky-200"
        >
          Back to orgs
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Plan
          </div>
          <div className="mt-2 text-lg font-semibold text-foreground">
            {organization.plan_key ?? 'N/A'}
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Created {formatDate(organization.created_at)}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Subscription
          </div>
          <div className="mt-2 text-lg font-semibold text-foreground">
            {subscription?.status ?? 'N/A'}
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Trial ends{' '}
            {formatDate(
              subscription?.trial_expires_at ??
                subscription?.current_period_end,
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-xl font-semibold text-foreground">Members</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm text-muted-foreground">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2">Email</th>
                <th className="py-2">Role</th>
                <th className="py-2">Added</th>
                <th className="py-2">Last Login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((member: any) => (
                <tr key={member.user_id}>
                  <td className="py-3">{member.email}</td>
                  <td className="py-3">{member.role}</td>
                  <td className="py-3">{formatDate(member.created_at)}</td>
                  <td className="py-3">{formatDate(member.last_sign_in_at)}</td>
                </tr>
              ))}
              {members.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-6 text-center text-sm text-muted-foreground"
                  >
                    No members found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-xl font-semibold text-foreground">Internal Notes</h2>
        <AddNoteForm orgId={orgId} />
        <div className="mt-6 space-y-3 text-sm text-muted-foreground">
          {notes.map((note: any) => (
            <div
              key={note.id}
              className="rounded-xl border border-border bg-[hsl(var(--card))] p-4"
            >
              <div className="text-xs text-muted-foreground">
                {formatDate(note.created_at)}
              </div>
              <div className="mt-2 text-sm text-foreground">{note.note}</div>
            </div>
          ))}
          {notes.length === 0 ? (
            <div className="text-sm text-muted-foreground">No notes yet.</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
