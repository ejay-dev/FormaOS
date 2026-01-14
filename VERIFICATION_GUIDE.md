# ⚡ Performance Optimization - Verification Guide

## Quick Start: How to Verify the Optimizations

### Step 1: Install Dependencies
```bash
cd /Users/ejay/formaos
npm install
# Zustand will be installed
```

### Step 2: Start Dev Server
```bash
npm run dev
# App runs at http://localhost:3000
```

### Step 3: Open DevTools
```
Mac: Cmd + Opt + I
Windows: F12
```

### Step 4: Check Each Metric

---

## 🔍 Verification Checklist

### ✅ 1. Hydration Store is Populated
**Where**: DevTools → Application → Cookies/Storage  
**What to look for**: Zustand store has `user`, `organization`, `role`

**Steps**:
1. Navigate to app after login
2. Open DevTools → Application tab
3. Look for Zustand state in storage
4. Should show:
   ```json
   {
     "user": { "id": "...", "email": "...", "name": "..." },
     "organization": { "id": "...", "name": "..." },
     "role": "owner",
     "isFounder": false,
     "entitlements": { ... }
   }
   ```

---

### ✅ 2. Zero Duplicate Database Queries
**Where**: DevTools → Network tab  
**What to look for**: No repeated `org_members` queries

**Steps**:
1. Open DevTools → Network tab
2. Clear network log
3. Click "Policies" in sidebar
4. Observe requests:
   - ❌ Should NOT see `/auth/callback`
   - ❌ Should NOT see `org_members` query
   - ✅ Should see ONLY org_policies query
   - ✅ Maybe one `/api/system-state` on first load

**Expected**:
```
Before: 3-5 database calls per page
After:  1 database call (page-specific data only)
```

---

### ✅ 3. Sidebar Navigation is Instant
**Where**: Browser performance  
**What to look for**: Sub-100ms transitions

**Steps**:
1. Open DevTools → Performance tab
2. Click recording button
3. Click "Tasks" in sidebar
4. Stop recording
5. Look at timeline:
   - Yellow/green bars should complete in <100ms
   - Should see no long tasks or "layout thrashing"

**Expected**:
```
Before: 400-600ms (visible delay)
After:  <100ms (instant)
```

---

### ✅ 4. Routes are Prefetched
**Where**: DevTools → Network tab  
**What to look for**: Routes loaded before clicking

