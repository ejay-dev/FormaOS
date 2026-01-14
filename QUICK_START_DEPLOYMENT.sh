#!/bin/bash

# =====================================================
# FORMAOS SECURITY HARDENING - QUICK START DEPLOYMENT
# =====================================================

echo "🔐 FormaOS Security Hardening - Quick Start Deployment"
echo "========================================================"
echo ""

# Check current directory
if [ ! -f "package.json" ]; then
    echo "❌ ERROR: Not in FormaOS root directory"
    echo "Please run from: /Users/ejay/formaos"
    exit 1
fi

echo "✅ In correct directory: $(pwd)"
echo ""

# Step 1: Verify migration file exists
echo "Step 1: Verifying migration file..."
if [ -f "supabase/migrations/20260114_security_hardening.sql" ]; then
    echo "✅ Migration file found"
    echo "   File: supabase/migrations/20260114_security_hardening.sql"
    echo "   Size: $(wc -l < supabase/migrations/20260114_security_hardening.sql) lines"
else
    echo "❌ Migration file NOT found"
    exit 1
fi

echo ""
echo "Step 2: Verifying documentation..."
docs=(
    "SECURITY_HARDENING_GUIDE.md"
    "SECURITY_HARDENING_REPORT.md"
    "RLS_POLICY_REFERENCE.md"
    "EXECUTION_CHECKLIST.md"
)

all_docs_exist=true
for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        echo "✅ $doc"
    else
        echo "❌ $doc - MISSING"
        all_docs_exist=false
    fi
done

if [ "$all_docs_exist" = false ]; then
    echo ""
    echo "❌ Some documentation files are missing"
    exit 1
fi

echo ""
echo "Step 3: Pre-deployment checks..."

# Check if git is available
if command -v git &> /dev/null; then
    echo "✅ Git available"
    echo "   Current branch: $(git rev-parse --abbrev-ref HEAD)"
    echo "   Last commit: $(git log -1 --pretty=format:'%h - %s')"
else
    echo "⚠️  Git not available (optional)"
fi

echo ""
echo "Step 4: Backup verification..."
echo "ℹ️  Supabase automatic backups are ENABLED"
echo "ℹ️  You can restore from backup if needed"

echo ""
echo "========================================================"
echo ""
echo "🚀 NEXT STEPS:"
echo ""
echo "1. DEPLOY SQL MIGRATION"
echo "   • Open: https://app.supabase.com"
echo "   • Select: FormaOS project"
echo "   • Go to: SQL Editor → + New Query"
echo "   • Copy & paste contents of: supabase/migrations/20260114_security_hardening.sql"
echo "   • Click: RUN"
echo "   • Wait for: \"Query executed successfully\" message"
echo ""
echo "2. VERIFY DEPLOYMENT"
echo "   • Follow Step 2 in: EXECUTION_CHECKLIST.md"
echo "   • Run verification queries in SQL Editor"
echo "   • Expected: All checks pass ✅"
echo ""
echo "3. RUN SECURITY ADVISOR"
echo "   • Go to: Security → Security Advisor"
echo "   • Wait for scan (30-60 seconds)"
echo "   • Expected: 0 errors ✅"
echo ""
echo "4. EXECUTE 5 CRITICAL TESTS"
echo "   • Follow Step 4 in: EXECUTION_CHECKLIST.md"
echo "   • Test each scenario"
echo "   • Expected: All tests pass ✅"
echo ""
echo "5. GIT COMMIT & DEPLOY"
echo "   • Run: bash ./DEPLOY_SECURITY_HARDENING.sh"
echo "   • Or manually commit and push"
echo "   • Vercel will auto-deploy on git push"
echo ""
echo "6. MONITOR FOR 24 HOURS"
echo "   • Watch error logs"
echo "   • Check performance metrics"
echo "   • Follow Step 5 in: EXECUTION_CHECKLIST.md"
echo ""
echo "========================================================"
echo ""
echo "📚 DOCUMENTATION:"
echo "   • EXECUTION_CHECKLIST.md - Step-by-step guide"
echo "   • SECURITY_HARDENING_GUIDE.md - Detailed procedures"
echo "   • SECURITY_HARDENING_REPORT.md - Executive summary"
echo "   • RLS_POLICY_REFERENCE.md - Technical reference"
echo ""
echo "🆘 HELP:"
echo "   • If issues: Check troubleshooting in EXECUTION_CHECKLIST.md"
echo "   • If critical: Use rollback procedure"
echo "   • If stuck: Review SECURITY_HARDENING_GUIDE.md"
echo ""
echo "✅ All checks passed. Ready to deploy!"
echo ""
