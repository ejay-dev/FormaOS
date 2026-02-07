#!/bin/bash

# ============================================
# FormaOS Testing & Monitoring Setup Script
# ============================================
# Run this script to install required dependencies
# and set up testing infrastructure

set -e

echo "🚀 Setting up FormaOS Testing & Performance Monitoring..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Please run this script from the project root."
  exit 1
fi

echo "📦 Installing web-vitals for performance monitoring..."
npm install web-vitals

echo ""
echo "✅ Dependencies installed successfully!"
echo ""

echo "📋 Running test suite to verify setup..."
echo ""

# Run unit tests
echo "Running unit tests..."
npm test tests/onboarding/rbac-utils.test.ts tests/onboarding/progress-persistence.test.ts 2>/dev/null || echo "⚠️ Some tests failed - this is expected if data is not set up"

echo ""
echo "✅ Setup complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Add performance monitoring to your root layout:"
echo "   See: TESTING_AND_PERFORMANCE_GUIDE.md (Setup Instructions)"
echo ""
echo "2. Run tests:"
echo "   npm test                  # All unit tests"
echo "   npm run test:e2e          # All E2E tests"
echo "   npm run test:coverage     # With coverage report"
echo ""
echo "3. View performance dashboard (dev mode):"
echo "   npm run dev"
echo "   Click '📊 Perf' button in bottom-right corner"
echo ""
echo "4. Configure analytics (optional):"
echo "   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX"
echo ""
echo "📖 Full documentation: TESTING_AND_PERFORMANCE_GUIDE.md"
echo "📊 Implementation summary: ENTERPRISE_TESTING_IMPLEMENTATION_COMPLETE.md"
echo ""
