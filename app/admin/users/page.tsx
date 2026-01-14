import { getAdminFetchConfig } from "@/app/admin/lib";
import { UserActionButtons } from "@/app/admin/components/user-action-buttons";
import { Mail, Building2, Shield, Clock } from "lucide-react";

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
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

async function fetchUsers(query?: string, page?: string) {
  const { base, headers } = await getAdminFetchConfig();
  const params = new URLSearchParams();
  if (query) params.set("query", query);
  if (page) params.set("page", page);
  const res = await fetch(`${base}/api/admin/users?${params.toString()}`, {
    cache: "no-store",
    headers,
  });
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Users</h1>
        <p className="mt-2 text-sm text-slate-400">
          Manage platform users and account access
        </p>
      </div>

      {/* Search */}
      <form className="flex items-center gap-2">
        <input
          name="query"
          defaultValue={resolved?.query ?? ""}
          placeholder="Search by email or name"
          className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-slate-600 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg border border-slate-800 bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700/50"
        >
          Search
        </button>
      </form>

      {/* Table */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80">
                <th className="px-6 py-3 text-left font-semibold text-slate-300">
                  User
                </th>
                <th className="px-6 py-3 text-left font-semibold text-slate-300">
                  Organization
                </th>
                <th className="px-6 py-3 text-left font-semibold text-slate-300">
                  Role
                </th>
                <th className="px-6 py-3 text-left font-semibold text-slate-300">
                  Provider
                </th>
                <th className="px-6 py-3 text-left font-semibold text-slate-300">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left font-semibold text-slate-300">
                  Status
                </th>
                <th className="px-6 py-3 text-right font-semibold text-slate-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {rows.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-slate-700 flex items-center justify-center">
                        <Mail className="h-4 w-4 text-slate-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-100">
                          {user.email.split("@")[0]}
                        </div>
                        <div className="text-xs text-slate-500">
                          {user.email.split("@")[1]}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Building2 className="h-4 w-4 text-slate-500" />
                      {user.organization || "—"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-slate-500" />
                      <span className="text-slate-300 capitalize">
                        {user.role}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-400">{user.provider}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="h-4 w-4 text-slate-600" />
                      {formatDate(user.last_sign_in_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        user.email_confirmed
                          ? "bg-emerald-500/10 text-emerald-300"
                          : "bg-amber-500/10 text-amber-300"
                      }`}
                    >
                      {user.email_confirmed ? "Verified" : "Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <UserActionButtons userId={user.id} />
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Mail className="h-8 w-8 opacity-20" />
                      <p>No users found</p>
                    </div>
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
