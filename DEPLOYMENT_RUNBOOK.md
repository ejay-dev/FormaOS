# FormaOS Deployment Runbook

## Pre-Deployment Checklist

### Code Quality (Estimated time: 10 minutes)

- [ ] Run tests locally: `npm test` → All passing
- [ ] Run linter: `npm run lint` → No errors
- [ ] Run build: `npm run build` → Completes successfully
- [ ] Check Git status: `git status` → Working directory clean
- [ ] Create deployment branch: `git checkout -b deploy/$(date +%Y%m%d)`

### Security & Compliance (Estimated time: 5 minutes)

- [ ] Audit dependencies: `npm audit` → 0 high vulnerabilities
- [ ] Review recent commits: `git log --oneline -10`
- [ ] Verify no secrets in code: `git grep -i "password\|secret\|key" -- '*.ts' '*.tsx'`
- [ ] Check environment variables are configured in Vercel

### Database (Estimated time: 5 minutes)

- [ ] Backup production database
  ```bash
  # Via Supabase dashboard: Backups → Download backup
  ```
- [ ] Review pending migrations
- [ ] Verify RLS policies are enabled
- [ ] Test database queries locally

### Performance (Estimated time: 5 minutes)

- [ ] Check Core Web Vitals target < 2.5s LCP
- [ ] Verify image optimization: `npm run build` → "Optimized X images"
- [ ] Check bundle size: `npm run build-stats` → No unexpected increases
- [ ] Monitor performance metrics from last deployment

---

## Deployment to Staging

### 1. Push to Staging Branch (5 min)

```bash
# Commit code
git add -A
git commit -m "feat: Deploy feature to staging

- Describe changes
- Reference any related issues #123
- Performance impact: minimal
"

# Push to staging branch
git push origin develop
```

Vercel will automatically deploy `develop` branch to staging URL.

### 2. Monitor Staging Deployment (5 min)

**Vercel Dashboard:**

```
https://vercel.com/dashboard → Select FormaOS → Deployments
```

**Check:**

- [ ] Build completes ✓
- [ ] No console errors
- [ ] Lighthouse score > 90
- [ ] All environment variables loaded

**Test Staging Environment:**

```bash
# Visit staging URL
https://staging.formaos.com

# Test main flows:
# 1. Login with test account
# 2. View organization overview
# 3. List team members
# 4. Upload evidence
# 5. Change user role
```

### 3. Run E2E Tests on Staging (10 min)

```bash
# If using Playwright/Cypress
npm run test:e2e:staging

# Or manual smoke tests
curl -X GET https://staging.formaos.com/api/org/overview \
  -H "Authorization: Bearer $TEST_JWT"
```

### 4. Performance Testing (5 min)

```bash
# Monitor page load times
# Staging URL → DevTools → Network tab → Check:
# - Page Load Time
# - Largest Contentful Paint (LCP)
# - First Input Delay (FID)
```

### 5. Approval Gate

**Notify stakeholders:**

```
📊 Staging Deployment Complete

URL: https://staging.formaos.com
Build: ✓ Passed
Performance: LCP 1.2s
Tests: ✓ All passing

Ready for approval: /approve
```

---

## Deployment to Production

### 1. Create Release (5 min)

```bash
# Create release tag
git tag -a v1.2.3 -m "Release version 1.2.3: RBAC system + API docs"
git push origin v1.2.3

# Or via GitHub releases
# https://github.com/ejay-dev/FormaOS/releases/new
```

### 2. Deploy to Production (Vercel Auto-Deploy)

**Manual trigger if needed:**

```bash
# Via Vercel CLI
vercel promote staging.formaos.com --prod
```

**Or via GitHub:**

1. Go to GitHub repository
2. Releases → Draft new release
3. Select tag: `v1.2.3`
4. Vercel automatically deploys main branch

### 3. Monitor Production Deployment (10 min)

**Real-time Monitoring:**

```bash
# Vercel logs
vercel logs --prod

# Check error rates
curl https://formaos.com/api/monitoring/health
```

**Metrics to Watch:**

- Error rate < 0.5%
- Response time < 500ms
- API uptime 99.9%

**Sentry Monitoring:**

```
https://sentry.io/organizations/formaos/issues/
```

**DataDog Dashboard:**

```
https://app.datadoghq.com/dashboard/
```

### 4. Smoke Testing (15 min)

**Manual user flow tests:**

```bash
# Test 1: Owner Login & Overview
1. Navigate to https://formaos.com/login
2. Login with admin credentials
3. Verify /app shows organization overview
4. Check all modules visible

# Test 2: Team Management
1. Navigate to /app/team
2. Verify member list loads
3. Try inviting new member
4. Verify role change works

# Test 3: Compliance
1. Navigate to /app/compliance
2. Upload test evidence
3. Verify upload succeeds
4. Check evidence appears in vault

# Test 4: API
curl -X GET https://formaos.com/api/org/overview \
  -H "Authorization: Bearer $PROD_JWT"
# Should return 200 with organization data

# Test 5: Performance
- Open DevTools → Performance tab
- Record page load
- Check LCP < 1.5s
```

### 5. Alerting Verification (5 min)

**Verify alerting is working:**

```bash
# Send test alert
curl -X POST https://formaos.com/api/test/alert \
  -H "Authorization: Bearer $ADMIN_JWT"

# Should receive alerts in:
# - Slack channel #formaos-alerts
# - PagerDuty incident
# - Email notification
```

### 6. Communication Update

**Notify team of successful deployment:**

