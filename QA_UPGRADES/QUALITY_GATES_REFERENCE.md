## Quality Gates Reference Guide

> Quick reference for developers working with FormaOS quality gates and CI/CD pipeline

---

### 🚦 Quality Gate Overview

#### Blocking Quality Gates (Must Pass)

- **TypeScript Compilation:** `npx tsc --noEmit` must complete without errors
- **ESLint Critical Errors:** `npm run lint` must have 0 errors (warnings OK)
- **Build Success:** `npm run build` must complete successfully
- **Security Tests:** Admin protection tests must pass 100%

#### Warning Quality Gates (Track & Improve)

- **ESLint Warnings:** Target <100 warnings (currently 239)
- **Test Coverage:** Target 80%+ coverage
- **Performance:** Lighthouse scores >85%
- **Bundle Size:** <5MB main bundle, <20MB total

---

### 🛠️ Local Development Commands

#### Before Pushing Code

```bash
# Check TypeScript compilation
npx tsc --noEmit

# Run ESLint validation
npm run lint

# Run unit tests with coverage
npm test -- --coverage

# Build application
npm run build

# Run critical security tests
npx playwright test e2e/admin-security-verification.spec.ts
```

#### Fix Common Issues

```bash
# Auto-fix ESLint issues
npm run lint -- --fix

# Format code
npx prettier --write "**/*.{ts,tsx,js,jsx,md,json}"

# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

### 🚨 Emergency Deployment

#### When to Use Emergency Override

- Critical security fixes
- Production-breaking bug fixes
- Database/infrastructure emergencies

#### How to Use Emergency Override

1. Go to GitHub Actions
2. Select "Deployment Quality Gates" workflow
3. Click "Run workflow"
4. Check "Emergency deployment (skip quality gates)"
5. Provide justification in commit message

**Note:** Core security and build validation still runs even with override

---

### 📊 Quality Metrics

#### Current Status

- **ESLint Warnings:** 239 (target: <100)
- **TypeScript Errors:** 0 ✅
- **Security Tests:** 20/20 passing ✅
- **Build Status:** Success ✅
- **Performance:** 1.2s load time (target <2s) ✅

#### How to Check Metrics

- **GitHub Actions:** Check workflow results
- **Quality Dashboard:** Daily automated reports
- **Local:** Run commands listed above

---

### 🔧 Troubleshooting Common Issues

#### ESLint Errors

```bash
# Most common: unused variables
# Fix: Remove unused imports/variables or prefix with underscore
const _unusedVar = 'example';

# Type errors
# Fix: Add proper TypeScript types
const handleClick = (event: React.MouseEvent) => { ... }
```

#### Build Failures

```bash
# Clear cache and rebuild
rm -rf .next
npm run build

# Check for missing dependencies
npm audit fix
npm install
```

#### Test Failures

```bash
# Run specific test
npm test -- --testNamePattern="test name"

# Update snapshots
npm test -- --updateSnapshot

# Debug mode
npm test -- --verbose
```

---

### 📋 Workflow Status

#### Check Pipeline Status

1. Go to GitHub repository
2. Click "Actions" tab
3. Check latest workflow runs
4. Click on failed runs to see details

#### Workflow Files

- `quality-gates.yml` - Main quality pipeline
- `security-scan.yml` - Security validation
- `performance-check.yml` - Performance monitoring
- `deployment-gates.yml` - Deployment protection

---

### 🎯 Best Practices

#### Before Committing

- ✅ Run local quality checks
- ✅ Write descriptive commit messages
- ✅ Test changes locally
- ✅ Check for unused imports

#### For Pull Requests

- ✅ Ensure quality gates pass
- ✅ Add tests for new features
- ✅ Update documentation if needed
- ✅ Keep changes focused and small

#### For Emergency Fixes

- ✅ Use emergency override sparingly
- ✅ Document reason for override
- ✅ Plan follow-up to address technical debt
- ✅ Monitor post-deployment

---

_Quick Reference Guide - Updated: 2025-01-15_
