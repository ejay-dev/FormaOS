'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Save theme preference to user_profiles.
 * Called client-side after theme switch.
 */
const VALID_THEMES = [
  'dark',
  'light-premium',
  'midnight-ink',
  'graphite',
  'champagne',
  'aurora',
];

export async function saveThemePreference(theme: string) {
  if (!VALID_THEMES.includes(theme)) return;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase
      .from('user_profiles')
      .update({ theme_preference: theme })
      .eq('user_id', user.id);
  } catch (err) {
    // Non-critical — localStorage is the primary persistence
    console.error('[saveThemePreference] Failed:', err);
  }
}

/**
 * Load theme preference from user_profiles.
 * Called server-side during layout render to set initial theme.
 */
export async function loadThemePreference(): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data } = await supabase
      .from('user_profiles')
      .select('theme_preference')
      .eq('user_id', user.id)
      .maybeSingle();

    return data?.theme_preference ?? null;
  } catch {
    return null;
  }
}
