# 🔐 FormaOS Environment Variables Reference

**Last Updated:** February 7, 2026

---

## 📋 REQUIRED ENVIRONMENT VARIABLES

### Application URLs

```env
# Production URLs (CRITICAL - Must match exactly)
NEXT_PUBLIC_APP_URL=https://app.formaos.com.au
NEXT_PUBLIC_SITE_URL=https://formaos.com.au

# Development URLs (local only)
# NEXT_PUBLIC_APP_URL=http://localhost:3000
# NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Purpose:** Core application domain configuration  
**Usage:** Auth callbacks, redirects, cookie domains  
**Required:** ✅ Yes  
**Validation:** Must be valid HTTPS URLs in production

---

### Supabase Configuration

```env
# Supabase Project URL
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-id].supabase.co

# Supabase Anonymous Key (Public - safe to expose)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Service Role Key (SECRET - Admin access)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Purpose:** Database and authentication backend  
**Usage:** All database queries, auth, storage  
**Required:** ✅ Yes (all 3)  
**Security:**

- Anon key: Public (limited by RLS)
- Service key: **SECRET** (bypasses RLS, admin only)

**Where to find:**

1. Go to Supabase Dashboard
2. Settings > API
3. Copy Project URL and keys

---

### Founder Access Control

```env
# Founder Email Addresses (comma-separated)
FOUNDER_EMAILS=ejazhussaini313@gmail.com,admin@formaos.com.au

# Founder User IDs (comma-separated, optional but recommended)
FOUNDER_USER_IDS=uuid-1,uuid-2
```

**Purpose:** Admin panel access control  
**Usage:** `/admin` route protection via middleware  
**Required:** ✅ Yes (at least FOUNDER_EMAILS)  
**Format:** Comma-separated list, no spaces

**How to get User IDs:**

1. Sign up with founder email
2. Query Supabase: `SELECT id FROM auth.users WHERE email = 'founder@email.com'`
3. Add UUID to FOUNDER_USER_IDS

---

### Stripe Configuration (Billing)

```env
# Stripe Secret Key (SECRET)
STRIPE_SECRET_KEY=sk_live_...

# Stripe Webhook Secret (SECRET)
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (from Stripe Dashboard > Products)
STRIPE_BASIC_PRICE_ID=price_1234...
STRIPE_PRO_PRICE_ID=price_5678...
STRIPE_ENTERPRISE_PRICE_ID=price_9012...
```

**Purpose:** Payment processing and subscription management  
**Usage:** Checkout, webhooks, subscription sync  
**Required:** ✅ Yes (all 5)  
**Security:** All are **SECRET** - never expose

**Where to find:**

1. Stripe Dashboard > Developers > API Keys
2. Copy Secret Key (not Publishable Key)
3. Dashboard > Products > Create products
4. Copy Price IDs for each plan
5. Webhooks > Add endpoint > Copy signing secret

---

## 🔧 OPTIONAL ENVIRONMENT VARIABLES

### Email Service (if using Resend/SendGrid)

```env
# Resend API Key
RESEND_API_KEY=re_...

# Or SendGrid API Key
SENDGRID_API_KEY=SG...

# From email address
EMAIL_FROM=noreply@formaos.com.au
```

**Purpose:** Transactional emails (optional)  
**Usage:** Welcome emails, notifications, password resets  
**Required:** ❌ Optional  
**Note:** Supabase handles auth emails by default

---

### Analytics & Monitoring (optional)

```env
# Sentry DSN (error tracking)
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...

# Google Analytics
NEXT_PUBLIC_GA_ID=G-...

# PostHog (product analytics)
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

**Purpose:** Monitoring, analytics, error tracking  
**Required:** ❌ Optional  
**Recommended:** Sentry for error tracking

---

### Feature Flags (optional)

```env
# Enable beta features
ENABLE_BETA_FEATURES=false

# Enable demo mode
ENABLE_DEMO_MODE=false

