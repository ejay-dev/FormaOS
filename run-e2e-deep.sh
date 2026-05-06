#!/bin/zsh
export PW_SKIP_WEBSERVER=1
export PLAYWRIGHT_BASE_URL=http://localhost:3002
cd /Users/ejaz/FormaOS
# Trust localhost:3002 in CSRF checks (production build runs on :3002 for E2E)
export CSRF_TRUSTED_ORIGINS=http://localhost:3002
export NEXT_PUBLIC_APP_URL=http://localhost:3002
export NEXT_PUBLIC_SITE_URL=http://localhost:3002

if ! curl -fsS http://localhost:3002/ >/dev/null 2>&1; then
	echo "[run-e2e-deep] Server on :3002 is down. Starting Next.js production server..."
	PORT=3002 node_modules/.bin/next start -p 3002 > /tmp/next-server.log 2>&1 &
fi

for i in {1..90}; do
	if curl -fsS http://localhost:3002/ >/dev/null 2>&1; then
		break
	fi
	if [[ "$i" -eq 90 ]]; then
		echo "[run-e2e-deep] ERROR: localhost:3002 did not become ready in time"
		exit 1
	fi
	sleep 1
done

npx playwright test --max-failures=25 --workers=1
