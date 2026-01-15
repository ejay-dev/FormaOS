#!/bin/bash

# Professional SaaS QA Pipeline Installation Script
echo "🚀 Setting up Professional SaaS QA Pipeline for FormaOS..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this from the FormaOS root directory."
    exit 1
fi

# Install testing dependencies
echo "📦 Installing testing dependencies..."
npm install --save-dev \
    @types/node \
    @types/react \
    @types/react-dom \
    typescript \
    eslint \
    eslint-config-next \
    eslint-plugin-jsx-a11y \
    eslint-plugin-testing-library \
    eslint-plugin-jest-dom \
    eslint-plugin-security \
    @typescript-eslint/eslint-plugin \
    @typescript-eslint/parser \
    stylelint \
    stylelint-config-standard \
    stylelint-config-css-modules \
    stylelint-a11y \
    jest \
    jest-environment-jsdom \
    @testing-library/react \
    @testing-library/jest-dom \
    @testing-library/user-event \
    @playwright/test \
    backstopjs \
    @lhci/cli \
    pa11y-ci \
    axe-core \
    @axe-core/playwright \
    snyk \
    wait-on

# Install monitoring dependencies
echo "📊 Installing monitoring dependencies..."
npm install --save \
    @vercel/analytics \
    @vercel/speed-insights \
    @sentry/nextjs \
    web-vitals

# Create necessary directories
echo "📁 Creating test directories..."
mkdir -p __tests__/{auth,onboarding,components,utils}
mkdir -p e2e
mkdir -p scripts
mkdir -p .github/workflows
mkdir -p lib/monitoring
mkdir -p backstop_data
mkdir -p lighthouse-reports

# Install Playwright browsers
echo "🎭 Installing Playwright browsers..."
npx playwright install

# Generate visual regression baselines
echo "📸 Setting up visual regression baselines..."
npm run test:visual:reference || echo "ℹ️  Visual baselines will be created on first run"

# Set up monitoring
echo "📊 Setting up monitoring configuration..."
npm run setup:monitoring

# Create .env.example for required environment variables
cat > .env.example << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Monitoring Configuration
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SNYK_TOKEN=your_snyk_token

# Testing Configuration
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword123
ADMIN_USER_EMAIL=admin@example.com
ADMIN_USER_PASSWORD=adminpassword123
EOF

# Update .gitignore
cat >> .gitignore << EOF

# Testing
coverage/
playwright-report/
test-results/
backstop_data/bitmaps_test/
backstop_data/html_report/
lighthouse-reports/

# Monitoring
.sentry-build-info
EOF

echo "✅ Professional SaaS QA Pipeline setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Copy .env.example to .env and fill in your values"
echo "2. Set up your CI/CD secrets in GitHub:"
echo "   - SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY"
echo "   - NEXT_PUBLIC_SENTRY_DSN, SNYK_TOKEN"
echo "3. Run 'npm run qa:full' to test the entire pipeline"
echo "4. Push to trigger the CI/CD pipeline"
echo ""
echo "📚 Available commands:"
echo "   npm run test:all      - Run all tests"
echo "   npm run test:e2e      - Run E2E tests"
echo "   npm run test:visual   - Run visual regression tests"
echo "   npm run test:a11y     - Run accessibility tests"
echo "   npm run qa:full       - Full QA audit including backend"