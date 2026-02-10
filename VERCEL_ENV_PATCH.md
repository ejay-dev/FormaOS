# 🚀 Vercel Environment Variables Setup Guide

**Purpose:** Configure environment variables for FormaOS in Vercel  
**Last Updated:** 2026-02-10  
**Status:** Ready for deployment

---

## 📋 Quick Access

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Project:** FormaOS
- **Settings:** Project Settings → Environment Variables

---

## 🎯 Required Environment Variables

### Production Environment

Navigate to: **Vercel Dashboard → FormaOS → Settings → Environment Variables**

Configure the following variables with scope **Production**:

#### 1. Supabase Configuration

```env
# Name: NEXT_PUBLIC_SUPABASE_URL
# Value: https://[your-project-id].supabase.co
# Scope: ✅ Production, ✅ Preview, ✅ Development
# Sensitive: No (Public)
```

```env
# Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
# Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.[your-anon-key]
# Scope: ✅ Production, ✅ Preview, ✅ Development
# Sensitive: No (Public, RLS-protected)
```

```env
# Name: SUPABASE_SERVICE_ROLE_KEY
# Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.[your-service-role-key]
# Scope: ✅ Production, ✅ Preview, ⚠️ Development (optional)
# Sensitive: ✅ YES - Mark as sensitive, encrypt
# ⚠️ CRITICAL: This key bypasses RLS - keep secret!
```

**Where to find:** Supabase Dashboard → Project Settings → API

---

#### 2. Application URLs

```env
# Name: NEXT_PUBLIC_APP_URL
# Value (Production): https://app.formaos.com.au
# Value (Preview): https://preview-formaos.vercel.app
# Value (Development): http://localhost:3000
# Scope: Set individually per environment
# Sensitive: No (Public)
```

```env
# Name: NEXT_PUBLIC_SITE_URL
# Value (Production): https://formaos.com.au
# Value (Preview): https://preview-site-formaos.vercel.app
# Value (Development): http://localhost:3000
# Scope: Set individually per environment
# Sensitive: No (Public)
```

---

#### 3. Founder Access Control

```env
# Name: FOUNDER_EMAILS
# Value: email1@domain.com,email2@domain.com
# Example: ejazhussaini313@gmail.com,admin@formaos.com.au
# Scope: ✅ Production, ✅ Preview, ✅ Development
# Sensitive: ⚠️ Somewhat (but not a secret)
# Format: Comma-separated, no spaces
```

```env
# Name: FOUNDER_USER_IDS
# Value: uuid-1,uuid-2,uuid-3
# Example: a1b2c3d4-1234-5678-90ab-cdef12345678,b2c3d4e5-2345-6789-01bc-def123456789
# Scope: ✅ Production, ⚠️ Preview (optional), ⚠️ Development (optional)
# Sensitive: ⚠️ Somewhat
# Format: Comma-separated UUIDs, no spaces
# Note: Get UUIDs from: SELECT id FROM auth.users WHERE email = 'founder@email.com'
```

---

#### 4. Automation & Cron (Optional)

```env
# Name: CRON_SECRET
# Value: [32+ character random string]
# Generate with: openssl rand -hex 32
# Example: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
# Scope: ✅ Production, ⚠️ Preview (optional)
# Sensitive: ✅ YES - Mark as sensitive
# Required: Only if using /api/cron endpoints
```

---

#### 5. Monitoring (Optional)

```env
# Name: NEXT_PUBLIC_SENTRY_DSN
# Value: https://[key]@[org].ingest.sentry.io/[project]
# Scope: ✅ Production, ⚠️ Preview (recommended)
# Sensitive: No (Public)
# Required: Optional (for error tracking)
```

```env
# Name: NEXT_PUBLIC_GA_ID
# Value: G-XXXXXXXXXX
# Scope: ✅ Production only
# Sensitive: No (Public)
# Required: Optional (for analytics)
```

---

## 📝 Step-by-Step Setup Instructions

### Method 1: Via Vercel Dashboard (Recommended)

1. **Navigate to Project Settings**
   - Go to https://vercel.com/dashboard
   - Select "FormaOS" project
   - Click "Settings" tab
   - Click "Environment Variables" in sidebar

2. **Add Each Variable**
   - Click "Add New" button
   - Enter variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - Enter variable value
   - Select appropriate environment scopes:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
   - For sensitive variables (service role key, cron secret):
     - ✅ Mark as "Sensitive" - will be encrypted at rest
   - Click "Save"

3. **Repeat for All Variables**
   - Follow the table above
   - Double-check scope for each variable
   - Verify sensitive variables are marked

4. **Trigger Redeploy**
   - Go to "Deployments" tab
   - Click "..." on latest deployment
   - Click "Redeploy"
   - Wait for deployment to complete

---

### Method 2: Via Vercel CLI

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Login to Vercel
vercel login

# Link project (if not already linked)
vercel link

# Add environment variables one by one
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Paste value when prompted

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Paste value when prompted

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Paste value when prompted
# Mark as sensitive: yes

# Continue for all variables...

# Pull environment variables to local (optional)
vercel env pull .env.production

# Trigger redeploy
vercel --prod
```

---

### Method 3: Bulk Import (Advanced)

1. **Create .env.vercel file**

```env
# .env.vercel - DO NOT COMMIT TO GIT
# Use this template to bulk import via Vercel CLI

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# URLs
NEXT_PUBLIC_APP_URL=https://app.formaos.com.au
NEXT_PUBLIC_SITE_URL=https://formaos.com.au

# Admin
FOUNDER_EMAILS=email1@domain.com,email2@domain.com
FOUNDER_USER_IDS=uuid-1,uuid-2

