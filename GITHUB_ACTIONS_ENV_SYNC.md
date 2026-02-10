# 🔧 GitHub Actions Environment Variables Sync

**Last Updated:** February 10, 2026  
**Status:** 🟡 Action Required

---

## 🎯 Problem

VS Code GitHub Actions extension shows **"Context access might be invalid"** warnings because:
- GitHub Actions cannot verify that repository Secrets/Variables exist
- Workflows reference `vars.NEXT_PUBLIC_SUPABASE_URL`, `secrets.SUPABASE_URL`, etc.
- These values exist in Vercel but not in GitHub Actions

---

## ✅ Solution

Sync environment variables from Vercel to GitHub Actions Settings.

---

## 📋 Required Variables & Secrets

### GitHub Actions VARIABLES (Public)

These are visible in workflow logs and should be set as **Variables**:

| GitHub Variable Name | Vercel Source | Used By |
|---------------------|---------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | `NEXT_PUBLIC_SUPABASE_URL` | All test workflows |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All test workflows |

### GitHub Actions SECRETS (Private)

These are encrypted and should be set as **Secrets**:

| GitHub Secret Name | Vercel Source | Used By |
|-------------------|---------------|---------|
| `SUPABASE_URL` | `NEXT_PUBLIC_SUPABASE_URL` | QA Pipeline |
| `SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | QA Pipeline |
| `SUPABASE_SERVICE_KEY` | `SUPABASE_SERVICE_ROLE_KEY` | QA Pipeline |
| `SNYK_TOKEN` | `SNYK_TOKEN` (if exists) | Security Scan, Quality Gates |
| `CODECOV_TOKEN` | `CODECOV_TOKEN` (if exists) | Quality Gates |
| `LHCI_GITHUB_APP_TOKEN` | `LHCI_GITHUB_APP_TOKEN` (if exists) | Performance Check |

---

## 🚀 Quick Start - Automated Script

### Option 1: Run the Sync Script (Recommended)

```bash
# Prerequisites:
# - GitHub CLI (gh) installed and authenticated
# - Access to Vercel dashboard or local .env with values

# Run the script
./scripts/sync-env-to-github-actions.sh
```

The script will:
1. ✅ Check prerequisites (gh CLI, authentication)
2. ✅ Prompt for each value
3. ✅ Set variables and secrets in GitHub
4. ✅ Verify configuration

---

## 🔧 Manual Setup

### Option 2: Via GitHub CLI (Manual)

```bash
# Authenticate with GitHub CLI
gh auth login

# Set Variables (public)
gh variable set NEXT_PUBLIC_SUPABASE_URL --repo ejay-dev/FormaOS --body "https://xxx.supabase.co"
gh variable set NEXT_PUBLIC_SUPABASE_ANON_KEY --repo ejay-dev/FormaOS --body "eyJhbGciOi..."

# Set Secrets (private)
echo "https://xxx.supabase.co" | gh secret set SUPABASE_URL --repo ejay-dev/FormaOS
echo "eyJhbGciOi..." | gh secret set SUPABASE_ANON_KEY --repo ejay-dev/FormaOS
echo "eyJhbGciOi...SERVICE_KEY..." | gh secret set SUPABASE_SERVICE_KEY --repo ejay-dev/FormaOS

# Optional secrets (if you have them)
echo "snyk_token_here" | gh secret set SNYK_TOKEN --repo ejay-dev/FormaOS
echo "codecov_token_here" | gh secret set CODECOV_TOKEN --repo ejay-dev/FormaOS
echo "lhci_token_here" | gh secret set LHCI_GITHUB_APP_TOKEN --repo ejay-dev/FormaOS
```

### Option 3: Via GitHub Dashboard (Manual)

1. **Navigate to Repository Settings:**
   - URL: https://github.com/ejay-dev/FormaOS/settings/secrets/actions
   - Or: Repository → Settings → Secrets and variables → Actions

2. **Set Variables (Public):**
   - Click on "Variables" tab
   - Click "New repository variable"
   - Add each variable:
     - Name: `NEXT_PUBLIC_SUPABASE_URL`
     - Value: (from Vercel)
     - Click "Add variable"
   - Repeat for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Set Secrets (Private):**
   - Click on "Secrets" tab
   - Click "New repository secret"
   - Add each secret:
     - Name: `SUPABASE_URL`
     - Value: (from Vercel)
     - Click "Add secret"
   - Repeat for all required secrets

---

## 📥 Getting Values from Vercel

### Method 1: Vercel Dashboard

1. **Go to Vercel Dashboard:**
   - URL: https://vercel.com/dashboard
   - Navigate to your FormaOS project

2. **Access Environment Variables:**
   - Click "Settings" → "Environment Variables"
   - Filter by "Production" environment

3. **Copy Values:**
   - Click the "eye" icon to reveal values
   - Copy each value to set in GitHub

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link to project
vercel link

# List environment variables (doesn't show values for security)
vercel env ls production

# Pull specific environment variable (interactive)
vercel env pull .env.production
# Then view .env.production file
cat .env.production
```

**Note:** Vercel CLI protects secret values. For sensitive keys like `SUPABASE_SERVICE_ROLE_KEY`, you'll need to use the Vercel Dashboard.

---

## 🔍 Verification Steps

### 1. Check GitHub Settings

```bash
# List current variables
gh variable list --repo ejay-dev/FormaOS

# List current secrets (names only, not values)
gh secret list --repo ejay-dev/FormaOS
```

Expected output:
```
Variables:
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SUPABASE_URL

Secrets:
CODECOV_TOKEN
LHCI_GITHUB_APP_TOKEN
SNYK_TOKEN
SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY
SUPABASE_URL
```

### 2. Trigger a Workflow Run

