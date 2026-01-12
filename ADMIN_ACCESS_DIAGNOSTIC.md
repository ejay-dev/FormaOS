# Admin Access Diagnostic Guide

## 🎯 Objective
Fix `/admin` redirecting to `/pricing` for founder email: `ejazhussaini313@gmail.com`

---

## ✅ Changes Applied (Commit: e76b284)

### 1. **Enhanced Founder Detection**
   - Added `.trim()` to email/ID parsing (whitespace tolerance)
   - Made detection case-insensitive across all files
   - Added robust founder checks in all entry points

### 2. **Comprehensive Logging Added**
   All founder detection points now log:
   - ✅ Middleware (`middleware.ts`)
   - ✅ App Layout (`app/app/layout.tsx`)
   - ✅ Marketing Layout (`app/(marketing)/layout.tsx`)
   - ✅ Admin Layout (`app/admin/layout.tsx`)
   - ✅ Admin Access Function (`app/app/admin/access.ts`)

### 3. **Hardened Admin Protection**
   - Middleware now explicitly blocks non-founders from `/admin`
   - Founders bypass ALL subscription/billing checks
   - Early return for founders before any other middleware logic

---

## 🔍 How to Diagnose the Issue

### Step 1: Deploy to Vercel & Check Logs

1. **Trigger auto-deploy** (already pushed to `main`)
2. **Wait for deployment to complete**
3. **Visit**: `https://app.formaos.com.au/admin`
4. **Check Vercel Runtime Logs** immediately after visiting

Look for these log entries:

```
[Middleware] ADMIN ACCESS CHECK {
  pathname: '/admin',
  userEmail: 'ejazhussaini313@gmail.com',
  isFounder: true/false,  <--- THIS IS KEY
  founderEmailsCount: 1,  <--- Should be 1 if env var is set
  hasUser: true
}
```

**If `isFounder: false`:**
- ❌ Environment variable `FOUNDER_EMAILS` not set correctly in Vercel
- ❌ Or email doesn't match exactly (check for typos/whitespace)

**If `isFounder: true`:**
- ✅ Founder detection works
- Look for next log: `✅ FOUNDER ACCESS GRANTED to /admin`
- If you see a redirect instead, there's another issue

---

### Step 2: Verify Environment Variables in Vercel

Go to: **Vercel Dashboard → Project → Settings → Environment Variables**

#### Required Configuration:

```bash
FOUNDER_EMAILS=ejazhussaini313@gmail.com
```

**Critical Checks:**
- ✅ No leading/trailing spaces
- ✅ Exact email match (case-insensitive is handled in code)
- ✅ Set for **Production** environment
- ✅ Set for **Preview** environment
- ✅ Set for **Development** environment

#### Alternative (using User ID):

```bash
FOUNDER_USER_IDS=<your-supabase-user-id>
```

To get your user ID:
1. Go to Supabase Dashboard → Authentication → Users
2. Find `ejazhussaini313@gmail.com`
3. Copy the UUID

---

### Step 3: Test the Flow

#### Test A: Unauthenticated Access
```
1. Open incognito/private window
2. Visit: https://app.formaos.com.au/admin
3. Expected: Redirect to /auth/signin
4. Check logs for: "[Middleware] ADMIN ACCESS CHECK"
```

#### Test B: Founder Authentication
```
1. Visit: https://app.formaos.com.au/auth/signin
2. Click "Continue with Google"
3. Sign in with: ejazhussaini313@gmail.com
4. Expected: Redirect to /admin after callback
5. Check logs for:
   - "[auth/callback] Founder detected"
   - "[Middleware] ✅ FOUNDER ACCESS GRANTED"
   - "[requireFounderAccess] ✅ Founder access granted"
```

#### Test C: Direct Admin Access (while logged in)
```
1. While logged in as founder
2. Visit: https://app.formaos.com.au/admin
3. Expected: Admin dashboard loads
4. Should see logs confirming founder access at each layer
```

