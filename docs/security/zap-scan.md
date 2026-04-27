# OWASP ZAP Baseline Scans

Use ZAP baseline scans against staging to catch security regressions without running destructive active scans.

## Public Baseline

```bash
docker run --rm -t owasp/zap2docker-stable zap-baseline.py \
  -t https://staging.formaos.com \
  -a \
  -m 5
```

## Authenticated App Baseline

Authenticated scans require a safe staging account and a captured browser context. Do not commit auth cookies or generated context files.

Recommended approach:

1. Create a dedicated staging org/user.
2. Capture authenticated context locally.
3. Run ZAP against staging with safe GET-focused crawling.
4. Rotate credentials after testing.

## Release Blocking Findings

Block release on:

- high-confidence high-risk findings
- authentication/session leakage
- reflected or stored XSS
- missing security headers on authenticated routes
- sensitive data exposure
- destructive route exposure through GET requests

## Do Not

- run aggressive active scans against production by default
- scan live customer data
- commit ZAP reports that contain secrets, cookies, or PII
