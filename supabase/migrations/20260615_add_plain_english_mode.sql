-- Add plain_english_mode preference to user_profiles
-- Default: true (new users see plain-English labels)
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS plain_english_mode boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.user_profiles.plain_english_mode
  IS 'When true, regulator jargon is translated to plain English across the UI';
