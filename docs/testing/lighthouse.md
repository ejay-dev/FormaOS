# Lighthouse Public Site Testing

Lighthouse tracks public marketing quality for:

- `/`
- `/pricing`
- `/contact`
- `/changelog`
- `/security`
- `/trust`

## Run Locally

Start the app, then run:

```bash
LIGHTHOUSE_BASE_URL=http://localhost:3000 npm run test:lighthouse:public
```

JSON reports and `summary.json` are written under `.lighthouseci/public/`. The directory is ignored and should not be committed.

## Categories

The runner captures:

- performance
- accessibility
- best practices
- SEO

## CI

Use Lighthouse in nightly or pre-release checks, not as the only blocker for every small commit. Investigate regressions when performance or SEO drops materially from the current baseline.