---

## 🚨 Common Issues & Solutions

### Issue 1: `founderEmailsCount: 0` in logs
**Problem:** `FOUNDER_EMAILS` environment variable not set in Vercel

**Solution:**
```bash
# In Vercel Dashboard:
FOUNDER_EMAILS=ejazhussaini313@gmail.com

# After adding, MUST redeploy:
- Click "Redeploy" in Vercel Deployments
- Or push a new commit to trigger deployment
```

### Issue 2: `isFounder: false` but env var is set
**Problem:** Email mismatch or Supabase email is different

**Solution:**
```bash
# Check the actual email in Supabase:
# Go to Supabase → Authentication → Users
# Verify the email matches EXACTLY

# Or check logs for:
[requireFounderAccess] Checking founder access {
  email: "actual-email@example.com",  <--- Compare this
  ...
}
```

### Issue 3: Still redirecting to `/pricing`
**Problem:** Old deployment cached or subscription check running before founder check

**Solution:**
1. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Clear browser cache/cookies
3. Check Vercel logs for the execution order
4. Look for subscription check logs BEFORE founder check logs

---

## 📊 Expected Log Sequence (Success Path)

When visiting `/admin` as founder:

```
1. [Middleware] ADMIN ACCESS CHECK
   { isFounder: true, pathname: '/admin', ... }

2. [Middleware] ✅ FOUNDER ACCESS GRANTED to /admin
   { email: 'ejazhussaini313@gmail.com' }

3. [requireFounderAccess] Checking founder access
   { email: 'ejazhussaini313@gmail.com', hasEmailAccess: true }

4. [requireFounderAccess] ✅ Founder access granted
   { email: 'ejazhussaini313@gmail.com' }

5. [admin/layout] ✅ Founder access granted
   { email: 'ejazhussaini313@gmail.com' }
```

---

## 🛠️ Debugging Commands

### Local Testing (with env vars set in .env.local):
```bash
# Build
npm run build

# Start production server
npm start

# In another terminal, test the endpoint:
curl -I http://localhost:3000/admin
# Should return: 302 redirect to /auth/signin (if not authenticated)
```

### Check Environment Variables Locally:
```bash
# Verify FOUNDER_EMAILS is set
grep FOUNDER_EMAILS .env.local

# Should output:
# FOUNDER_EMAILS=ejazhussaini313@gmail.com
```

---

## 📋 Deployment Checklist

- [ ] Code pushed to `main` branch ✅ (commit: e76b284)
- [ ] Vercel auto-deployment triggered
- [ ] `FOUNDER_EMAILS` set in Vercel for Production
- [ ] `FOUNDER_EMAILS` set in Vercel for Preview
- [ ] Deployment completed successfully
- [ ] Hard refresh browser / clear cache
- [ ] Test unauthenticated `/admin` access
- [ ] Test founder Google OAuth sign-in
- [ ] Test direct `/admin` access while logged in
- [ ] Check Vercel logs for founder detection

---

## 🎬 Next Steps

1. **Deploy** (already pushed, wait for Vercel auto-deploy)
2. **Set** `FOUNDER_EMAILS=ejazhussaini313@gmail.com` in Vercel
3. **Test** the `/admin` access flow
4. **Check** Vercel Runtime Logs for debugging info
5. **Report** what you see in the logs

---

## 📞 Quick Diagnosis Questions

If still not working after deployment:

**Q1:** What do you see in Vercel logs for `[Middleware] ADMIN ACCESS CHECK`?
**Q2:** What is the value of `isFounder` in the logs?
**Q3:** What is the value of `founderEmailsCount` in the logs?
**Q4:** Are you being redirected to `/pricing`, `/auth/signin`, or something else?
**Q5:** Does your Supabase user have the email `ejazhussaini313@gmail.com` exactly?

---

**Last Updated:** 2026-01-12  
**Commit:** e76b284 - Add comprehensive founder detection logging
