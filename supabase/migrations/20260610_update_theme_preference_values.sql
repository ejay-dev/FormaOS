-- 20260610_update_theme_preference_values.sql
-- Updates theme_preference constraint for new 5-theme system.
-- Old: dark, light-premium, midnight-ink, graphite, champagne, aurora
-- New: dark, midnight-blue, graphite, light, aurora

-- Migrate old theme values to new equivalents
UPDATE public.user_profiles SET theme_preference = 'light' WHERE theme_preference = 'light-premium';
UPDATE public.user_profiles SET theme_preference = 'midnight-blue' WHERE theme_preference = 'midnight-ink';
UPDATE public.user_profiles SET theme_preference = 'dark' WHERE theme_preference = 'champagne';

-- Drop old constraint
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

-- Add updated check constraint
ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_theme_preference_check
  CHECK (theme_preference IN ('dark', 'midnight-blue', 'graphite', 'light', 'aurora'));
