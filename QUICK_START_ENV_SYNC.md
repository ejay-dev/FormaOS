# 🚀 Quick Start: Fix GitHub Actions Warnings

**Problem:** VS Code shows "Context access might be invalid" warnings  
**Solution:** Sync environment variables from Vercel to GitHub Actions

---

## ⚡ Fastest Solution (3 Steps)

### Step 1: Get Values from Vercel

Go to: https://vercel.com/dashboard → Your FormaOS Project → Settings → Environment Variables

Copy these values (Production environment):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SNYK_TOKEN` (if exists)
- `CODECOV_TOKEN` (if exists)
- `LHCI_GITHUB_APP_TOKEN` (if exists)

### Step 2: Run the Script

```bash
# Make sure you're authenticated
gh auth login

# Run the interactive script
./scripts/sync-env-to-github-actions.sh
```

The script will prompt you for each value. Paste them when asked.

### Step 3: Verify

```bash
# Check that variables and secrets are set
gh variable list --repo ejay-dev/FormaOS
gh secret list --repo ejay-dev/FormaOS

# Trigger a workflow run to test
gh workflow run "QA Pipeline" --repo ejay-dev/FormaOS
```

Check: https://github.com/ejay-dev/FormaOS/actions

✅ No more warnings!

---

## 📋 Alternative: Manual Setup via GitHub Dashboard

If you prefer not to use the script:

1. **Go to:** https://github.com/ejay-dev/FormaOS/settings/secrets/actions

2. **Add Variables** (click Variables tab):
   - `NEXT_PUBLIC_SUPABASE_URL` = (from Vercel)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (from Vercel)

3. **Add Secrets** (click Secrets tab):
   - `SUPABASE_URL` = same as NEXT_PUBLIC_SUPABASE_URL
   - `SUPABASE_ANON_KEY` = same as NEXT_PUBLIC_SUPABASE_ANON_KEY
   - `SUPABASE_SERVICE_KEY` = from Vercel: SUPABASE_SERVICE_ROLE_KEY
   - `SNYK_TOKEN` = (from Vercel, if exists)
   - `CODECOV_TOKEN` = (from Vercel, if exists)
   - `LHCI_GITHUB_APP_TOKEN` = (from Vercel, if exists)

4. **Test:** Re-run any workflow

---

## 🎯 What Gets Set

| GitHub Variable/Secret | Source (Vercel) |
|----------------------|-----------------|
| **Variables** (public) |
| `NEXT_PUBLIC_SUPABASE_URL` | `NEXT_PUBLIC_SUPABASE_URL` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **Secrets** (encrypted) |
| `SUPABASE_URL` | `NEXT_PUBLIC_SUPABASE_URL` |
| `SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `SUPABASE_SERVICE_KEY` | `SUPABASE_SERVICE_ROLE_KEY` ⚠️ different name |
| `SNYK_TOKEN` | `SNYK_TOKEN` (optional) |
| `CODECOV_TOKEN` | `CODECOV_TOKEN` (optional) |
| `LHCI_GITHUB_APP_TOKEN` | `LHCI_GITHUB_APP_TOKEN` (optional) |

---

## ❓ FAQ

**Q: Why are some values duplicated (public variable + secret)?**  
A: Some workflows need them as variables (public), others as secrets (server-side). It's intentional.

**Q: Do I need all the optional tokens?**  
A: No. SNYK, CODECOV, and LHCI are optional. The workflows will skip those steps if not set.

**Q: Where do I get SUPABASE_SERVICE_ROLE_KEY?**  
A: Vercel Dashboard → Environment Variables → `SUPABASE_SERVICE_ROLE_KEY`  
OR: Supabase Dashboard → Settings → API → service_role key (secret)

**Q: Will this overwrite existing values?**  
A: Yes. The script updates existing values if they exist.

**Q: Can I automate this?**  
A: Yes! Use `scripts/sync-env-to-github-actions-ci.sh` with environment variables set.

---

## 🔗 More Info

- **Complete Guide:** [GITHUB_ACTIONS_ENV_SYNC.md](./GITHUB_ACTIONS_ENV_SYNC.md)
- **Script Docs:** [scripts/README-ENV-SYNC.md](./scripts/README-ENV-SYNC.md)
- **All Env Vars:** [ENV_VARIABLES_REFERENCE.md](./ENV_VARIABLES_REFERENCE.md)

---

**Time to Complete:** ~5 minutes  
**Last Updated:** February 10, 2026