# Optional
CRON_SECRET=your-secret-here
NEXT_PUBLIC_SENTRY_DSN=https://...
```

2. **Import using Vercel CLI**

```bash
# This will prompt for each variable
vercel env add < .env.vercel

# Or manually push
while IFS='=' read -r key value; do
  [ -z "$key" ] || [ "${key:0:1}" = "#" ] && continue
  vercel env add "$key" production <<< "$value"
done < .env.vercel

# Clean up
rm .env.vercel  # IMPORTANT: Delete file after import
```

---

## ✅ Verification Checklist

After setting up environment variables:

### In Vercel Dashboard

- [ ] All required variables are present in Production scope
- [ ] All required variables are present in Preview scope
- [ ] Development scope has necessary variables for local testing
- [ ] Sensitive variables (service role key, cron secret) are marked as "Sensitive"
- [ ] URLs are correct for each environment
- [ ] No typos in variable names (match exactly: `NEXT_PUBLIC_SUPABASE_URL`, not `SUPABASE_URL`)

### Test Deployment

- [ ] Trigger a new deployment after setting variables
- [ ] Check deployment logs for environment variable errors
- [ ] Visit production URL and verify app loads
- [ ] Test authentication (sign up / sign in)
- [ ] Test OAuth (Google sign-in)
- [ ] Test admin access (with founder account)
- [ ] Check browser console for errors

### Manual Tests

```bash
# 1. Test production deployment
curl -I https://app.formaos.com.au
# Should return 200 OK

# 2. Check if build succeeded
# Go to Vercel Dashboard → Deployments → Latest
# Status should be "Ready"

# 3. Test auth callback
# Navigate to: https://app.formaos.com.au/auth/callback
# Should redirect properly (not show error page)
```

---

## 🔄 Environment-Specific Values

### Production

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_APP_URL` | `https://app.formaos.com.au` |
| `NEXT_PUBLIC_SITE_URL` | `https://formaos.com.au` |
| `NEXT_PUBLIC_SUPABASE_URL` | Production Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Production service role key |
| `FOUNDER_EMAILS` | Real founder emails |
| `CRON_SECRET` | Production secret |

### Preview (Staging)

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_APP_URL` | `https://preview-formaos.vercel.app` |
| `NEXT_PUBLIC_SITE_URL` | `https://preview-site-formaos.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | Same as production OR staging Supabase project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as production OR staging anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Same as production OR staging service role |
| `FOUNDER_EMAILS` | Same as production |
| `CRON_SECRET` | Different from production (optional) |

### Development

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` |
| `NEXT_PUBLIC_SUPABASE_URL` | Dev/staging Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Dev/staging anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Dev/staging service role key |
| `FOUNDER_EMAILS` | Developer emails |

---

## 🔒 Security Best Practices

### Do's ✅

- ✅ Use different service role keys for production and development
- ✅ Mark service role key and cron secret as "Sensitive" in Vercel
- ✅ Rotate keys quarterly or after any security incident
- ✅ Set up Vercel deployment protection (require approval for production)
- ✅ Use environment-specific Supabase projects when possible
- ✅ Test in Preview environment before deploying to Production

### Don'ts ❌

- ❌ Never commit `.env` files to git
- ❌ Never share service role keys via email or Slack
- ❌ Never use production keys in development
- ❌ Never expose `SUPABASE_SERVICE_ROLE_KEY` client-side (no `NEXT_PUBLIC_` prefix)
- ❌ Never hardcode secrets in code
- ❌ Never use same keys across multiple projects

---

## 🆘 Troubleshooting

### Issue: "Supabase is not configured" error

**Cause:** Missing or incorrect environment variables

**Solution:**
1. Check variable names match exactly (case-sensitive)
2. Verify values are not empty or "undefined"
3. Redeploy after adding/updating variables
4. Check browser console for specific error messages

### Issue: "Authentication failed" or "Session not found"

**Cause:** Incorrect URLs or cookie domain issues

**Solution:**
1. Verify `NEXT_PUBLIC_APP_URL` matches actual deployment URL
2. Check Supabase Dashboard → Auth → URL Configuration
3. Confirm redirect URL includes `/auth/callback`
4. Test in incognito mode to rule out cookie issues

### Issue: "Access Denied" for founder

**Cause:** Founder emails not configured or mismatched

**Solution:**
1. Check `FOUNDER_EMAILS` variable is set
2. Verify email matches exactly (case-sensitive, no spaces)
3. Try adding `FOUNDER_USER_IDS` for UUID-based check
4. Check middleware logs for founder detection

### Issue: Variables not updating after save

**Cause:** Vercel caches environment variables

**Solution:**
1. Wait 30 seconds after saving
2. Trigger a new deployment (required for changes to take effect)
3. Clear browser cache
4. Check "Deployments" tab to see if new deployment is using updated variables

---

## 📚 Additional Resources

- [Vercel Environment Variables Docs](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase Environment Variables](https://supabase.com/docs/guides/getting-started/local-development#environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [FormaOS Keys Audit](./KEYS_AUDIT.md) - Complete variable inventory

---

## 🎯 Quick Copy-Paste Checklist

Use this checklist when setting up variables in Vercel:

```
[ ] NEXT_PUBLIC_SUPABASE_URL
[ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
[ ] SUPABASE_SERVICE_ROLE_KEY (mark sensitive)
[ ] NEXT_PUBLIC_APP_URL
[ ] NEXT_PUBLIC_SITE_URL
[ ] FOUNDER_EMAILS
[ ] FOUNDER_USER_IDS (optional)
[ ] CRON_SECRET (optional, mark sensitive)
[ ] NEXT_PUBLIC_SENTRY_DSN (optional)
[ ] Trigger redeploy
[ ] Test production deployment
[ ] Test authentication
[ ] Test admin access
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-10  
**Next Review:** After production deployment
