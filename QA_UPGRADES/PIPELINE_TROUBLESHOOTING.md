## Pipeline Troubleshooting Guide

> Common issues and solutions for FormaOS CI/CD pipeline

---

### 🔍 Common Pipeline Failures

#### 1. ESLint Validation Failures

**Symptoms:** `ESLint validation` job fails with errors

**Common Causes:**

- Unused variables/imports
- TypeScript type errors
- Missing dependency declarations
- Code formatting issues

**Solutions:**

```bash
# Auto-fix ESLint issues locally
npm run lint -- --fix

# Check specific file
npx eslint path/to/file.tsx

# Common fixes:
# - Remove unused imports: Delete unused import statements
# - Add underscore to unused variables: const _unused = value
# - Fix type declarations: Add proper TypeScript types
```

#### 2. TypeScript Compilation Errors

**Symptoms:** `TypeScript compilation check` fails

**Common Causes:**

- Missing type declarations
- Import/export mismatches
- Incorrect type usage

**Solutions:**

```bash
# Check compilation locally
npx tsc --noEmit

# Common fixes:
# - Add missing types: interface Props { ... }
# - Fix import paths: Check relative imports
# - Update type definitions: npm install @types/package
```

#### 3. Build Failures

**Symptoms:** `Build application` step fails

**Common Causes:**

- Missing dependencies
- Environment variable issues
- Next.js configuration problems

**Solutions:**

```bash
# Test build locally
npm run build

# Clear cache
rm -rf .next
rm -rf node_modules
npm install
npm run build

# Check for missing env vars in production
# Ensure all required env vars are set in Vercel/deployment
```

#### 4. Security Test Failures

**Symptoms:** Admin security verification tests fail

**Common Causes:**

- Changes to authentication logic
- Middleware configuration issues
- Route protection problems

**Solutions:**

```bash
# Run security tests locally
npx playwright test e2e/admin-security-verification.spec.ts

# Check specific security aspects:
# - Admin route protection
# - Unauthorized page functionality
# - Environment variable security
```

#### 5. E2E Test Timeouts

**Symptoms:** Playwright tests timeout or fail intermittently

**Common Causes:**

- Server startup delays
- Network issues in CI
- Race conditions in tests

**Solutions:**

```bash
# Increase timeout in playwright.config.ts
timeout: 60000  // 60 seconds

# Add wait conditions in tests
await page.waitForLoadState('networkidle')
await page.waitForSelector('[data-testid="element"]')
```

---

### 🚨 Pipeline Stuck or Hanging

#### Symptoms

- Workflow runs for >10 minutes
- Jobs show "in progress" but no activity
- Runner appears unresponsive

#### Solutions

1. **Cancel and Retry:**
   - Go to GitHub Actions
   - Click "Cancel workflow"
   - Re-run the workflow

2. **Check GitHub Status:**
   - Visit status.github.com
   - Look for GitHub Actions outages

3. **Resource Issues:**
   - Large dependencies causing memory issues
   - Consider splitting workflows

---

### 🔧 Workflow Configuration Issues

#### Missing Secrets

**Symptoms:** Jobs fail with "secret not found" errors

**Required Secrets:**

- `CODECOV_TOKEN` - For code coverage reporting
- `SNYK_TOKEN` - For security scanning
- `LHCI_GITHUB_APP_TOKEN` - For Lighthouse CI

**Setup:**

1. Go to Repository Settings
2. Click "Secrets and variables" > "Actions"
3. Add required secrets

#### Permissions Issues

**Symptoms:** "Permission denied" or "Resource not accessible"

**Solutions:**

1. Check repository permissions
2. Verify workflow file permissions
3. Ensure tokens have correct scopes

---

### 📊 Performance Issues

#### Slow Pipeline Execution

**Symptoms:** Quality gates take >10 minutes

**Optimizations:**

1. **Parallel Execution:**
   - Jobs run in parallel where possible
   - Use `needs:` carefully to avoid blocking

2. **Caching:**
   - npm cache is configured
   - Consider adding more caching

3. **Selective Testing:**
   - Use `skip_e2e` input for faster feedback
   - Run full suite only when needed

#### High Resource Usage

**Symptoms:** Runner runs out of memory/disk space

**Solutions:**

```yaml
# Add resource monitoring
- name: Check resources
  run: |
    df -h
    free -m
    ps aux --sort=-%mem | head
```

---

### 🚀 Deployment Issues

#### Failed Vercel Deployment

**Symptoms:** Deployment step fails

**Common Causes:**

- Build artifacts missing
- Environment variables not set
- Vercel configuration issues

**Solutions:**

1. Check Vercel dashboard
2. Verify environment variables
3. Test deployment locally with `vercel --local`

#### Post-deployment Health Checks Fail

**Symptoms:** Health check step reports errors

**Debugging:**

```bash
# Manual health check
curl -I https://formaos.com.au
curl -I https://formaos.com.au/pricing

# Check specific endpoints
curl -v https://formaos.com.au/admin
```

---

### 🛠️ Debug Commands

#### Local Pipeline Simulation

```bash
# Simulate quality gates locally

# 1. Code quality
npx tsc --noEmit
npm run lint
npx prettier --check "**/*.{ts,tsx,js,jsx,md,json}"

# 2. Testing
npm test -- --coverage --watchAll=false

# 3. E2E tests
npx playwright install --with-deps
npm run build
npx playwright test e2e/admin-security-verification.spec.ts

# 4. Security
npm audit --audit-level=high

# 5. Performance
npm run build
ls -la .next/static/chunks/
```

#### Pipeline Debugging

```bash
# Add debug output to workflow
- name: Debug info
  run: |
    echo "Node version: $(node --version)"
    echo "NPM version: $(npm --version)"
    echo "Working directory: $(pwd)"
    echo "Environment: $NODE_ENV"
    ls -la
```

---

### 📞 Getting Help

#### When to Escalate

- Pipeline failures persist after troubleshooting
- Security tests failing unexpectedly
- Infrastructure/GitHub Actions issues
- Emergency deployment needed

#### How to Report Issues

1. **Gather Information:**
   - Workflow run URL
   - Error messages
   - Steps to reproduce
   - Local vs CI differences

2. **Create Issue:**
   - Use GitHub issues
   - Include debug information
   - Tag relevant team members

#### Quick Fixes

- **Re-run failed jobs** - Often resolves transient issues
- **Check GitHub status** - May be platform issues
- **Clear caches** - `rm -rf node_modules .next`
- **Update dependencies** - `npm update`

---

_Troubleshooting Guide - Updated: 2025-01-15_
