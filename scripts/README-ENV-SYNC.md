# 🔧 Environment Variable Sync Scripts

This directory contains scripts to sync environment variables from Vercel to GitHub Actions.

---

## 📋 Scripts Overview

### 1. `sync-env-to-github-actions.sh`
**Interactive script** - Prompts for values and sets them in GitHub Actions.

**Use when:**
- Running locally on your machine
- You have access to Vercel Dashboard to copy values
- You want to manually enter each value

**Features:**
- ✅ Checks prerequisites
- ✅ Interactive prompts for each value
- ✅ Secure input (passwords hidden)
- ✅ Attempts to fetch from Vercel CLI
- ✅ Verification at the end

### 2. `sync-env-to-github-actions-ci.sh`
**Non-interactive script** - Reads from environment variables and sets in GitHub Actions.

**Use when:**
- Running in CI/CD pipeline
- Values already available as environment variables
- Automation/scripting scenarios
- Batch operations

**Features:**
- ✅ Reads from environment variables
- ✅ Silent operation (non-interactive)
- ✅ Skips missing values
- ✅ Suitable for automation

---

## 🚀 Usage

### Interactive Script

```bash
# Run the script - it will prompt for each value
./scripts/sync-env-to-github-actions.sh
```

Example session:
```
Setting variable: NEXT_PUBLIC_SUPABASE_URL
Enter NEXT_PUBLIC_SUPABASE_URL (e.g., https://xxx.supabase.co): https://abcdefg.supabase.co
✅ Set: NEXT_PUBLIC_SUPABASE_URL

Setting secret: SUPABASE_SERVICE_KEY
Enter SUPABASE_SERVICE_KEY (from Vercel: SUPABASE_SERVICE_ROLE_KEY): [hidden input]
✅ Set: SUPABASE_SERVICE_KEY
```

### Non-Interactive Script (CI)

```bash
# Set environment variables first
export NEXT_PUBLIC_SUPABASE_URL="https://abcdefg.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
export SNYK_TOKEN="your-snyk-token"
export CODECOV_TOKEN="your-codecov-token"
export LHCI_GITHUB_APP_TOKEN="your-lhci-token"

# Run the script
./scripts/sync-env-to-github-actions-ci.sh
```

---

## 📦 Prerequisites

Both scripts require:

1. **GitHub CLI (`gh`)** installed and authenticated
   ```bash
   # Install (macOS)
   brew install gh
   
   # Install (Linux)
   sudo apt install gh
   
   # Authenticate
   gh auth login
   ```

2. **Repository access** - You must have write access to set secrets/variables

Optional for interactive script:
3. **Vercel CLI** (for automatic value fetching)
   ```bash
   npm install -g vercel
   vercel login
   ```

---

## 🔐 Security

### Secrets vs Variables

**Variables** (public):
- Visible in workflow logs
- Used for non-sensitive data
- Examples: URLs, public keys

**Secrets** (encrypted):
- Never visible in logs
- Encrypted at rest
- Used for sensitive data
- Examples: API keys, service role keys

### What Goes Where

| Value | Type | Why |
|-------|------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Variable | Public URL, safe to expose |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Variable | Anon key is limited by RLS |
| `SUPABASE_SERVICE_KEY` | Secret | Admin key, bypasses RLS |
| `SNYK_TOKEN` | Secret | Private API token |
| `CODECOV_TOKEN` | Secret | Private API token |
| `LHCI_GITHUB_APP_TOKEN` | Secret | Private API token |

---

## 🎯 Values Mapping

| GitHub Name | Vercel Name | Notes |
|------------|-------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` (var) | `NEXT_PUBLIC_SUPABASE_URL` | Same name |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` (var) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same name |
| `SUPABASE_URL` (secret) | `NEXT_PUBLIC_SUPABASE_URL` | Duplicate for server use |
| `SUPABASE_ANON_KEY` (secret) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Duplicate for server use |
| `SUPABASE_SERVICE_KEY` (secret) | `SUPABASE_SERVICE_ROLE_KEY` | Name differs! |
| `SNYK_TOKEN` (secret) | `SNYK_TOKEN` | Optional |
| `CODECOV_TOKEN` (secret) | `CODECOV_TOKEN` | Optional |
| `LHCI_GITHUB_APP_TOKEN` (secret) | `LHCI_GITHUB_APP_TOKEN` | Optional |

---

## ✅ Verification

After running either script, verify:

```bash
# List variables
gh variable list --repo ejay-dev/FormaOS

# List secrets (names only)
gh secret list --repo ejay-dev/FormaOS

# Trigger a workflow to test
gh workflow run "QA Pipeline" --repo ejay-dev/FormaOS

# Check workflow status
gh run list --repo ejay-dev/FormaOS --limit 5
```

---

## 🐛 Troubleshooting

### "gh: command not found"
Install GitHub CLI: https://cli.github.com/

### "gh: not authenticated"
Run: `gh auth login`

### "Resource not accessible by integration"
The GITHUB_TOKEN doesn't have permission. Either:
- Run locally with your authenticated gh CLI
- Use a Personal Access Token with `repo` scope

### "Failed to set secret/variable"
Check:
- Repository name is correct: `ejay-dev/FormaOS`
- You have write access to the repository
- GitHub CLI is properly authenticated
- Value is not empty

### Values still not working in workflows
- Re-run the workflow (old runs don't update)
- Check workflow file references correct names
- Verify case sensitivity (e.g., `vars.NEXT_PUBLIC_SUPABASE_URL`)

---

## 📚 Related Documentation

- [GITHUB_ACTIONS_ENV_SYNC.md](../GITHUB_ACTIONS_ENV_SYNC.md) - Complete guide
- [ENV_VARIABLES_REFERENCE.md](../ENV_VARIABLES_REFERENCE.md) - All environment variables
- [VERCEL_ENV_VAR_SETUP.md](../VERCEL_ENV_VAR_SETUP.md) - Vercel configuration

---

## 🔄 CI/CD Integration Example

```yaml
# .github/workflows/sync-env.yml
name: Sync Environment Variables

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to sync from'
        required: true
        default: 'production'

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Sync from Vercel to GitHub
        env:
          # These should be set as GitHub Secrets first
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.VERCEL_NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.VERCEL_NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.VERCEL_SUPABASE_SERVICE_ROLE_KEY }}
          SNYK_TOKEN: ${{ secrets.VERCEL_SNYK_TOKEN }}
          GH_TOKEN: ${{ secrets.REPO_ACCESS_TOKEN }}
        run: |
          ./scripts/sync-env-to-github-actions-ci.sh
```

---

## 📞 Support

For issues or questions:
1. Check the [GITHUB_ACTIONS_ENV_SYNC.md](../GITHUB_ACTIONS_ENV_SYNC.md) guide
2. Review workflow files in `.github/workflows/`
3. Check GitHub Actions logs: https://github.com/ejay-dev/FormaOS/actions

---

**Last Updated:** February 10, 2026
