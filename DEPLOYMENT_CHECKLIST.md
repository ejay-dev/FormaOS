# FormaOS Production Deployment Checklist

Use this checklist before deploying FormaOS to production.

---

## 📋 Pre-Deployment Checklist

### 1. Database Setup

- [ ] **Run all migrations in order**
  ```bash
  # Ensure migrations are applied in correct order
  # Check supabase/migrations/ directory
  ```

- [ ] **Verify trial columns exist**
  ```sql
  SELECT column_name 
  FROM information_schema.columns 
  WHERE table_name = 'org_subscriptions' 
  AND column_name IN ('trial_started_at', 'trial_expires_at', 'price_id');
  ```
  Should return 3 rows.

- [ ] **Verify RLS policies are enabled**
  ```sql
  SELECT tablename, rowsecurity 
  FROM pg_tables 
  WHERE schemaname = 'public' 
  AND tablename IN ('organizations', 'org_members', 'org_subscriptions');
  ```
  All should have `rowsecurity = true`.

### 2. Environment Variables

Copy `.env.example` to `.env.local` (or configure in Vercel) and set:

#### Required Core Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (NEVER expose as NEXT_PUBLIC_)
- [ ] `NEXT_PUBLIC_APP_URL` - https://app.formaos.com.au
- [ ] `NEXT_PUBLIC_SITE_URL` - https://formaos.com.au

#### Required for Billing
- [ ] `STRIPE_SECRET_KEY` - Stripe secret key (sk_live_...)
- [ ] `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret (whsec_...)
- [ ] `STRIPE_PRICE_BASIC` - Stripe price ID for Basic plan
- [ ] `STRIPE_PRICE_PRO` - Stripe price ID for Pro plan
- [ ] `STRIPE_PRICE_ENTERPRISE` - (Optional) Stripe price ID for Enterprise

#### Required for Email
- [ ] `RESEND_API_KEY` - Resend API key
- [ ] `RESEND_FROM_EMAIL` - Verified sender email (e.g., noreply@formaos.com.au)

#### Required for Admin Access
- [ ] `FOUNDER_EMAILS` - Comma-separated founder emails
- [ ] `FOUNDER_USER_IDS` - (Optional) Comma-separated Supabase user IDs

### 3. Supabase Configuration

- [ ] **Enable Email Auth**
  - Go to Authentication > Providers
  - Enable Email provider
  - Configure email templates

- [ ] **Configure Google OAuth**
  - Go to Authentication > Providers
  - Enable Google provider
  - Add authorized redirect URLs:
    - `https://app.formaos.com.au/auth/callback`
    - `https://formaos.com.au/auth/callback`

- [ ] **Set Site URL**
  - Go to Authentication > URL Configuration
  - Site URL: `https://formaos.com.au`
  - Redirect URLs: Add both app and site domains

- [ ] **Configure Email Templates**
  - Confirmation email
  - Password reset email
  - Magic link email (if used)

### 4. Stripe Configuration

- [ ] **Create Products and Prices**
  - Basic plan: $399/month
  - Pro plan: $1,200/month
  - Enterprise: Custom pricing

- [ ] **Configure Webhook**
  - Endpoint URL: `https://app.formaos.com.au/api/billing/webhook`
  - Events to listen for:
    - `checkout.session.completed`
    - `customer.subscription.created`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
    - `invoice.paid`
    - `invoice.payment_failed`
  - Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

- [ ] **Test Webhook**
  ```bash
  stripe listen --forward-to localhost:3000/api/billing/webhook
  ```

### 5. DNS & Domain Configuration

- [ ] **Configure DNS Records**
  ```
  formaos.com.au        A/CNAME  -> Vercel
  app.formaos.com.au    A/CNAME  -> Vercel
  ```

- [ ] **SSL Certificates**
  - Verify SSL is active for both domains
  - Check certificate validity

- [ ] **Verify Domain Routing**
  - Test: https://formaos.com.au (marketing site)
  - Test: https://app.formaos.com.au (app)
  - Ensure no redirects to vercel.app

### 6. Email Configuration (Resend)

- [ ] **Verify Domain**
  - Add DNS records for email verification
  - Verify domain in Resend dashboard

- [ ] **Test Email Sending**
  ```bash
  # Test from your app or use Resend dashboard
  ```

### 7. Security Checks

- [ ] **Verify no secrets in client bundle**
  ```bash
  npm run build
  # Check .next/static for any exposed secrets
  ```

