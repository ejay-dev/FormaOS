import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export interface AdminProfileDirectoryEntry {
  userId: string;
  email: string | null;
  fullName: string | null;
  avatarPath: string | null;
}

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;

export async function findAuthUserByEmail(
  email: string,
  admin: AdminClient = createSupabaseAdminClient(),
) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return null;
  }

  const { data } = await admin.auth.admin.listUsers();
  return (
    data?.users?.find(
      (user: { email?: string | null }) =>
        user.email?.toLowerCase() === normalizedEmail,
    ) ?? null
  );
}

export async function getAdminProfileDirectoryEntries(
  userIds: string[],
  admin: AdminClient = createSupabaseAdminClient(),
): Promise<AdminProfileDirectoryEntry[]> {
  const uniqueUserIds = Array.from(
    new Set(
      userIds
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  );

  if (!uniqueUserIds.length) {
    return [];
  }

  const { data: profiles } = await admin
    .from('user_profiles')
    .select('user_id, full_name, avatar_path')
    .in('user_id', uniqueUserIds);

  const emailEntries = await Promise.all(
    uniqueUserIds.map(async (userId) => {
      const { data } = await admin.auth.admin.getUserById(userId);
      return [userId, data.user?.email ?? null] as const;
    }),
  );

  const emailByUserId = new Map(emailEntries);
  const profileByUserId = new Map(
    (profiles ?? []).map((profile) => [
      profile.user_id as string,
      {
        fullName:
          (profile.full_name as string | null | undefined)?.trim() || null,
        avatarPath:
          (profile.avatar_path as string | null | undefined)?.trim() || null,
      },
    ]),
  );

  return uniqueUserIds.map((userId) => {
    const profile = profileByUserId.get(userId);
    return {
      userId,
      email: emailByUserId.get(userId) ?? null,
      fullName: profile?.fullName ?? null,
      avatarPath: profile?.avatarPath ?? null,
    };
  });
}
