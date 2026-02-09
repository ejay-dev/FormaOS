# 🚀 OAuth Fix - Quick Start (5 Minutes)

**Problem**: Users get stuck in login loop after Google OAuth  
**Solution**: Deploy code + configure Google Cloud + Supabase  
**Status**: ✅ READY NOW

---

## 1️⃣ Deploy Code (2 min)

```bash
git pull origin main
npm run build
npm run deploy  # or your deploy command
```

**Files changed:**

- `app/auth/callback/route.ts` ← Only this file

**No database migrations needed.**

---

## 2️⃣ Configure Google Cloud Console (2 min)

Go to: **apis.google.com** → **Credentials** → Find your Client

### OAuth Consent Screen

Set these exact values:

- **App name**: `FormaOS`
- **Support email**: `support@formaos.com.au`
- **Logo**: `https://formaos.com.au/brand/formaos-mark-light.svg`
- **Authorized domains**: `formaos.com.au`, `app.formaos.com.au`

### OAuth Credentials

Add these redirect URIs:

```
https://app.formaos.com.au/auth/callback
https://formaos.com.au/auth/callback
```

---

## 3️⃣ Configure Supabase (1 min)

Go to: **Dashboard** → **Authentication** → **Providers** → **Google**

Add these to "Authorized redirect URLs":

```
https://app.formaos.com.au/auth/callback
https://formaos.com.au/auth/callback
```

---

## 4️⃣ Test (Quick Check)

1. **Desktop**: `https://app.formaos.com.au/auth/signup` → Click Google → Should land in `/app/onboarding` ✅
2. **Mobile**: Same flow, should work on iOS/Android ✅
3. **Consent**: Google screen should say "FormaOS" (wait 1-2 hours if it doesn't) ✅

---

## ❌ If Something's Wrong

| Problem                  | Check                                       |
| ------------------------ | ------------------------------------------- |
| Still seeing login loop  | Google consent step, server logs            |
| Consent shows "Supabase" | Google Cloud Console app name               |
| Plan parameter lost      | Check `auth/signup?plan=pro` in browser URL |
| Mobile not working       | Clear cookies, try in private window        |

---

## 📚 Full Docs

- **Detailed guide**: [OAUTH_DEPLOYMENT_GUIDE.md](OAUTH_DEPLOYMENT_GUIDE.md)
- **Exact config values**: [OAUTH_CONFIG_REFERENCE.md](OAUTH_CONFIG_REFERENCE.md)
- **Manual test plan**: [OAUTH_MANUAL_TEST_PLAN.md](OAUTH_MANUAL_TEST_PLAN.md)
- **Full summary**: [OAUTH_FIX_DEPLOYMENT_PACKAGE.md](OAUTH_FIX_DEPLOYMENT_PACKAGE.md)

---

## ✅ Success Indicators

After 10 minutes:

- [ ] Code deployed successfully
- [ ] Google Cloud configured (app name = "FormaOS")
- [ ] Supabase OAuth URLs updated
- [ ] Test signup: No login loop
- [ ] Test login: Direct to dashboard

**If all 5 pass → You're done! 🎉**
