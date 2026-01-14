# QUICK REFERENCE - RBAC INTEGRATION

## What Changed?

| File | From | To | Impact |
|------|------|-----|--------|
| `/app/page.tsx` | 1423 lines (generic) | 88 lines (role-aware) | 94% smaller, cleaner |
| `/app/onboarding/page.tsx` | "staff" role | "member" role | Consistent taxonomy |
| Build status | ❌ Old components | ✅ New components | TypeScript verified |

---

## How It Works Now

### Access Path: New User
```
1. User signs up
   ↓
2. Completes onboarding (selects employer/employee)
   ↓
3. Role saved to org_members.role ('owner' or 'member')
   ↓
4. Lands on /app
   ↓
5. page.tsx detects role
   ├─ owner/admin? → EmployerDashboard (org view)
   └─ member/viewer? → EmployeeDashboard (personal view)
   ↓
6. All subsequent data filtered by role
   - API queries via RLS (database level)
   - Component visibility (UI level)
```

---

## Testing Checklist (Quick)

### Test 1: Employer Account
- [ ] Create account, select "Employer"
- [ ] Dashboard shows organization sections
- [ ] Can see team data

### Test 2: Employee Account  
- [ ] Create account, select "Employee"
- [ ] Dashboard shows personal sections only
- [ ] Cannot see team data

### Test 3: API Permissions
- [ ] Employee API call returns personal data only
- [ ] Employer API call returns all org data

---

## Key URLs

| Path | Audience | Redirects |
|------|----------|-----------|
| `/app` | All authenticated | ✅ No (role-aware rendering) |
| `/admin` | Founders only | Non-founder → `/pricing` |
| `/auth/signin` | Unauthenticated | ✅ Auto → `/app` if logged in |
| `/onboarding` | Incomplete users | ✅ From `/auth` after signup |

---

## Database Roles

```
owner     → Employer with full access
admin     → Admin with full access  
member    → Employee (default), personal view
viewer    → Read-only, personal view
```

---

## Deployment

```bash
# Already done:
✅ Code committed: c956573
✅ Pushed to main
✅ Build passes

# Next steps:
1. npm run dev          # Test locally
2. Deploy to staging    # Use your CI/CD
3. Run E2E tests        # See E2E_TESTING_GUIDE.md
4. Deploy to production # 1 commit back, minimal risk
```

---

## If Issues

### Problem: Wrong role showing
```bash
# Check database
SELECT role FROM org_members WHERE user_id='xxx';

# Should be 'owner' or 'member'
```

### Problem: Employee sees org data
```bash
# 1. Check RLS policies exist
SELECT tablename FROM pg_policies WHERE tablename LIKE 'org_%';

# 2. Check middleware logs
# Should show role detection working

# 3. Clear cache and retry
```

### Problem: Build fails
```bash
rm -rf .next
npm run build

# If still fails:
git revert c956573  # Revert the integration
npm run build       # Should work (rollback)
```

---

## Files to Review

| File | What's New |
|------|-----------|
| `app/app/page.tsx` | Main dashboard - now role-aware |
| `app/onboarding/page.tsx` | Line 31: "staff" → "member" |
| `lib/roles.ts` | Role definitions (existing) |
| `components/dashboard/` | EmployerDashboard, EmployeeDashboard (existing) |

---

## Success Indicators

✅ All of these should be true:

- Dashboard loads at `/app` (no redirects)
- Employer sees org data
- Employee sees personal data
- No console errors
- Network tab shows 200s (not 403s)
- Middleware logs show role detection
- Build completes successfully

---

## Support Resources

| Document | Purpose |
|----------|---------|
| `RBAC_INTEGRATION_COMPLETE.md` | Full overview |
| `E2E_TESTING_GUIDE.md` | Complete testing scenarios |
| `FINAL_INTEGRATION_SUMMARY.md` | Technical details |
| `lib/roles.ts` | Role system source |

---

**Status**: ✅ Ready for Deployment  
**Risk Level**: 🟢 Low (minimal changes, backward-compatible)  
**Estimated QA Time**: 1-2 hours  
**Estimated Deployment**: 5 minutes
