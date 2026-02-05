import { getAdminFetchConfig } from '@/app/admin/lib';

type SupportRow = {
  id: string;
  email: string;
  name: string | null;
  subject: string;
  message: string;
  status: string;
  created_at: string;
};

function formatDate(value?: string | null) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString();
}

async function fetchSupport(status?: string) {
  const { base, headers } = await getAdminFetchConfig();
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  const res = await fetch(`${base}/api/admin/support?${params.toString()}`, {
    cache: 'no-store',
    headers,
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const resolved = await searchParams;
  const data = await fetchSupport(resolved?.status);
  const rows: SupportRow[] = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Support</h1>
        <p className="mt-2 text-sm text-slate-400">
          Inbound requests and contact queue.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2">Requester</th>
                <th className="py-2">Subject</th>
                <th className="py-2">Status</th>
                <th className="py-2">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="py-3">
                    <div className="text-slate-100">
                      {row.name ?? row.email}
                    </div>
                    <div className="text-xs text-slate-500">{row.email}</div>
                  </td>
                  <td className="py-3">
                    <div className="text-slate-100">{row.subject}</div>
                    <div className="text-xs text-slate-500 line-clamp-2">
                      {row.message}
                    </div>
                  </td>
                  <td className="py-3">{row.status}</td>
                  <td className="py-3">{formatDate(row.created_at)}</td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-6 text-center text-sm text-slate-500"
                  >
                    No support requests logged.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
