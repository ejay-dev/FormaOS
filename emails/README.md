# FormaOS Auth Email Templates

Branded HTML email templates for Supabase Auth. Paste each file into the corresponding template in the Supabase Dashboard → Authentication → Templates.

Variables used:

- `{{ .ActionLink }}`: The link users should click (works for confirmation, magic link, password reset, and invitation)
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
- If your GoTrue version expects different variables (e.g., `{{ .ConfirmationURL }}`), replace `{{ .ActionLink }}` with the required variable.
- OTP-oriented templates use `{{ .Token }}`.
- Ensure SMTP is correctly configured in Supabase (Resend SMTP) and that `RESEND_API_KEY` is set in both Vercel and Supabase.
