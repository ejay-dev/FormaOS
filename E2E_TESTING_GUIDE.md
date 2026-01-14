# END-TO-END TESTING GUIDE - RBAC System Verification

## Pre-Test Verification

### Database Checks
```sql
-- Verify roles table exists
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'org_members' AND column_name = 'role';

-- Should show: role | text

-- Verify existing org_members have roles
SELECT id, user_id, organization_id, role FROM org_members LIMIT 5;

-- Verify RLS policies are active
SELECT schemaname, tablename, policyname, qual 
FROM pg_policies WHERE tablename IN ('org_members', 'org_tasks', 'org_evidence')
LIMIT 10;
```

---

## Test Scenario 1: Employer Journey (Owner Role)

### Step 1: Create Test Account (Employer)
1. Go to `https://yourapp.com/auth/signin`
2. Click "Sign up"
3. Enter:
   - Email: `employer-test@example.com`
   - Password: Strong password
4. Click "Sign up"
5. ✅ **Expected**: Redirected to organization setup form

### Step 2: Complete Onboarding (Employer)
1. On onboarding form:
   - Organization Name: "Test Corp"
   - Industry: Pick any
   - Select **"Employer / Organization admin"** radio button
   - Accept terms
   - Click "Create organization"
2. ✅ **Expected**: 
   - Redirected to `/app` 
   - Database shows: `org_members.role = 'owner'`
   - Dashboard displays **EmployerDashboard** sections

### Step 3: Verify Employer Dashboard Content
1. Check visible sections:
   - [ ] Organization name "Test Corp" displays in header
   - [ ] Role badge shows "Owner" or "Admin"
   - [ ] Team overview section visible
   - [ ] Organization compliance summary visible
   - [ ] Can see **all team data** (if team exists)
   - [ ] Settings link available
   - [ ] Billing link available

### Step 4: Verify Employer API Access
1. Open browser DevTools → Network tab
2. Click "View tasks" or similar button
3. Monitor API call: `/api/org/tasks`
4. ✅ **Expected**:
   - Response includes **all org tasks** (not filtered to user)
   - Status: 200 OK
   - Full dataset returned

### Step 5: Verify Admin Isolation
1. Try to navigate to `https://yourapp.com/admin`
2. ✅ **Expected**: 
   - For non-founder employer: Redirected to `/pricing`
   - (Only founders can access /admin based on env vars)

---

## Test Scenario 2: Employee Journey (Member Role)

### Step 1: Create Test Account (Employee)
1. Go to `https://yourapp.com/auth/signin`
2. Click "Sign up"
3. Enter:
   - Email: `employee-test@example.com`
   - Password: Strong password
4. Click "Sign up"
5. ✅ **Expected**: Redirected to organization setup form

### Step 2: Complete Onboarding (Employee)
1. On onboarding form:
   - Organization Name: "Test Corp" (or different org)
   - Industry: Pick any
   - Select **"Employee / Field staff"** radio button
   - Accept terms
   - Click "Create organization"
2. ✅ **Expected**: 
   - Redirected to `/app`
   - Database shows: `org_members.role = 'member'`
   - Dashboard displays **EmployeeDashboard** sections

### Step 3: Verify Employee Dashboard Content
1. Check visible sections:
   - [ ] Organization name displays
   - [ ] Role badge shows "Employee" or "Member"
   - [ ] Personal compliance status visible
   - [ ] My tasks section visible
   - [ ] My evidence section visible
   - [ ] Settings/Billing links are **hidden or locked**

### Step 4: Verify Employee Data Isolation
1. Open browser DevTools → Network tab
2. Click "View my tasks"
3. Monitor API call: `/api/org/tasks`
4. ✅ **Expected**:
   - Response includes **only personal tasks** (WHERE assigned_to = user_id)
   - Status: 200 OK
   - Other team members' tasks NOT returned

### Step 5: Verify Employee Cannot See Org Data
1. Try direct API call in console:
   ```javascript
   fetch('/api/org/members')
     .then(r => r.json())
     .then(d => console.log(d))
   ```
2. ✅ **Expected**:
   - Either 403 Forbidden (access denied)
   - Or empty array (RLS filter applied)

---

## Test Scenario 3: Same Organization Multi-User Access

### Prerequisites
- Must have 2 test accounts already created (from Scenarios 1 & 2)
- **Important**: Make sure both accounts are in the **same organization**

### Step 1: Employer Views Organization
1. Log in as `employer-test@example.com`
2. Go to `/app`
3. ✅ **Expected**:
   - EmployerDashboard loads
   - Can see team section (if employees exist)
   - Shows 2 team members (including self and the employee test account)

