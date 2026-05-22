-- 20260209_add_theme_preference.sql
-- Adds theme_preference column to user_profiles for persisting user's chosen theme.
-- Values: 'dark' (default), 'light-premium', 'midnight-ink', 'graphite', 'champagne', 'aurora'

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name = 'theme_preference'
  ) THEN
    ALTER TABLE public.user_profiles
      ADD COLUMN theme_preference text NOT NULL DEFAULT 'dark';
  END IF;
END $$;

-- Drop old constraint if it exists (may have fewer values)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND constraint_name = 'user_profiles_theme_preference_check'
  ) THEN
    ALTER TABLE public.user_profiles
      DROP CONSTRAINT user_profiles_theme_preference_check;
  END IF;
END $$;

-- Add check constraint with all valid theme values
ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_theme_preference_check
  CHECK (theme_preference IN ('dark', 'light-premium', 'midnight-ink', 'graphite', 'champagne', 'aurora'));
