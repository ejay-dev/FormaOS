# Rollback Procedures - QA Upgrades

## IMMEDIATE ROLLBACK (< 5 minutes)

### 1. Feature Flag Rollback

```bash
# Disable all new features immediately
export NEXT_PUBLIC_FEATURE_FLAGS="{}"
npm run build && vercel --prod
```

### 2. Git Rollback

```bash
# Revert to last known good commit
git log --oneline -10
git reset --hard <LAST_GOOD_COMMIT>
git push --force-with-lease origin main
```

### 3. Vercel Rollback

```bash
# Roll back to previous deployment
vercel rollback
# OR via dashboard: vercel.com/deployments
```

## GRADUAL ROLLBACK (< 30 minutes)

### 1. Database State Restoration

```sql
-- If any data integrity issues
-- Use Supabase dashboard to restore from backup
-- Point-in-time recovery available
```

### 2. Environment Variable Restoration

```bash
# Restore previous environment configuration
vercel env ls
vercel env rm <PROBLEMATIC_VAR>
vercel env add <VAR_NAME> <PREVIOUS_VALUE> production
```

### 3. Dependency Rollback

```bash
# If package updates cause issues
git checkout HEAD~1 -- package.json package-lock.json
npm ci
npm run build
```

## HEALTH CHECK VERIFICATION

### After Any Rollback:

```bash
# 1. Verify core functionality
curl -f https://formaos.com/api/health

# 2. Test authentication
# Manual: Try Google OAuth + email login

# 3. Test critical user flows
# Manual: Signup → Onboarding → Dashboard

# 4. Verify admin access
# Manual: Founder login → Admin dashboard

# 5. Check error rates
# Dashboard: Vercel Analytics + Sentry
```

## ROLLBACK DECISION MATRIX

| Issue Type          | Severity | Action                | Timeline   |
| ------------------- | -------- | --------------------- | ---------- |
| Auth broken         | Critical | Git rollback          | 2 minutes  |
| Performance -50%    | High     | Feature flags off     | 5 minutes  |
| Visual regression   | Medium   | CSS-only deploy       | 15 minutes |
| Admin access issue  | Critical | Environment rollback  | 10 minutes |
| Database corruption | Critical | Point-in-time restore | 30 minutes |

## POST-ROLLBACK CHECKLIST

- [ ] Verify all core user flows work
- [ ] Check error dashboards (Sentry, Vercel)
- [ ] Confirm database integrity
- [ ] Test authentication methods
- [ ] Validate admin access
- [ ] Monitor performance metrics
- [ ] Document incident and root cause
- [ ] Plan fix with additional safeguards

## EMERGENCY CONTACTS

- **Primary**: ejazhussaini313@gmail.com
- **Secondary**: launchnest.team@gmail.com
- **Vercel Support**: Available if needed
- **Supabase Support**: Available if needed

## BACKUP VERIFICATION

Before any major changes, ensure:

- [ ] Database backup completed (< 1 hour ago)
- [ ] Git repository has clean state
- [ ] Environment variables documented
- [ ] Previous deployment URL available
- [ ] Monitoring baselines captured