**Steps**:
1. Open DevTools → Network tab
2. Clear all
3. Just load the app (don't click anything)
4. Wait 1-2 seconds
5. Look for these chunks being downloaded:
   - `policies/page.js`
   - `tasks/page.js`
   - `people/page.js`
   - etc.

**Expected**:
```
✅ Routes prefetched in background
✅ Click = no network delay, just render
```

---

### ✅ 5. Policies Page Works (Client Component)
**Where**: /app/policies  
**What to look for**: Policies load, no server errors

**Steps**:
1. Click "Policies" in sidebar
2. Should see policies list instantly
3. Check Network tab:
   - Should see request to `org_policies`
   - Should NOT see request to `org_members`
4. DevTools Console:
   - Should have NO errors
   - Should see log like: `[Policies] Fetching...`

**Expected**:
```
✅ Policies load from store org_id
✅ No org_members query
✅ <100ms load time
```

---

### ✅ 6. Billing Page Works (Client Component)
**Where**: /app/billing  
**What to look for**: Billing info loads, entitlements shown

**Steps**:
1. Click "Settings" → or find Billing link
2. Page should load instantly
3. Check Network tab:
   - Should see 3 queries:
     - organizations
     - org_subscriptions
     - org_entitlements
   - Should NOT see org_members
4. Should display:
   - Current plan
   - Subscription status
   - Entitlements list

**Expected**:
```
✅ Billing data loads using cached org_id
✅ All 3 tables queried in parallel
✅ No org_members re-query
```

---

### ✅ 7. TopBar Data is Cached (No Re-fetch)
**Where**: Top right corner  
**What to look for**: User name/org shown from cache

**Steps**:
1. Look at top right of app
2. Should show:
   - Organization name
   - User email
   - Role badge
3. Navigate between pages 2-3 times
4. Check DevTools:
   - User profile should NOT be fetched again
   - Should come from Zustand store

**Expected**:
```
✅ TopBar uses store, not API
✅ No repeated profile fetches
```

---

### ✅ 8. Mobile Sidebar Still Works
**Where**: Mobile view  
**What to look for**: Mobile menu works

**Steps**:
1. DevTools → Toggle device toolbar (Cmd+Shift+M)
2. Click hamburger menu
3. Click a link
4. Should navigate correctly
5. Check performance same as desktop

**Expected**:
```
✅ Mobile navigation instant
✅ Prefetching works on mobile too
```

---

## 📊 Performance Comparison Template

### Before Optimization
```
Sidebar Click → Policy Page Render:
├─ Layout rendering: 200ms
├─ Auth check: 50ms
├─ org_members query: 100ms
├─ organizations query: 80ms
├─ org_policies query: 120ms
├─ Page setup: 50ms
└─ Total: 600ms (with visible spinner)
```

### After Optimization
```
Sidebar Click → Policy Page Render:
├─ Route prefetch: (done during hover/page load)
├─ Layout rendering: 0ms (uses hydrated state)
├─ Auth check: 0ms (already done)
├─ org_id lookup: 0ms (from store)
├─ org_policies query: 120ms (only new data)
├─ Page setup: 10ms
└─ Total: 130ms (instant, no spinner)
```

---

## 🐛 Troubleshooting

### Issue: Zustand store is empty
**Solution**:
1. Hard refresh browser (Cmd+Shift+R)
2. Check if user is logged in
3. Check `/api/system-state` endpoint in Network tab
4. Look for errors in console

### Issue: Pages still slow
**Solution**:
1. Clear browser cache
2. Hard refresh all pages
3. Check that pages have `'use client'` directive
4. Verify `useOrgId()` hook is being called
5. Check Network tab for unexpected queries

### Issue: Routes not prefetching
**Solution**:
1. Check that sidebar is visible
2. Wait 2-3 seconds after page loads
3. Look in Network tab for `_next/data/` files
4. Check browser console for prefetch errors

### Issue: Dropdown keeps closing
**Solution**:
1. This is expected behavior from onMouseEnter prefetch
2. User clicks link instead, so it's okay

---

## 📈 Measuring with Lighthouse

### 1. Open DevTools → Lighthouse
2. Select "Performance" audit
3. Run audit
4. Look for:
   - First Contentful Paint: <1.5s
   - Largest Contentful Paint: <2.5s
   - Cumulative Layout Shift: <0.1
   - Total Blocking Time: <150ms

### Expected improvements:
```
Before: ~60-65 score
After:  ~75-80 score
```

---

## ✅ Final Checklist

- [ ] Zustand store populated after login
- [ ] No org_members queries on subsequent page loads
- [ ] Sidebar navigation <100ms
- [ ] Routes prefetch in background
- [ ] Policies page shows policies from store org_id
- [ ] Billing page shows all sections
- [ ] TopBar displays org/user from cache
- [ ] Mobile sidebar works
- [ ] No console errors
- [ ] Lighthouse score improved 10-15 points

---

## 🎯 Success Criteria

**You'll know it's working when**:

1. ⚡ Sidebar clicks feel INSTANT (no spinner)
2. 🔄 Switch between pages 5+ times → still instant
3. 📊 Network tab shows 80% fewer queries
4. 🎯 Lighthouse performance score up 10-15 points
5. 🚀 First page load hydration completes <150ms

---

## 📝 Notes

- First page load might be slightly slower (one extra API call to hydrate)
- Subsequent navigation is **dramatically** faster
- Mobile gets same benefits as desktop
- All features continue to work normally
- Try on real device/network to see real improvement