```
✅ PRODUCTION DEPLOYMENT SUCCESSFUL

Version: v1.2.3
Deployed: 2026-01-14 15:30 UTC
Duration: 4 minutes
Performance: LCP 1.1s (-18%)
Status: ✓ All systems green

New Features:
- Role-Based Access Control (RBAC)
- API Documentation & OpenAPI
- Performance Optimization (52% faster)
- Monitoring & Observability

Metrics:
- Error Rate: 0.2%
- Uptime: 99.95%
- API Response Time: 285ms

No issues detected. All systems operational.
```

---

## Rollback Plan

### If Issues Detected

**Immediate Actions:**

```bash
# 1. Stop the deployment
# (if still in progress)
vercel cancel

# 2. Check recent logs
vercel logs --prod --follow

# 3. Assess severity
#    - Critical (down): Rollback immediately
#    - High (broken feature): Rollback immediately
#    - Low (UI glitch): Monitor and investigate
```

### Automatic Rollback

**Vercel automatically rolls back if:**

- Build fails
- Deployment fails
- Health checks fail (if configured)

### Manual Rollback

```bash
# Via Vercel Dashboard:
# 1. Go to Deployments
# 2. Find previous stable deployment
# 3. Click "..." menu → "Promote to Production"

# Or via CLI:
vercel promote <deployment-url> --prod
```

**Steps:**

```bash
# 1. Promote previous deployment
vercel promote <previous-deployment> --prod

# 2. Verify rollback
curl https://formaos.com/api/org/overview

# 3. Notify team
# Version rolled back to v1.2.2
# Previous version restored: all systems normal
```

---

## Post-Deployment

### 1. Monitor for 1 hour

**Check metrics every 5 minutes:**

```bash
# Error rate
curl https://formaos.com/api/monitoring/health | jq '.errorRate'

# Response time
curl https://formaos.com/api/monitoring/metrics | jq '.avgResponseTime'

# Database performance
```

### 2. User Feedback (30 min - 2 hours)

- Monitor support channels for issues
- Check social media/community for feedback
- Be ready to rollback if critical issues found

### 3. Final Sign-Off (30 min)

**Deployment checklist:**

- [ ] Zero critical errors
- [ ] Performance metrics within target
- [ ] No user complaints
- [ ] Database performing normally
- [ ] All features working as expected

**Update deployment log:**

```markdown
## Deployment: v1.2.3

- **Date**: 2026-01-14
- **Duration**: 4 min
- **Status**: ✅ Successful
- **Tested by**: [@ejay-dev]
- **Issues**: None
- **Sign-off**: Approved
```

---

## Scheduled Deployments

### Best Practices

**Deployment Windows:**

```
✅ GOOD
- Tuesday-Thursday 14:00 UTC (away from weekends)
- Outside peak usage hours
- When support team is available

❌ AVOID
- Monday morning
- Friday afternoon
- Late evening
- Weekend/holidays
```

### Weekly Deployment Schedule

```
Monday:   Review and test
Tuesday:  Deploy to staging
Wednesday: Staging testing & approval
Thursday: Deploy to production
Friday:   Monitor & support
```

---

## Disaster Recovery

### Database Disaster

```bash
# 1. Stop the application
vercel undeploy --prod

# 2. Restore from backup
# Supabase Dashboard → Backups → Restore
# (Choose most recent backup before incident)

# 3. Verify restore
psql $DATABASE_URL -c "SELECT COUNT(*) FROM organizations;"

# 4. Resume deployment
git push origin main
```

### Data Corruption

```bash
# 1. Identify corrupted data
SELECT * FROM org_members WHERE role NOT IN ('owner','admin','member','viewer');

# 2. Backup corrupted data (for investigation)
COPY corrupted_data TO '/tmp/backup.csv';

# 3. Fix corruption
UPDATE org_members SET role = 'member'
WHERE role NOT IN ('owner','admin','member','viewer');

# 4. Verify integrity
SELECT role, COUNT(*) FROM org_members GROUP BY role;
```

### Security Incident

```bash
# 1. Rotate credentials
# - Generate new API keys in Supabase
# - Update environment variables
# - Redeploy application

# 2. Audit logs
# - Check DataDog for suspicious activity
# - Review Supabase logs
# - Check CloudWatch logs

# 3. Notify affected users (if applicable)
```

---

## Monitoring & Alerts

### Production Alerts

| Alert               | Threshold          | Action                         |
| ------------------- | ------------------ | ------------------------------ |
| Error Rate          | > 1%               | Page on-call engineer          |
| Response Time       | > 2s avg           | Investigate, possibly rollback |
| CPU Usage           | > 80%              | Scale up, investigate          |
| Memory Usage        | > 90%              | Restart service, investigate   |
| Database Query Time | > 3s               | Optimize query, scale DB       |
| SSL Certificate     | < 7 days to expiry | Renew certificate              |

### Monitoring Dashboards

**Vercel Analytics:**

```
https://vercel.com/dashboard → FormaOS → Analytics
```

**Sentry:**

```
https://sentry.io/organizations/formaos/
```

**DataDog:**

```
https://app.datadoghq.com/
```

---

## Documentation References

- [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) - Environment configuration
- [PERFORMANCE_OPTIMIZATION.md](PERFORMANCE_OPTIMIZATION.md) - Performance tuning
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API reference
- [TEST_SUITE.md](TEST_SUITE.md) - Testing guide

---

## Deployment Contacts

**On-Call Team:**

- Lead: @ejay-dev
- Backup: @team-member
- On-Call Slack: #formaos-oncall

**Escalation:**

- P1 (Critical): Call 1-800-FORMAOS
- P2 (High): Slack @formaos-team
- P3 (Medium): Email support@formaos.com

---

**Last Updated:** 2026-01-14  
**Version:** 1.0  
**Next Review:** 2026-02-14
