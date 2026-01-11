import Link from "next/link";
import { getAdminFetchConfig } from "@/app/admin/lib";

type OrgRow = {
  id: string;
  name: string | null;
  owner_email: string;
  plan_key: string | null;
  status: string;
  created_at: string | null;
  trial_expires_at: string | null;
};

async function fetchOrganizations(query?: string, page?: string) {
  const { base, headers } = await getAdminFetchConfig();
  const params = new URLSearchParams();
  if (query) params.set("query", query);
  if (page) params.set("page", page);

  const res = await fetch(`${base}/api/admin/orgs?${params.toString()}`, {
    cache: "no-store",
    headers,
  });
  if (!res.ok) return null;
  return res.json();
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

export default async function AdminOrgsPage({
  searchParams,
}: {
  searchParams?: Promise<{ query?: string; page?: string }>;
}) {
  const resolved = await searchParams;
  const data = await fetchOrganizations(resolved?.query, resolved?.page);
  const rows: OrgRow[] = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Organizations</h1>
          <p className="mt-2 text-sm text-slate-400">Manage plan status, trials, and org access.</p>
        </div>
          <form className="flex items-center gap-2" action="/admin/orgs" method="get">
          <input
            name="query"
            defaultValue={resolved?.query ?? ""}
            placeholder="Search orgs"
            className="rounded-lg border border-white/10 bg-[hsl(var(--card))] px-3 py-2 text-sm text-slate-200"
          />
          <button
            type="submit"
            className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/5"
          >
            Search
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2">Organization</th>
                <th className="py-2">Owner</th>
                <th className="py-2">Plan</th>
                <th className="py-2">Status</th>
                <th className="py-2">Trial Ends</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((org) => (
                <tr key={org.id}>
                  <td className="py-3 font-semibold text-slate-100">{org.name ?? "—"}</td>
                  <td className="py-3">{org.owner_email}</td>
                  <td className="py-3">{org.plan_key ?? "—"}</td>
                  <td className="py-3">{org.status}</td>
                  <td className="py-3">{formatDate(org.trial_expires_at)}</td>
                  <td className="py-3">
                    <div className="flex flex-col gap-2">
                      <Link href={`/admin/orgs/${org.id}`} className="text-xs text-sky-300">
                        View org
                      </Link>
                      <form method="post" action={`/api/admin/orgs/${org.id}/plan`} className="flex items-center gap-2">
                        <select
                          name="plan"
                          defaultValue={org.plan_key ?? "basic"}
                          className="rounded-lg border border-white/10 bg-[hsl(var(--card))] px-2 py-1 text-xs text-slate-200"
                        >
                          <option value="basic">Starter</option>
                          <option value="pro">Pro</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                        <button
                          type="submit"
                          className="rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-200 hover:bg-white/5"
                        >
                          Update plan
                        </button>
                      </form>
                      <form
                        method="post"
                        action={`/api/admin/orgs/${org.id}/trial/extend`}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="number"
                          name="days"
                          min={1}
                          max={90}
                          defaultValue={14}
                          className="w-16 rounded-lg border border-white/10 bg-[hsl(var(--card))] px-2 py-1 text-xs text-slate-200"
                        />
                        <button
                          type="submit"
                          className="rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-200 hover:bg-white/5"
                        >
                          Extend trial
                        </button>
                      </form>
                      <form method="post" action={`/api/admin/orgs/${org.id}/lock`}>
                        <input type="hidden" name="locked" value={org.status !== "blocked" ? "true" : "false"} />
                        <button
                          type="submit"
                          className="rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-200 hover:bg-white/5"
                        >
                          {org.status === "blocked" ? "Unblock" : "Block"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-sm text-slate-500">
                    No organizations found.
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
