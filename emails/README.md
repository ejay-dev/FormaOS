# FormaOS Auth Email Templates

Branded HTML email templates for Supabase Auth. Paste each file into the corresponding template in the Supabase Dashboard → Authentication → Templates.

Variables used:

- `{{ .SiteURL }}`: Auth site URL from Supabase settings (set to `https://app.formaos.com.au`)
- `{{ .TokenHash }}`: Token hash for first-party verification links
- `{{ .ActionLink }}`: Legacy/fallback action link variable
- `{{ .CurrentYear }}`: Convenience year variable (optional; if unsupported in your project, replace statically)

Templates provided:

- emails/auth/signup-confirmation.html → "Confirm signup"
- emails/auth/password-reset.html → "Reset password"
- emails/auth/magic-link.html → "Magic link"
- emails/auth/invite-user.html → "Invite user"
- emails/auth/change-email.html → "Change email address"
- emails/auth/email-otp.html → "Email OTP"
- emails/auth/reauthentication.html → "Reauthentication"

Notes:

- These templates remove all third‑party branding and are aligned to FormaOS.
- Confirm signup and magic-link templates intentionally use first-party links:
  - `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup`
  - `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink`
- If `TokenHash` is unavailable in your GoTrue version, use fallback wrapping:
  - `{{ .SiteURL }}/auth/confirm?confirmation_url={{ .ConfirmationURL | urlquery }}`
- OTP-oriented templates use `{{ .Token }}`.
- Ensure SMTP is correctly configured in Supabase (Resend SMTP) and that `RESEND_API_KEY` is set in both Vercel and Supabase.
