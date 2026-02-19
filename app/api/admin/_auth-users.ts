import { createSupabaseAdminClient } from '@/lib/supabase/admin';

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;

type FetchOptions = {
  perPage?: number;
  maxPages?: number;
};

/**
 * Supabase Admin API has no batch get-by-id endpoint.
 * This scans paginated auth users and stops as soon as all target ids are resolved.
 */
export async function fetchAuthEmailsByIds(
  admin: AdminClient,
  userIds: string[],
  options: FetchOptions = {},
): Promise<Map<string, string>> {
  const uniqueIds = Array.from(
    new Set(userIds.map((id) => id.trim()).filter(Boolean)),
  );
  const emails = new Map<string, string>();

  if (!uniqueIds.length) {
    return emails;
  }

  const remaining = new Set(uniqueIds);
  const perPage = Math.min(Math.max(options.perPage ?? 200, 1), 1000);
  const maxPages = Math.max(options.maxPages ?? 25, 1);
  let page = 1;

  while (remaining.size > 0 && page <= maxPages) {
    const { data, error } = await (admin as any).auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      break;
    }

    const users = data?.users ?? [];
    users.forEach((candidate: any) => {
      const id = String(candidate?.id ?? '');
      if (!id || !remaining.has(id)) return;
      emails.set(id, candidate?.email ?? 'N/A');
      remaining.delete(id);
    });

    if (users.length < perPage) {
      break;
    }

    const total = Number(data?.total ?? 0);
    const totalPages = total > 0 ? Math.ceil(total / perPage) : maxPages;
    page += 1;
    if (page > totalPages) {
      break;
    }
  }

  return emails;
}
