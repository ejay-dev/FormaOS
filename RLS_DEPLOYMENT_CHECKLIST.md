# 📋 RLS Deployment Checklist

**Status:** Ready to Deploy  
**Last Updated:** January 14, 2026

---

## Pre-Deployment Verification ✅

- [x] RLS migration file created: `20260401_safe_rls_policies.sql`
- [x] Table name inconsistency fixed (org_audit_logs - plural)
- [x] All frontend queries verified with server-side client
- [x] Admin routes verified using service role key
- [x] No TypeScript errors detected
- [x] No build errors detected
- [x] Automated validation tests passing (7/7)
- [x] Changes committed to main branch (3 commits)
- [x] Git push successful to origin/main
- [x] Comprehensive documentation generated

---

## Deployment Steps

### Step 1: Access Supabase SQL Editor ⏳
```
1. Go to https://app.supabase.com
2. Select your FormaOS project
3. Click "SQL Editor" in left sidebar
4. Click "+ New Query"
```

### Step 2: Apply RLS Migration ⏳
```
1. Copy all contents from: supabase/migrations/20260401_safe_rls_policies.sql
2. Paste into Supabase SQL Editor
3. Click "Run" button
4. Wait for completion (should take <30 seconds)
5. Look for success message
```

### Step 3: Verify Policies Applied ⏳
```
1. Go to Authentication > Policies in Supabase
2. Check these tables have RLS enabled:
   - [ ] organizations
   - [ ] org_members
   - [ ] org_subscriptions
   - [ ] org_onboarding_status
   - [ ] team_invitations
   - [ ] org_audit_logs (plural!)
   - [ ] org_audit_events
   - [ ] org_files
3. For each table, verify policies show:
   - Policy names match migration (e.g., "audit_log_org_isolation")
   - Status shows "Active"
```

### Step 4: Verify Application Deployment ⏳
```
1. Check Vercel dashboard: https://vercel.com/dashboard
2. Verify latest commit deployed:
   - Commit: 0a2c069 (Add RLS validation summary)
   - Status: ✅ Production
3. Wait for build to complete if in progress
```

---

## Post-Deployment Testing

### 🧪 Automated Tests
```bash
# Run validation script to re-verify
cd /Users/ejay/formaos
./validate-rls.sh
```

**Expected Output:** All 7 checks should pass ✅

### 🧪 Manual User Testing

#### Test A: Normal User Login ⏳
- [ ] Go to https://app.formaos.com.au
- [ ] Login with normal user account
- [ ] Dashboard loads without errors
- [ ] See personal organization only
- [ ] No RLS errors in browser console (F12)
- [ ] Can view team members
- [ ] Can view subscription details
- [ ] Can view audit history

#### Test B: Founder/Admin Access ⏳
- [ ] Logout and login with founder account
- [ ] Navigate to https://app.formaos.com.au/admin/dashboard
- [ ] Admin dashboard loads
- [ ] Can view /admin/trials (all trial subscriptions)
- [ ] Can view /admin/orgs (all organizations)
- [ ] Can view /admin/users (all users)
- [ ] No 403 or RLS errors

#### Test C: Cross-Org Isolation ⏳
- [ ] Open DevTools (F12) → Console
- [ ] Login as normal user
- [ ] Run:
  ```javascript
  // Try to query different org (should fail or return empty)
  const { data } = await supabase
    .from('org_members')
    .select('*')
    .eq('organization_id', '[some-other-org-id]');
  console.log(data); // Should be empty or error
  ```
- [ ] Verify returns no data (RLS working correctly)

#### Test D: Audit Logs ⏳
- [ ] Navigate to /app/history
- [ ] Audit logs page loads
- [ ] Can see organization's audit trail
- [ ] No RLS errors
- [ ] Pagination works if many logs

---

## Monitoring & Alerts

### Watch For Issues

**In Browser Console:**
- ❌ "permission denied" errors
- ❌ "policy violation" messages
- ❌ 403 Forbidden errors on org queries
- ❌ "relation does not exist" errors

**In Supabase Logs:**
```
1. Go to Authentication > Logs in Supabase
2. Look for RLS-related errors
3. Search for policy violations
4. Check for unexpected 403 errors
```

**If You See Issues:**
1. Check the Rollback section in RLS_DEPLOYMENT_READY.md
2. Disable RLS on affected table if needed
3. Review the fix and re-apply migration
4. Contact support with error details

---

## Troubleshooting

### Issue: "Relation does not exist" Error

**Cause:** RLS migration tried to create policies on non-existent table

**Fix:** 
1. Check if table exists in Supabase Data Editor
2. If missing, create the table first
3. Re-run migration

### Issue: "Permission denied" Errors

**Cause:** User querying org they don't belong to

**Expected:** This IS the security working! RLS blocked access.

**Fix:** Verify user is member of the organization they're accessing

### Issue: Admin Cannot Access All Orgs

**Cause:** Admin routes not using service role key

**Fix:**
1. Check `/api/admin/orgs/route.ts` uses `createSupabaseAdminClient()`
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is set in environment
3. Restart Next.js server

### Issue: Normal User Sees Different Org's Data

**Cause:** RLS not properly applied or query has bug

**Critical:** Stop deployment immediately!

**Fix:**
1. Disable RLS on affected table (see rollback steps)
2. Review the failing query
3. Fix the query or RLS policy
4. Re-apply migration with fix

---

## Success Criteria

### You'll Know RLS is Working When:

✅ Normal users only see their organizations  
✅ Users see only team members in their org  
✅ Users see only their org's subscriptions  
✅ Users see only their org's audit logs  
✅ Founder can access all organizations via admin dashboard  
✅ No unauthorized data is visible to any user  
✅ No performance degradation  
✅ Application still functions normally  

---

## Rollback Procedure (If Critical Issues)

If you need to disable RLS immediately:

```sql
-- Disable RLS on all protected tables
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_onboarding_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_audit_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_files DISABLE ROW LEVEL SECURITY;
```

**Steps:**
1. Go to Supabase SQL Editor
2. Copy above SQL and run it
3. Wait for completion
4. Verify in Authentication > Policies that RLS is OFF
5. Test application works normally
6. Contact support to investigate issues

---

## Support Resources

- **RLS Deployment Guide:** [RLS_DEPLOYMENT_READY.md](RLS_DEPLOYMENT_READY.md)
- **Technical Audit Report:** [POST_RLS_VALIDATION.md](POST_RLS_VALIDATION.md)
- **Implementation Summary:** [RLS_VALIDATION_SUMMARY.md](RLS_VALIDATION_SUMMARY.md)
- **Validation Script:** `./validate-rls.sh`

---

## Approval Sign-Off

**Ready to Deploy?** ✅ YES

**All Checks Passed:** ✅ YES

**Documentation Complete:** ✅ YES

**Rollback Plan Ready:** ✅ YES

---

**Status: READY FOR PRODUCTION DEPLOYMENT** 🚀

This checklist covers all deployment and verification steps. Follow each section carefully and confirm all tests pass before declaring the RLS deployment complete.