- [ ] **Verify service role key is server-only**
  - Search codebase for `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`
  - Should return 0 results

- [ ] **Test RLS policies**
  - Create test user
  - Verify they can only access their org data
  - Verify admin routes are protected

- [ ] **Test founder access**
  - Try accessing /admin without founder email
  - Should redirect to /app

### 8. Functional Testing

#### Auth Flow
- [ ] Sign up with email/password
- [ ] Confirm email (if enabled)
- [ ] Sign in with email/password
- [ ] Sign up with Google OAuth
- [ ] Sign in with Google OAuth
- [ ] Password reset flow
- [ ] Session persistence across refresh

#### Onboarding Flow
- [ ] New user lands on onboarding
- [ ] Can select plan
- [ ] Can complete all onboarding steps
- [ ] Redirects to dashboard when complete

#### Billing Flow
- [ ] Trial is created (14 days)
- [ ] Can access dashboard during trial
- [ ] Stripe checkout works
- [ ] Webhook updates subscription status
- [ ] Trial expiration blocks access
- [ ] Billing page shows correct status

#### Admin Console
- [ ] Founder can access /admin
- [ ] Can view all organizations
- [ ] Can view all users
- [ ] Can manage subscriptions
- [ ] Non-founder cannot access

### 9. Performance & Monitoring

- [ ] **Set up error tracking** (e.g., Sentry)
- [ ] **Set up analytics** (if applicable)
- [ ] **Configure logging**
- [ ] **Set up uptime monitoring**

### 10. Final Verification

- [ ] Run environment validation:
  ```bash
  npm run build
  # Check console for environment warnings
  ```

- [ ] Test complete user journey:
  1. Sign up → Onboarding → Trial → Dashboard
  2. Trial expiration → Billing page
  3. Stripe checkout → Active subscription
  4. Access dashboard with active subscription

- [ ] Verify all critical paths work:
  - [ ] Marketing site loads
  - [ ] Sign up works
  - [ ] Sign in works
  - [ ] OAuth works
  - [ ] Dashboard loads
  - [ ] Billing page works
  - [ ] Admin console works (for founders)

---

## 🚀 Deployment Steps

### Vercel Deployment

1. **Connect Repository**
   ```bash
   vercel link
   ```

2. **Configure Environment Variables**
   - Go to Vercel dashboard
   - Project Settings > Environment Variables
   - Add all variables from checklist above
   - Set for Production environment

3. **Configure Domains**
   - Add `formaos.com.au`
   - Add `app.formaos.com.au`
   - Verify DNS configuration

4. **Deploy**
   ```bash
   vercel --prod
   ```

5. **Verify Deployment**
   - Check build logs for errors
   - Test both domains
   - Verify environment variables are loaded

---

## 🔍 Post-Deployment Verification

- [ ] Visit https://formaos.com.au - marketing site loads
- [ ] Visit https://app.formaos.com.au - redirects to signin
- [ ] Sign up flow works end-to-end
- [ ] OAuth callback works correctly
- [ ] Trial is created automatically
- [ ] Dashboard is accessible
- [ ] Billing page works
- [ ] Stripe webhooks are received
- [ ] Emails are sent successfully
- [ ] Admin console is accessible (founders only)

---

## 🆘 Troubleshooting

### Issue: "Database error saving new user"
- **Cause:** Missing `SUPABASE_SERVICE_ROLE_KEY`
- **Fix:** Add service role key to environment variables

### Issue: "Trial not working"
- **Cause:** Missing trial columns in database
- **Fix:** Run migration `20250318_fix_trial_columns.sql`

### Issue: "OAuth redirects to wrong domain"
- **Cause:** Incorrect `NEXT_PUBLIC_APP_URL`
- **Fix:** Set to `https://app.formaos.com.au`

### Issue: "Stripe webhook not working"
- **Cause:** Incorrect webhook secret or URL
- **Fix:** Verify webhook endpoint and secret in Stripe dashboard

### Issue: "Cannot access admin console"
- **Cause:** `FOUNDER_EMAILS` not set or incorrect
- **Fix:** Add your email to `FOUNDER_EMAILS` environment variable

---

## 📞 Support

If you encounter issues during deployment:
1. Check the logs in Vercel dashboard
2. Review `PRODUCTION_AUDIT_REPORT.md`
3. Verify all environment variables are set
4. Test locally first with production env vars

---

**Last Updated:** 2024
**Version:** 1.0.0
