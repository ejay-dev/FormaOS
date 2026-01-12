# Vercel Deployment Checklist for Admin Access Fix

## Issue
`https://app.formaos.com.au/admin` redirects to `/pricing` instead of admin portal for founder.

## Root Cause
1. Latest code changes not deployed to Vercel
2. Environment variables not configured in Vercel
3. Domain configuration incomplete

---

## ✅ Step 1: Verify Domain Configuration in Vercel

1. **Go to Vercel Dashboard** → Your FormaOS Project → Settings → Domains

2. **Add domains if missing:**
   ```
   app.formaos.com.au (Primary App Domain)
   formaos.com.au (Marketing Site)
   www.formaos.com.au (Optional)
   ```

3. **Verify DNS Configuration:**
   - `app.formaos.com.au` → CNAME → `cname.vercel-dns.com`
   - `formaos.com.au` → A → `76.76.21.21`
   - Both should show ✓ in Vercel

---

## ✅ Step 2: Configure Environment Variables in Vercel

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

### Add/Verify These Variables:

#### **Required for Admin Access:**
```bash
FOUNDER_EMAILS=ejazhussaini313@gmail.com
```
Or use user ID:
```bash
FOUNDER_USER_IDS=<your-supabase-user-id>
```

#### **Required for Supabase:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### **Required for Routing:**
```bash
NEXT_PUBLIC_APP_URL=https://app.formaos.com.au
NEXT_PUBLIC_SITE_URL=https://formaos.com.au
```

#### **Required for Billing:**
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_BASIC=price_...
STRIPE_PRICE_PRO=price_...
```

#### **Required for Email:**
```bash
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@formaos.com.au
```

**Important:** Set environment variables for **Production**, **Preview**, and **Development** environments.

---

## ✅ Step 3: Deploy Latest Code to Vercel

### Option A: Automatic Deployment (if GitHub integration is set up)
1. Code is already pushed to `main` branch
2. Vercel should auto-deploy within 1-2 minutes
3. Check: **Vercel Dashboard → Deployments** for latest deployment status

### Option B: Manual Deployment via Vercel CLI
```bash
cd /Users/ejay/formaos
npm install -g vercel
vercel login
vercel --prod
```

---

## ✅ Step 4: Verify Deployment

### Check 1: Latest commit is deployed
```bash
git log --oneline -1
```
Expected: `Fix admin routing: block unauthenticated /admin access...`

Go to **Vercel Dashboard → Deployments** and verify this commit is deployed.

### Check 2: Environment variables are loaded
Visit: `https://app.formaos.com.au/api/debug/env` (in dev mode)

Or check Vercel deployment logs for env var loading.

### Check 3: Test Admin Access Flow

#### Test A: Unauthenticated Access
```
1. Open incognito/private browser window
2. Visit: https://app.formaos.com.au/admin
3. Expected: Redirect to https://app.formaos.com.au/auth/signin ✓
4. Should NOT redirect to /pricing ❌
```

#### Test B: Founder Authentication
```
1. Visit: https://app.formaos.com.au/auth/signin
2. Click "Continue with Google"
3. Sign in with: ejazhussaini313@gmail.com
4. Expected: Redirect to https://app.formaos.com.au/admin ✓
5. Should see: "Founder Admin" dashboard ✓
```

#### Test C: Direct Admin Access (authenticated)
```
1. While still logged in as founder
2. Visit: https://app.formaos.com.au/admin
3. Expected: Admin dashboard loads immediately ✓
4. No subscription checks or org requirements ✓
```

---

## ✅ Step 5: Troubleshooting

### Issue: Still redirecting to /pricing

**Possible causes:**

1. **Old deployment is still active**
   - Solution: Force redeploy in Vercel dashboard
   - Or run: `vercel --force --prod`

2. **Browser cache**
   - Solution: Hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
   - Or use incognito window

3. **Environment variables not set**
   - Solution: Double-check `FOUNDER_EMAILS` is set in Vercel
   - Redeploy after adding env vars

4. **Wrong domain**
   - Solution: Ensure you're testing on `app.formaos.com.au` not `formaos.com.au`

### Issue: "Unauthorized" or "Forbidden" error

**Check:**
```bash
# Verify your email in FOUNDER_EMAILS matches exactly
echo $FOUNDER_EMAILS
# Should output: ejazhussaini313@gmail.com
```

**Or get your Supabase user ID:**
```sql
-- Run in Supabase SQL Editor:
SELECT id FROM auth.users WHERE email = 'ejazhussaini313@gmail.com';
```

Then set in Vercel:
```bash
FOUNDER_USER_IDS=<the-id-from-above>
```

### Issue: Middleware not running

**Check Vercel logs:**
1. Go to Vercel Dashboard → Deployments → Latest → Logs
2. Search for: `[Middleware]` or `Middleware runtime error`
3. Look for errors related to Supabase or auth

---

## 🎯 Quick Verification Commands

Run these to verify local build works:

```bash
# Build locally
npm run build

# Start production server locally
npm start

# Test in another terminal:
curl -I http://localhost:3000/admin
# Should return: 302 redirect to /auth/signin
```

---

## 📋 Summary of Code Changes Already Pushed

### Files Modified:
1. `middleware.ts` - Admin route protection added
2. `app/admin/layout.tsx` - Redirect to signin (not /app)
3. `app/app/layout.tsx` - Founder detection before org check
4. `app/(marketing)/layout.tsx` - Founder redirect to /admin

### Key Changes:
- ✅ Unauthenticated `/admin` → redirects to `/auth/signin`
- ✅ Authenticated founder → allowed into `/admin`
- ✅ Authenticated non-founder → blocked from `/admin`
- ✅ Founder bypasses org/subscription checks
- ✅ No pricing redirects for admin access

---

## 🚀 Final Steps

1. ✅ Verify `FOUNDER_EMAILS=ejazhussaini313@gmail.com` is set in Vercel
2. ✅ Verify latest commit is deployed to production
3. ✅ Test in incognito: `app.formaos.com.au/admin` → should redirect to signin
4. ✅ Sign in with Google as founder → should land on admin dashboard
5. ✅ No more `/pricing` redirects

---

**Last Updated:** 2026-01-12
**Commit:** `0d6f972` - Fix admin routing