# Enable maintenance mode
MAINTENANCE_MODE=false
```

**Purpose:** Feature toggles  
**Required:** ❌ Optional  
**Default:** false for all

---

## ✅ ENVIRONMENT VARIABLE CHECKLIST

### Pre-Deployment Verification

#### Production Environment (Vercel)

- [ ] `NEXT_PUBLIC_APP_URL` = Production app domain
- [ ] `NEXT_PUBLIC_SITE_URL` = Production marketing domain
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Supabase anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = Supabase service key ⚠️ SECRET
- [ ] `FOUNDER_EMAILS` = Founder email addresses
- [ ] `FOUNDER_USER_IDS` = Founder user IDs (recommended)
- [ ] `STRIPE_SECRET_KEY` = Stripe secret key ⚠️ SECRET
- [ ] `STRIPE_WEBHOOK_SECRET` = Stripe webhook secret ⚠️ SECRET
- [ ] `STRIPE_BASIC_PRICE_ID` = Basic plan price ID
- [ ] `STRIPE_PRO_PRICE_ID` = Pro plan price ID
- [ ] `STRIPE_ENTERPRISE_PRICE_ID` = Enterprise plan price ID

#### Development Environment (.env.local)

- [ ] Same as production but with localhost URLs
- [ ] Use Stripe test mode keys (sk*test*...)
- [ ] Use test price IDs

---

## 🔒 SECURITY BEST PRACTICES

### Secret Management

```bash
# ✅ DO:
- Store secrets in Vercel environment variables
- Use different keys for dev/staging/production
- Rotate keys regularly (quarterly)
- Use Stripe test mode for development
- Never commit .env files to git

# ❌ DON'T:
- Expose SUPABASE_SERVICE_ROLE_KEY publicly
- Use production Stripe keys in development
- Share secrets via email or Slack
- Hardcode secrets in code
- Use same keys across environments
```

### Access Control

```bash
# Who needs access to what:
✅ Developers: Anon keys, dev Stripe keys
✅ DevOps: All keys for deployment
❌ Public: Only NEXT_PUBLIC_* variables
❌ Client-side: Never service role or secret keys
```

---

## 🧪 TESTING ENVIRONMENT VARIABLES

### Validate Configuration

```bash
# 1. Check required variables are set
node -e "
  const required = [
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_SITE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'FOUNDER_EMAILS',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required env vars:', missing);
    process.exit(1);
  } else {
    console.log('✅ All required env vars present');
  }
"

# 2. Test Supabase connection
node -e "
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  supabase.from('organizations').select('count').then(({ error }) => {
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      process.exit(1);
    } else {
      console.log('✅ Supabase connection successful');
    }
  });
"

# 3. Test Stripe connection
node -e "
  const Stripe = require('stripe');
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  stripe.prices.retrieve(process.env.STRIPE_BASIC_PRICE_ID).then(() => {
    console.log('✅ Stripe connection successful');
  }).catch(error => {
    console.error('❌ Stripe connection failed:', error.message);
    process.exit(1);
  });
"
```

---

## 📝 DEPLOYMENT CONFIGURATION

### Vercel Environment Variables Setup

```bash
# Option 1: Via Vercel Dashboard
1. Go to https://vercel.com/[your-team]/formaos/settings/environment-variables
2. Add each variable one by one
3. Select environment: Production, Preview, Development
4. Click "Save"

# Option 2: Via Vercel CLI
vercel env add NEXT_PUBLIC_APP_URL
# Paste value when prompted
# Select: Production

# Option 3: Bulk import from .env file
vercel env pull .env.production
# Edit .env.production with production values
vercel env push .env.production
```

### Environment Separation

```bash
# Production
NEXT_PUBLIC_APP_URL=https://app.formaos.com.au
STRIPE_SECRET_KEY=sk_live_...

# Preview/Staging
NEXT_PUBLIC_APP_URL=https://staging-formaos.vercel.app
STRIPE_SECRET_KEY=sk_test_...

# Development
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...
```

---

## 🔍 TROUBLESHOOTING

### Common Issues

#### Issue: "Supabase connection failed"

**Solution:**

1. Check `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Verify anon key matches project
3. Check Supabase project is active
4. Verify RLS policies don't block queries

#### Issue: "Stripe webhook signature verification failed"

**Solution:**

1. Check `STRIPE_WEBHOOK_SECRET` matches webhook endpoint
2. Verify webhook endpoint URL is correct
3. Check webhook events are selected correctly
4. Test webhook delivery in Stripe dashboard

#### Issue: "Founder cannot access /admin"

**Solution:**

1. Verify email in `FOUNDER_EMAILS` matches exactly
2. Check `FOUNDER_USER_IDS` has correct UUID
3. Clear browser cookies and retry
4. Check middleware logs for founder detection

#### Issue: "Environment variables not updating"

**Solution:**

1. Redeploy after changing env vars in Vercel
2. Clear build cache: Settings > Clear Cache
3. Verify correct environment selected (Production vs Preview)
4. Check for typos in variable names

---

## 📚 REFERENCE LINKS

- [Vercel Environment Variables Docs](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase Environment Variables](https://supabase.com/docs/guides/getting-started/local-development#environment-variables)
- [Stripe API Keys](https://stripe.com/docs/keys)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

**Last Verified:** February 7, 2026  
**Status:** ✅ All variables documented and tested
