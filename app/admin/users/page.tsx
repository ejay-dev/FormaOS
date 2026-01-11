import { getAdminApiBase } from "@/app/admin/lib";

type UserRow = {
  id: string;
  email: string;
  provider: string;
  email_confirmed: boolean;
  last_sign_in_at: string | null;
  role: string;
  organization: string;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

async function fetchUsers(query?: string, page?: string) {
  const base = await getAdminApiBase();
  const params = new URLSearchParams();
  if (query) params.set("query", query);
  if (page) params.set("page", page);
  const res = await fetch(`${base}/api/admin/users?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: Promise<{ query?: string; page?: string }>;
}) {
  const resolved = await searchParams;
  const data = await fetchUsers(resolved?.query, resolved?.page);
  const rows: UserRow[] = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Users</h1>
          <p className="mt-2 text-sm text-slate-400">Manage user access and account status.</p>
        </div>
        <form className="flex items-center gap-2" action="/admin/users" method="get">
          <input
            name="query"
            defaultValue={resolved?.query ?? ""}
            placeholder="Search email"
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
                <th className="py-2">Email</th>
                <th className="py-2">Provider</th>
                <th className="py-2">Org</th>
                <th className="py-2">Role</th>
                <th className="py-2">Last Login</th>
                <th className="py-2">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((user) => (
                <tr key={user.id}>
                  <td className="py-3">{user.email}</td>
                  <td className="py-3">{user.provider}</td>
                  <td className="py-3">{user.organization}</td>
                  <td className="py-3">{user.role}</td>
                  <td className="py-3">{formatDate(user.last_sign_in_at)}</td>
                  <td className="py-3">{user.email_confirmed ? "confirmed" : "pending"}</td>
                  <td className="py-3">
                    <div className="flex flex-col gap-2">
                      <form method="post" action={`/api/admin/users/${user.id}/lock`}>
                        <input type="hidden" name="locked" value="true" />
                        <button
                          type="submit"
                          className="rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-200 hover:bg-white/5"
                        >
                          Lock
                        </button>
                      </form>
                      <form method="post" action={`/api/admin/users/${user.id}/lock`}>
                        <input type="hidden" name="locked" value="false" />
                        <button
                          type="submit"
                          className="rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-200 hover:bg-white/5"
                        >
                          Unlock
                        </button>
                      </form>
                      <form method="post" action={`/api/admin/users/${user.id}/resend-confirmation`}>
                        <button
                          type="submit"
                          className="rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-200 hover:bg-white/5"
                        >
                          Resend confirmation
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-sm text-slate-500">
                    No users found.
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