### Step 2: Employee Views Same Organization
1. Open **incognito/private window**
2. Go to `https://yourapp.com/auth/signin`
3. Log in as `employee-test@example.com`
4. ✅ **Expected**:
   - EmployeeDashboard loads
   - Shows only **personal data**
   - Does NOT see employer's data
   - Team member list is either hidden or shows only personal info

### Step 3: Cross-Role API Permission Check
1. As employee (logged in), run in console:
   ```javascript
   // Should return only personal tasks
   fetch('/api/org/tasks')
     .then(r => r.json())
     .then(d => console.log('Employee tasks:', d))
   
   // Should fail or return empty for other users' tasks
   fetch('/api/org/tasks?user_id=<employer-id>')
     .then(r => r.json())
     .then(d => console.log('Cross-user attempt:', d))
   ```
2. ✅ **Expected**:
   - First call: Returns personal tasks (200 OK)
   - Second call: Returns nothing or 403 (permission denied)

---

## Test Scenario 4: Router/Middleware Verification

### Test 4a: Unauthenticated Access
1. Incognito/Private window
2. Go to `https://yourapp.com/app`
3. ✅ **Expected**: Redirected to `/auth/signin`

### Test 4b: /Admin Access (Non-Founder)
1. Log in as regular user
2. Try: `https://yourapp.com/admin`
3. ✅ **Expected**: Redirected to `/pricing` (for non-founders)

### Test 4c: Auth Page Redirect (Logged In)
1. Log in as regular user
2. Try: `https://yourapp.com/auth/signin`
3. ✅ **Expected**: Redirected to `/app` (already authenticated)

### Test 4d: Onboarding Redirect
1. Log in as regular user
2. Don't complete onboarding (somehow)
3. ✅ **Expected**: If accessing app, redirected to `/onboarding`

---

## Test Scenario 5: Browser Console Checks

### No TypeScript/Console Errors
1. Log in as employer and employee
2. Open DevTools → Console tab
3. ✅ **Expected**:
   - No red errors about `undefined role`
   - No 401/403 errors for legitimate requests
   - No hydration mismatches
   - No import errors

### Performance Check
1. Dashboard should load in < 3 seconds
2. API calls should be < 1 second
3. ✅ **Expected**: Smooth UX, no loading spinners > 5s

---

## Test Scenario 6: Module Access Control

### For Employer (Owner)
1. ✅ Can access: Organizations, Team, Compliance, Tasks, Vault, Reports, Audit, Billing
2. ✅ All modules show "Unlocked"

### For Employee (Member)
1. ✅ Can access: Personal Compliance, My Tasks, My Vault
2. ✅ Other modules show:
   - Either "Locked for your role" message
   - Or completely hidden from sidebar
3. ✅ Locked modules don't navigate/404 properly

---

## Verification Checklist

| Item | Employer | Employee | Status |
|------|----------|----------|--------|
| Dashboard renders | ✅ | ✅ | [ ] |
| Role displays correctly | ✅ Owner | ✅ Member | [ ] |
| Sees org-wide data | ✅ | ❌ | [ ] |
| Sees personal data | ✅ | ✅ | [ ] |
| Can access /admin | ❌ (non-founder) | ❌ | [ ] |
| API respects role | ✅ | ✅ | [ ] |
| No console errors | ✅ | ✅ | [ ] |
| Performance < 3s | ✅ | ✅ | [ ] |
| Locked modules hidden | ✅ | ✅ | [ ] |

---

## Troubleshooting

### Issue: Dashboard shows wrong role
**Solution**:
```bash
# Check database
SELECT role FROM org_members WHERE user_id = 'xxx';

# Should be 'owner' or 'member', not 'staff'
```

### Issue: Employee can see org data
**Solution**:
1. Check RLS policies are deployed:
   ```sql
   SELECT policyname FROM pg_policies WHERE tablename = 'org_tasks';
   ```
2. Ensure middleware is working (check logs)
3. Clear browser cache and retry

### Issue: Build fails with type errors
**Solution**:
```bash
# Rebuild from clean
rm -rf .next
npm run build

# Ensure page_old.tsx was deleted
ls app/app/page*
```

### Issue: Middleware not redirecting
**Solution**:
1. Check env vars in Vercel:
   - `FOUNDER_EMAILS`
   - `FOUNDER_USER_IDS`
2. Middleware logs should show founder detection
3. Non-founders should redirect to `/pricing`

---

## Sign-Off

- [ ] All test scenarios completed
- [ ] Employer can see org data
- [ ] Employee can see only personal data
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Ready for production deployment

**Tested by**: ________________  
**Date**: ________________  
**Result**: PASS / FAIL