```bash
# Trigger a workflow manually
gh workflow run "QA Pipeline" --repo ejay-dev/FormaOS

# Or re-run the latest workflow
gh run list --repo ejay-dev/FormaOS --limit 1
gh run rerun <run-id> --repo ejay-dev/FormaOS
```

### 3. Check for Warnings

1. Go to: https://github.com/ejay-dev/FormaOS/actions
2. Click on the latest workflow run
3. Check the "Set up job" step
4. Verify no "Context access might be invalid" warnings
5. Check that all jobs pass ✅

---

## 🐛 Troubleshooting

### Issue: "gh: not authenticated"

**Solution:**
```bash
gh auth login
# Follow the prompts to authenticate
```

### Issue: "Resource not accessible by integration"

**Cause:** The GITHUB_TOKEN used doesn't have permission to set secrets/variables.

**Solution:**
- Use a Personal Access Token (PAT) with `repo` scope
- Or run the script locally with your authenticated gh CLI
- Or use the GitHub Dashboard method

### Issue: Workflows still show warnings

**Check:**
1. Variable/secret names match exactly (case-sensitive)
2. Workflow files reference correct names:
   - Variables: `${{ vars.NEXT_PUBLIC_SUPABASE_URL }}`
   - Secrets: `${{ secrets.SUPABASE_URL }}`
3. Values are not empty
4. Re-run the workflow after setting (old runs won't update)

### Issue: "Value is empty"

**Solution:**
- Get the actual value from Vercel Dashboard
- Make sure you're looking at "Production" environment in Vercel
- Verify the variable exists in Vercel (it should be set there first)

---

## 📝 Workflow Files That Use These Variables

### Variables (`vars.*`)
- `.github/workflows/accessibility-testing.yml`
- `.github/workflows/visual-regression.yml`
- `.github/workflows/load-testing.yml`
- `.github/workflows/compliance-testing.yml`

### Secrets (`secrets.*`)
- `.github/workflows/qa-pipeline.yml` - Uses `SUPABASE_*` secrets
- `.github/workflows/quality-gates.yml` - Uses `CODECOV_TOKEN`, `SNYK_TOKEN`
- `.github/workflows/performance-check.yml` - Uses `LHCI_GITHUB_APP_TOKEN`
- `.github/workflows/security-scan.yml` - References but doesn't require external secrets

---

## 🔒 Security Notes

### DO:
- ✅ Set sensitive keys (SERVICE_ROLE_KEY) as Secrets, not Variables
- ✅ Use different values for Production vs Preview in Vercel
- ✅ Rotate keys regularly
- ✅ Keep Vercel as the source of truth for production values

### DON'T:
- ❌ Set service role keys as Variables (they'd be visible in logs)
- ❌ Commit secrets to the repository
- ❌ Share secret values via insecure channels
- ❌ Use production keys in development

---

## 📚 Reference

### Related Workflows

- **QA Pipeline** (`.github/workflows/qa-pipeline.yml`)
  - Uses: `secrets.SUPABASE_URL`, `secrets.SUPABASE_ANON_KEY`, `secrets.SUPABASE_SERVICE_KEY`, `secrets.SNYK_TOKEN`

- **Accessibility Testing** (`.github/workflows/accessibility-testing.yml`)
  - Uses: `vars.NEXT_PUBLIC_SUPABASE_URL`, `vars.NEXT_PUBLIC_SUPABASE_ANON_KEY`

- **Visual Regression** (`.github/workflows/visual-regression.yml`)
  - Uses: `vars.NEXT_PUBLIC_SUPABASE_URL`, `vars.NEXT_PUBLIC_SUPABASE_ANON_KEY`

- **Load Testing** (`.github/workflows/load-testing.yml`)
  - Uses: `vars.NEXT_PUBLIC_SUPABASE_URL`, `vars.NEXT_PUBLIC_SUPABASE_ANON_KEY`

- **Compliance Testing** (`.github/workflows/compliance-testing.yml`)
  - Uses: `vars.NEXT_PUBLIC_SUPABASE_URL`, `vars.NEXT_PUBLIC_SUPABASE_ANON_KEY`

- **Quality Gates** (`.github/workflows/quality-gates.yml`)
  - Uses: `secrets.CODECOV_TOKEN`, `secrets.SNYK_TOKEN`

- **Performance Check** (`.github/workflows/performance-check.yml`)
  - Uses: `secrets.LHCI_GITHUB_APP_TOKEN`

### Vercel Environment Variable Naming

| Vercel Name | GitHub Secret Name | GitHub Variable Name |
|-------------|-------------------|---------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `SUPABASE_URL` | `NEXT_PUBLIC_SUPABASE_URL` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | `SUPABASE_SERVICE_KEY` | _(not public)_ |
| `SNYK_TOKEN` | `SNYK_TOKEN` | _(not public)_ |
| `CODECOV_TOKEN` | `CODECOV_TOKEN` | _(not public)_ |
| `LHCI_GITHUB_APP_TOKEN` | `LHCI_GITHUB_APP_TOKEN` | _(not public)_ |

---

## ✅ Success Checklist

After completing the sync:

- [ ] All required Variables are set in GitHub
- [ ] All required Secrets are set in GitHub
- [ ] Workflow runs show no "Context access might be invalid" warnings
- [ ] At least one workflow has run successfully with the new vars/secrets
- [ ] VS Code GitHub Actions extension no longer shows warnings

---

## 📞 Support

If you encounter issues:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Verify prerequisites (gh CLI authenticated)
3. Verify values exist in Vercel first
4. Check workflow runs for specific errors: https://github.com/ejay-dev/FormaOS/actions

---

**Generated:** February 10, 2026  
**Script Location:** `/scripts/sync-env-to-github-actions.sh`  
**Repository:** https://github.com/ejay-dev/FormaOS
