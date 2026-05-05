#!/bin/zsh
export PW_SKIP_WEBSERVER=1
export PLAYWRIGHT_BASE_URL=http://localhost:3002
cd /Users/ejaz/FormaOS
# Trust localhost:3002 in CSRF checks (production build runs on :3002 for E2E)
export CSRF_TRUSTED_ORIGINS=http://localhost:3002
export NEXT_PUBLIC_APP_URL=http://localhost:3002
export NEXT_PUBLIC_SITE_URL=http://localhost:3002
npx playwright test --max-failures=25 --workers=1
