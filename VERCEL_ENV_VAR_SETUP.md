# 🚨 CRITICAL: Vercel Environment Variable Setup

## Root Cause (from logs)

```
[app/layout] Founder check { 
  email: 'ejazhussaini313@gmail.com', 
  isFounder: false, 
  founderEmailsConfigured: false  ← ENV VAR NOT SET!
}
```

**The `FOUNDER_EMAILS` environment variable is NOT configured in Vercel Production.**

This is why the founder check is failing everywhere:
- Middleware: `isFounder = false`
- Marketing layout: `isFounder = false`
- App layout: `isFounder = false`

The code is working correctly, but has no founder emails to compare against.

---

## 📋 Step-by-Step Fix

### Option 1: Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - URL: https://vercel.com/dashboard
   - Or: https://vercel.com/ejazs-projects-9ff3f580/forma (your project)

2. **Navigate to Settings**
   - Click on your FormaOS project
   - Click "Settings" in the top menu
   - Click "Environment Variables" in the left sidebar

3. **Check Existing Variables**
   - Look for `FOUNDER_EMAILS` in the list
   - If it exists, check which environments it's set for
   - **CRITICAL**: It MUST be set for "Production"

4. **Add/Update the Variable**
   ```
   Key: FOUNDER_EMAILS
   Value: ejazhussaini313@gmail.com
   Environment: ✅ Production (MUST be checked!)
   ```

5. **Save Changes**
   - Click "Save"
   - Vercel will show a confirmation

6. **Redeploy**
   - Go to "Deployments" tab
   - Find the latest deployment (commit 4559fac)
   - Click the "..." menu
   - Click "Redeploy"
   - Select "Use existing Build Cache" (faster)
   - Click "Redeploy"

7. **Wait for Deployment**
   - Should take 2-3 minutes
   - Wait for "Ready" status

8. **Test**
   - Visit: https://app.formaos.com.au/admin
   - Log in with: ejazhussaini313@gmail.com
   - Should redirect to: /admin (no more /pricing!)

---

### Option 2: Vercel CLI

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Login
vercel login

# Set environment variable
vercel env add FOUNDER_EMAILS production

# When prompted, enter:
ejazhussaini313@gmail.com

# Redeploy
vercel --prod
```

---

## 🔍 Verification

After setting the env var and redeploying, check logs again:

**Before (Current):**
```
[app/layout] Founder check { 
  isFounder: false, 
  founderEmailsConfigured: false  ← Problem!
}
```

**After (Expected):**
```
[app/layout] Founder check { 
  isFounder: true,  ← Fixed!
  founderEmailsConfigured: true  ← Fixed!
}
[Middleware] ✅ FOUNDER ACCESS GRANTED
```

---

## 🚫 Common Mistakes to Avoid

1. **Setting for "Preview" instead of "Production"**
   - The env var MUST be set for Production environment
   - Preview deployments won't help the live site

2. **Not redeploying after adding env var**
   - New env vars require a redeploy to take effect
   - Just adding the var isn't enough

3. **Typos in email or var name**
   - Must be exactly: `FOUNDER_EMAILS` (not FOUNDER_EMAIL)
   - Must be exactly: `ejazhussaini313@gmail.com`
   - Case sensitive!

4. **Whitespace in value**
   - Don't add quotes: `ejazhussaini313@gmail.com` ✅
   - Not: `"ejazhussaini313@gmail.com"` ❌

---

## 🎯 Why This Isn't a Supabase Issue

The logs show:
- ✅ Supabase is working (user email is read correctly)
- ✅ Session is established (email shows in logs)
- ✅ Auth is working (OAuth callback succeeded)
- ❌ **Founder check fails because env var is not set**

The founder detection logic works by:
1. Reading `process.env.FOUNDER_EMAILS` from Vercel
2. Splitting by comma into a Set
3. Checking if user email is in the Set
4. If env var is not set → Set is empty → check always fails

This is purely an environment configuration issue, not a database, auth, or code issue.

---

## 📊 Login Flow Analysis

From your logs, here's what happened:

1. **User logs in with Google** ✅
2. **Auth callback completes** ✅
3. **User session established** ✅
4. **User redirected to /app** (should have gone to /admin)
5. **App layout checks founder:**
   - `founderEmailsConfigured: false` ← ENV VAR MISSING
   - `isFounder: false` ← CHECK FAILS
6. **App layout checks org membership:**
   - No org found (correct for founder)
   - Redirects to /onboarding
7. **Onboarding page:**
   - No org membership
   - Redirects to /pricing ❌

**Root cause:** Step 5 failed because env var not set.

---

## ✅ After Fix

Once env var is set:

1. **User logs in with Google** ✅
2. **Auth callback completes** ✅
3. **Auth callback checks founder:**
   - `isFounder: true` ← CHECK PASSES
   - Redirects to /admin ✅
4. **Done!** Admin dashboard loads

---

## 🔧 Alternative: Use User ID Instead

If you want to avoid email-based detection, use user ID:

1. **Get your user ID from Supabase:**
   ```sql
   SELECT id FROM auth.users 
   WHERE email = 'ejazhussaini313@gmail.com';
   ```

2. **Set in Vercel:**
   ```
   Key: FOUNDER_USER_IDS
   Value: <your-uuid-here>
   ```

This is more reliable as user IDs never change, while emails can.

---

## 📞 Next Steps

1. ✅ Set `FOUNDER_EMAILS` in Vercel Production
2. ✅ Redeploy latest deployment
3. ✅ Test login at `/admin`
4. ✅ Share logs showing `isFounder: true`

**This is the only blocker.** The code is ready, the logic is correct, we just need the environment variable configured.
