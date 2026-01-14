# 🚀 FormaOS Production Deployment Checklist

## Pre-Deployment Steps

### 1. Database Migrations ⏳

```bash
# Connect to production database
psql "postgresql://<your-connection-string>"

# Run Phase 5 migration
\i migrations/005_phase5_upgrades.sql

# Run Phase 6 migration
\i migrations/006_phase6_upgrades.sql

# Verify tables
\dt

# Verify views
\dv

# Check RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

# Expected: 35+ policies across 26+ tables
```

**Expected Output:**
```
✅ 11 Phase 5 tables created
✅ 10 Phase 6 tables created
✅ 3 Phase 6 views created
✅ 35+ indexes created
✅ 24 Phase 6 RLS policies created
✅ No errors reported
```

---

### 2. Environment Variables ⏳

**Add to Vercel/Production:**

```bash
# Phase 5 - Slack Integration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_BOT_TOKEN=xoxb-your-bot-token

# Phase 6 - Redis Caching & Rate Limiting
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Phase 6 - AI Risk Analysis (Optional)
OPENAI_API_KEY=sk-your-openai-key

# Phase 6 - Email Notifications
RESEND_API_KEY=re_your-resend-key
# OR
SENDGRID_API_KEY=SG.your-sendgrid-key
# OR
AWS_SES_ACCESS_KEY=your-aws-key
AWS_SES_SECRET_KEY=your-aws-secret

# Phase 6 - Microsoft Teams (Optional)
TEAMS_WEBHOOK_URL=https://your-teams-webhook-url

# Verify Existing Variables
FOUNDER_EMAILS=ejazhussaini313@gmail.com
FOUNDER_USER_IDS=<your-founder-user-id>
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
STRIPE_SECRET_KEY=sk_live_your-stripe-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

---

### 3. NPM Dependencies ⏳

```bash
# Install new Phase 6 dependency
npm install @upstash/redis

# Verify all dependencies
npm install

# Build check
npm run build

# Expected: No errors, build succeeds
```

---

### 4. Staging Test ⏳

**Test Checklist:**

- [ ] Login with founder account → /admin accessible
- [ ] Login with regular account → /app dashboard loads
- [ ] Create new user → onboarding flow completes
- [ ] Assign role → employer/employee correctly set
- [ ] Upload evidence → file uploads successfully
- [ ] Create task → task appears in dashboard
- [ ] Real-time → notifications appear instantly
- [ ] Workflow → certificate expiry triggers notification
- [ ] Phase 5 → Slack notification sent
- [ ] Phase 6 → Risk analysis runs
- [ ] Phase 6 → Email notification sent
- [ ] Phase 6 → Rate limiting works (429 response)
- [ ] Performance → Dashboard loads <2s
- [ ] Security → Cross-org access blocked

---

## Production Deployment Steps

### 1. Deploy to Production ⏳

```bash
# If using Vercel
vercel --prod

# If using custom deployment
git push origin main
# Wait for CI/CD pipeline
```

---

### 2. Post-Deployment Verification ⏳

**Immediately After Deployment:**

```bash
# 1. Check health endpoint
curl https://app.formaos.com.au/api/health

# 2. Test founder login
# Navigate to: https://app.formaos.com.au/admin
# Expected: Admin dashboard loads

# 3. Test regular user
# Navigate to: https://app.formaos.com.au/auth/signin
# Expected: Sign in page, then dashboard after login

# 4. Check database connections
# Monitor Supabase dashboard for active connections

# 5. Check Redis cache
# Monitor Upstash dashboard for cache hits

# 6. Check rate limiting
# Make 11+ requests to API endpoint
# Expected: 429 Too Many Requests on 11th request
```

---

### 3. Monitoring Setup ⏳

**Configure Alerts for:**

- [ ] Error rate >5%
- [ ] Response time >2s (p95)
- [ ] Rate limit 429 responses spike
- [ ] Database connection errors
- [ ] Redis connection failures
- [ ] Workflow execution failures
- [ ] Email delivery failures
- [ ] AI API errors

**Monitor These Metrics:**
```
Dashboard Load Time: <2s
API Response Time: <500ms
Cache Hit Rate: >80%
Database Query Time: <200ms
Real-time Latency: <100ms
Error Rate: <1%
```

---

## Production Validation Tests

### Test 1: Founder Admin Access ⏳

```
1. Navigate to https://app.formaos.com.au/admin
2. Expected: Redirect to /auth/signin
3. Sign in with founder email
4. Expected: Redirect to /admin/dashboard
5. Verify: Admin console loads
6. Check console logs for: "✅ FOUNDER ACCESS GRANTED"
```

### Test 2: Regular User Access ⏳

```
1. Sign in with non-founder email
2. Expected: Redirect to /onboarding OR /app
3. Complete onboarding if needed
4. Expected: Dashboard loads (employer or employee view)
5. Verify: Correct role-based dashboard displays
```

### Test 3: RBAC Validation ⏳

```
# Employer/Owner Test
1. Sign in as owner
2. Navigate to team management
3. Expected: Can view all team members
4. Try to add new member
5. Expected: Invitation sent successfully

