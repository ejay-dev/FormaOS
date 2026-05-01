'use client';

import { useEffect, useMemo, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';

export interface CurrentUserAvatar {
  displayName: string | null;
  avatarUrl: string | null;
}

export function useCurrentUserAvatar(
  userId: string | null | undefined,
): CurrentUserAvatar {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!userId) {
      setDisplayName(null);
      setAvatarUrl(null);
      return;
    }

    (async () => {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name, avatar_path')
        .eq('user_id', userId)
        .maybeSingle();

      if (!mounted) return;
      setDisplayName(profile?.full_name ?? null);

      if (profile?.avatar_path) {
        const { data: signed } = await supabase.storage
          .from('user-avatars')
          .createSignedUrl(profile.avatar_path, 60 * 60 * 12);
        if (!mounted) return;
        setAvatarUrl(signed?.signedUrl ?? null);
      } else {
        setAvatarUrl(null);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [supabase, userId]);

  return { displayName, avatarUrl };
}