# Employee/Member Test
1. Sign in as member
2. Navigate to dashboard
3. Expected: Only personal sections visible
4. Try to access /admin
5. Expected: Redirected to /pricing or blocked
```

### Test 4: Real-Time Features ⏳

```
1. Open dashboard in two browser windows
2. User A: Update a task
3. User B: Expected: Real-time notification appears
4. User B: Click notification
5. Expected: Task details load
```

### Test 5: Workflow Automation ⏳

```
1. Create a certificate with expiry date in 29 days
2. Wait for scheduled job (or trigger manually)
3. Expected: Notification sent
4. Expected: Renewal task created
5. Check: Workflow execution logs
```

### Test 6: Phase 6 Features ⏳

```
# Risk Analysis
1. Navigate to /app/risk-analysis
2. Click "Run Analysis"
3. Expected: Risk score calculated (0-100)
4. Expected: AI insights displayed
5. Expected: Top risks listed

# Email Notifications
1. Assign a task to a user
2. Expected: Email sent to user
3. Check email delivery logs
4. Verify: Email delivered successfully

# Rate Limiting
1. Make 11 API requests rapidly
2. Expected: First 10 succeed (200)
3. Expected: 11th fails (429)
4. Expected: X-RateLimit-Remaining header decreases
```

---

## Rollback Plan (If Needed)

### Quick Rollback

```bash
# Revert to previous deployment
vercel rollback

# OR revert Git commit
git revert HEAD
git push origin main
```

### Database Rollback

```sql
-- If Phase 6 migration causes issues
DROP TABLE IF EXISTS risk_analyses CASCADE;
DROP TABLE IF EXISTS ai_insights CASCADE;
DROP TABLE IF EXISTS email_logs CASCADE;
DROP TABLE IF EXISTS email_preferences CASCADE;
DROP TABLE IF EXISTS compliance_scans CASCADE;
DROP TABLE IF EXISTS scan_findings CASCADE;
DROP TABLE IF EXISTS dashboard_layouts CASCADE;
DROP TABLE IF EXISTS api_usage_logs CASCADE;
DROP TABLE IF EXISTS api_alert_config CASCADE;
DROP TABLE IF EXISTS scheduled_tasks CASCADE;

DROP VIEW IF EXISTS risk_summary CASCADE;
DROP VIEW IF EXISTS compliance_status CASCADE;
DROP VIEW IF EXISTS api_health CASCADE;
```

---

## Success Criteria

### Deployment Successful When:

- [x] All migrations run without errors
- [x] All environment variables configured
- [x] Build succeeds with no errors
- [x] Health endpoint returns 200
- [x] Founder can access /admin
- [x] Regular users can access /app
- [x] RBAC enforced correctly
- [x] Real-time features working
- [x] Workflows executing
- [x] Phase 5 features functional
- [x] Phase 6 features functional
- [x] No critical errors in logs
- [x] Performance metrics met

---

## Post-Deployment Checklist

### First Hour
- [ ] Monitor error logs
- [ ] Check user sign-ins
- [ ] Verify dashboard loads
- [ ] Test critical workflows

### First Day
- [ ] Review performance metrics
- [ ] Check rate limiting stats
- [ ] Monitor email deliveries
- [ ] Verify webhook deliveries
- [ ] Review AI API usage

### First Week
- [ ] Analyze cache hit rates
- [ ] Review workflow execution logs
- [ ] Check for any RLS issues
- [ ] Monitor database query performance
- [ ] Gather user feedback

---

## Support Contacts

**Emergency Rollback:** Immediate (via Vercel dashboard or Git)  
**Database Issues:** Check Supabase logs and status  
**Redis Issues:** Check Upstash dashboard  
**Email Issues:** Check Resend/SendGrid logs  

---

## Completion Sign-Off

- [ ] **Phase 5 Migration:** Executed successfully
- [ ] **Phase 6 Migration:** Executed successfully  
- [ ] **Environment Variables:** All configured
- [ ] **Dependencies:** Installed
- [ ] **Staging Test:** All tests passed
- [ ] **Production Deploy:** Successful
- [ ] **Post-Deploy Tests:** All passed
- [ ] **Monitoring:** Configured and active
- [ ] **Documentation:** Updated
- [ ] **Team Notified:** Yes

**Deployment Status:** ⏳ READY TO EXECUTE

**Sign-Off:**
- **Technical Lead:** _________________
- **Date:** _________________
- **Production URL:** https://app.formaos.com.au

---

**END OF DEPLOYMENT CHECKLIST**
